# VTC Calculator Free - Plugin WordPress

Plugin WordPress gratuit pour calculer les prix de courses VTC en utilisant des APIs gratuites (Nominatim et OSRM).

## 🎯 Fonctionnalités

- ✅ **Autocomplétion d'adresses** avec Nominatim (OpenStreetMap) - 100% gratuit
- ✅ **Calcul de distance et durée** avec OSRM (Open Source Routing Machine) - gratuit
- ✅ **Tarification suisse personnalisable** (prise en charge + prix au km + prix à la minute)
- ✅ **Bouton WhatsApp** avec message pré-rempli pour réservation
- ✅ **Design moderne et responsive** compatible mobile/tablette/desktop
- ✅ **Aucune clé API requise** - tout est gratuit !

## 📦 Installation

### Méthode 1 : Upload via l'interface WordPress

1. **Téléchargez** le dossier `vtc-calculator-free`
2. **Zippez** le dossier complet (vtc-calculator-free.zip)
3. Dans WordPress, allez dans **Extensions → Ajouter**
4. Cliquez sur **Téléverser une extension**
5. Sélectionnez le fichier zip et cliquez sur **Installer maintenant**
6. **Activez** le plugin

### Méthode 2 : Upload FTP

1. **Uploadez** le dossier `vtc-calculator-free` dans `/wp-content/plugins/`
2. Dans WordPress, allez dans **Extensions**
3. **Activez** le plugin "VTC Calculator Free"

## 🚀 Utilisation

### Ajouter le calculateur sur une page

Ajoutez simplement le shortcode suivant dans n'importe quelle page ou article WordPress :

```
[vtc_calculator]
```

### Personnaliser le numéro WhatsApp

Par défaut, le numéro WhatsApp est `+41791234567`. Pour le modifier :

```
[vtc_calculator whatsapp_number="+41791234567"]
```

**Important :** Utilisez le format international avec le `+` et le code pays.

Exemples :
- Suisse : `+41791234567`
- France : `+33612345678`
- Belgique : `+32470123456`

### Exemple d'intégration sur la page d'accueil

1. Allez dans **Pages → Accueil** (ou créez une nouvelle page)
2. Ajoutez le shortcode :
   ```
   [vtc_calculator whatsapp_number="+41791234567"]
   ```
3. **Publiez** la page

## ⚙️ Configuration de la tarification

La tarification suisse par défaut est :
- **Prise en charge** : 6.00 CHF
- **Prix par km** : 3.80 CHF
- **Prix par minute** : 0.80 CHF

### Modifier la tarification

Éditez le fichier `vtc-calculator-free.php` et modifiez les valeurs dans la classe (ligne ~45) :

```php
private $pricing = array(
    'base_fee' => 6.00,      // Prise en charge
    'per_km' => 3.80,        // Prix par km
    'per_minute' => 0.80     // Prix par minute
);
```

## 🎨 Personnalisation du design

Le fichier CSS se trouve dans `assets/css/vtc-calculator.css`. Vous pouvez :

### Changer les couleurs principales

```css
/* Bouton principal */
.vtc-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

/* Bouton WhatsApp */
.vtc-btn-whatsapp {
    background: linear-gradient(135deg, #25d366 0%, #20ba5a 100%);
}
```

### Ajuster le style global

Toutes les classes CSS commencent par `vtc-` pour éviter les conflits avec votre thème.

## 🌍 APIs utilisées (100% gratuites)

### 1. Nominatim (OpenStreetMap)
- **Fonction** : Autocomplétion d'adresses
- **URL** : https://nominatim.openstreetmap.org/
- **Coût** : Gratuit
- **Limite** : 1 requête/seconde (respect de la Fair Use Policy)
- **Documentation** : https://nominatim.org/release-docs/latest/

### 2. OSRM (Open Source Routing Machine)
- **Fonction** : Calcul de distance et durée
- **URL** : https://router.project-osrm.org/
- **Coût** : Gratuit
- **Limite** : Raisonnable (Fair Use)
- **Documentation** : http://project-osrm.org/

### Respect des Fair Use Policies

Les deux APIs sont gratuites mais ont des politiques d'utilisation équitable :
- ✅ Pas de limitation stricte pour usage personnel/petit site
- ✅ Debounce de 300ms implémenté pour limiter les requêtes
- ✅ User-Agent personnalisé pour identifier l'application
- ⚠️ Pour très gros trafic, considérez héberger vos propres instances

## 🔧 Dépannage

### Le calculateur ne s'affiche pas
1. Vérifiez que le plugin est **activé**
2. Vérifiez que jQuery est chargé (requis par WordPress)
3. Vérifiez la console navigateur pour des erreurs JS

### L'autocomplétion ne fonctionne pas
1. Vérifiez votre connexion internet
2. Testez directement l'API : https://nominatim.openstreetmap.org/search?q=Genève&format=json
3. Vérifiez qu'aucun bloqueur de pub ne bloque les APIs

### Le calcul ne fonctionne pas
1. Vérifiez que les adresses sont bien sélectionnées (pas juste tapées)
2. Testez directement OSRM : https://router.project-osrm.org/
3. Consultez les logs d'erreur WordPress

### Le bouton WhatsApp ne fonctionne pas
1. Vérifiez le format du numéro : `+41791234567` (international)
2. Assurez-vous que WhatsApp est installé sur mobile
3. Sur desktop, WhatsApp Web doit être configuré

## 📱 Compatibilité

- ✅ WordPress 5.0+
- ✅ PHP 7.4+
- ✅ Tous navigateurs modernes (Chrome, Firefox, Safari, Edge)
- ✅ Mobile, tablette, desktop
- ✅ Compatible avec tous les thèmes WordPress

## 🆘 Support

Pour des questions ou problèmes :
1. Vérifiez la section **Dépannage** ci-dessus
2. Consultez les logs d'erreur WordPress
3. Testez sur un thème WordPress par défaut (Twenty Twenty-Four)

## 📄 Licence

GPL v2 or later

## 🚀 Roadmap

- [ ] Option pour prioriser d'autres pays (pas seulement Suisse)
- [ ] Ajout de véhicules avec tarifs différents
- [ ] Mode nuit/jour
- [ ] Intégration Google Maps en option (payant)
- [ ] Statistiques d'utilisation
- [ ] Export des devis en PDF

## 🌟 Améliorations possibles

### Auto-hébergement des APIs (pour gros trafic)

Si votre site génère beaucoup de trafic, vous pouvez héberger vos propres instances :

1. **Nominatim** : https://github.com/osm-search/Nominatim
2. **OSRM** : https://github.com/Project-OSRM/osrm-backend

### Intégration avec WooCommerce

Pour intégrer avec WooCommerce et créer des produits automatiquement, contactez un développeur WordPress.

---

**Développé pour Emergent VTC** 🚗💨
Version 1.0.0
