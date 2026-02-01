from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import io
import asyncio
import smtplib
from email.message import EmailMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Romuo.ch VTC API",
    description="API complète pour service VTC premium en Suisse",
    version="2.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# =============================================================================
# VEHICLE CONFIGURATION - CHF Pricing
# =============================================================================

VEHICLE_TYPES = {
    "eco": {
        "id": "eco",
        "name": "Eco",
        "model": "Toyota Prius",
        "description": "Véhicule économique et écologique",
        "base_fare": 6.00,
        "rate_per_km": 2.50,
        "rate_per_minute": 0.40,
        "capacity": 4,
        "luggage": 2,
        "icon": "🚗",
        "min_passengers": 1,
        "max_passengers": 4,
        "category": "standard"
    },
    "berline": {
        "id": "berline",
        "name": "Berline Luxe",
        "model": "Mercedes Classe E",
        "description": "Confort et élégance premium",
        "base_fare": 10.00,
        "rate_per_km": 3.50,
        "rate_per_minute": 0.60,
        "capacity": 4,
        "luggage": 3,
        "icon": "🚙",
        "min_passengers": 1,
        "max_passengers": 4,
        "category": "premium"
    },
    "van": {
        "id": "van",
        "name": "Van Premium",
        "model": "Mercedes V-Class",
        "description": "Espace pour groupes et familles",
        "base_fare": 15.00,
        "rate_per_km": 4.50,
        "rate_per_minute": 0.80,
        "capacity": 7,
        "luggage": 6,
        "icon": "🚐",
        "min_passengers": 1,
        "max_passengers": 7,
        "category": "premium"
    },
    "bus": {
        "id": "bus",
        "name": "Bus",
        "model": "Mercedes Sprinter",
        "description": "Transport de groupe jusqu'à 20 personnes",
        "base_fare": 25.00,
        "rate_per_km": 6.00,
        "rate_per_minute": 1.00,
        "capacity": 20,
        "luggage": 20,
        "icon": "🚌",
        "min_passengers": 5,
        "max_passengers": 20,
        "category": "group"
    }
}

# =============================================================================
# FIXED ZONE PRICING - Airport & Popular Routes
# =============================================================================

DEFAULT_FIXED_ZONES = [
    {
        "zone_id": "gva_lausanne",
        "name": "Aéroport Genève ↔ Lausanne",
        "origin": {"name": "Aéroport de Genève", "lat": 46.2381, "lon": 6.1089, "radius_km": 2},
        "destination": {"name": "Lausanne Centre", "lat": 46.5197, "lon": 6.6323, "radius_km": 3},
        "prices": {"eco": 95, "berline": 130, "van": 180, "bus": 280},
        "bidirectional": True,
        "active": True
    },
    {
        "zone_id": "gva_montreux",
        "name": "Aéroport Genève ↔ Montreux",
        "origin": {"name": "Aéroport de Genève", "lat": 46.2381, "lon": 6.1089, "radius_km": 2},
        "destination": {"name": "Montreux", "lat": 46.4312, "lon": 6.9107, "radius_km": 3},
        "prices": {"eco": 140, "berline": 190, "van": 260, "bus": 380},
        "bidirectional": True,
        "active": True
    },
    {
        "zone_id": "gva_vevey",
        "name": "Aéroport Genève ↔ Vevey",
        "origin": {"name": "Aéroport de Genève", "lat": 46.2381, "lon": 6.1089, "radius_km": 2},
        "destination": {"name": "Vevey", "lat": 46.4628, "lon": 6.8418, "radius_km": 2},
        "prices": {"eco": 130, "berline": 175, "van": 240, "bus": 350},
        "bidirectional": True,
        "active": True
    },
    {
        "zone_id": "lausanne_montreux",
        "name": "Lausanne ↔ Montreux",
        "origin": {"name": "Lausanne", "lat": 46.5197, "lon": 6.6323, "radius_km": 3},
        "destination": {"name": "Montreux", "lat": 46.4312, "lon": 6.9107, "radius_km": 3},
        "prices": {"eco": 55, "berline": 75, "van": 110, "bus": 170},
        "bidirectional": True,
        "active": True
    },
    {
        "zone_id": "zrh_zurich",
        "name": "Aéroport Zürich ↔ Zürich Centre",
        "origin": {"name": "Aéroport de Zürich", "lat": 47.4647, "lon": 8.5492, "radius_km": 2},
        "destination": {"name": "Zürich Centre", "lat": 47.3769, "lon": 8.5417, "radius_km": 3},
        "prices": {"eco": 50, "berline": 70, "van": 100, "bus": 150},
        "bidirectional": True,
        "active": True
    }
]

# Peak hours definition
PEAK_HOURS = {
    "morning": (7, 9),
    "evening": (17, 19),
}

