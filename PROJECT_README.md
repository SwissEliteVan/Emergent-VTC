# Romuo.ch - Swiss Premium VTC Application MVP

## 🚗 Overview
Romuo.ch is a premium VTC (Vehicle Transport with Chauffeur) mobile application designed for the Swiss market. The MVP focuses on the passenger booking flow with elegant Swiss design aesthetics and CHF pricing.

## ✨ Features Implemented

### 🔐 Authentication
- **Emergent Google Social Login** - Quick and secure authentication
- Session-based auth with 7-day token expiry
- Automatic user profile creation

### 🗺️ Map & Location
- Interactive map view (native mobile only)
- Real-time user location tracking
- Destination search with address input
- Location permissions handling (iOS & Android)

### 🚙 Vehicle Selection
- **3 Premium Vehicle Types:**
  - **Eco** - CHF 6.00 base + CHF 3.00/km
  - **Berline Luxe** - CHF 10.00 base + CHF 5.00/km  
  - **Van** - CHF 15.00 base + CHF 6.00/km

### 💰 Price Calculation
- Real-time price estimation in Swiss Francs (CHF)
- Distance-based pricing formula
- Transparent price breakdown

### 📱 Booking Flow
1. User selects destination
2. Chooses vehicle type
3. Views price estimate
4. Confirms booking
5. Gets ride confirmation with estimated arrival time

### 🎨 Design
- **Dark Mode Premium Theme**
  - Deep black background (#0A0A0A)
  - Anthracite gray cards (#2C2C2C)
  - Gold accents (#D4AF37) for luxury feel
- Swiss minimalist aesthetic
- Mobile-first responsive design
- Touch-optimized UI (48px minimum touch targets)

## 🛠️ Tech Stack

### Frontend
- **Expo** (React Native)
- **Expo Router** (File-based routing)
- **TypeScript**
- **Zustand** (State management)
- **React Native Maps** (Native only)
- **Expo Location** (GPS tracking)
- **Axios** (API calls)
- **AsyncStorage** (Local storage)

### Backend
- **FastAPI** (Python)
- **MongoDB** (Database)
- **Motor** (Async MongoDB driver)
- **Pydantic** (Data validation)
- **HTTPX** (Auth API calls)

### Authentication
- **Emergent Google OAuth** integration
- Session token management
- Secure httpOnly cookies

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI backend with all API endpoints
│   ├── .env               # Environment variables (MONGO_URL, DB_NAME)
│   └── requirements.txt   # Python dependencies
│
├── frontend/
│   ├── app/               # Expo Router screens
│   │   ├── _layout.tsx   # Root layout with AuthProvider
│   │   ├── index.tsx     # Login screen
│   │   ├── map.tsx       # Main map/booking screen
│   │   ├── confirmation.tsx  # Booking confirmation
│   │   └── ride-status.tsx   # Active ride status
│   │
│   ├── components/
│   │   └── NativeMap.tsx # Native map component
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   │
│   ├── store/
│   │   └── rideStore.ts  # Ride state management (Zustand)
│   │
│   ├── app.json          # Expo configuration
│   ├── package.json      # Dependencies
│   └── .env             # Frontend environment variables
│
└── auth_testing.md       # Auth testing playbook
```

## 🔧 Environment Setup

### Backend (.env)
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
```

### Frontend (.env)
```bash
EXPO_TUNNEL_SUBDOMAIN=swissride-mvp
EXPO_PACKAGER_HOSTNAME=https://swissride-mvp.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://swissride-mvp.preview.emergentagent.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

## 🚀 API Endpoints

### Public Endpoints
- `GET /api/vehicles` - Get all vehicle types with pricing
- `POST /api/rides/calculate` - Calculate ride price
  ```json
  {
    "pickup": {"latitude": 46.5197, "longitude": 6.6323, "address": "Lausanne"},
    "destination": {"latitude": 46.2044, "longitude": 6.1432, "address": "Geneva"},
    "vehicle_type": "berline",
    "distance_km": 65.5
  }
  ```

### Auth Endpoints
- `POST /api/auth/session` - Exchange session_id for session_token
  - Header: `X-Session-ID: {session_id}`
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user

### Protected Endpoints (Require Auth)
- `POST /api/rides` - Create new ride booking
- `GET /api/rides/{ride_id}` - Get ride details
- `GET /api/rides/user/history` - Get user's ride history

## 🗄️ Database Schema

### Collections

#### users
```javascript
{
  "user_id": "user_abc123def456",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "created_at": ISODate("2024-01-01T00:00:00Z")
}
```

#### user_sessions
```javascript
{
  "user_id": "user_abc123def456",
  "session_token": "token_xyz",
  "expires_at": ISODate("2024-01-08T00:00:00Z"),
  "created_at": ISODate("2024-01-01T00:00:00Z")
}
```

#### rides
```javascript
{
  "ride_id": "ride_abc123def456",
  "user_id": "user_abc123def456",
  "pickup": {
    "latitude": 46.5197,
    "longitude": 6.6323,
    "address": "Lausanne"
  },
  "destination": {
    "latitude": 46.2044,
    "longitude": 6.1432,
    "address": "Geneva"
  },
  "vehicle_type": "berline",
  "distance_km": 65.5,
  "price": 337.50,
  "status": "pending",
  "created_at": ISODate("2024-01-01T00:00:00Z")
}
```

## 📱 Mobile Permissions

### iOS (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Show your location on map",
      "NSLocationAlwaysUsageDescription": "Track your ride location"
    }
  }
}
```

### Android (app.json)
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ]
  }
}
```

## ✅ Testing Status

### Backend Testing (13/13 Passed ✅)
- ✅ Vehicle Types API - All CHF pricing correct
- ✅ Price Calculation - Accurate for all vehicle types
- ✅ Authentication System - Proper validation
- ✅ Protected Endpoints - Auth requirements working
- ✅ Database Connectivity - MongoDB operations successful
- ✅ Server Connectivity - All endpoints accessible

### Pricing Verification
- **Eco**: Base 6 CHF + 3 CHF/km ✅
- **Berline**: Base 10 CHF + 5 CHF/km ✅
- **Van**: Base 15 CHF + 6 CHF/km ✅

## 🔜 Next Steps for Production

### Required Before Launch
1. **Google Maps API Key** - Add your real API key to `.env` and `app.json`
2. **Custom Domain** - Configure Romuo.ch domain on Hostinger
3. **VPS Deployment** - Deploy containerized app to your Hostinger VPS
4. **Authentication Migration** - Implement custom Google OAuth (move away from Emergent Auth)

### Future Enhancements (Phase 2)
- Driver app & real-time tracking
- Payment integration (Stripe/Twint)
- Push notifications
- Ride history with invoices
- Rating system
- Multiple payment methods
- Admin dashboard

## 📞 Support

For questions or issues, refer to:
- `/app/auth_testing.md` - Authentication testing guide
- Backend API: http://localhost:8001/docs (FastAPI auto-generated docs)

## 🎯 MVP Completion Checklist
- ✅ Authentication with Google OAuth
- ✅ Interactive map (native mobile)
- ✅ Destination search
- ✅ 3 vehicle types with Swiss CHF pricing
- ✅ Real-time price calculation
- ✅ Booking flow (create ride)
- ✅ Ride confirmation screen
- ✅ Premium dark mode design
- ✅ FastAPI + MongoDB backend
- ✅ All APIs tested and working

---

**Version**: 1.0.0 (MVP)  
**Last Updated**: January 2025  
**App Name**: Romuo.ch  
**Domain**: romuo.ch (Hostinger)
