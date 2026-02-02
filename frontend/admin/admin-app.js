/**
 * VTC Suisse - Admin Dashboard Application
 * Swiss Design System Administration
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  apiBase: '/api',
  refreshInterval: 30000, // 30 seconds
  dateFormat: {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' }
  },
  currency: 'CHF',
  locale: 'fr-CH'
};

// ============================================
// State Management
// ============================================
const state = {
  currentPage: 'dashboard',
  reservations: [],
  drivers: [],
  customers: [],
  payments: [],
  statistics: null,
  filters: {
    status: 'all',
    dateFrom: null,
    dateTo: null,
    search: ''
  },
  pagination: {
    page: 1,
    perPage: 10,
    total: 0
  },
  modals: {
    reservation: null,
    driver: null
  }
};

// ============================================
// API Helper
// ============================================
const api = {
  async get(endpoint) {
    try {
      const response = await fetch(`${CONFIG.apiBase}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  async post(endpoint, body) {
    try {
      const response = await fetch(`${CONFIG.apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  async put(endpoint, body) {
    try {
      const response = await fetch(`${CONFIG.apiBase}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${CONFIG.apiBase}${endpoint}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
};

// ============================================
// Utility Functions
// ============================================
const utils = {
  formatDate(dateStr, format = 'short') {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(CONFIG.locale, CONFIG.dateFormat[format]);
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString(CONFIG.locale, CONFIG.dateFormat.time);
  },

  formatCurrency(amount, currency = CONFIG.currency) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat(CONFIG.locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  formatDistance(km) {
    if (!km) return '-';
    return `${km.toFixed(1)} km`;
  },

  formatDuration(minutes) {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  },

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  truncate(str, length = 30) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
};

// ============================================
// Navigation
// ============================================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const pages = document.querySelectorAll('.page');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;

      // Update active nav
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show page
      pages.forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${page}`)?.classList.add('active');

      // Update title
      pageTitle.textContent = item.querySelector('span').textContent;

      // Update state and load data
      state.currentPage = page;
      loadPageData(page);
    });
  });

  // Menu toggle for mobile
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ============================================
// Data Loading
// ============================================
async function loadPageData(page) {
  try {
    switch (page) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'reservations':
        await loadReservations();
        break;
      case 'drivers':
        await loadDrivers();
        break;
      case 'customers':
        await loadCustomers();
        break;
      case 'payments':
        await loadPayments();
        break;
      case 'settings':
        loadSettings();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${page}:`, error);
    showToast('error', 'Erreur de chargement', `Impossible de charger les données`);
  }
}

// Dashboard
async function loadDashboard() {
  try {
    // Load statistics
    const stats = await api.get('/admin/statistics');
    state.statistics = stats;
    updateStatsCards(stats);

    // Load recent reservations
    const reservations = await api.get('/admin/reservations?limit=5&status=pending,confirmed');
    renderRecentReservations(reservations);

    // Initialize charts
    initCharts(stats);
  } catch (error) {
    // Use mock data if API fails
    console.warn('Using mock dashboard data');
    const mockStats = {
      today: { reservations: 12, revenue: 2450, distance: 156 },
      week: { reservations: 78, revenue: 15680, distance: 1024 },
      month: { reservations: 324, revenue: 64800, distance: 4256 },
      pending: 8,
      drivers: { available: 5, busy: 3, offline: 2 }
    };
    updateStatsCards(mockStats);
    initCharts(mockStats);
  }
}

function updateStatsCards(stats) {
  // Today's reservations
  const todayRes = document.getElementById('stat-today-reservations');
  if (todayRes) todayRes.textContent = stats.today?.reservations || 0;

  // Today's revenue
  const todayRev = document.getElementById('stat-today-revenue');
  if (todayRev) todayRev.textContent = utils.formatCurrency(stats.today?.revenue || 0);

  // Pending reservations
  const pending = document.getElementById('stat-pending');
  if (pending) pending.textContent = stats.pending || 0;

  // Active drivers
  const drivers = document.getElementById('stat-active-drivers');
  if (drivers) drivers.textContent = stats.drivers?.available || 0;
}

function initCharts(stats) {
  // Revenue Chart
  const revenueCtx = document.getElementById('revenue-chart');
  if (revenueCtx && typeof Chart !== 'undefined') {
    // Destroy existing chart if any
    if (window.revenueChart) window.revenueChart.destroy();

    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = stats.weeklyRevenue || [1200, 1890, 1560, 2100, 1750, 2400, 1980];

    window.revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenus (CHF)',
          data,
          borderColor: '#D52B1E',
          backgroundColor: 'rgba(213, 43, 30, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `CHF ${value}`
            }
          }
        }
      }
    });
  }

  // Status distribution chart
  const statusCtx = document.getElementById('status-chart');
  if (statusCtx && typeof Chart !== 'undefined') {
    if (window.statusChart) window.statusChart.destroy();

    window.statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Terminées', 'En cours', 'En attente', 'Annulées'],
        datasets: [{
          data: stats.statusDistribution || [65, 15, 12, 8],
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        },
        cutout: '70%'
      }
    });
  }
}

function renderRecentReservations(reservations) {
  const tbody = document.getElementById('recent-reservations-body');
  if (!tbody) return;

  if (!reservations || reservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 40px; color: var(--gray-500);">
          Aucune réservation récente
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reservations.map(res => `
    <tr>
      <td class="cell-id">#${res.id.substring(0, 8)}</td>
      <td>
        <div class="cell-customer">
          <div class="customer-avatar">${utils.getInitials(res.customer_name)}</div>
          <span class="customer-name">${res.customer_name}</span>
        </div>
      </td>
      <td>
        <div class="cell-route">
          <div class="route-from"><i class="fas fa-circle"></i> ${utils.truncate(res.pickup_address, 25)}</div>
          <div class="route-to"><i class="fas fa-map-marker-alt"></i> ${utils.truncate(res.dropoff_address, 25)}</div>
        </div>
      </td>
      <td class="cell-datetime">
        <div class="datetime-date">${utils.formatDate(res.pickup_datetime)}</div>
        <div class="datetime-time">${utils.formatTime(res.pickup_datetime)}</div>
      </td>
      <td><span class="status-badge ${res.status}">${getStatusLabel(res.status)}</span></td>
    </tr>
  `).join('');
}

// Reservations Page
async function loadReservations() {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return;

  // Show loading
  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 40px;">
        <div class="loading-spinner" style="margin: 0 auto;"></div>
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams({
      page: state.pagination.page,
      limit: state.pagination.perPage
    });

    if (state.filters.status !== 'all') {
      params.append('status', state.filters.status);
    }
    if (state.filters.dateFrom) {
      params.append('date_from', state.filters.dateFrom);
    }
    if (state.filters.dateTo) {
      params.append('date_to', state.filters.dateTo);
    }

    const data = await api.get(`/admin/reservations?${params}`);
    state.reservations = data.reservations || data;
    state.pagination.total = data.total || state.reservations.length;

    renderReservationsTable();
    updatePagination();
  } catch (error) {
    // Mock data
    state.reservations = generateMockReservations(10);
    state.pagination.total = 50;
    renderReservationsTable();
    updatePagination();
  }
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return;

  if (state.reservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div>
            <h3>Aucune réservation</h3>
            <p>Aucune réservation ne correspond aux critères sélectionnés.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.reservations.map(res => `
    <tr data-id="${res.id}">
      <td class="cell-id">#${(res.id || '').substring(0, 8)}</td>
      <td>
        <div class="cell-customer">
          <div class="customer-avatar">${utils.getInitials(res.customer_name)}</div>
          <div class="customer-info">
            <span class="customer-name">${res.customer_name || 'N/A'}</span>
            <span class="customer-email">${res.customer_phone || ''}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="cell-route">
          <div class="route-from"><i class="fas fa-circle"></i> ${utils.truncate(res.pickup_address, 30)}</div>
          <div class="route-to"><i class="fas fa-map-marker-alt"></i> ${utils.truncate(res.dropoff_address, 30)}</div>
        </div>
      </td>
      <td class="cell-datetime">
        <div class="datetime-date">${utils.formatDate(res.pickup_datetime)}</div>
        <div class="datetime-time">${utils.formatTime(res.pickup_datetime)}</div>
      </td>
      <td>${res.vehicle_type || '-'}</td>
      <td class="cell-price">${utils.formatCurrency(res.total_price)}</td>
      <td><span class="status-badge ${res.status}">${getStatusLabel(res.status)}</span></td>
      <td class="cell-actions">
        <button class="action-btn view" onclick="viewReservation('${res.id}')" title="Voir">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" onclick="editReservation('${res.id}')" title="Modifier">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" onclick="deleteReservation('${res.id}')" title="Annuler">
          <i class="fas fa-times"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Drivers Page
async function loadDrivers() {
  const grid = document.getElementById('drivers-grid');
  if (!grid) return;

  try {
    const drivers = await api.get('/admin/drivers');
    state.drivers = drivers;
    renderDriversGrid();
  } catch (error) {
    // Mock data
    state.drivers = generateMockDrivers(8);
    renderDriversGrid();
  }
}

function renderDriversGrid() {
  const grid = document.getElementById('drivers-grid');
  if (!grid) return;

  if (state.drivers.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fas fa-user-tie"></i></div>
        <h3>Aucun chauffeur</h3>
        <p>Ajoutez votre premier chauffeur pour commencer.</p>
        <button class="btn btn-primary" onclick="openDriverModal()">
          <i class="fas fa-plus"></i> Ajouter un chauffeur
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.drivers.map(driver => `
    <div class="driver-card" data-id="${driver.id}">
      <div class="driver-header">
        <div class="driver-avatar">${utils.getInitials(driver.name)}</div>
        <div class="driver-info">
          <h3>${driver.name}</h3>
          <span class="driver-vehicle">${driver.vehicle_model || 'Non assigné'}</span>
        </div>
        <span class="status-badge ${driver.status}">${getDriverStatusLabel(driver.status)}</span>
      </div>
      <div class="driver-stats">
        <div class="driver-stat">
          <div class="driver-stat-value">${driver.trips_count || 0}</div>
          <div class="driver-stat-label">Courses</div>
        </div>
        <div class="driver-stat">
          <div class="driver-stat-value">${utils.formatDistance(driver.total_distance)}</div>
          <div class="driver-stat-label">Distance</div>
        </div>
        <div class="driver-stat">
          <div class="driver-stat-value">${utils.formatCurrency(driver.total_revenue)}</div>
          <div class="driver-stat-label">Revenus</div>
        </div>
      </div>
      <div class="driver-footer">
        <div class="driver-rating">
          <i class="fas fa-star"></i>
          <span>${(driver.rating || 4.5).toFixed(1)}</span>
        </div>
        <div class="driver-actions">
          <button class="btn btn-sm btn-secondary" onclick="editDriver('${driver.id}')">
            <i class="fas fa-edit"></i> Modifier
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Customers Page
async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  try {
    const customers = await api.get('/admin/customers');
    state.customers = customers;
    renderCustomersTable();
  } catch (error) {
    // Mock data
    state.customers = generateMockCustomers(15);
    renderCustomersTable();
  }
}

function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.customers.map(customer => `
    <tr data-id="${customer.id}">
      <td>
        <div class="cell-customer">
          <div class="customer-avatar">${utils.getInitials(customer.name)}</div>
          <div class="customer-info">
            <span class="customer-name">${customer.name}</span>
            <span class="customer-email">${customer.email}</span>
          </div>
        </div>
      </td>
      <td>${customer.phone || '-'}</td>
      <td>${customer.preferred_canton || '-'}</td>
      <td>${customer.reservations_count || 0}</td>
      <td class="cell-price">${utils.formatCurrency(customer.total_spent)}</td>
      <td class="cell-datetime">
        <div class="datetime-date">${utils.formatDate(customer.last_reservation)}</div>
      </td>
      <td class="cell-actions">
        <button class="action-btn view" onclick="viewCustomer('${customer.id}')" title="Voir">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn edit" onclick="editCustomer('${customer.id}')" title="Modifier">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Payments Page
async function loadPayments() {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  try {
    const payments = await api.get('/admin/payments');
    state.payments = payments;
    renderPaymentsTable();
  } catch (error) {
    // Mock data
    state.payments = generateMockPayments(20);
    renderPaymentsTable();
  }
}

function renderPaymentsTable() {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.payments.map(payment => `
    <tr>
      <td class="cell-id">#${(payment.id || '').substring(0, 8)}</td>
      <td class="cell-id">#${(payment.reservation_id || '').substring(0, 8)}</td>
      <td>
        <div class="cell-customer">
          <div class="customer-avatar">${utils.getInitials(payment.customer_name)}</div>
          <span>${payment.customer_name}</span>
        </div>
      </td>
      <td class="cell-price">${utils.formatCurrency(payment.amount)}</td>
      <td>
        <span class="payment-method">
          <i class="fas fa-${getPaymentMethodIcon(payment.method)}"></i>
          ${getPaymentMethodLabel(payment.method)}
        </span>
      </td>
      <td><span class="status-badge ${payment.status}">${getPaymentStatusLabel(payment.status)}</span></td>
      <td class="cell-datetime">
        <div class="datetime-date">${utils.formatDate(payment.created_at)}</div>
        <div class="datetime-time">${utils.formatTime(payment.created_at)}</div>
      </td>
    </tr>
  `).join('');
}

// Settings Page
function loadSettings() {
  // Load settings from localStorage or API
  const settings = JSON.parse(localStorage.getItem('vtc_settings') || '{}');

  // Populate form fields
  Object.keys(settings).forEach(key => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = settings[key];
      } else {
        input.value = settings[key];
      }
    }
  });
}

// ============================================
// Modal Functions
// ============================================
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function viewReservation(id) {
  const reservation = state.reservations.find(r => r.id === id);
  if (!reservation) return;

  state.modals.reservation = reservation;

  const content = document.getElementById('reservation-details-content');
  if (content) {
    content.innerHTML = `
      <div class="detail-section">
        <h4>Informations générales</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Numéro</span>
            <span class="detail-value">#${reservation.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Statut</span>
            <span class="status-badge ${reservation.status}">${getStatusLabel(reservation.status)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date de réservation</span>
            <span class="detail-value">${utils.formatDate(reservation.created_at, 'long')}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Client</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Nom</span>
            <span class="detail-value">${reservation.customer_name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Téléphone</span>
            <span class="detail-value">${reservation.customer_phone || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">${reservation.customer_email || '-'}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Trajet</h4>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <span class="detail-label">Départ</span>
            <span class="detail-value"><i class="fas fa-circle" style="color: var(--success);"></i> ${reservation.pickup_address}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Arrivée</span>
            <span class="detail-value"><i class="fas fa-map-marker-alt" style="color: var(--swiss-red);"></i> ${reservation.dropoff_address}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date & Heure</span>
            <span class="detail-value">${utils.formatDate(reservation.pickup_datetime, 'long')} à ${utils.formatTime(reservation.pickup_datetime)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Distance</span>
            <span class="detail-value">${utils.formatDistance(reservation.distance_km)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Durée estimée</span>
            <span class="detail-value">${utils.formatDuration(reservation.duration_min)}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Véhicule & Tarification</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Type de véhicule</span>
            <span class="detail-value">${reservation.vehicle_type}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Passagers</span>
            <span class="detail-value">${reservation.passengers || 1}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Bagages</span>
            <span class="detail-value">${reservation.luggage || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Prix total</span>
            <span class="detail-value" style="font-size: 20px; font-weight: 700; color: var(--swiss-red);">
              ${utils.formatCurrency(reservation.total_price)}
            </span>
          </div>
        </div>
      </div>

      ${reservation.notes ? `
        <div class="detail-section">
          <h4>Notes</h4>
          <p>${reservation.notes}</p>
        </div>
      ` : ''}
    `;
  }

  openModal('modal-reservation-details');
}

function editReservation(id) {
  const reservation = state.reservations.find(r => r.id === id);
  if (!reservation) return;

  // Open edit modal or navigate to edit page
  showToast('info', 'Modification', `Édition de la réservation #${id.substring(0, 8)}`);
}

async function deleteReservation(id) {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) return;

  try {
    await api.put(`/admin/reservations/${id}/status`, { status: 'cancelled' });
    showToast('success', 'Réservation annulée', 'La réservation a été annulée avec succès.');
    loadReservations();
  } catch (error) {
    showToast('error', 'Erreur', 'Impossible d\'annuler la réservation.');
  }
}

function openDriverModal(driver = null) {
  state.modals.driver = driver;

  const form = document.getElementById('driver-form');
  if (form) {
    form.reset();
    if (driver) {
      form.querySelector('[name="name"]').value = driver.name || '';
      form.querySelector('[name="phone"]').value = driver.phone || '';
      form.querySelector('[name="email"]').value = driver.email || '';
      form.querySelector('[name="license_number"]').value = driver.license_number || '';
      form.querySelector('[name="vehicle_model"]').value = driver.vehicle_model || '';
      form.querySelector('[name="vehicle_plate"]').value = driver.vehicle_plate || '';
    }
  }

  document.getElementById('driver-modal-title').textContent =
    driver ? 'Modifier le chauffeur' : 'Ajouter un chauffeur';

  openModal('modal-driver');
}

function editDriver(id) {
  const driver = state.drivers.find(d => d.id === id);
  openDriverModal(driver);
}

async function saveDriver(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    if (state.modals.driver) {
      await api.put(`/admin/drivers/${state.modals.driver.id}`, data);
      showToast('success', 'Chauffeur modifié', 'Les informations ont été mises à jour.');
    } else {
      await api.post('/admin/drivers', data);
      showToast('success', 'Chauffeur ajouté', 'Le nouveau chauffeur a été créé.');
    }
    closeModal('modal-driver');
    loadDrivers();
  } catch (error) {
    showToast('error', 'Erreur', 'Impossible de sauvegarder le chauffeur.');
  }
}

// ============================================
// Filters & Search
// ============================================
function initFilters() {
  // Status filter
  const statusFilter = document.getElementById('filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      state.pagination.page = 1;
      loadReservations();
    });
  }

  // Date filters
  const dateFrom = document.getElementById('filter-date-from');
  const dateTo = document.getElementById('filter-date-to');

  if (dateFrom) {
    dateFrom.addEventListener('change', (e) => {
      state.filters.dateFrom = e.target.value;
      state.pagination.page = 1;
      loadReservations();
    });
  }

  if (dateTo) {
    dateTo.addEventListener('change', (e) => {
      state.filters.dateTo = e.target.value;
      state.pagination.page = 1;
      loadReservations();
    });
  }

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', utils.debounce((e) => {
      state.filters.search = e.target.value;
      state.pagination.page = 1;
      loadPageData(state.currentPage);
    }, 300));
  }
}

// ============================================
// Pagination
// ============================================
function updatePagination() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  const totalPages = Math.ceil(state.pagination.total / state.pagination.perPage);
  const currentPage = state.pagination.page;

  let html = `
    <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span style="padding: 0 8px;">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span style="padding: 0 8px;">...</span>`;
    html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `
    <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;

  // Update info
  const info = document.getElementById('pagination-info');
  if (info) {
    const start = (currentPage - 1) * state.pagination.perPage + 1;
    const end = Math.min(currentPage * state.pagination.perPage, state.pagination.total);
    info.textContent = `${start}-${end} sur ${state.pagination.total} résultats`;
  }
}

function goToPage(page) {
  const totalPages = Math.ceil(state.pagination.total / state.pagination.perPage);
  if (page < 1 || page > totalPages) return;

  state.pagination.page = page;
  loadPageData(state.currentPage);
}

// ============================================
// Toast Notifications
// ============================================
function showToast(type, title, message) {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ============================================
// Helper Functions
// ============================================
function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    assigned: 'Assignée',
    started: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
}

function getDriverStatusLabel(status) {
  const labels = {
    available: 'Disponible',
    busy: 'Occupé',
    offline: 'Hors ligne'
  };
  return labels[status] || status;
}

function getPaymentMethodLabel(method) {
  const labels = {
    twint: 'TWINT',
    card: 'Carte bancaire',
    cash: 'Espèces',
    invoice: 'Facture'
  };
  return labels[method] || method;
}

function getPaymentMethodIcon(method) {
  const icons = {
    twint: 'mobile-alt',
    card: 'credit-card',
    cash: 'money-bill-wave',
    invoice: 'file-invoice'
  };
  return icons[method] || 'money-bill';
}

function getPaymentStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    completed: 'Payé',
    failed: 'Échoué',
    refunded: 'Remboursé'
  };
  return labels[status] || status;
}

// ============================================
// Mock Data Generators
// ============================================
function generateMockReservations(count) {
  const statuses = ['pending', 'confirmed', 'assigned', 'started', 'completed', 'cancelled'];
  const vehicles = ['berline', 'van', 'luxe', 'eco'];
  const names = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Müller', 'Thomas Weber', 'Anna Schmidt'];
  const addresses = [
    'Gare de Genève, Genève',
    'Aéroport de Genève, Cointrin',
    'Hotel Metropole, Genève',
    'EPFL, Lausanne',
    'Bahnhof Zürich, Zürich',
    'Flughafen Zürich, Kloten'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `res_${Date.now()}_${i}`,
    customer_name: names[Math.floor(Math.random() * names.length)],
    customer_phone: `+41 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    customer_email: `client${i}@example.ch`,
    pickup_address: addresses[Math.floor(Math.random() * addresses.length)],
    dropoff_address: addresses[Math.floor(Math.random() * addresses.length)],
    pickup_datetime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    vehicle_type: vehicles[Math.floor(Math.random() * vehicles.length)],
    passengers: Math.floor(Math.random() * 4) + 1,
    luggage: Math.floor(Math.random() * 3),
    distance_km: Math.floor(Math.random() * 50) + 5,
    duration_min: Math.floor(Math.random() * 60) + 15,
    total_price: Math.floor(Math.random() * 200) + 50,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function generateMockDrivers(count) {
  const statuses = ['available', 'busy', 'offline'];
  const names = ['Marc Favre', 'Luca Rossi', 'Hans Keller', 'Ahmed Ben Ali', 'Paolo Bianchi', 'Yves Morand', 'Stefan Wyss', 'David Roth'];
  const vehicles = ['Mercedes Classe E', 'BMW Série 5', 'Tesla Model S', 'Mercedes Classe V', 'Audi A6', 'VW Multivan'];

  return Array.from({ length: count }, (_, i) => ({
    id: `drv_${Date.now()}_${i}`,
    name: names[i % names.length],
    phone: `+41 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    email: `chauffeur${i}@vtc-suisse.ch`,
    license_number: `GE${Math.floor(Math.random() * 900000 + 100000)}`,
    vehicle_model: vehicles[Math.floor(Math.random() * vehicles.length)],
    vehicle_plate: `GE ${Math.floor(Math.random() * 900000 + 100000)}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    rating: (Math.random() * 1 + 4).toFixed(1),
    trips_count: Math.floor(Math.random() * 500) + 50,
    total_distance: Math.floor(Math.random() * 10000) + 1000,
    total_revenue: Math.floor(Math.random() * 50000) + 5000
  }));
}

function generateMockCustomers(count) {
  const names = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Müller', 'Thomas Weber', 'Anna Schmidt',
                 'François Leroy', 'Isabelle Petit', 'Michel Roux', 'Catherine Blanc', 'Philippe Moreau',
                 'Nathalie Simon', 'Laurent Girard', 'Christine Dubois', 'Olivier Lefebvre'];
  const cantons = ['GE', 'VD', 'ZH', 'BE', 'BS', 'TI', 'VS'];

  return Array.from({ length: count }, (_, i) => ({
    id: `cust_${Date.now()}_${i}`,
    name: names[i % names.length],
    email: `client${i}@example.ch`,
    phone: `+41 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    preferred_canton: cantons[Math.floor(Math.random() * cantons.length)],
    reservations_count: Math.floor(Math.random() * 20) + 1,
    total_spent: Math.floor(Math.random() * 5000) + 100,
    last_reservation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function generateMockPayments(count) {
  const methods = ['twint', 'card', 'cash', 'invoice'];
  const statuses = ['pending', 'completed', 'completed', 'completed', 'failed'];
  const names = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Müller', 'Thomas Weber'];

  return Array.from({ length: count }, (_, i) => ({
    id: `pay_${Date.now()}_${i}`,
    reservation_id: `res_${Date.now()}_${i}`,
    customer_name: names[Math.floor(Math.random() * names.length)],
    amount: Math.floor(Math.random() * 200) + 50,
    method: methods[Math.floor(Math.random() * methods.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

// ============================================
// Settings Form
// ============================================
function saveSettings(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const settings = {};

  for (const [key, value] of formData.entries()) {
    settings[key] = value;
  }

  // Handle checkboxes (they don't appear in FormData when unchecked)
  form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    settings[checkbox.name] = checkbox.checked;
  });

  localStorage.setItem('vtc_settings', JSON.stringify(settings));
  showToast('success', 'Paramètres sauvegardés', 'Vos modifications ont été enregistrées.');
}

// ============================================
// Export Functions
// ============================================
function exportData(type) {
  let data, filename;

  switch (type) {
    case 'reservations':
      data = state.reservations;
      filename = `reservations_${new Date().toISOString().split('T')[0]}.json`;
      break;
    case 'drivers':
      data = state.drivers;
      filename = `chauffeurs_${new Date().toISOString().split('T')[0]}.json`;
      break;
    case 'customers':
      data = state.customers;
      filename = `clients_${new Date().toISOString().split('T')[0]}.json`;
      break;
    case 'payments':
      data = state.payments;
      filename = `paiements_${new Date().toISOString().split('T')[0]}.json`;
      break;
  }

  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Export réussi', `${data.length} enregistrements exportés.`);
  }
}

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFilters();
  loadPageData('dashboard');

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
        overlay.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });

  // Auto-refresh dashboard
  setInterval(() => {
    if (state.currentPage === 'dashboard') {
      loadDashboard();
    }
  }, CONFIG.refreshInterval);
});

// Add CSS for slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }

  .detail-section {
    margin-bottom: 24px;
  }

  .detail-section h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--gray-200);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-label {
    font-size: 12px;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value {
    font-size: 14px;
    color: var(--gray-900);
  }

  .payment-method {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--gray-700);
  }

  .payment-method i {
    color: var(--gray-400);
  }
`;
document.head.appendChild(style);