# Discount rates
DISCOUNT_RATES = {
    "youth": 0.15,
    "ride_sharing": 0.25,
    "off_peak": 0.10,
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def calculate_user_age(date_of_birth: str) -> int:
    """Calculate age from date of birth (YYYY-MM-DD)"""
    try:
        birth_date = datetime.strptime(date_of_birth, "%Y-%m-%d")
        today = datetime.now()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    except:
        return None

def is_peak_hour(scheduled_time: datetime) -> bool:
    """Check if the given time is during peak hours"""
    hour = scheduled_time.hour
    for period, (start, end) in PEAK_HOURS.items():
        if start <= hour < end:
            return True
    return False

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Haversine distance between two points in km"""
    import math
    R = 6371  # Earth's radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def point_in_zone(lat: float, lon: float, zone_point: dict) -> bool:
    """Check if a point is within the radius of a zone point"""
    distance = haversine_distance(lat, lon, zone_point["lat"], zone_point["lon"])
    return distance <= zone_point.get("radius_km", 2)

async def check_fixed_zone_price(pickup_lat: float, pickup_lon: float,
                                  dest_lat: float, dest_lon: float,
                                  vehicle_type: str) -> Optional[dict]:
    """Check if a route matches a fixed price zone"""
    # First check database zones
    zones = await db.zones.find({"active": True}).to_list(100)

    # Add default zones if none in DB
    if not zones:
        zones = DEFAULT_FIXED_ZONES

    for zone in zones:
        origin = zone["origin"]
        destination = zone["destination"]

        # Check forward direction
        if (point_in_zone(pickup_lat, pickup_lon, origin) and
            point_in_zone(dest_lat, dest_lon, destination)):
            if vehicle_type in zone.get("prices", {}):
                return {
                    "zone_id": zone.get("zone_id"),
                    "zone_name": zone.get("name"),
                    "fixed_price": zone["prices"][vehicle_type],
                    "direction": "forward"
                }

        # Check reverse direction if bidirectional
        if zone.get("bidirectional", True):
            if (point_in_zone(pickup_lat, pickup_lon, destination) and
                point_in_zone(dest_lat, dest_lon, origin)):
                if vehicle_type in zone.get("prices", {}):
                    return {
                        "zone_id": zone.get("zone_id"),
                        "zone_name": zone.get("name"),
                        "fixed_price": zone["prices"][vehicle_type],
                        "direction": "reverse"
                    }

    return None

def calculate_hybrid_price(
    vehicle_type: str,
    distance_km: float,
    duration_minutes: float = None,
    num_passengers: int = 1,
    user_age: int = None,
    is_ride_sharing: bool = False,
    scheduled_time: datetime = None,
    fixed_zone_price: float = None
) -> dict:
    """Calculate intelligent price with zone pricing and discounts"""
    vehicle = VEHICLE_TYPES.get(vehicle_type)
    if not vehicle:
        raise ValueError("Invalid vehicle type")

    # Use fixed zone price if available
    if fixed_zone_price:
        base_price = fixed_zone_price
        pricing_method = "fixed_zone"
    else:
        # Hybrid calculation: Base + Distance + Time
        base_price = vehicle["base_fare"]
        distance_price = distance_km * vehicle["rate_per_km"]

        # Estimate duration if not provided (assume 40 km/h average)
        if duration_minutes is None:
            duration_minutes = (distance_km / 40) * 60

        time_price = duration_minutes * vehicle["rate_per_minute"]
        base_price = base_price + distance_price + time_price
        pricing_method = "hybrid"

    # Apply discounts
    discounts = []
    total_discount = 0

    if user_age and user_age < 26:
        total_discount += DISCOUNT_RATES["youth"]
        discounts.append({"type": "youth", "percent": 15, "label": "Réduction jeunes (-26 ans)"})

    if is_ride_sharing:
        total_discount += DISCOUNT_RATES["ride_sharing"]
        discounts.append({"type": "ride_sharing", "percent": 25, "label": "Partage de course"})

    if scheduled_time and not is_peak_hour(scheduled_time):
        total_discount += DISCOUNT_RATES["off_peak"]
        discounts.append({"type": "off_peak", "percent": 10, "label": "Heure creuse"})

    # Maximum 50% discount
    total_discount = min(total_discount, 0.50)
    final_price = base_price * (1 - total_discount)

    return {
        "vehicle_type": vehicle_type,
        "vehicle_name": vehicle["name"],
        "distance_km": round(distance_km, 1),
        "duration_minutes": round(duration_minutes, 0) if duration_minutes else None,
        "base_price": round(base_price, 2),
        "final_price": round(final_price, 2),
        "total_discount_percent": round(total_discount * 100, 0),
        "discounts_applied": discounts,
        "pricing_method": pricing_method,
        "currency": "CHF"
    }

def get_suitable_vehicles(num_passengers: int):
    """Get vehicles suitable for the number of passengers"""
    suitable = []
    for vehicle_id, vehicle in VEHICLE_TYPES.items():
        if vehicle["min_passengers"] <= num_passengers <= vehicle["max_passengers"]:
            suitable.append(vehicle)
    return suitable

# =============================================================================
# NOTIFICATION HELPERS
# =============================================================================

async def store_notification(
    channel: str,
    recipient: str,
    payload: dict,
    status: str,
    error: Optional[str] = None
):
    """Persist notification attempts for auditing."""
    notification_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "channel": channel,
        "recipient": recipient,
        "payload": payload,
        "status": status,
        "error": error,
        "created_at": datetime.now(timezone.utc),
        "sent_at": datetime.now(timezone.utc) if status == "sent" else None
    }
    await db.notifications.insert_one(notification_doc)

async def send_email_notification(to_email: str, subject: str, body: str) -> dict:
    """Send an email notification via SMTP."""
    if not (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM):
        return {"status": "skipped", "reason": "smtp_not_configured"}

    def _send_email():
        message = EmailMessage()
        message["From"] = SMTP_FROM
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)

    try:
        await asyncio.to_thread(_send_email)
        return {"status": "sent"}
    except Exception as exc:
        return {"status": "failed", "error": str(exc)}

async def send_sms_notification(to_phone: str, message: str) -> dict:
    """Send an SMS notification via Twilio."""
    if SMS_PROVIDER != "twilio":
        return {"status": "skipped", "reason": "sms_provider_not_supported"}

    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        return {"status": "skipped", "reason": "twilio_not_configured"}

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    payload = {
        "To": to_phone,
        "From": TWILIO_FROM_NUMBER,
        "Body": message
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=payload, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
            response.raise_for_status()
        return {"status": "sent"}
    except Exception as exc:
        return {"status": "failed", "error": str(exc)}

async def dispatch_notification(
    channel: str,
    recipient: str,
    payload: dict,
    send_func
):
    """Send and store notifications consistently."""
    result = await send_func(recipient, **payload)
    status = result.get("status", "failed")
    error = result.get("error") or result.get("reason")
    await store_notification(channel, recipient, payload, status, error)

async def notify_new_ride(ride_doc: dict, contact: Optional[dict] = None):
    """Notify customer and admin about a new ride."""
    contact = contact or {}
    customer_name = contact.get("name") or "Client"

    pickup_address = ride_doc["pickup"]["address"]
    destination_address = ride_doc["destination"]["address"]
    message = (
        f"Nouvelle réservation {ride_doc['ride_id']}.\n"
        f"Départ: {pickup_address}\n"
        f"Arrivée: {destination_address}\n"
        f"Véhicule: {ride_doc['vehicle_type']}\n"
        f"Prix: CHF {ride_doc['price']:.2f}\n"
    )

    email_subject = f"Confirmation de réservation {ride_doc['ride_id']}"
    customer_email = contact.get("email")
    customer_phone = contact.get("phone")

    tasks = []

    if customer_email:
        tasks.append(dispatch_notification(
            "email",
            customer_email,
            {"subject": email_subject, "body": f"Bonjour {customer_name},\n\n{message}\nMerci pour votre confiance.\nRomuo.ch"},
            send_email_notification
        ))

    if customer_phone:
        tasks.append(dispatch_notification(
            "sms",
            customer_phone,
            {"message": f"{customer_name}, votre course est confirmée. {message}"},
            send_sms_notification
        ))

    if ADMIN_NOTIFICATION_EMAIL:
        tasks.append(dispatch_notification(
            "email",
            ADMIN_NOTIFICATION_EMAIL,
            {"subject": f"Nouvelle course {ride_doc['ride_id']}", "body": message},
            send_email_notification
        ))

    if ADMIN_NOTIFICATION_PHONE:
        tasks.append(dispatch_notification(
            "sms",
            ADMIN_NOTIFICATION_PHONE,
            {"message": f"Nouvelle course {ride_doc['ride_id']}: {pickup_address} → {destination_address}"},
            send_sms_notification
        ))

    if tasks:
        await asyncio.gather(*tasks)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class Location(BaseModel):
    latitude: float
    longitude: float
    address: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "passenger"
    account_type: str = "personal"
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# Driver Model
class Driver(BaseModel):
    driver_id: str
    user_id: str
    name: str
    phone: str
    email: str
    photo: Optional[str] = None
    license_number: str
    license_expiry: str
    rating: float = 5.0
    total_trips: int = 0
    status: str = "available"  # available, busy, offline
    current_location: Optional[dict] = None  # {"lat": float, "lon": float}
    assigned_vehicle_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class DriverCreate(BaseModel):
    name: str
    phone: str
    email: str
    photo: Optional[str] = None
    license_number: str
    license_expiry: str

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    status: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None

# Vehicle Model (Fleet)
class Vehicle(BaseModel):
    vehicle_id: str
    brand: str
    model: str
    year: int
    license_plate: str
    color: str
    category: str  # eco, berline, van, bus
    capacity: int
    status: str = "available"  # available, in_use, maintenance
    features: List[str] = []
    insurance_expiry: str
    last_maintenance: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class VehicleCreate(BaseModel):
    brand: str
    model: str
    year: int
    license_plate: str
    color: str
    category: str
    capacity: int
    features: List[str] = []
    insurance_expiry: str

class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    category: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    features: Optional[List[str]] = None
    insurance_expiry: Optional[str] = None
    last_maintenance: Optional[str] = None

# Zone Model
class Zone(BaseModel):
    zone_id: str
    name: str
    origin: dict
    destination: dict
    prices: dict
    bidirectional: bool = True
    active: bool = True
    created_at: datetime

class ZoneCreate(BaseModel):
    name: str
    origin: dict
    destination: dict
    prices: dict
    bidirectional: bool = True

# Booking Models
class RideCalculation(BaseModel):
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: Optional[float] = None
    duration_minutes: Optional[float] = None
    num_passengers: int = 1
    scheduled_time: Optional[str] = None

class RideCreate(BaseModel):
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    duration_minutes: Optional[float] = None
    price: float
    payment_method: str = "cash"  # cash, card, invoice
    scheduled_time: Optional[str] = None
    notes: Optional[str] = None

class GuestContact(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class GuestRideCreate(BaseModel):
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    duration_minutes: Optional[float] = None
    price: float
    payment_method: str = "cash"  # cash, card, invoice
    scheduled_time: Optional[str] = None
    notes: Optional[str] = None
    contact: GuestContact

class Ride(BaseModel):
    ride_id: str
    user_id: str
    driver_id: Optional[str] = None
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    duration_minutes: Optional[float] = None
    price: float
    payment_method: str = "cash"
    status: str  # pending, assigned, driver_en_route, arrived, in_progress, completed, cancelled
    billing_type: str = "immediate"
    notes: Optional[str] = None
    zone_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# =============================================================================
# AUTH HELPERS
# =============================================================================

async def get_session_token(request: Request) -> Optional[str]:
    """Extract session token from cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")

    return None

async def get_current_user(request: Request) -> User:
    """Get current user from session token"""
    session_token = await get_session_token(request)

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )

    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    return User(**user_doc)

