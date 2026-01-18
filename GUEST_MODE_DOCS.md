# Romuo.ch - Guest Mode & Deferred Authentication

## 🎯 UX Improvement: Guest Mode Implementation

### Problem Solved
**Before**: Users were forced to login immediately upon opening the app, creating friction for new users who just wanted to check prices.

**After**: Users can immediately see prices and explore the app. Authentication is only required when actually booking a ride.

---

## 🌟 Guest Mode Features

### 1. Instant Access (No Login Wall)
- App opens directly to the **Map & Price Estimator**
- **No authentication required** to browse
- Guests can:
  - Enter destination
  - Select vehicle type (Eco/Berline/Van)
  - See real-time price estimates in CHF
  - Explore the app freely

### 2. Deferred Authentication
Authentication is only triggered when user tries to **book a ride**.

**Guest Flow:**
1. Guest enters destination → "Lausanne to Geneva"
2. Selects vehicle → "Berline Luxe"
3. Sees price → "337.50 CHF"
4. Clicks **"Commander"**
5. 🔒 **Login prompt appears**: "Connexion requise pour réserver"
6. User clicks "Se connecter"
7. Google OAuth opens
8. After successful login → **Automatic redirect to booking confirmation**
9. Trip details preserved (destination, vehicle, price)

**Logged-in User Flow:**
1. Opens app → sees personalized header with name
2. Can instantly book rides (no login prompt)
3. Access to driver mode toggle
4. Access to ride history

---

## 💡 Key Technical Implementation

### Auth Context Updates
- New `isGuest` property: `true` when not logged in
- Session check on app launch (non-blocking)
- Post-login redirect handling with preserved state

### Preserved State During Auth
Trip details stored in Zustand before login:
- Pickup location
- Destination address
- Selected vehicle type
- Distance calculation
- Price estimate

### Smart Routing
```
Guest Opens App → Landing Page (Map/Price Estimator)
Guest Clicks Book → Login Prompt → Auth → Auto-redirect to Confirmation
Logged-in User → Auto-navigate based on role:
  - Passenger → Map Screen
  - Driver → Dispatch Screen
```

---

## 📱 UI/UX Changes

### Header (Guest vs Logged-in)

**Guest Header:**
```
┌─────────────────────────────────────┐
│ Romuo.ch              [Connexion]   │
│ VTC PREMIUM SUISSE                  │
└─────────────────────────────────────┘
```

**Logged-in Header (Passenger):**
```
┌─────────────────────────────────────┐
│ Bonjour,            [🚗] [Logout]   │
│ Jean Dupont                         │
└─────────────────────────────────────┘
```

**Logged-in Header (Driver):**
```
┌─────────────────────────────────────┐
│ Mode Chauffeur      [↔️] [Logout]   │
│ Jean Dupont                         │
└─────────────────────────────────────┘
```

### Booking Button Behavior

**Guest User:**
- Button text: **"Commander - X.XX CHF"**
- Click → Login dialog appears
- Dialog: "Connexion requise pour réserver une course"
- Options: "Annuler" | "Se connecter"

**Logged-in User:**
- Button text: **"Commander - X.XX CHF"**
- Click → Direct to confirmation screen
- No additional prompts

---

## 🔐 Protected vs Public Routes

### Public Routes (No Auth Required)
✅ `/` (index) - Map & Price Estimator
✅ `/login` - Login screen (if accessed directly)

### Protected Routes (Auth Required)
🔒 `/confirmation` - Booking confirmation
🔒 `/ride-status` - Active ride tracking
🔒 `/driver-dispatch` - Driver dispatch screen
🔒 `/driver-active` - Driver active ride management

**Protection Mechanism:**
- Confirmation screen checks for auth
- If guest tries to access directly → redirect to home with error
- Trip details must be in store to proceed

---

## 🚀 User Experience Benefits

### For New Users (Conversion Optimization)
1. **Zero friction**: Check prices instantly
2. **Trust building**: See real costs before committing
3. **Informed decision**: Compare vehicle types freely
4. **Commitment point**: Only ask for login when ready to book

### For Returning Users
1. **Seamless access**: Stay logged in across sessions
2. **Instant booking**: No extra steps
3. **Role persistence**: Driver/Passenger mode remembered
4. **Fast switching**: Toggle between modes easily

---

## 🔄 Technical Flow Diagrams

### Guest Booking Flow
```
┌────────────┐
│ Open App   │
└──────┬─────┘
       │
       v
┌────────────────────┐
│ Index (Guest Mode) │
│ - Enter destination│
│ - Select vehicle   │
│ - See price        │
└──────┬─────────────┘
       │
       v (Click "Commander")
┌────────────────────┐
│ Login Prompt       │
│ "Connexion requise"│
└──────┬─────────────┘
       │ (Click "Se connecter")
       v
┌────────────────────┐
│ Google OAuth       │
│ (External)         │
└──────┬─────────────┘
       │
       v (Success + Redirect)
┌────────────────────┐
│ Index (Logged-in)  │
│ + Pending Intent   │
└──────┬─────────────┘
       │ (Auto-navigation)
       v
┌────────────────────┐
│ Confirmation       │
│ (Trip preserved)   │
└────────────────────┘
```

