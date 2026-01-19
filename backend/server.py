from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Vehicle configuration with CHF pricing - UPDATED
VEHICLE_TYPES = {
    "eco": {
        "id": "eco",
        "name": "Eco",
        "description": "Véhicule économique et confortable",
        "base_fare": 6.00,
        "rate_per_km": 3.00,
        "capacity": 4,
        "icon": "🚗",
        "min_passengers": 1,
        "max_passengers": 4
    },
    "berline": {
        "id": "berline",
        "name": "Berline Luxe",
        "description": "Mercedes Classe E ou équivalent",
        "base_fare": 10.00,
        "rate_per_km": 5.00,
        "capacity": 4,
        "icon": "🚙",
        "min_passengers": 1,
        "max_passengers": 4
    },
    "bus": {
        "id": "bus",
        "name": "Bus",
        "description": "Minibus/Autocar pour groupes (5-15 passagers)",
        "base_fare": 25.00,
        "rate_per_km": 8.00,
        "capacity": 15,
        "icon": "🚌",
        "min_passengers": 5,
        "max_passengers": 15
    }
}

def get_suitable_vehicles(num_passengers: int):
    """Get vehicles suitable for the number of passengers"""
    suitable = []
    for vehicle_id, vehicle in VEHICLE_TYPES.items():
        if vehicle["min_passengers"] <= num_passengers <= vehicle["max_passengers"]:
            suitable.append(vehicle)
    return suitable

# Peak hours definition (for dynamic pricing)
PEAK_HOURS = {
    "morning": (7, 9),    # 7h-9h
    "evening": (17, 19),  # 17h-19h
}

# Discount rates
DISCOUNT_RATES = {
    "youth": 0.15,        # 15% off for youth (<26 years)
    "ride_sharing": 0.25, # 25% off for shared rides
    "off_peak": 0.10,     # 10% off for off-peak hours
}

# Pydantic Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "passenger"  # passenger or driver
    account_type: str = "personal"  # personal or business
    company_name: Optional[str] = None
    vat_number: Optional[str] = None  # Swiss VAT/IDE number
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class Location(BaseModel):
    latitude: float
    longitude: float
    address: str

class RideCalculation(BaseModel):
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float

class RideCreate(BaseModel):
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    price: float

class Ride(BaseModel):
    ride_id: str
    user_id: str
    driver_id: Optional[str] = None
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    price: float
    status: str  # pending, accepted, in_progress, completed, cancelled
    billing_type: str = "immediate"  # immediate or monthly
    created_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# Auth Helper Functions
async def get_session_token(request: Request) -> Optional[str]:
    """Extract session token from cookies or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Try Authorization header as fallback
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    
    return None

async def get_current_user(request: Request) -> User:
    """Get current user from session token"""
    session_token = await get_session_token(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if session is expired
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    
    # Create SessionDataResponse
    session_data = SessionDataResponse(**user_data)
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": session_data.email},
        {"_id": 0}
    )
    
    if not existing_user:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": session_data.email,
            "name": session_data.name,
            "picture": session_data.picture,
            "role": "passenger",  # Default role
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = existing_user["user_id"]
    
    # Create session
    session_doc = {
        "user_id": user_id,
        "session_token": session_data.session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_data.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": session_data.email,
        "name": session_data.name,
        "picture": session_data.picture,
        "session_token": session_data.session_token
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = await get_session_token(request)
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Vehicle Routes
@api_router.get("/vehicles")
async def get_vehicle_types():
    """Get all available vehicle types with pricing"""
    return {"vehicles": list(VEHICLE_TYPES.values())}

# Ride Routes
@api_router.post("/rides/calculate")
async def calculate_ride_price(calculation: RideCalculation):
    """Calculate ride price based on distance and vehicle type"""
    vehicle = VEHICLE_TYPES.get(calculation.vehicle_type)
    
    if not vehicle:
        raise HTTPException(status_code=400, detail="Invalid vehicle type")
    
    # Calculate price: base_fare + (distance * rate_per_km)
    price = vehicle["base_fare"] + (calculation.distance_km * vehicle["rate_per_km"])
    
    return {
        "vehicle_type": calculation.vehicle_type,
        "distance_km": calculation.distance_km,
        "base_fare": vehicle["base_fare"],
        "rate_per_km": vehicle["rate_per_km"],
        "price": round(price, 2),
        "currency": "CHF"
    }

@api_router.post("/rides")
async def create_ride(
    ride_data: RideCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new ride booking"""
    ride_id = f"ride_{uuid.uuid4().hex[:12]}"
    
    # Determine billing type based on account type
    billing_type = "monthly" if current_user.account_type == "business" else "immediate"
    
    ride_doc = {
        "ride_id": ride_id,
        "user_id": current_user.user_id,
        "pickup": ride_data.pickup.dict(),
        "destination": ride_data.destination.dict(),
        "vehicle_type": ride_data.vehicle_type,
        "distance_km": ride_data.distance_km,
        "price": ride_data.price,
        "status": "pending",
        "billing_type": billing_type,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.rides.insert_one(ride_doc)
    
    return {
        "ride_id": ride_id,
        "status": "pending",
        "billing_type": billing_type,
        "message": "Ride booked successfully"
    }

@api_router.get("/rides/{ride_id}")
async def get_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get ride details"""
    ride = await db.rides.find_one(
        {"ride_id": ride_id, "user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    return ride

@api_router.get("/rides/user/history")
async def get_user_rides(
    current_user: User = Depends(get_current_user)
):
    """Get user's ride history"""
    rides = await db.rides.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"rides": rides}