async def get_optional_user(request: Request) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# Admin verification
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "romuo_admin_2024")
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL")
ADMIN_NOTIFICATION_PHONE = os.environ.get("ADMIN_NOTIFICATION_PHONE")

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

SMS_PROVIDER = os.environ.get("SMS_PROVIDER", "twilio")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")

def verify_admin_access(admin_password: str):
    """Simple admin verification"""
    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    return True

# =============================================================================
# AUTH ROUTES
# =============================================================================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")

    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")

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

    session_data = SessionDataResponse(**user_data)

    existing_user = await db.users.find_one(
        {"email": session_data.email},
        {"_id": 0}
    )

    if not existing_user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": session_data.email,
            "name": session_data.name,
            "picture": session_data.picture,
            "role": "passenger",
            "account_type": "personal",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = existing_user["user_id"]

    session_doc = {
        "user_id": user_id,
        "session_token": session_data.session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)

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

# =============================================================================
# VEHICLE TYPES ROUTES (Public)
# =============================================================================

@api_router.get("/vehicles")
async def get_vehicle_types():
    """Get all available vehicle types with pricing"""
    return {"vehicles": list(VEHICLE_TYPES.values())}

@api_router.get("/vehicles/suggest")
async def suggest_vehicles(num_passengers: int = 1):
    """Suggest suitable vehicles based on number of passengers"""
    if num_passengers < 1 or num_passengers > 20:
        raise HTTPException(
            status_code=400,
            detail="Number of passengers must be between 1 and 20"
        )

    suitable = get_suitable_vehicles(num_passengers)

    if not suitable:
        raise HTTPException(
            status_code=400,
            detail=f"No vehicle available for {num_passengers} passengers"
        )

    return {
        "num_passengers": num_passengers,
        "suitable_vehicles": suitable,
        "recommended": suitable[0]["id"]
    }

