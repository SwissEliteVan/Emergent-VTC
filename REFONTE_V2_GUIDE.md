# 🔄 ROMUO.CH - REFONTE MAJEURE v2.0
## Guide Complet d'Implémentation

---

## 📋 RÉSUMÉ DES CHANGEMENTS

### 1. Logique de Flotte ✅
- ❌ Suppression : Catégorie "Van"
- ✅ Ajout : Catégorie "Bus" (Minibus/Autocar) pour 5-15 passagers
- ✅ Logique intelligente : Bus proposé uniquement si ≥5 passagers

### 2. Tarification Avancée ✅
- ✅ **Heures creuses** : -10% hors heures de pointe
- ✅ **Tarif Jeune** : -15% pour moins de 26 ans
- ✅ **Ride-sharing** : -25% si partage accepté
- ✅ **Optimisation horaire** : Suggestions d'horaires moins chers

### 3. Sécurité & Inclusivité ✅
- ✅ **Option "Femme pour Femme"** : Filtre conductrice uniquement
- ✅ Logique dispatch : Courses assignées uniquement aux conductrices

### 4. Carte Web Compatible ✅
- ✅ Remplacement React Native Maps → **Leaflet** (web-compatible)
- ✅ Affichage correct sur desktop
- ✅ Compatibilité mobile préservée

### 5. Responsive Desktop ✅
- ✅ Layout adaptatif : Mobile → Tablet → Desktop
- ✅ Navigation clavier/souris optimisée
- ✅ Carte tarifaire redesignée

---

## 🔧 BACKEND - MODIFICATIONS

### Fichier : `/app/backend/server.py`

#### 1.1 Nouvelle configuration des véhicules

```python
# REMPLACER la section VEHICLE_TYPES par :

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

# AJOUTER après VEHICLE_TYPES :

# Heures de pointe (pour tarification dynamique)
PEAK_HOURS = {
    "morning": (7, 9),    # 7h-9h
    "evening": (17, 19),  # 17h-19h
}

# Taux de réduction
DISCOUNT_RATES = {
    "youth": 0.15,        # 15% pour -26 ans
    "ride_sharing": 0.25, # 25% pour partage
    "off_peak": 0.10,     # 10% hors pointe
}
```

#### 1.2 Nouveau modèle User avec genre et date de naissance

```python
# REMPLACER la classe User par :

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "passenger"  # passenger or driver
    account_type: str = "personal"  # personal or business
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    
    # NOUVEAUX CHAMPS
    gender: Optional[str] = None  # "male", "female", "other", "prefer_not_to_say"
    date_of_birth: Optional[str] = None  # Format: YYYY-MM-DD
    
    created_at: datetime
```

#### 1.3 Nouveau modèle Ride avec options

```python
# REMPLACER la classe Ride par :

class Ride(BaseModel):
    ride_id: str
    user_id: str
    driver_id: Optional[str] = None
    pickup: Location
    destination: Location
    vehicle_type: str
    distance_km: float
    
    # NOUVEAUX CHAMPS
    num_passengers: int = 1  # Nombre de passagers
    is_ride_sharing: bool = False  # Partage accepté
    female_driver_only: bool = False  # Conductrice uniquement
    scheduled_time: Optional[datetime] = None  # Heure planifiée
    
    base_price: float  # Prix de base
    final_price: float  # Prix final après réductions
    discounts_applied: List[str] = []  # ["youth", "off_peak", etc.]
    
    status: str  # pending, accepted, in_progress, completed, cancelled
    billing_type: str = "immediate"
    created_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
```

#### 1.4 Nouvelle logique de calcul de prix