# Driver Routes
@api_router.post("/user/toggle-role")
async def toggle_user_role(
    current_user: User = Depends(get_current_user)
):
    """Toggle user role between passenger and driver"""
    new_role = "driver" if current_user.role == "passenger" else "passenger"
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"role": new_role}}
    )
    
    return {"role": new_role, "message": f"Switched to {new_role} mode"}

@api_router.get("/driver/pending-rides")
async def get_pending_rides(
    current_user: User = Depends(get_current_user)
):
    """Get all pending rides for drivers"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    # Get all pending rides
    rides = await db.rides.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"rides": rides}

@api_router.get("/driver/active-ride")
async def get_driver_active_ride(
    current_user: User = Depends(get_current_user)
):
    """Get driver's current active ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    # Find accepted or in_progress ride for this driver
    ride = await db.rides.find_one(
        {
            "driver_id": current_user.user_id,
            "status": {"$in": ["accepted", "in_progress"]}
        },
        {"_id": 0}
    )
    
    if not ride:
        return {"ride": None}
    
    return {"ride": ride}

@api_router.post("/rides/{ride_id}/accept")
async def accept_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver accepts a ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    # Check if ride exists and is pending
    ride = await db.rides.find_one(
        {"ride_id": ride_id, "status": "pending"},
        {"_id": 0}
    )
    
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or already accepted")
    
    # Check if driver already has an active ride
    existing_ride = await db.rides.find_one(
        {
            "driver_id": current_user.user_id,
            "status": {"$in": ["accepted", "in_progress"]}
        }
    )
    
    # Allow accepting even with active ride (forward dispatch)
    # Update ride with driver info
    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "status": "accepted",
                "driver_id": current_user.user_id,
                "accepted_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Ride accepted successfully",
        "ride_id": ride_id,
        "status": "accepted"
    }

@api_router.post("/rides/{ride_id}/start")
async def start_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver starts the ride (navigation begins)"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    ride = await db.rides.find_one(
        {
            "ride_id": ride_id,
            "driver_id": current_user.user_id,
            "status": "accepted"
        },
        {"_id": 0}
    )
    
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not accepted")
    
    await db.rides.update_one(
        {"ride_id": ride_id},
        {"$set": {"status": "in_progress"}}
    )
    
    return {
        "message": "Ride started",
        "ride_id": ride_id,
        "status": "in_progress"
    }

@api_router.post("/rides/{ride_id}/complete")
async def complete_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver completes the ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    ride = await db.rides.find_one(
        {
            "ride_id": ride_id,
            "driver_id": current_user.user_id,
            "status": {"$in": ["accepted", "in_progress"]}
        },
        {"_id": 0}
    )
    
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not started")
    
    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Ride completed successfully",
        "ride_id": ride_id,
        "status": "completed",
        "earnings": ride["price"]
    }