# =============================================================================
# FIXED ZONES ROUTES
# =============================================================================

@api_router.get("/zones")
async def get_all_zones():
    """Get all fixed price zones"""
    zones = await db.zones.find({"active": True}, {"_id": 0}).to_list(100)
    if not zones:
        zones = DEFAULT_FIXED_ZONES
    return {"zones": zones}

@api_router.post("/zones")
async def create_zone(zone: ZoneCreate, admin_password: str):
    """Create a new fixed price zone"""
    verify_admin_access(admin_password)

    zone_id = f"zone_{uuid.uuid4().hex[:8]}"
    zone_doc = {
        "zone_id": zone_id,
        **zone.dict(),
        "active": True,
        "created_at": datetime.now(timezone.utc)
    }

    await db.zones.insert_one(zone_doc)
    return {"zone_id": zone_id, "message": "Zone created successfully"}

@api_router.put("/zones/{zone_id}")
async def update_zone(zone_id: str, zone: ZoneCreate, admin_password: str):
    """Update a fixed price zone"""
    verify_admin_access(admin_password)

    result = await db.zones.update_one(
        {"zone_id": zone_id},
        {"$set": {**zone.dict(), "updated_at": datetime.now(timezone.utc)}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")

    return {"message": "Zone updated successfully"}

@api_router.delete("/zones/{zone_id}")
async def delete_zone(zone_id: str, admin_password: str):
    """Delete a fixed price zone"""
    verify_admin_access(admin_password)

    result = await db.zones.update_one(
        {"zone_id": zone_id},
        {"$set": {"active": False}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")

    return {"message": "Zone deleted successfully"}

# =============================================================================
# RIDE/BOOKING ROUTES
# =============================================================================

@api_router.post("/rides/calculate")
async def calculate_ride_price(calculation: RideCalculation, request: Request):
    """Calculate ride price with hybrid pricing (base + km + time + zones)"""
    vehicle = VEHICLE_TYPES.get(calculation.vehicle_type)

    if not vehicle:
        raise HTTPException(status_code=400, detail="Invalid vehicle type")

    # Calculate distance if not provided
    distance_km = calculation.distance_km
    if distance_km is None:
        distance_km = haversine_distance(
            calculation.pickup.latitude,
            calculation.pickup.longitude,
            calculation.destination.latitude,
            calculation.destination.longitude
        ) * 1.3  # Road distance approximation

    # Check for fixed zone pricing
    fixed_zone = await check_fixed_zone_price(
        calculation.pickup.latitude,
        calculation.pickup.longitude,
        calculation.destination.latitude,
        calculation.destination.longitude,
        calculation.vehicle_type
    )

    # Get user for potential discounts
    user = await get_optional_user(request)
    user_age = None
    if user and user.date_of_birth:
        user_age = calculate_user_age(user.date_of_birth)

    # Parse scheduled time
    scheduled_time = None
    if calculation.scheduled_time:
        try:
            scheduled_time = datetime.fromisoformat(calculation.scheduled_time.replace('Z', '+00:00'))
        except:
            pass

    # Calculate price
    price_info = calculate_hybrid_price(
        vehicle_type=calculation.vehicle_type,
        distance_km=distance_km,
        duration_minutes=calculation.duration_minutes,
        num_passengers=calculation.num_passengers,
        user_age=user_age,
        scheduled_time=scheduled_time,
        fixed_zone_price=fixed_zone["fixed_price"] if fixed_zone else None
    )

    # Add zone info if applicable
    if fixed_zone:
        price_info["zone_id"] = fixed_zone["zone_id"]
        price_info["zone_name"] = fixed_zone["zone_name"]

    # Calculate all vehicle prices for comparison
    all_prices = {}
    for vtype in VEHICLE_TYPES.keys():
        fz = await check_fixed_zone_price(
            calculation.pickup.latitude,
            calculation.pickup.longitude,
            calculation.destination.latitude,
            calculation.destination.longitude,
            vtype
        )
        vp = calculate_hybrid_price(
            vehicle_type=vtype,
            distance_km=distance_km,
            duration_minutes=calculation.duration_minutes,
            fixed_zone_price=fz["fixed_price"] if fz else None
        )
        all_prices[vtype] = vp["final_price"]

    price_info["all_prices"] = all_prices

    return price_info

@api_router.post("/rides")
async def create_ride(
    ride_data: RideCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new ride booking"""
    ride_id = f"ride_{uuid.uuid4().hex[:12]}"

    billing_type = "monthly" if current_user.account_type == "business" else "immediate"

    # Parse scheduled time
    scheduled_time = None
    if ride_data.scheduled_time:
        try:
            scheduled_time = datetime.fromisoformat(ride_data.scheduled_time.replace('Z', '+00:00'))
        except:
            pass

    contact_details = {
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone
    }

    ride_doc = {
        "ride_id": ride_id,
        "user_id": current_user.user_id,
        "pickup": ride_data.pickup.dict(),
        "destination": ride_data.destination.dict(),
        "vehicle_type": ride_data.vehicle_type,
        "distance_km": ride_data.distance_km,
        "duration_minutes": ride_data.duration_minutes,
        "price": ride_data.price,
        "payment_method": ride_data.payment_method,
        "status": "pending",
        "billing_type": billing_type,
        "notes": ride_data.notes,
        "scheduled_time": scheduled_time,
        "created_at": datetime.now(timezone.utc),
        "contact": {k: v for k, v in contact_details.items() if v}
    }

    await db.rides.insert_one(ride_doc)
    await notify_new_ride(ride_doc, contact_details)

    return {
        "ride_id": ride_id,
        "status": "pending",
        "billing_type": billing_type,
        "message": "Ride booked successfully"
    }

@api_router.post("/rides/guest")
async def create_guest_ride(ride_data: GuestRideCreate):
    """Create a new ride booking for guest users"""
    if not ride_data.contact.email and not ride_data.contact.phone:
        raise HTTPException(status_code=400, detail="Email or phone is required for guest bookings")

    ride_id = f"ride_{uuid.uuid4().hex[:12]}"

    scheduled_time = None
    if ride_data.scheduled_time:
        try:
            scheduled_time = datetime.fromisoformat(ride_data.scheduled_time.replace('Z', '+00:00'))
        except:
            pass

    ride_doc = {
        "ride_id": ride_id,
        "user_id": f"guest_{uuid.uuid4().hex[:10]}",
        "pickup": ride_data.pickup.dict(),
        "destination": ride_data.destination.dict(),
        "vehicle_type": ride_data.vehicle_type,
        "distance_km": ride_data.distance_km,
        "duration_minutes": ride_data.duration_minutes,
        "price": ride_data.price,
        "payment_method": ride_data.payment_method,
        "status": "pending",
        "billing_type": "immediate",
        "notes": ride_data.notes,
        "scheduled_time": scheduled_time,
        "created_at": datetime.now(timezone.utc),
        "contact": ride_data.contact.dict()
    }

    await db.rides.insert_one(ride_doc)
    await notify_new_ride(ride_doc, ride_data.contact.dict())

    return {
        "ride_id": ride_id,
        "status": "pending",
        "message": "Ride booked successfully"
    }

@api_router.get("/rides/{ride_id}")
async def get_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get ride details"""
    ride = await db.rides.find_one(
        {"ride_id": ride_id},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    # Check access (user owns ride or is admin/driver)
    if ride["user_id"] != current_user.user_id and current_user.role not in ["driver", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return ride

@api_router.get("/rides/user/history")
async def get_user_rides(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """Get user's ride history"""
    rides = await db.rides.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)

    return {"rides": rides}

@api_router.post("/rides/{ride_id}/cancel")
async def cancel_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a ride"""
    ride = await db.rides.find_one(
        {"ride_id": ride_id, "user_id": current_user.user_id},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride["status"] not in ["pending", "assigned", "driver_en_route"]:
        raise HTTPException(status_code=400, detail="Cannot cancel ride in current status")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc)}}
    )

    return {"message": "Ride cancelled successfully"}

# =============================================================================
# INVOICE/PDF GENERATION
# =============================================================================

@api_router.get("/rides/{ride_id}/invoice")
async def get_ride_invoice(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Generate PDF invoice for a completed ride"""
    ride = await db.rides.find_one(
        {"ride_id": ride_id},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if ride["status"] != "completed":
        raise HTTPException(status_code=400, detail="Invoice only available for completed rides")

    # Generate simple text invoice (for MVP - can be enhanced with reportlab later)
    invoice_number = f"INV-{ride_id.upper()}"
    invoice_date = ride.get("completed_at", ride["created_at"])
    if isinstance(invoice_date, datetime):
        invoice_date = invoice_date.strftime("%d.%m.%Y")

    invoice_text = f"""
================================================================================
                              ROMUO.CH
                    Service VTC Premium Suisse
================================================================================

FACTURE N°: {invoice_number}
Date: {invoice_date}

--------------------------------------------------------------------------------
CLIENT
--------------------------------------------------------------------------------
Nom: {current_user.name}
Email: {current_user.email}
{f"Entreprise: {current_user.company_name}" if current_user.company_name else ""}
{f"N° TVA: {current_user.vat_number}" if current_user.vat_number else ""}

--------------------------------------------------------------------------------
DÉTAILS DE LA COURSE
--------------------------------------------------------------------------------
Date de réservation: {ride['created_at'].strftime('%d.%m.%Y %H:%M') if isinstance(ride['created_at'], datetime) else ride['created_at']}

Départ: {ride['pickup']['address']}
Arrivée: {ride['destination']['address']}

Type de véhicule: {VEHICLE_TYPES.get(ride['vehicle_type'], {}).get('name', ride['vehicle_type'])}
Distance: {ride['distance_km']:.1f} km
Mode de paiement: {ride['payment_method'].upper()}

--------------------------------------------------------------------------------
MONTANT
--------------------------------------------------------------------------------
Total HT:                                           CHF {ride['price'] / 1.081:.2f}
TVA (8.1%):                                         CHF {ride['price'] - (ride['price'] / 1.081):.2f}
--------------------------------------------------------------------------------
TOTAL TTC:                                          CHF {ride['price']:.2f}
================================================================================

Merci de votre confiance!

Romuo.ch - Transport VTC Premium
www.romuo.ch | contact@romuo.ch
================================================================================
"""

    # Return as downloadable text file (enhance to PDF with reportlab later)
    return StreamingResponse(
        io.BytesIO(invoice_text.encode('utf-8')),
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=facture_{invoice_number}.txt"
        }
    )

# =============================================================================
# DRIVER ROUTES
# =============================================================================

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

    ride = await db.rides.find_one(
        {
            "driver_id": current_user.user_id,
            "status": {"$in": ["assigned", "driver_en_route", "arrived", "in_progress"]}
        },
        {"_id": 0}
    )

    return {"ride": ride}

@api_router.post("/rides/{ride_id}/accept")
async def accept_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver accepts a ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    ride = await db.rides.find_one(
        {"ride_id": ride_id, "status": "pending"},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or already accepted")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "status": "assigned",
                "driver_id": current_user.user_id,
                "assigned_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Ride accepted successfully",
        "ride_id": ride_id,
        "status": "assigned"
    }

@api_router.post("/rides/{ride_id}/en-route")
async def driver_en_route(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver marks they are en route to pickup"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    ride = await db.rides.find_one(
        {
            "ride_id": ride_id,
            "driver_id": current_user.user_id,
            "status": "assigned"
        },
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not assigned")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {"$set": {"status": "driver_en_route"}}
    )

    return {"message": "Status updated", "status": "driver_en_route"}

@api_router.post("/rides/{ride_id}/arrived")
async def driver_arrived(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver marks they have arrived at pickup"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    ride = await db.rides.find_one(
        {
            "ride_id": ride_id,
            "driver_id": current_user.user_id,
            "status": "driver_en_route"
        },
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {"$set": {"status": "arrived"}}
    )

    return {"message": "Arrived at pickup", "status": "arrived"}

@api_router.post("/rides/{ride_id}/start")
async def start_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Driver starts the ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    ride = await db.rides.find_one(
        {
            "ride_id": ride_id,
            "driver_id": current_user.user_id,
            "status": {"$in": ["assigned", "driver_en_route", "arrived"]}
        },
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "status": "in_progress",
                "picked_up_at": datetime.now(timezone.utc)
            }
        }
    )

    return {"message": "Ride started", "status": "in_progress"}

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
            "status": {"$in": ["in_progress", "arrived", "assigned", "driver_en_route"]}
        },
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            }
        }
    )

    # Update driver stats
    await db.drivers.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"total_trips": 1}}
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
    """Driver declines a ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    ride = await db.rides.find_one(
        {"ride_id": ride_id, "status": "pending"},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    return {"message": "Ride declined", "ride_id": ride_id}

@api_router.get("/driver/earnings")
async def get_driver_earnings(
    current_user: User = Depends(get_current_user),
    period: str = "all"  # all, today, week, month
):
    """Get driver's earnings"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    query = {
        "driver_id": current_user.user_id,
        "status": "completed"
    }

    # Add date filter
    if period == "today":
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        query["completed_at"] = {"$gte": today}
    elif period == "week":
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        query["completed_at"] = {"$gte": week_ago}
    elif period == "month":
        month_ago = datetime.now(timezone.utc) - timedelta(days=30)
        query["completed_at"] = {"$gte": month_ago}

    completed_rides = await db.rides.find(
        query,
        {"_id": 0}
    ).to_list(1000)

    total_earnings = sum(ride["price"] for ride in completed_rides)

    return {
        "period": period,
        "total_earnings": round(total_earnings, 2),
        "total_rides": len(completed_rides),
        "currency": "CHF",
        "rides": completed_rides
    }