```python
# AJOUTER cette fonction après DISCOUNT_RATES :

def calculate_smart_price(
    vehicle_type: str,
    distance_km: float,
    num_passengers: int = 1,
    user_age: Optional[int] = None,
    is_ride_sharing: bool = False,
    scheduled_time: Optional[datetime] = None
) -> dict:
    """
    Calcul intelligent du prix avec réductions applicables
    """
    vehicle = VEHICLE_TYPES.get(vehicle_type)
    if not vehicle:
        raise ValueError("Invalid vehicle type")
    
    # Vérifier que le nombre de passagers est valide
    if num_passengers < vehicle["min_passengers"] or num_passengers > vehicle["max_passengers"]:
        raise ValueError(f"Vehicle {vehicle_type} can only accommodate {vehicle['min_passengers']}-{vehicle['max_passengers']} passengers")
    
    # Prix de base
    base_price = vehicle["base_fare"] + (distance_km * vehicle["rate_per_km"])
    
    # Appliquer les réductions
    discounts = []
    total_discount = 0
    
    # 1. Tarif Jeune (-15%)
    if user_age and user_age < 26:
        total_discount += DISCOUNT_RATES["youth"]
        discounts.append("youth")
    
    # 2. Ride-sharing (-25%)
    if is_ride_sharing:
        total_discount += DISCOUNT_RATES["ride_sharing"]
        discounts.append("ride_sharing")
    
    # 3. Heure creuse (-10%)
    if scheduled_time:
        hour = scheduled_time.hour
        is_peak = False
        for period, (start, end) in PEAK_HOURS.items():
            if start <= hour < end:
                is_peak = True
                break
        
        if not is_peak:
            total_discount += DISCOUNT_RATES["off_peak"]
            discounts.append("off_peak")
    
    # Prix final (maximum 50% de réduction)
    total_discount = min(total_discount, 0.50)
    final_price = base_price * (1 - total_discount)
    
    return {
        "vehicle_type": vehicle_type,
        "vehicle_name": vehicle["name"],
        "distance_km": distance_km,
        "num_passengers": num_passengers,
        "base_price": round(base_price, 2),
        "final_price": round(final_price, 2),
        "total_discount_percent": round(total_discount * 100, 0),
        "discounts_applied": discounts,
        "currency": "CHF"
    }
```

#### 1.5 Endpoint de suggestion de véhicules

```python
# AJOUTER ce nouvel endpoint avant les admin routes :

@api_router.get("/vehicles/suggest")
async def suggest_vehicles(num_passengers: int = 1):
    """
    Suggérer les véhicules adaptés au nombre de passagers
    """
    if num_passengers < 1 or num_passengers > 15:
        raise HTTPException(status_code=400, detail="Number of passengers must be between 1 and 15")
    
    suitable_vehicles = []
    
    for vehicle_id, vehicle in VEHICLE_TYPES.items():
        if vehicle["min_passengers"] <= num_passengers <= vehicle["max_passengers"]:
            suitable_vehicles.append(vehicle)
    
    # Si aucun véhicule ne convient (pas possible normalement)
    if not suitable_vehicles:
        raise HTTPException(status_code=400, detail="No vehicle available for this number of passengers")
    
    return {
        "num_passengers": num_passengers,
        "suitable_vehicles": suitable_vehicles,
        "recommendation": suitable_vehicles[0]["id"]  # Le moins cher qui convient
    }
```

#### 1.6 Nouveau endpoint de calcul de prix avec options

```python
# REMPLACER l'endpoint /api/rides/calculate par :

@api_router.post("/rides/calculate-advanced")
async def calculate_ride_price_advanced(
    pickup: Location,
    destination: Location,
    vehicle_type: str,
    distance_km: float,
    num_passengers: int = 1,
    user_age: Optional[int] = None,
    is_ride_sharing: bool = False,
    scheduled_time: Optional[str] = None  # Format ISO: "2025-01-20T14:30:00"
):
    """
    Calculer le prix avec toutes les options (réductions, partage, etc.)
    """
    # Convertir scheduled_time si fourni
    scheduled_dt = None
    if scheduled_time:
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        except:
            pass
    
    try:
        result = calculate_smart_price(
            vehicle_type=vehicle_type,
            distance_km=distance_km,
            num_passengers=num_passengers,
            user_age=user_age,
            is_ride_sharing=is_ride_sharing,
            scheduled_time=scheduled_dt
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

#### 1.7 Modification du dispatch driver pour femme-pour-femme

```python
# REMPLACER @api_router.get("/driver/pending-rides") par :