@api_router.post("/rides/{ride_id}/decline")
async def decline_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver declines a ride (keeps it pending for others)"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    ride = await db.rides.find_one(
        {"ride_id": ride_id, "status": "pending"},
        {"_id": 0}
    )
    
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    # Just return success - ride stays pending for other drivers
    return {
        "message": "Ride declined",
        "ride_id": ride_id
    }

@api_router.get("/driver/earnings")
async def get_driver_earnings(
    current_user: User = Depends(get_current_user)
):
    """Get driver's total earnings from completed rides"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    completed_rides = await db.rides.find(
        {
            "driver_id": current_user.user_id,
            "status": "completed"
        },
        {"_id": 0}
    ).to_list(1000)
    
    total_earnings = sum(ride["price"] for ride in completed_rides)
    
    return {
        "total_earnings": total_earnings,
        "total_rides": len(completed_rides),
        "rides": completed_rides
    }

# Profile Management Routes
@api_router.put("/user/profile")
async def update_user_profile(
    account_type: Optional[str] = None,
    company_name: Optional[str] = None,
    vat_number: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update user profile (B2B account info)"""
    update_fields = {}
    
    if account_type and account_type in ["personal", "business"]:
        update_fields["account_type"] = account_type
    
    if company_name:
        update_fields["company_name"] = company_name
    
    if vat_number:
        update_fields["vat_number"] = vat_number
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_fields}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return updated_user

# Admin Routes (Protected - simple password check for MVP)
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")  # Change in production!

def verify_admin_access(admin_password: str):
    """Simple admin verification - replace with proper auth in production"""
    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    return True

@api_router.get("/admin/users")
async def get_all_users(admin_password: str):
    """Get all users for admin dashboard"""
    verify_admin_access(admin_password)
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return {"users": users}

@api_router.get("/admin/rides")
async def get_all_rides(admin_password: str, status: Optional[str] = None):
    """Get all rides for admin dashboard"""
    verify_admin_access(admin_password)
    
    query = {}
    if status:
        query["status"] = status
    
    rides = await db.rides.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"rides": rides}

@api_router.post("/admin/rides/{ride_id}/assign")
async def admin_assign_driver(
    ride_id: str,
    driver_id: str,
    admin_password: str
):
    """Manually assign driver to a pending ride (for phone bookings)"""
    verify_admin_access(admin_password)
    
    # Verify ride exists and is pending
    ride = await db.rides.find_one({"ride_id": ride_id, "status": "pending"})
    if not ride:
        raise HTTPException(status_code=404, detail="Pending ride not found")
    
    # Verify driver exists
    driver = await db.users.find_one({"user_id": driver_id, "role": "driver"})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Assign driver
    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "driver_id": driver_id,
                "status": "accepted",
                "accepted_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Driver assigned successfully",
        "ride_id": ride_id,
        "driver_id": driver_id
    }

@api_router.get("/admin/stats")
async def get_admin_stats(admin_password: str):
    """Get platform statistics for admin dashboard"""
    verify_admin_access(admin_password)
    
    total_users = await db.users.count_documents({})
    total_drivers = await db.users.count_documents({"role": "driver"})
    total_passengers = await db.users.count_documents({"role": "passenger"})
    
    total_rides = await db.rides.count_documents({})
    pending_rides = await db.rides.count_documents({"status": "pending"})
    completed_rides = await db.rides.count_documents({"status": "completed"})
    
    # Calculate total revenue
    completed_ride_docs = await db.rides.find(
        {"status": "completed"},
        {"_id": 0, "price": 1}
    ).to_list(10000)
    total_revenue = sum(ride["price"] for ride in completed_ride_docs)
    
    return {
        "users": {
            "total": total_users,
            "drivers": total_drivers,
            "passengers": total_passengers
        },
        "rides": {
            "total": total_rides,
            "pending": pending_rides,
            "completed": completed_rides
        },
        "revenue": {
            "total": total_revenue,
            "currency": "CHF"
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()