@api_router.post("/driver/location")
async def update_driver_location(
    lat: float,
    lon: float,
    current_user: User = Depends(get_current_user)
):
    """Update driver's current location"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")

    await db.drivers.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                "current_location": {"lat": lat, "lon": lon},
                "location_updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

    return {"message": "Location updated"}

# =============================================================================
# ADMIN ROUTES - Fleet Management
# =============================================================================

# Fleet Drivers CRUD
@api_router.get("/admin/drivers")
async def admin_get_drivers(admin_password: str):
    """Get all fleet drivers"""
    verify_admin_access(admin_password)

    drivers = await db.drivers.find({}, {"_id": 0}).to_list(500)
    return {"drivers": drivers}

@api_router.post("/admin/drivers")
async def admin_create_driver(driver: DriverCreate, admin_password: str):
    """Create a new fleet driver"""
    verify_admin_access(admin_password)

    driver_id = f"drv_{uuid.uuid4().hex[:8]}"

    # Check if user exists with this email
    existing_user = await db.users.find_one({"email": driver.email})
    user_id = existing_user["user_id"] if existing_user else f"user_{uuid.uuid4().hex[:12]}"

    if not existing_user:
        # Create user account
        await db.users.insert_one({
            "user_id": user_id,
            "email": driver.email,
            "name": driver.name,
            "role": "driver",
            "account_type": "personal",
            "phone": driver.phone,
            "created_at": datetime.now(timezone.utc)
        })
    else:
        # Update to driver role
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"role": "driver"}}
        )

    driver_doc = {
        "driver_id": driver_id,
        "user_id": user_id,
        **driver.dict(),
        "rating": 5.0,
        "total_trips": 0,
        "status": "available",
        "current_location": None,
        "created_at": datetime.now(timezone.utc)
    }

    await db.drivers.insert_one(driver_doc)

    return {"driver_id": driver_id, "user_id": user_id, "message": "Driver created successfully"}

@api_router.put("/admin/drivers/{driver_id}")
async def admin_update_driver(driver_id: str, update: DriverUpdate, admin_password: str):
    """Update a fleet driver"""
    verify_admin_access(admin_password)

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.drivers.update_one(
        {"driver_id": driver_id},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {"message": "Driver updated successfully"}

@api_router.delete("/admin/drivers/{driver_id}")
async def admin_delete_driver(driver_id: str, admin_password: str):
    """Delete a fleet driver"""
    verify_admin_access(admin_password)

    result = await db.drivers.delete_one({"driver_id": driver_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {"message": "Driver deleted successfully"}

@api_router.post("/admin/drivers/{driver_id}/status")
async def admin_update_driver_status(driver_id: str, status: str, admin_password: str):
    """Update driver status"""
    verify_admin_access(admin_password)

    if status not in ["available", "busy", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.drivers.update_one(
        {"driver_id": driver_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {"message": f"Driver status updated to {status}"}

# Fleet Vehicles CRUD
@api_router.get("/admin/vehicles")
async def admin_get_vehicles(admin_password: str):
    """Get all fleet vehicles"""
    verify_admin_access(admin_password)

    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(500)
    return {"vehicles": vehicles}

@api_router.post("/admin/vehicles")
async def admin_create_vehicle(vehicle: VehicleCreate, admin_password: str):
    """Create a new fleet vehicle"""
    verify_admin_access(admin_password)

    vehicle_id = f"veh_{uuid.uuid4().hex[:8]}"

    # Check for duplicate license plate
    existing = await db.vehicles.find_one({"license_plate": vehicle.license_plate})
    if existing:
        raise HTTPException(status_code=400, detail="License plate already registered")

    vehicle_doc = {
        "vehicle_id": vehicle_id,
        **vehicle.dict(),
        "status": "available",
        "created_at": datetime.now(timezone.utc)
    }

    await db.vehicles.insert_one(vehicle_doc)

    return {"vehicle_id": vehicle_id, "message": "Vehicle created successfully"}

@api_router.put("/admin/vehicles/{vehicle_id}")
async def admin_update_vehicle(vehicle_id: str, update: VehicleUpdate, admin_password: str):
    """Update a fleet vehicle"""
    verify_admin_access(admin_password)

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return {"message": "Vehicle updated successfully"}

@api_router.delete("/admin/vehicles/{vehicle_id}")
async def admin_delete_vehicle(vehicle_id: str, admin_password: str):
    """Delete a fleet vehicle"""
    verify_admin_access(admin_password)

    result = await db.vehicles.delete_one({"vehicle_id": vehicle_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return {"message": "Vehicle deleted successfully"}

# Admin Users
@api_router.get("/admin/users")
async def get_all_users(admin_password: str):
    """Get all users"""
    verify_admin_access(admin_password)

    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return {"users": users}

# Admin Rides - Dispatch
@api_router.get("/admin/rides")
async def get_all_rides(
    admin_password: str,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100
):
    """Get all rides with optional filters"""
    verify_admin_access(admin_password)

    query = {}
    if status:
        if status == "active":
            query["status"] = {"$in": ["pending", "assigned", "driver_en_route", "arrived", "in_progress"]}
        else:
            query["status"] = status

    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query.setdefault("created_at", {})["$gte"] = from_date
        except:
            pass

    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query.setdefault("created_at", {})["$lte"] = to_date
        except:
            pass

    rides = await db.rides.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"rides": rides}

@api_router.get("/admin/rides/pending")
async def get_pending_rides_admin(admin_password: str):
    """Get all pending rides for dispatch"""
    verify_admin_access(admin_password)

    rides = await db.rides.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    return {"rides": rides}

@api_router.get("/admin/rides/calendar")
async def get_rides_calendar(
    admin_password: str,
    start: str,
    end: str
):
    """Get rides for calendar view"""
    verify_admin_access(admin_password)

    try:
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")

    rides = await db.rides.find(
        {
            "$or": [
                {"scheduled_time": {"$gte": start_date, "$lte": end_date}},
                {"created_at": {"$gte": start_date, "$lte": end_date}}
            ]
        },
        {"_id": 0}
    ).to_list(500)

    # Format for calendar
    events = []
    for ride in rides:
        event_time = ride.get("scheduled_time") or ride.get("created_at")
        events.append({
            "id": ride["ride_id"],
            "title": f"{ride['pickup']['address'][:20]}... → {ride['destination']['address'][:20]}...",
            "start": event_time.isoformat() if isinstance(event_time, datetime) else event_time,
            "status": ride["status"],
            "price": ride["price"],
            "vehicle_type": ride["vehicle_type"],
            "driver_id": ride.get("driver_id"),
            "extendedProps": ride
        })

    return {"events": events}

@api_router.post("/admin/rides/{ride_id}/assign")
async def admin_assign_driver(
    ride_id: str,
    driver_id: str,
    admin_password: str
):
    """Manually assign driver to a ride"""
    verify_admin_access(admin_password)

    ride = await db.rides.find_one({"ride_id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    driver = await db.drivers.find_one({"driver_id": driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    await db.rides.update_one(
        {"ride_id": ride_id},
        {
            "$set": {
                "driver_id": driver["user_id"],
                "status": "assigned",
                "assigned_at": datetime.now(timezone.utc)
            }
        }
    )

    # Update driver status
    await db.drivers.update_one(
        {"driver_id": driver_id},
        {"$set": {"status": "busy"}}
    )

    return {
        "message": "Driver assigned successfully",
        "ride_id": ride_id,
        "driver_id": driver_id
    }

@api_router.get("/admin/dispatch")
async def get_dispatch_data(admin_password: str):
    """Get all data needed for dispatch view"""
    verify_admin_access(admin_password)

    # Get pending rides
    pending_rides = await db.rides.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    # Get active rides
    active_rides = await db.rides.find(
        {"status": {"$in": ["assigned", "driver_en_route", "arrived", "in_progress"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Get all drivers with status
    drivers = await db.drivers.find({}, {"_id": 0}).to_list(500)

    # Get available vehicles
    vehicles = await db.vehicles.find({"status": "available"}, {"_id": 0}).to_list(500)

    return {
        "pending_rides": pending_rides,
        "active_rides": active_rides,
        "drivers": drivers,
        "vehicles": vehicles
    }

# Admin Stats
@api_router.get("/admin/stats")
async def get_admin_stats(admin_password: str):
    """Get platform statistics"""
    verify_admin_access(admin_password)

    total_users = await db.users.count_documents({})
    total_drivers = await db.drivers.count_documents({})
    available_drivers = await db.drivers.count_documents({"status": "available"})

    total_vehicles = await db.vehicles.count_documents({})
    available_vehicles = await db.vehicles.count_documents({"status": "available"})

    total_rides = await db.rides.count_documents({})
    pending_rides = await db.rides.count_documents({"status": "pending"})
    active_rides = await db.rides.count_documents(
        {"status": {"$in": ["assigned", "driver_en_route", "arrived", "in_progress"]}}
    )
    completed_rides = await db.rides.count_documents({"status": "completed"})

    # Today's stats
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_rides = await db.rides.count_documents({"created_at": {"$gte": today}})
    today_completed = await db.rides.count_documents(
        {"status": "completed", "completed_at": {"$gte": today}}
    )

    # Revenue
    completed_ride_docs = await db.rides.find(
        {"status": "completed"},
        {"_id": 0, "price": 1}
    ).to_list(10000)
    total_revenue = sum(ride["price"] for ride in completed_ride_docs)

    today_revenue_docs = await db.rides.find(
        {"status": "completed", "completed_at": {"$gte": today}},
        {"_id": 0, "price": 1}
    ).to_list(1000)
    today_revenue = sum(ride["price"] for ride in today_revenue_docs)

    return {
        "users": {
            "total": total_users
        },
        "drivers": {
            "total": total_drivers,
            "available": available_drivers,
            "busy": total_drivers - available_drivers
        },
        "vehicles": {
            "total": total_vehicles,
            "available": available_vehicles
        },
        "rides": {
            "total": total_rides,
            "pending": pending_rides,
            "active": active_rides,
            "completed": completed_rides,
            "today": today_rides,
            "today_completed": today_completed
        },
        "revenue": {
            "total": round(total_revenue, 2),
            "today": round(today_revenue, 2),
            "currency": "CHF"
        }
    }

# =============================================================================
# TRACKING - Real-time position
# =============================================================================

@api_router.get("/rides/{ride_id}/track")
async def track_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get real-time tracking data for a ride"""
    ride = await db.rides.find_one(
        {"ride_id": ride_id},
        {"_id": 0}
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride["user_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    driver_location = None
    driver_info = None

    if ride.get("driver_id"):
        driver = await db.drivers.find_one(
            {"user_id": ride["driver_id"]},
            {"_id": 0}
        )
        if driver:
            driver_location = driver.get("current_location")
            driver_info = {
                "name": driver.get("name"),
                "phone": driver.get("phone"),
                "photo": driver.get("photo"),
                "rating": driver.get("rating", 5.0),
                "total_trips": driver.get("total_trips", 0)
            }

    return {
        "ride_id": ride_id,
        "status": ride["status"],
        "driver_location": driver_location,
        "driver_info": driver_info,
        "pickup": ride["pickup"],
        "destination": ride["destination"]
    }

# =============================================================================
# MAIN APP SETUP
# =============================================================================

# Include the router in the main app
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API Romuo.ch VTC",
        "version": "2.0.0",
        "status": "operational",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "api": "/api",
            "admin": "/api/admin",
            "health": "/api/vehicles"
        }
    }

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

@app.on_event("startup")
async def startup_event():
    """Initialize database with default zones if needed"""
    zones_count = await db.zones.count_documents({})
    if zones_count == 0:
        for zone in DEFAULT_FIXED_ZONES:
            zone["created_at"] = datetime.now(timezone.utc)
            await db.zones.insert_one(zone)
        logger.info("Initialized default fixed price zones")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