### Logged-in User Flow
```
┌────────────┐
│ Open App   │
└──────┬─────┘
       │
       v (Auth check)
┌────────────────────┐
│ Index (Logged-in)  │
│ - Shows user name  │
│ - Driver toggle    │
└──────┬─────────────┘
       │
       v (Select & Book)
┌────────────────────┐
│ Confirmation       │
│ (Immediate access) │
└────────────────────┘
```

---

## 📊 Data Flow

### Booking Intent Storage

**Before Login (AsyncStorage):**
```javascript
{
  "pending_booking_intent": "true" // Flag
}
```

**Trip Details (Zustand Store):**
```javascript
{
  pickup: {
    latitude: 46.5197,
    longitude: 6.6323,
    address: "Position actuelle"
  },
  destination: {
    latitude: 46.2044,
    longitude: 6.1432,
    address: "Geneva"
  },
  selectedVehicle: {
    id: "berline",
    name: "Berline Luxe",
    base_fare: 10.00,
    rate_per_km: 5.00
  },
  distanceKm: 65.5,
  price: 337.50
}
```

**Post-Login:**
1. Auth successful → User object set
2. Check `pending_booking_intent` flag
3. If true + trip details exist → navigate to `/confirmation`
4. Clear `pending_booking_intent` flag
5. User proceeds with booking

---

## ✅ Testing Scenarios

### Scenario 1: New User (Guest) Flow
1. ✅ Open app → Lands on map immediately
2. ✅ See "Romuo.ch" branding instead of user name
3. ✅ Enter destination → Shows vehicle options
4. ✅ Select vehicle → Shows price
5. ✅ Click "Commander" → Login prompt appears
6. ✅ Login → Returns to app with trip details intact
7. ✅ Auto-navigate to confirmation screen
8. ✅ Complete booking successfully

### Scenario 2: Returning User (Logged-in)
1. ✅ Open app → See personalized greeting
2. ✅ See driver mode toggle button
3. ✅ Enter destination and select vehicle
4. ✅ Click "Commander" → Direct to confirmation (no login)
5. ✅ Complete booking

### Scenario 3: Guest Explores Then Exits
1. ✅ Open app as guest
2. ✅ Check multiple price estimates
3. ✅ Close app without booking
4. ✅ Reopen → Still in guest mode
5. ✅ No login required to continue exploring

### Scenario 4: Driver Mode Protection
1. ✅ Logged-in user with driver role
2. ✅ Open app → Auto-navigate to driver dispatch
3. ✅ Cannot access as guest
4. ✅ Login required to see driver features

---

## 🔧 Configuration

### Auth Flow Settings
- **Session Duration**: 7 days
- **Login Provider**: Emergent Google OAuth
- **Redirect Handling**: Deep links + URL params
- **State Persistence**: AsyncStorage + Zustand

### Guest Mode Settings
- **Price Estimation**: Public API (no auth required)
- **Vehicle List**: Public API (no auth required)
- **Booking Creation**: Protected API (auth required)
- **Ride Management**: Protected API (auth required)

---

## 📈 Expected Business Impact

### Conversion Metrics
- **Reduced bounce rate**: Users can explore before committing
- **Increased signups**: Only ask when value is clear
- **Higher booking completion**: Seamless flow reduces drop-off

### User Satisfaction
- **Lower friction**: No immediate auth wall
- **Better transparency**: See prices upfront
- **Informed decisions**: Compare options freely
- **Trust building**: No commitment required to explore

---

## 🎨 Swiss Premium Design Maintained

All guest mode screens follow the established Swiss premium aesthetic:
- Deep black (#0A0A0A) backgrounds
- Anthracite (#1A1A1A, #2C2C2C) cards
- Gold (#D4AF37) accents for branding and CTAs
- Minimalist typography
- Large, accessible touch targets
- Consistent spacing (8pt grid)

---

## 🚦 Implementation Checklist

✅ Auth Context updated with `isGuest` property  
✅ Index screen allows guest access  
✅ Header shows appropriate UI (guest vs logged-in)  
✅ Booking button checks auth state  
✅ Login prompt dialog implemented  
✅ Trip details preserved in Zustand  
✅ Booking intent flag in AsyncStorage  
✅ Post-login auto-navigation  
✅ Protected routes enforce auth  
✅ Driver mode remains gated  
✅ Role-based routing (passenger/driver)  
✅ Swiss premium design maintained  

---

**Version**: 3.0.0 (Guest Mode & Deferred Auth)  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready
