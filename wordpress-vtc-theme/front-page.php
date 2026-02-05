<?php
/**
 * Template Name: VTC Homepage
 * Description: Page d'accueil immersive pour service VTC
 * 
 * @package VTC_Premium_Swiss
 */

get_header(); ?>

<main id="primary" class="site-main">
    
    <!-- HERO SECTION AVEC FORMULAIRE -->
    <section class="vtc-hero-section">
        
        <!-- Image de fond -->
        <div class="vtc-hero-background">
            <?php 
            $hero_image = get_theme_mod('vtc_hero_image');
            if ($hero_image) : ?>
                <img src="<?php echo esc_url($hero_image); ?>" alt="Chauffeur Privé Suisse">
            <?php else : ?>
                <!-- Image par défaut - placeholder sombre -->
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%231a1a1a' width='1920' height='1080'/%3E%3Ctext fill='%23d4af37' font-size='48' font-family='serif' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EVTC Premium%3C/text%3E%3C/svg%3E" alt="VTC Premium">
            <?php endif; ?>
        </div>
        
        <!-- Formulaire de réservation glassmorphism -->
        <?php echo do_shortcode('[vtc_booking_form]'); ?>
        
    </section>
    
    <!-- SECTION SERVICES (Optionnel) -->
    <section class="vtc-services-section">
        <div class="vtc-container">
            <h2 class="vtc-section-title">Nos Services Premium</h2>
            
            <div class="vtc-services-grid">
                <div class="vtc-service-card">
                    <div class="vtc-service-icon">🚗</div>
                    <h3>Transferts Aéroport</h3>
                    <p>Service de navette premium vers tous les aéroports suisses (Genève, Zurich, Bâle)</p>
                </div>
                
                <div class="vtc-service-card">
                    <div class="vtc-service-icon">💼</div>
                    <h3>Déplacements Business</h3>
                    <p>Transport professionnel pour vos réunions et événements d'affaires</p>
                </div>
                
                <div class="vtc-service-card">
                    <div class="vtc-service-icon">🎉</div>
                    <h3>Événements Spéciaux</h3>
                    <p>Mariages, soirées, galas - arrivez avec style et élégance</p>
                </div>
                
                <div class="vtc-service-card">
                    <div class="vtc-service-icon">🌍</div>
                    <h3>Longue Distance</h3>
                    <p>Voyages interurbains et internationaux dans le confort absolu</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- SECTION FLOTTE (Optionnel) -->
    <section class="vtc-fleet-section">
        <div class="vtc-container">
            <h2 class="vtc-section-title">Notre Flotte Premium</h2>
            <p class="vtc-section-subtitle">Véhicules de luxe pour tous vos déplacements</p>
            
            <div class="vtc-fleet-grid">
                <div class="vtc-fleet-card">
                    <h3>Berline Executive</h3>
                    <ul>
                        <li>Mercedes Classe E / BMW Série 5</li>
                        <li>4 passagers</li>
                        <li>Cuir, climatisation, Wi-Fi</li>
                    </ul>
                </div>
                
                <div class="vtc-fleet-card vtc-featured">
                    <div class="vtc-badge">Le Plus Demandé</div>
                    <h3>Berline Première Classe</h3>
                    <ul>
                        <li>Mercedes Classe S / BMW Série 7</li>
                        <li>4 passagers</li>
                        <li>Sièges massants, champagne</li>
                    </ul>
                </div>
                
                <div class="vtc-fleet-card">
                    <h3>Van Premium</h3>
                    <ul>
                        <li>Mercedes Classe V / Viano</li>
                        <li>6-8 passagers</li>
                        <li>Idéal pour groupes et familles</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
    
    <!-- SECTION POURQUOI NOUS CHOISIR -->
    <section class="vtc-why-section">
        <div class="vtc-container">
            <h2 class="vtc-section-title">Pourquoi Nous Choisir ?</h2>
            
            <div class="vtc-advantages-grid">
                <div class="vtc-advantage-item">
                    <div class="vtc-advantage-number">01</div>
                    <h3>Ponctualité Garantie</h3>
                    <p>Nos chauffeurs arrivent toujours 10 minutes avant l'heure prévue</p>
                </div>
                
                <div class="vtc-advantage-item">
                    <div class="vtc-advantage-number">02</div>
                    <h3>Discrétion Absolue</h3>
                    <p>Confidentialité et professionnalisme pour tous vos trajets</p>
                </div>
                
                <div class="vtc-advantage-item">
                    <div class="vtc-advantage-number">03</div>
                    <h3>Tarifs Transparents</h3>
                    <p>Prix fixes sans surprises, devis gratuit instantané</p>
                </div>
                
                <div class="vtc-advantage-item">
                    <div class="vtc-advantage-number">04</div>
                    <h3>Disponible 24/7</h3>
                    <p>Service disponible jour et nuit, 365 jours par an</p>
                </div>
            </div>
        </div>
    </section>
    
</main>

<?php get_footer(); ?>