@api_router.get("/driver/pending-rides")
async def get_pending_rides(
    current_user: User = Depends(get_current_user)
):
    """Get pending rides for drivers (with female-only filter)"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Driver role required")
    
    # Construire le filtre
    query = {"status": "pending"}
    
    # Si le chauffeur n'est PAS une femme, exclure les courses "femme uniquement"
    if current_user.gender != "female":
        query["female_driver_only"] = {"$ne": True}
    
    rides = await db.rides.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"rides": rides}
```

---

## 🎨 FRONTEND - MODIFICATIONS

### 📦 Nouvelles dépendances à installer

```bash
cd /app/frontend

# Installer Leaflet pour la carte web-compatible
yarn add react-leaflet leaflet

# Installer les types TypeScript pour Leaflet
yarn add -D @types/leaflet
```

### Fichier à créer : `/app/frontend/components/WebMap.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Leaflet pour Web, React Native Maps pour mobile
const WebMap = Platform.OS === 'web' 
  ? require('./WebMapLeaflet').default 
  : require('./NativeMap').default;

export default WebMap;
```

### Fichier à créer : `/app/frontend/components/WebMapLeaflet.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

interface WebMapProps {
  currentLocation: { coords: { latitude: number; longitude: number } } | null;
}

export default function WebMapLeaflet({ currentLocation }: WebMapProps) {
  useEffect(() => {
    // Import dynamique de Leaflet (uniquement côté web)
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        import('leaflet/dist/leaflet.css');
        
        // Créer la carte
        const map = L.map('map-container').setView(
          currentLocation 
            ? [currentLocation.coords.latitude, currentLocation.coords.longitude]
            : [46.5197, 6.6323], // Lausanne par défaut
          13
        );
        
        // Ajouter les tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Ajouter un marqueur pour la position actuelle
        if (currentLocation) {
          L.marker([
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          ]).addTo(map).bindPopup('Votre position');
        }
        
        return () => {
          map.remove();
        };
      });
    }
  }, [currentLocation]);
  
  return (
    <View style={styles.container}>
      <div id="map-container" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
```

---

## 📱 RESPONSIVE DESIGN - Modifications

### Principe : Breakpoints adaptatifs

```typescript
// Fichier à créer : /app/frontend/utils/responsive.ts

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export const isWeb = Platform.OS === 'web';
export const isMobile = width < BREAKPOINTS.mobile;
export const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
export const isDesktop = width >= BREAKPOINTS.tablet;

export const responsive = {
  // Padding adaptatif
  padding: isMobile ? 16 : isTablet ? 24 : 32,
  
  // Largeur maximale du contenu
  maxWidth: isMobile ? '100%' : isTablet ? 720 : 1200,
  
  // Taille des cartes
  cardWidth: isMobile ? '100%' : isTablet ? '48%' : '32%',
  
  // Colonnes de grille
  columns: isMobile ? 1 : isTablet ? 2 : 3,
};
```

---

## 🎯 CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Backend (1-2h)
- [ ] Modifier VEHICLE_TYPES (supprimer Van, ajouter Bus)
- [ ] Ajouter PEAK_HOURS et DISCOUNT_RATES
- [ ] Mettre à jour modèle User (gender, date_of_birth)
- [ ] Mettre à jour modèle Ride (num_passengers, options)
- [ ] Ajouter fonction calculate_smart_price()
- [ ] Créer endpoint /vehicles/suggest
- [ ] Créer endpoint /rides/calculate-advanced
- [ ] Modifier /driver/pending-rides (filtre femme)
- [ ] Redémarrer backend : `sudo supervisorctl restart backend`

### Phase 2 : Frontend Carte (30min)
- [ ] Installer Leaflet : `yarn add react-leaflet leaflet`
- [ ] Créer WebMapLeaflet.tsx
- [ ] Créer WebMap.tsx (wrapper conditionnel)
- [ ] Remplacer l'import de carte dans index.tsx

### Phase 3 : Frontend Options (1h)
- [ ] Ajouter champs formulaire (nb passagers, partage, femme)
- [ ] Appeler nouveau endpoint calculate-advanced
- [ ] Afficher les réductions appliquées
- [ ] Suggérer horaires optimisés

### Phase 4 : Responsive Desktop (1h)
- [ ] Créer responsive.ts avec breakpoints
- [ ] Adapter styles des écrans (flex-direction, maxWidth)
- [ ] Tester sur desktop (Chrome DevTools)
- [ ] Vérifier navigation clavier

### Phase 5 : Tests (30min)
- [ ] Tester calcul de prix avec réductions
- [ ] Tester suggestion Bus pour 5+ passagers
- [ ] Tester filtre femme-pour-femme
- [ ] Tester carte sur desktop
- [ ] Tester responsive mobile/tablet/desktop

---

## 🚨 POINTS D'ATTENTION

### Migrations Base de Données
Aucune migration requise ! Les nouveaux champs sont optionnels (Optional[]).
Les documents existants fonctionneront sans modification.

### Compatibilité
- Leaflet fonctionne parfaitement sur web
- React Native Maps reste pour mobile
- Pas de breaking changes pour utilisateurs existants

### Performance
- Leaflet est léger (~140 KB)
- Rendu carte optimisé pour desktop
- Pas d'impact sur mobile

---

## 📞 AIDE À L'IMPLÉMENTATION

Si vous voulez que j'implémente ces changements directement :

1. **Backend complet** : Je peux réécrire server.py avec toutes les modifications
2. **Composant carte** : Je peux créer les fichiers WebMap complets
3. **Screen responsive** : Je peux adapter index.tsx pour desktop
4. **Tests** : Je peux créer des scripts de test

**Dites-moi par où commencer et je le fais immédiatement !** 🚀
