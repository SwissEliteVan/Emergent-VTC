/**
 * VTC Suisse - Main Application
 * Booking system with TWINT integration
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
  api: {
    nominatim: "https://nominatim.openstreetmap.org",
    photon: "https://photon.komoot.io/api",
    exchangeRate: "https://api.frankfurter.app/latest",
  },
  pricing: {
    eco: { base: 6, perKm: 2.2, perMin: 0.4 },
    berline: { base: 10, perKm: 2.8, perMin: 0.5 },
    van: { base: 15, perKm: 3.5, perMin: 0.6 },
    luxe: { base: 25, perKm: 4.5, perMin: 0.8 },
  },
  vatRate: 0.077,
  nightSurchargeRate: 0.2,
  weekendSurchargeRate: 0.1,
  currency: {
    primary: "CHF",
    secondary: "EUR",
  },
};

// ========================================
// State
// ========================================
const state = {
  pickup: null,
  dropoff: null,
  date: null,
  time: null,
  passengers: 1,
  vehicle: "berline",
  tripType: "oneway",
  canton: null,
  route: null,
  price: null,
  exchangeRate: null,
  showEur: false,
};

// ========================================
// Initialize
// ========================================
let swissMap = null;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map
  if (document.getElementById("map")) {
    swissMap = new SwissMap("map");
  }

  // Set default date to today
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  // Set default time to now + 1 hour
  const timeInput = document.getElementById("time");
  if (timeInput) {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  // Fetch exchange rate
  fetchExchangeRate();

  // Bind events
  bindFormEvents();
  bindCantonEvents();
  bindVehicleEvents();
  bindPassengerEvents();
  bindTripTypeEvents();
  bindModalEvents();
  bindCurrencyToggle();
  bindAutocomplete();
  bindLocationButton();
  bindQuickDestinations();
  bindHeaderScroll();

  // Generate canton grid
  generateCantonGrid();
});

// ========================================
// Exchange Rate
// ========================================
async function fetchExchangeRate() {
  try {
    const response = await fetch(`${CONFIG.api.exchangeRate}?from=CHF&to=EUR`);
    const data = await response.json();
    state.exchangeRate = data.rates.EUR;
  } catch (error) {
    console.warn("Could not fetch exchange rate:", error);
    state.exchangeRate = 0.95; // Fallback rate
  }
}

// ========================================
// Form Events
// ========================================
function bindFormEvents() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) return;

    // Calculate route and price
    await calculateRouteAndPrice();

    // Show estimate modal
    showEstimateModal();
  });

  // Customer form submission
  const customerForm = document.getElementById("customer-form");
  if (customerForm) {
    customerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(customerForm);
      const customer = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        notes: formData.get("notes"),
        payment: formData.get("payment"),
      };

      // Create booking
      await createBooking(customer);
    });
  }
}

function validateForm() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  if (!pickup || !dropoff) {
    showToast("Veuillez entrer les adresses de départ et d'arrivée", "error");
    return false;
  }

  if (!date || !time) {
    showToast("Veuillez sélectionner une date et une heure", "error");
    return false;
  }

  // Check if pickup/dropoff have coordinates
  if (!state.pickup || !state.dropoff) {
    showToast("Veuillez sélectionner des adresses valides", "error");
    return false;
  }

  return true;
}

// ========================================
// Route and Price Calculation
// ========================================
async function calculateRouteAndPrice() {
  const pickupCoords = [state.pickup.lat, state.pickup.lon];
  const dropoffCoords = [state.dropoff.lat, state.dropoff.lon];

  // Draw route on map
  if (swissMap) {
    state.route = await swissMap.drawRoute(pickupCoords, dropoffCoords);
  } else {
    // Fallback calculation
    const distance = calculateHaversineDistance(pickupCoords, dropoffCoords);
    state.route = {
      distance: distance.toFixed(1),
      duration: Math.round((distance / 50) * 60),
      elevation: { gain: 0, loss: 0, max: 0 },
    };
  }

  // Update route info display
  updateRouteInfo();

  // Calculate price
  calculatePrice();
}

function calculateHaversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1[0])) *
      Math.cos(toRad(coord2[0])) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function updateRouteInfo() {
  const routeInfo = document.getElementById("route-info");
  if (!routeInfo || !state.route) return;

  routeInfo.classList.remove("hidden");

  document.querySelector(".route-distance").textContent = state.route.distance;
  document.querySelector(".route-duration").textContent = state.route.duration;
  document.querySelector(".route-elevation").textContent =
    state.route.elevation?.max || "--";
}

function calculatePrice() {
  const tariff = CONFIG.pricing[state.vehicle];
  const distance = parseFloat(state.route.distance);
  const duration = parseInt(state.route.duration);

  // Base calculations
  let baseFare = tariff.base;
  let distanceFare = distance * tariff.perKm;
  let timeFare = duration * tariff.perMin;

  // Half-day pricing
  if (state.tripType === "halfday") {
    baseFare = tariff.base * 15; // 4 hours minimum
    distanceFare = 0;
    timeFare = 0;
  }

  // Round trip
  if (state.tripType === "roundtrip") {
    distanceFare *= 1.8; // Discount for round trip
    timeFare *= 1.8;
  }

  // Get pickup datetime
  const pickupDate = new Date(`${document.getElementById("date").value}T${document.getElementById("time").value}`);
  const hour = pickupDate.getHours();
  const day = pickupDate.getDay();

  // Night surcharge (22h - 6h)
  let nightSurcharge = 0;
  if (hour >= 22 || hour < 6) {
    nightSurcharge = (baseFare + distanceFare + timeFare) * CONFIG.nightSurchargeRate;
  }

  // Weekend surcharge
  let weekendSurcharge = 0;
  if (day === 0 || day === 6) {
    weekendSurcharge = (baseFare + distanceFare + timeFare) * CONFIG.weekendSurchargeRate;
  }

  // Subtotal
  const subtotal = baseFare + distanceFare + timeFare + nightSurcharge + weekendSurcharge;

  // VAT
  const vat = subtotal * CONFIG.vatRate;

  // Total
  const total = subtotal + vat;

  // EUR equivalent
  const totalEur = total * (state.exchangeRate || 0.95);

  state.price = {
    baseFare: round(baseFare),
    distanceFare: round(distanceFare),
    timeFare: round(timeFare),
    nightSurcharge: round(nightSurcharge),
    weekendSurcharge: round(weekendSurcharge),
    subtotal: round(subtotal),
    vat: round(vat),
    total: round(total),
    totalEur: round(totalEur),
    distance,
    duration,
    hasNightSurcharge: nightSurcharge > 0,
    hasWeekendSurcharge: weekendSurcharge > 0,
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

// ========================================
// Estimate Modal
// ========================================
function showEstimateModal() {
  const modal = document.getElementById("estimate-modal");
  if (!modal) return;

  // Populate data
  document.getElementById("est-pickup").textContent = state.pickup.display;
  document.getElementById("est-dropoff").textContent = state.dropoff.display;

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const datetime = new Date(`${date}T${time}`);
  document.getElementById("est-datetime").textContent = datetime.toLocaleString("fr-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  document.getElementById("est-distance").textContent = `${state.price.distance} km`;
  document.getElementById("est-duration").textContent = `${state.price.duration} min`;
  document.getElementById("est-vehicle").textContent = getVehicleName(state.vehicle);

  // Price breakdown
  document.getElementById("price-base").textContent = formatCHF(state.price.baseFare);
  document.getElementById("price-km").textContent = state.price.distance;
  document.getElementById("price-distance").textContent = formatCHF(state.price.distanceFare);
  document.getElementById("price-min").textContent = state.price.duration;
  document.getElementById("price-time").textContent = formatCHF(state.price.timeFare);

  // Supplements
  const nightRow = document.getElementById("row-night");
  if (state.price.hasNightSurcharge) {
    nightRow.classList.remove("hidden");
    document.getElementById("price-night").textContent = formatCHF(state.price.nightSurcharge);
  } else {
    nightRow.classList.add("hidden");
  }

  const weekendRow = document.getElementById("row-weekend");
  if (state.price.hasWeekendSurcharge) {
    weekendRow.classList.remove("hidden");
    document.getElementById("price-weekend").textContent = formatCHF(state.price.weekendSurcharge);
  } else {
    weekendRow.classList.add("hidden");
  }

  document.getElementById("price-subtotal").textContent = formatCHF(state.price.subtotal);
  document.getElementById("price-vat").textContent = formatCHF(state.price.vat);
  document.getElementById("price-total").textContent = formatCHF(state.price.total);

  // EUR equivalent
  const eurRow = document.getElementById("row-eur");
  if (state.showEur) {
    eurRow.classList.remove("hidden");
    document.getElementById("price-eur").textContent = `€ ${state.price.totalEur.toFixed(2)}`;
  }

  // Show modal
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function getVehicleName(type) {
  const names = {
    eco: "Eco",
    berline: "Berline",
    van: "Van",
    luxe: "Luxe",
  };
  return names[type] || type;
}

function formatCHF(amount) {
  return `CHF ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;
}

// ========================================
// Booking Creation
// ========================================
async function createBooking(customer) {
  // Generate reservation ID
  const reservationId = generateReservationId();

  // Close estimate modal
  closeModal("estimate-modal");

  // Show confirmation modal
  showConfirmationModal(reservationId, customer.payment);

  // In production, send to backend
  console.log("Booking created:", {
    reservationId,
    customer,
    pickup: state.pickup,
    dropoff: state.dropoff,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    passengers: state.passengers,
    vehicle: state.vehicle,
    tripType: state.tripType,
    price: state.price,
  });
}

function generateReservationId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VTC-${year}${month}-${random}`;
}

function showConfirmationModal(reservationId, paymentMethod) {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;

  document.getElementById("conf-reservation-id").textContent = reservationId;

  // TWINT QR code
  const twintSection = document.getElementById("twint-payment");
  if (paymentMethod === "twint") {
    twintSection.classList.remove("hidden");
    generateTwintQR(reservationId, state.price.total);
  } else {
    twintSection.classList.add("hidden");
  }

  // Show modal
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Download receipt button
  document.getElementById("btn-download-receipt").onclick = () => {
    downloadReceipt(reservationId);
  };
}

async function generateTwintQR(reservationId, amount) {
  const qrContainer = document.getElementById("twint-qr");
  if (!qrContainer || typeof QRCode === "undefined") return;

  qrContainer.innerHTML = "";

  // TWINT payment data (simplified for demo)
  const twintData = JSON.stringify({
    type: "TWINT",
    merchantId: "VTC-SUISSE",
    amount: amount.toFixed(2),
    currency: "CHF",
    reference: reservationId,
  });

  try {
    await QRCode.toCanvas(qrContainer, twintData, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    qrContainer.innerHTML = "<p>QR code non disponible</p>";
  }
}

function downloadReceipt(reservationId) {
  // In production, call backend to generate PDF
  showToast("Téléchargement du récépissé...", "info");

  // Simulate download
  setTimeout(() => {
    showToast("Récépissé téléchargé", "success");
  }, 1000);
}

// ========================================
// Canton Events
// ========================================
function bindCantonEvents() {
  document.querySelectorAll(".canton-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const canton = btn.dataset.canton;

      if (canton === "more") {
        showCantonModal();
        return;
      }

      selectCanton(canton);
    });
  });
}

function selectCanton(code) {
  state.canton = code;

  // Update UI
  document.querySelectorAll(".canton-btn").forEach((btn) => {
    btn.setAttribute("aria-checked", btn.dataset.canton === code);
  });

  // Center map on canton
  if (swissMap && CANTONS[code]) {
    swissMap.centerOn(CANTONS[code].lat, CANTONS[code].lon, 11);
  }

  // Update language based on canton
  if (CANTONS[code]) {
    const lang = CANTONS[code].language;
    if (lang && window.i18n && lang !== window.i18n.getLanguage()) {
      // Suggest language change
      // window.i18n.setLanguage(lang);
    }
  }
}

function showCantonModal() {
  const modal = document.getElementById("canton-modal");
  if (modal) {
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function generateCantonGrid() {
  const grid = document.getElementById("canton-full-grid");
  if (!grid) return;

  grid.innerHTML = Object.entries(CANTONS)
    .map(
      ([code, canton]) => `
    <button class="canton-btn" data-canton="${code}" aria-checked="false">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/${getCantonFlagPath(code)}"
           alt="${canton.name}" class="canton-flag" onerror="this.style.display='none'">
      <span>${code}</span>
    </button>
  `
    )
    .join("");

  // Bind click events
  grid.querySelectorAll(".canton-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectCanton(btn.dataset.canton);
      closeModal("canton-modal");
    });
  });
}

function getCantonFlagPath(code) {
  // Wikipedia flag paths (simplified)
  const paths = {
    GE: "d/d7/Wappen_Genf_matt.svg/30px-Wappen_Genf_matt.svg.png",
    VD: "1/1d/Wappen_Waadt_matt.svg/30px-Wappen_Waadt_matt.svg.png",
    VS: "4/47/Wappen_Wallis_matt.svg/30px-Wappen_Wallis_matt.svg.png",
    ZH: "f/f7/Wappen_Z%C3%BCrich_matt.svg/30px-Wappen_Z%C3%BCrich_matt.svg.png",
    BE: "4/47/Wappen_Bern_matt.svg/30px-Wappen_Bern_matt.svg.png",
    BS: "6/6e/Wappen_Basel-Stadt_matt.svg/30px-Wappen_Basel-Stadt_matt.svg.png",
  };
  return paths[code] || "0/00/Flag_of_Switzerland.svg/30px-Flag_of_Switzerland.svg.png";
}

// ========================================
// Vehicle Events
// ========================================
function bindVehicleEvents() {
  document.querySelectorAll(".vehicle-option").forEach((option) => {
    option.addEventListener("click", () => {
      const vehicle = option.dataset.vehicle;
      state.vehicle = vehicle;

      // Update UI
      document.querySelectorAll(".vehicle-option").forEach((opt) => {
        opt.classList.toggle("selected", opt.dataset.vehicle === vehicle);
      });
    });
  });
}

// ========================================
// Passenger Events
// ========================================
function bindPassengerEvents() {
  const minusBtn = document.querySelector(".pax-btn.minus");
  const plusBtn = document.querySelector(".pax-btn.plus");
  const countEl = document.querySelector(".pax-count");

  if (!minusBtn || !plusBtn || !countEl) return;

  minusBtn.addEventListener("click", () => {
    if (state.passengers > 1) {
      state.passengers--;
      countEl.textContent = state.passengers;
      minusBtn.disabled = state.passengers <= 1;
    }
  });

  plusBtn.addEventListener("click", () => {
    if (state.passengers < 7) {
      state.passengers++;
      countEl.textContent = state.passengers;
      plusBtn.disabled = state.passengers >= 7;
    }
  });
}

// ========================================
// Trip Type Events
// ========================================
function bindTripTypeEvents() {
  document.querySelectorAll(".trip-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      state.tripType = type;

      // Update UI
      document.querySelectorAll(".trip-type-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.type === type);
      });
    });
  });
}

// ========================================
// Modal Events
// ========================================
function bindModalEvents() {
  // Close buttons
  document.querySelectorAll(".modal-close, .btn-close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  // Backdrop click
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      const modal = backdrop.closest(".modal");
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModal = document.querySelector('.modal[aria-hidden="false"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

// ========================================
// Currency Toggle
// ========================================
function bindCurrencyToggle() {
  const toggle = document.querySelector(".currency-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    state.showEur = !state.showEur;

    // Update toggle UI
    const activeEl = toggle.querySelector(".currency-active");
    const altEl = toggle.querySelector(".currency-alt");

    if (state.showEur) {
      activeEl.textContent = "EUR";
      altEl.textContent = "CHF";
    } else {
      activeEl.textContent = "CHF";
      altEl.textContent = "EUR";
    }

    // Update price display in modal if open
    const eurRow = document.getElementById("row-eur");
    if (eurRow) {
      eurRow.classList.toggle("hidden", !state.showEur);
    }
  });
}

// ========================================
// Autocomplete
// ========================================
function bindAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  if (pickupInput) {
    setupAutocomplete(pickupInput, "pickup-results", "pickup");
  }

  if (dropoffInput) {
    setupAutocomplete(dropoffInput, "dropoff-results", "dropoff");
  }
}

function setupAutocomplete(input, resultsId, type) {
  const results = document.getElementById(resultsId);
  if (!results) return;

  let debounceTimer;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (query.length < 3) {
      results.classList.remove("show");
      return;
    }

    debounceTimer = setTimeout(async () => {
      const suggestions = await searchAddress(query);
      showAutocompleteResults(results, suggestions, type, input);
    }, 300);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => results.classList.remove("show"), 200);
  });
}

async function searchAddress(query) {
  try {
    // Use Photon (Komoot) for better Swiss results
    const response = await fetch(
      `${CONFIG.api.photon}?q=${encodeURIComponent(query)}&limit=5&lang=fr&bbox=5.9,45.8,10.5,47.9`
    );
    const data = await response.json();

    return data.features.map((feature) => ({
      display: formatAddress(feature.properties),
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      type: feature.properties.type,
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

function formatAddress(props) {
  const parts = [];
  if (props.name) parts.push(props.name);
  if (props.street) parts.push(props.street);
  if (props.housenumber) parts[parts.length - 1] += ` ${props.housenumber}`;
  if (props.postcode) parts.push(props.postcode);
  if (props.city) parts.push(props.city);
  return parts.join(", ");
}

function showAutocompleteResults(container, suggestions, type, input) {
  if (suggestions.length === 0) {
    container.classList.remove("show");
    return;
  }

  container.innerHTML = suggestions
    .map(
      (s) => `
    <div class="autocomplete-item" data-lat="${s.lat}" data-lon="${s.lon}" data-display="${s.display}">
      <i class="fas fa-map-marker-alt"></i>
      <span>${s.display}</span>
    </div>
  `
    )
    .join("");

  container.classList.add("show");

  // Bind clicks
  container.querySelectorAll(".autocomplete-item").forEach((item) => {
    item.addEventListener("click", () => {
      const data = {
        lat: parseFloat(item.dataset.lat),
        lon: parseFloat(item.dataset.lon),
        display: item.dataset.display,
      };

      input.value = data.display;
      state[type] = data;

      // Update map marker
      if (swissMap) {
        if (type === "pickup") {
          swissMap.setPickup(data.lat, data.lon, data.display);
        } else {
          swissMap.setDropoff(data.lat, data.lon, data.display);
        }
      }

      container.classList.remove("show");
    });
  });
}

// ========================================
// Location Button
// ========================================
function bindLocationButton() {
  const locateBtn = document.querySelector(".btn-locate");
  if (!locateBtn) return;

  locateBtn.addEventListener("click", async () => {
    locateBtn.classList.add("loading");

    try {
      const position = await swissMap.getCurrentLocation();

      // Reverse geocode
      const response = await fetch(
        `${CONFIG.api.nominatim}/reverse?format=json&lat=${position.lat}&lon=${position.lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "VTC-Suisse/1.0",
          },
        }
      );
      const data = await response.json();

      const display = data.display_name.split(",").slice(0, 3).join(",");

      state.pickup = {
        lat: position.lat,
        lon: position.lon,
        display,
      };

      document.getElementById("pickup").value = display;

      if (swissMap) {
        swissMap.setPickup(position.lat, position.lon, display);
      }
    } catch (error) {
      showToast("Impossible d'obtenir votre position", "error");
    } finally {
      locateBtn.classList.remove("loading");
    }
  });
}

// ========================================
// Quick Destinations
// ========================================
function bindQuickDestinations() {
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      showPOISelector(type);
    });
  });
}

function showPOISelector(type) {
  const poiList = SWISS_POI[type + "s"];
  if (!poiList) return;

  // Find nearest POI based on pickup location or canton
  let nearest = poiList[0];

  if (state.pickup) {
    let minDist = Infinity;
    poiList.forEach((poi) => {
      const dist = calculateHaversineDistance(
        [state.pickup.lat, state.pickup.lon],
        [poi.lat, poi.lon]
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = poi;
      }
    });
  } else if (state.canton && CANTONS[state.canton]) {
    const canton = CANTONS[state.canton];
    let minDist = Infinity;
    poiList.forEach((poi) => {
      const dist = calculateHaversineDistance([canton.lat, canton.lon], [poi.lat, poi.lon]);
      if (dist < minDist) {
        minDist = dist;
        nearest = poi;
      }
    });
  }

  // Set as dropoff
  state.dropoff = {
    lat: nearest.lat,
    lon: nearest.lon,
    display: nearest.name,
  };

  document.getElementById("dropoff").value = nearest.name;

  if (swissMap) {
    swissMap.setDropoff(nearest.lat, nearest.lon, nearest.name);
  }
}

// ========================================
// Header Scroll
// ========================================
function bindHeaderScroll() {
  const header = document.querySelector(".header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === "error" ? "exclamation-circle" : type === "success" ? "check-circle" : "info-circle"}"></i>
    <span>${message}</span>
  `;

  // Add toast styles if not present
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: #333;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideUp 0.3s ease;
      }
      .toast-error { background: #C62828; }
      .toast-success { background: #2E7D32; }
      .toast-info { background: #1565C0; }
      @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideUp 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Export for testing
window.VTCApp = {
  state,
  calculatePrice,
  formatCHF,
  showToast,
};
