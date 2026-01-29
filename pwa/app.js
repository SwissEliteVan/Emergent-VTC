/**
 * EMERGENT VTC - Progressive Web App
 * Main Application Logic
 */

(function() {
    'use strict';

    // ===== APP STATE =====
    const AppState = {
        currentScreen: 'home',
        isLoggedIn: false,
        user: null,
        selectedVehicle: null,
        selectedDestination: null,
        currentRide: null,
        bookingState: 'idle' // idle, selecting, searching, confirmed
    };

    // ===== DOM ELEMENTS =====
    const DOM = {
        // Splash & Auth
        splashScreen: document.getElementById('splash-screen'),
        splashLoginBtn: document.getElementById('splash-login-btn'),
        splashGuestBtn: document.getElementById('splash-guest-btn'),
        loginModal: document.getElementById('login-modal'),
        registerModal: document.getElementById('register-modal'),
        closeLogin: document.getElementById('close-login'),
        closeRegister: document.getElementById('close-register'),
        showRegister: document.getElementById('show-register'),
        showLogin: document.getElementById('show-login'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),

        // Main App
        app: document.getElementById('app'),
        screens: document.querySelectorAll('.screen'),
        tabItems: document.querySelectorAll('.tab-item'),

        // Home Screen
        searchBar: document.getElementById('search-bar'),
        destinationInput: document.getElementById('destination-input'),
        destinationPanel: document.getElementById('destination-panel'),
        closeDestination: document.getElementById('close-destination'),
        destinationSearch: document.getElementById('destination-search'),
        placeItems: document.querySelectorAll('.place-item'),
        vehicleSheet: document.getElementById('vehicle-sheet'),
        vehicleOptions: document.querySelectorAll('.vehicle-option'),
        confirmRideBtn: document.getElementById('confirm-ride'),
        searchingOverlay: document.getElementById('searching-overlay'),
        cancelSearchBtn: document.getElementById('cancel-search'),
        rideConfirmed: document.getElementById('ride-confirmed'),
        cancelRideBtn: document.getElementById('cancel-ride'),

        // Activities Screen
        activityTabs: document.querySelectorAll('.activities-tabs .tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Account Screen
        userName: document.getElementById('user-name'),
        userPhone: document.getElementById('user-phone'),
        referralCode: document.getElementById('referral-code'),
        copyCodeBtn: document.getElementById('copy-code'),
        logoutBtn: document.getElementById('logout-btn')
    };

    // ===== INITIALIZATION =====
    function init() {
        // Register Service Worker
        registerServiceWorker();

        // Setup Event Listeners
        setupSplashEvents();
        setupAuthEvents();
        setupNavigationEvents();
        setupHomeScreenEvents();
        setupActivitiesEvents();
        setupAccountEvents();

        // Check for saved session
        checkSavedSession();
    }

    // ===== SERVICE WORKER =====
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('SW registered:', registration);
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    }

    // ===== SESSION MANAGEMENT =====
    function checkSavedSession() {
        const savedUser = localStorage.getItem('emergent_user');
        if (savedUser) {
            AppState.user = JSON.parse(savedUser);
            AppState.isLoggedIn = true;
            enterApp();
        }
    }

    function saveSession(user) {
        localStorage.setItem('emergent_user', JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem('emergent_user');
        AppState.user = null;
        AppState.isLoggedIn = false;
    }

    // ===== SPLASH SCREEN EVENTS =====
    function setupSplashEvents() {
        DOM.splashLoginBtn.addEventListener('click', () => {
            showModal(DOM.loginModal);
        });

        DOM.splashGuestBtn.addEventListener('click', () => {
            // Guest mode - create temporary user
            AppState.user = {
                id: 'guest_' + Date.now(),
                name: 'Invité',
                phone: '',
                isGuest: true
            };
            AppState.isLoggedIn = true;
            enterApp();
        });
    }

    // ===== AUTH EVENTS =====
    function setupAuthEvents() {
        // Close modals
        DOM.closeLogin.addEventListener('click', () => hideModal(DOM.loginModal));
        DOM.closeRegister.addEventListener('click', () => hideModal(DOM.registerModal));

        // Modal overlays
        DOM.loginModal.querySelector('.modal-overlay').addEventListener('click', () => hideModal(DOM.loginModal));
        DOM.registerModal.querySelector('.modal-overlay').addEventListener('click', () => hideModal(DOM.registerModal));

        // Switch between login/register
        DOM.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(DOM.loginModal);
            setTimeout(() => showModal(DOM.registerModal), 200);
        });

        DOM.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(DOM.registerModal);
            setTimeout(() => showModal(DOM.loginModal), 200);
        });

        // Login form
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('login-phone').value;
            const password = document.getElementById('login-password').value;

            // Simulate login
            if (phone && password) {
                AppState.user = {
                    id: 'user_' + Date.now(),
                    name: 'Jean Dupont',
                    phone: phone,
                    email: 'jean@exemple.com',
                    isGuest: false
                };
                AppState.isLoggedIn = true;
                saveSession(AppState.user);
                hideModal(DOM.loginModal);
                enterApp();
                showToast('Connexion réussie');
            }
        });

        // Register form
        DOM.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const password = document.getElementById('register-password').value;

            // Simulate registration
            if (name && email && phone && password) {
                AppState.user = {
                    id: 'user_' + Date.now(),
                    name: name,
                    phone: phone,
                    email: email,
                    isGuest: false
                };
                AppState.isLoggedIn = true;
                saveSession(AppState.user);
                hideModal(DOM.registerModal);
                enterApp();
                showToast('Compte créé avec succès');
            }
        });
    }

    // ===== NAVIGATION EVENTS =====
    function setupNavigationEvents() {
        DOM.tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const screenName = tab.dataset.screen;
                navigateToScreen(screenName);
            });
        });
    }

    function navigateToScreen(screenName) {
        // Update state
        AppState.currentScreen = screenName;

        // Update tabs
        DOM.tabItems.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.screen === screenName);
        });

        // Update screens
        DOM.screens.forEach(screen => {
            const isActive = screen.id === `screen-${screenName}`;
            screen.classList.toggle('active', isActive);
        });
    }

    // ===== HOME SCREEN EVENTS =====
    function setupHomeScreenEvents() {
        // Search bar click
        DOM.searchBar.addEventListener('click', openDestinationPanel);

        // Close destination panel
        DOM.closeDestination.addEventListener('click', closeDestinationPanel);

        // Place selection
        DOM.placeItems.forEach(place => {
            place.addEventListener('click', () => {
                const address = place.dataset.address;
                selectDestination(address);
            });
        });

        // Destination search input
        DOM.destinationSearch.addEventListener('input', (e) => {
            // In a real app, this would trigger an autocomplete API
            console.log('Searching:', e.target.value);
        });

        DOM.destinationSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                selectDestination(e.target.value.trim());
            }
        });

        // Vehicle selection
        DOM.vehicleOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectVehicle(option);
            });
        });

        // Confirm ride button
        DOM.confirmRideBtn.addEventListener('click', confirmRide);

        // Cancel search
        DOM.cancelSearchBtn.addEventListener('click', cancelSearch);

        // Cancel ride
        DOM.cancelRideBtn.addEventListener('click', cancelRide);
    }

    function openDestinationPanel() {
        DOM.destinationPanel.classList.remove('hidden');
        setTimeout(() => {
            DOM.destinationSearch.focus();
        }, 300);
    }

    function closeDestinationPanel() {
        DOM.destinationPanel.classList.add('hidden');
        DOM.destinationSearch.value = '';
    }

    function selectDestination(address) {
        AppState.selectedDestination = address;
        AppState.bookingState = 'selecting';

        // Update UI
        DOM.destinationInput.value = address;
        closeDestinationPanel();

        // Calculate fake distance and duration
        const distance = (Math.random() * 15 + 3).toFixed(1);
        const duration = Math.round(distance * 2);
        document.getElementById('route-distance').textContent = distance + ' km';
        document.getElementById('route-duration').textContent = duration + ' min';

        // Update prices based on distance
        const basePrice = parseFloat(distance);
        DOM.vehicleOptions.forEach(option => {
            const type = option.dataset.type;
            let multiplier = 1;
            if (type === 'berline') multiplier = 1.5;
            if (type === 'van') multiplier = 2.3;
            const price = Math.round(basePrice * multiplier + 5);
            option.dataset.price = price;
            option.querySelector('.vehicle-price').textContent = price + ' EUR';
        });

        // Show vehicle selection sheet
        showVehicleSheet();
    }

    function showVehicleSheet() {
        DOM.vehicleSheet.classList.remove('hidden');
        // Reset selection
        AppState.selectedVehicle = null;
        DOM.vehicleOptions.forEach(opt => opt.classList.remove('selected'));
        DOM.confirmRideBtn.disabled = true;
    }

    function hideVehicleSheet() {
        DOM.vehicleSheet.classList.add('hidden');
    }

    function selectVehicle(option) {
        // Update UI
        DOM.vehicleOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Update state
        AppState.selectedVehicle = {
            type: option.dataset.type,
            price: option.dataset.price
        };

        // Enable confirm button
        DOM.confirmRideBtn.disabled = false;
        DOM.confirmRideBtn.textContent = `Confirmer - ${AppState.selectedVehicle.price} EUR`;
    }

    function confirmRide() {
        if (!AppState.selectedVehicle || !AppState.selectedDestination) return;

        AppState.bookingState = 'searching';

        // Hide vehicle sheet, show searching overlay
        hideVehicleSheet();
        DOM.searchingOverlay.classList.remove('hidden');

        // Simulate driver search (3-5 seconds)
        const searchTime = Math.random() * 2000 + 3000;
        setTimeout(() => {
            if (AppState.bookingState === 'searching') {
                driverFound();
            }
        }, searchTime);
    }

    function cancelSearch() {
        AppState.bookingState = 'selecting';
        DOM.searchingOverlay.classList.add('hidden');
        showVehicleSheet();
    }

    function driverFound() {
        AppState.bookingState = 'confirmed';
        AppState.currentRide = {
            driver: {
                name: 'Marc D.',
                rating: 4.9,
                car: 'Tesla Model 3',
                plate: 'AB-123-CD'
            },
            destination: AppState.selectedDestination,
            vehicle: AppState.selectedVehicle,
            eta: Math.floor(Math.random() * 5) + 2
        };

        // Update ETA display
        DOM.rideConfirmed.querySelector('.ride-eta strong').textContent =
            AppState.currentRide.eta + ' min';

        // Hide searching, show confirmed
        DOM.searchingOverlay.classList.add('hidden');
        DOM.rideConfirmed.classList.remove('hidden');

        showToast('Chauffeur en route');
    }

    function cancelRide() {
        AppState.bookingState = 'idle';
        AppState.currentRide = null;
        AppState.selectedVehicle = null;
        AppState.selectedDestination = null;

        DOM.rideConfirmed.classList.add('hidden');
        DOM.destinationInput.value = '';
        DOM.confirmRideBtn.textContent = 'Confirmer la course';
        DOM.confirmRideBtn.disabled = true;

        showToast('Course annulée');
    }

    // ===== ACTIVITIES EVENTS =====
    function setupActivitiesEvents() {
        DOM.activityTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update tabs
                DOM.activityTabs.forEach(t => t.classList.toggle('active', t === tab));

                // Update content
                DOM.tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${tabName}`);
                });
            });
        });
    }

    // ===== ACCOUNT EVENTS =====
    function setupAccountEvents() {
        // Copy referral code
        DOM.copyCodeBtn.addEventListener('click', () => {
            const code = DOM.referralCode.textContent;
            navigator.clipboard.writeText(code).then(() => {
                showToast('Code copié');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('Code copié');
            });
        });

        // Share referral
        document.querySelector('.share-btn').addEventListener('click', () => {
            const code = DOM.referralCode.textContent;
            const shareData = {
                title: 'Emergent VTC',
                text: `Rejoins Emergent VTC avec mon code ${code} et obtiens 10 EUR de réduction sur ta première course !`,
                url: window.location.origin
            };

            if (navigator.share) {
                navigator.share(shareData).catch(console.log);
            } else {
                // Fallback - copy to clipboard
                navigator.clipboard.writeText(shareData.text).then(() => {
                    showToast('Lien copié');
                });
            }
        });

        // Logout
        DOM.logoutBtn.addEventListener('click', () => {
            clearSession();
            exitApp();
            showToast('Déconnexion réussie');
        });

        // Menu items (placeholder actions)
        document.getElementById('menu-payment').addEventListener('click', () => {
            showToast('Moyens de paiement - Bientôt disponible');
        });

        document.getElementById('menu-addresses').addEventListener('click', () => {
            showToast('Adresses - Bientôt disponible');
        });

        document.getElementById('menu-notifications').addEventListener('click', () => {
            showToast('Notifications - Bientôt disponible');
        });

        document.getElementById('menu-help').addEventListener('click', () => {
            showToast('Aide - Bientôt disponible');
        });

        document.getElementById('menu-legal').addEventListener('click', () => {
            showToast('Mentions légales - Bientôt disponible');
        });
    }

    // ===== UI HELPERS =====
    function enterApp() {
        DOM.splashScreen.classList.add('hidden');
        DOM.app.classList.remove('hidden');

        // Update user info in account screen
        if (AppState.user) {
            DOM.userName.textContent = AppState.user.name || 'Invité';
            DOM.userPhone.textContent = AppState.user.phone || 'Non renseigné';

            // Generate referral code
            if (!AppState.user.isGuest) {
                const firstName = AppState.user.name.split(' ')[0].toUpperCase();
                DOM.referralCode.textContent = firstName + '2026';
            } else {
                DOM.referralCode.textContent = 'GUEST2026';
            }
        }
    }

    function exitApp() {
        DOM.app.classList.add('hidden');
        DOM.splashScreen.classList.remove('hidden');

        // Reset state
        AppState.currentScreen = 'home';
        AppState.selectedVehicle = null;
        AppState.selectedDestination = null;
        AppState.currentRide = null;
        AppState.bookingState = 'idle';

        // Reset UI
        DOM.destinationInput.value = '';
        DOM.vehicleSheet.classList.add('hidden');
        DOM.searchingOverlay.classList.add('hidden');
        DOM.rideConfirmed.classList.add('hidden');
        navigateToScreen('home');

        // Clear forms
        DOM.loginForm.reset();
        DOM.registerForm.reset();
    }

    function showModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function showToast(message, type = 'default') {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== INITIALIZE APP =====
    document.addEventListener('DOMContentLoaded', init);

})();
