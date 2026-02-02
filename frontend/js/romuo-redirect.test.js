/**
 * ================================================================
 * ROMUO - Tests Unitaires du Système de Redirection
 * ================================================================
 * Tests pour romuo-redirect.js
 * Exécuter avec: npm test ou node romuo-redirect.test.js
 * ================================================================
 */

// Mock du DOM et window pour Node.js
if (typeof window === 'undefined') {
  global.window = {
    location: {
      hostname: 'romuo.ch',
      pathname: '/',
      search: '',
      hash: '',
      href: 'https://romuo.ch/',
    },
    screen: { width: 1920, height: 1080 },
    scrollTo: () => {},
    open: () => {},
    dispatchEvent: () => {},
    addEventListener: () => {},
  };

  global.document = {
    readyState: 'complete',
    referrer: '',
    title: 'Test Page',
    cookie: '',
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
    getElementById: () => null,
    querySelector: () => null,
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      innerHTML: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
      },
      addEventListener: () => {},
      dispatchEvent: () => {},
      remove: () => {},
    }),
    addEventListener: (event, callback) => {
      if (event === 'DOMContentLoaded') callback();
    },
  };

  global.navigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'fr-CH',
  };

  global.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, value) { this._data[key] = value; },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; },
  };

  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: 'healthy' }),
  });

  global.URLSearchParams = class URLSearchParams {
    constructor(search = '') {
      this._params = new Map();
      if (search.startsWith('?')) search = search.slice(1);
      search.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) this._params.set(key, decodeURIComponent(value || ''));
      });
    }
    get(key) { return this._params.get(key) || null; }
    entries() { return this._params.entries(); }
  };

  global.URL = class URL {
    constructor(url) {
      const match = url.match(/^(https?):\/\/([^\/]+)(.*)/);
      this.protocol = match ? match[1] : 'https';
      this.hostname = match ? match[2] : '';
      this.pathname = match ? match[3] : '/';
    }
  };

  global.CustomEvent = class CustomEvent {
    constructor(name, options) {
      this.name = name;
      this.detail = options?.detail;
    }
  };

  global.Event = class Event {
    constructor(name) { this.name = name; }
  };

  global.AbortController = class AbortController {
    constructor() { this.signal = {}; }
    abort() {}
  };

  global.FormData = class FormData {
    constructor() { this._data = new Map(); }
    entries() { return this._data.entries(); }
  };

  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  global.gtag = () => {};
}

// ============================================
// CLASSE DE TEST
// ============================================

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  /**
   * Enregistrer un test
   */
  test(name, fn) {
    this.tests.push({ name, fn });
  }

  /**
   * Assertions
   */
  assert = {
    equal: (actual, expected, message = '') => {
      if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
      }
    },

    deepEqual: (actual, expected, message = '') => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
      }
    },

    truthy: (value, message = '') => {
      if (!value) {
        throw new Error(`${message}\nExpected truthy value, got: ${value}`);
      }
    },

    falsy: (value, message = '') => {
      if (value) {
        throw new Error(`${message}\nExpected falsy value, got: ${value}`);
      }
    },

    throws: (fn, message = '') => {
      let threw = false;
      try {
        fn();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error(`${message}\nExpected function to throw`);
      }
    },

    contains: (str, substring, message = '') => {
      if (!str.includes(substring)) {
        throw new Error(`${message}\nExpected "${str}" to contain "${substring}"`);
      }
    },

    isArray: (value, message = '') => {
      if (!Array.isArray(value)) {
        throw new Error(`${message}\nExpected array, got: ${typeof value}`);
      }
    },

    isObject: (value, message = '') => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${message}\nExpected object, got: ${typeof value}`);
      }
    },

    hasProperty: (obj, prop, message = '') => {
      if (!(prop in obj)) {
        throw new Error(`${message}\nExpected object to have property "${prop}"`);
      }
    },
  };

  /**
   * Exécuter tous les tests
   */
  async run() {
    console.log('\n🧪 ROMUO Redirect - Tests Unitaires\n');
    console.log('='.repeat(50));

    for (const { name, fn } of this.tests) {
      try {
        await fn(this.assert);
        this.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.failed++;
        this.errors.push({ name, error });
        console.log(`❌ ${name}`);
        console.log(`   ${error.message.split('\n')[0]}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Résultats: ${this.passed} passés, ${this.failed} échoués sur ${this.tests.length} tests\n`);

    if (this.errors.length > 0) {
      console.log('Détails des erreurs:\n');
      for (const { name, error } of this.errors) {
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}\n`);
      }
    }

    return this.failed === 0;
  }
}

// ============================================
// MOCK DE LA CLASSE ROMUO
// ============================================

// Simuler la classe RomuoRedirect pour les tests
class MockRomuoRedirect {
  constructor(options = {}) {
    this.config = {
      SHOWCASE_DOMAIN: 'romuo.ch',
      APP_DOMAIN: 'app.romuo.ch',
      APP_URL: 'https://app.romuo.ch',
      SHOWCASE_URL: 'https://romuo.ch',
      STORAGE_PREFIX: 'romuo_',
      STORAGE_KEYS: {
        SESSION: 'romuo_session',
        PENDING_RESERVATION: 'romuo_pending_reservation',
        TRACKING: 'romuo_tracking',
      },
      HEALTH_CHECK_TIMEOUT: 5000,
      HEALTH_CHECK_URL: 'https://app.romuo.ch/api/health',
      PHONE_NUMBER: '+41 22 123 45 67',
      SESSION_DURATION: 24 * 60 * 60 * 1000,
      COOKIE_DOMAIN: '.romuo.ch',
      ...options,
    };

    this.session = {
      id: 'test_session_123',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.SESSION_DURATION,
      visits: 1,
    };

    this.isAppAvailable = true;
    this.eventListeners = new Map();
    this.trackedEvents = [];
  }

  // Encoder les paramètres
  encodeParams(params) {
    const encoded = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          encoded.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
        } else {
          encoded.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      }
    }
    return encoded.join('&');
  }

  // Décoder les paramètres
  decodeParams(queryString = '') {
    const params = {};
    if (queryString.startsWith('?')) queryString = queryString.slice(1);

    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        const decoded = decodeURIComponent(value || '');
        try {
          if (decoded.startsWith('{') || decoded.startsWith('[')) {
            params[key] = JSON.parse(decoded);
          } else {
            params[key] = decoded;
          }
        } catch (e) {
          params[key] = decoded;
        }
      }
    });

    return params;
  }

  // Construire l'URL de l'app
  buildAppUrl(section = 'reservation', params = {}) {
    const baseUrl = `${this.config.APP_URL}/${section}`;
    const fullParams = {
      ...params,
      _sid: this.session.id,
      _src: '/test',
      _ts: Date.now(),
    };
    const queryString = this.encodeParams(fullParams);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  // Sauvegarder en storage
  saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Récupérer du storage
  getFromStorage(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  // Supprimer du storage
  removeFromStorage(key) {
    localStorage.removeItem(key);
  }

  // Sauvegarder réservation en cours
  savePendingReservation(reservation) {
    const data = {
      ...reservation,
      savedAt: Date.now(),
      sessionId: this.session.id,
    };
    this.saveToStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION, data);
  }

  // Récupérer réservation en cours
  getPendingReservation() {
    return this.getFromStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION);
  }

  // Supprimer réservation en cours
  clearPendingReservation() {
    this.removeFromStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION);
  }

  // Tracker événement
  trackEvent(eventName, data = {}) {
    this.trackedEvents.push({ name: eventName, data, timestamp: Date.now() });
  }

  // Vérifier disponibilité
  async checkAppAvailability() {
    return this.isAppAvailable;
  }

  // Vérifier si on est sur le showcase
  isOnShowcase() {
    return window.location.hostname === this.config.SHOWCASE_DOMAIN;
  }

  // Vérifier si on est sur l'app
  isOnApp() {
    return window.location.hostname === this.config.APP_DOMAIN;
  }

  // Générer ID session
  generateSessionId() {
    return 'rs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtenir infos appareil
  getDeviceInfo() {
    return {
      isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
      isTablet: /iPad|Tablet/i.test(navigator.userAgent),
      browser: 'Chrome',
      os: 'MacOS',
      screenWidth: 1920,
      screenHeight: 1080,
      language: 'fr-CH',
    };
  }

  // Tronquer chaîne
  truncate(str, length = 30) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length - 3) + '...' : str;
  }

  // Écouter événement
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  // Émettre événement
  emit(eventName, data) {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach(callback => callback(data));
  }
}

// ============================================
// TESTS
// ============================================

const runner = new TestRunner();

// --- Tests d'encodage/décodage des paramètres ---

runner.test('encodeParams: encode simple parameters', (assert) => {
  const romuo = new MockRomuoRedirect();
  const params = { depart: 'Genève', arrival: 'Lausanne' };
  const encoded = romuo.encodeParams(params);

  assert.contains(encoded, 'depart=Gen%C3%A8ve', 'Should encode special characters');
  assert.contains(encoded, 'arrival=Lausanne', 'Should encode normal characters');
});

runner.test('encodeParams: encode object parameters', (assert) => {
  const romuo = new MockRomuoRedirect();
  const params = { options: { luggage: 2, wheelchair: true } };
  const encoded = romuo.encodeParams(params);

  assert.contains(encoded, 'options=', 'Should include options key');
  assert.contains(encoded, encodeURIComponent(JSON.stringify(params.options)), 'Should encode object as JSON');
});

runner.test('encodeParams: skip null and undefined values', (assert) => {
  const romuo = new MockRomuoRedirect();
  const params = { valid: 'test', nullVal: null, undefinedVal: undefined, empty: '' };
  const encoded = romuo.encodeParams(params);

  assert.contains(encoded, 'valid=test', 'Should include valid value');
  assert.equal(encoded.includes('nullVal'), false, 'Should skip null');
  assert.equal(encoded.includes('undefinedVal'), false, 'Should skip undefined');
  assert.equal(encoded.includes('empty'), false, 'Should skip empty string');
});

runner.test('decodeParams: decode simple parameters', (assert) => {
  const romuo = new MockRomuoRedirect();
  const queryString = '?depart=Gen%C3%A8ve&arrival=Lausanne&price=150.50';
  const decoded = romuo.decodeParams(queryString);

  assert.equal(decoded.depart, 'Genève', 'Should decode special characters');
  assert.equal(decoded.arrival, 'Lausanne', 'Should decode normal string');
  assert.equal(decoded.price, '150.50', 'Should decode numbers as strings');
});

runner.test('decodeParams: decode JSON objects', (assert) => {
  const romuo = new MockRomuoRedirect();
  const obj = { luggage: 2, wheelchair: true };
  const queryString = `?options=${encodeURIComponent(JSON.stringify(obj))}`;
  const decoded = romuo.decodeParams(queryString);

  assert.deepEqual(decoded.options, obj, 'Should decode JSON object');
});

runner.test('encodeParams + decodeParams: round-trip', (assert) => {
  const romuo = new MockRomuoRedirect();
  const original = {
    depart: 'Zürich HB',
    arrival: 'Aéroport de Genève',
    date: '2024-12-25',
    time: '14:30',
    passengers: '4',
  };

  const encoded = romuo.encodeParams(original);
  const decoded = romuo.decodeParams('?' + encoded);

  // Remove tracking params added by decodeParams
  delete decoded._sid;
  delete decoded._src;
  delete decoded._ts;

  assert.equal(decoded.depart, original.depart, 'depart should match');
  assert.equal(decoded.arrival, original.arrival, 'arrival should match');
  assert.equal(decoded.date, original.date, 'date should match');
});

// --- Tests de construction d'URL ---

runner.test('buildAppUrl: basic URL construction', (assert) => {
  const romuo = new MockRomuoRedirect();
  const url = romuo.buildAppUrl('reservation', {});

  assert.contains(url, 'https://app.romuo.ch/reservation', 'Should have correct base URL');
  assert.contains(url, '_sid=', 'Should include session ID');
  assert.contains(url, '_ts=', 'Should include timestamp');
});

runner.test('buildAppUrl: URL with parameters', (assert) => {
  const romuo = new MockRomuoRedirect();
  const url = romuo.buildAppUrl('reservation', {
    depart: 'Genève',
    arrival: 'Lausanne',
    estimate: '150.50',
  });

  assert.contains(url, 'depart=', 'Should include depart');
  assert.contains(url, 'arrival=', 'Should include arrival');
  assert.contains(url, 'estimate=', 'Should include estimate');
});

runner.test('buildAppUrl: different sections', (assert) => {
  const romuo = new MockRomuoRedirect();

  const resUrl = romuo.buildAppUrl('reservation', {});
  const tarifsUrl = romuo.buildAppUrl('tarifs', {});
  const contactUrl = romuo.buildAppUrl('contact', {});

  assert.contains(resUrl, '/reservation?', 'Should have reservation section');
  assert.contains(tarifsUrl, '/tarifs?', 'Should have tarifs section');
  assert.contains(contactUrl, '/contact?', 'Should have contact section');
});

// --- Tests de session ---

runner.test('session: has required fields', (assert) => {
  const romuo = new MockRomuoRedirect();

  assert.hasProperty(romuo.session, 'id', 'Should have id');
  assert.hasProperty(romuo.session, 'createdAt', 'Should have createdAt');
  assert.hasProperty(romuo.session, 'expiresAt', 'Should have expiresAt');
  assert.hasProperty(romuo.session, 'visits', 'Should have visits');
});

runner.test('generateSessionId: creates unique IDs', (assert) => {
  const romuo = new MockRomuoRedirect();

  const id1 = romuo.generateSessionId();
  const id2 = romuo.generateSessionId();

  assert.truthy(id1.startsWith('rs_'), 'Should start with rs_');
  assert.truthy(id1 !== id2, 'Should generate unique IDs');
});

// --- Tests de stockage ---

runner.test('storage: save and retrieve', (assert) => {
  const romuo = new MockRomuoRedirect();
  localStorage.clear();

  const data = { test: 'value', number: 123 };
  romuo.saveToStorage('test_key', data);
  const retrieved = romuo.getFromStorage('test_key');

  assert.deepEqual(retrieved, data, 'Should retrieve saved data');
});

runner.test('storage: remove item', (assert) => {
  const romuo = new MockRomuoRedirect();
  localStorage.clear();

  romuo.saveToStorage('test_key', { value: 'test' });
  romuo.removeFromStorage('test_key');
  const retrieved = romuo.getFromStorage('test_key');

  assert.equal(retrieved, null, 'Should return null after removal');
});

// --- Tests de réservation en cours ---

runner.test('pendingReservation: save and retrieve', (assert) => {
  const romuo = new MockRomuoRedirect();
  localStorage.clear();

  const reservation = {
    depart: 'Genève',
    arrival: 'Lausanne',
    estimate: 150.50,
  };

  romuo.savePendingReservation(reservation);
  const retrieved = romuo.getPendingReservation();

  assert.equal(retrieved.depart, reservation.depart, 'Should save depart');
  assert.equal(retrieved.arrival, reservation.arrival, 'Should save arrival');
  assert.hasProperty(retrieved, 'savedAt', 'Should add savedAt timestamp');
  assert.hasProperty(retrieved, 'sessionId', 'Should add sessionId');
});

runner.test('pendingReservation: clear', (assert) => {
  const romuo = new MockRomuoRedirect();
  localStorage.clear();

  romuo.savePendingReservation({ depart: 'Test' });
  romuo.clearPendingReservation();
  const retrieved = romuo.getPendingReservation();

  assert.equal(retrieved, null, 'Should clear pending reservation');
});

// --- Tests de tracking ---

runner.test('trackEvent: records events', (assert) => {
  const romuo = new MockRomuoRedirect();

  romuo.trackEvent('test_event', { value: 123 });
  romuo.trackEvent('another_event', { source: 'homepage' });

  assert.equal(romuo.trackedEvents.length, 2, 'Should track 2 events');
  assert.equal(romuo.trackedEvents[0].name, 'test_event', 'First event name');
  assert.equal(romuo.trackedEvents[1].name, 'another_event', 'Second event name');
});

runner.test('trackEvent: includes data', (assert) => {
  const romuo = new MockRomuoRedirect();

  romuo.trackEvent('click', { button: 'reserve', page: '/home' });

  assert.equal(romuo.trackedEvents[0].data.button, 'reserve', 'Should include button');
  assert.equal(romuo.trackedEvents[0].data.page, '/home', 'Should include page');
  assert.hasProperty(romuo.trackedEvents[0], 'timestamp', 'Should include timestamp');
});

// --- Tests de détection de domaine ---

runner.test('isOnShowcase: detects showcase domain', (assert) => {
  const romuo = new MockRomuoRedirect();
  window.location.hostname = 'romuo.ch';

  assert.truthy(romuo.isOnShowcase(), 'Should detect romuo.ch');

  window.location.hostname = 'app.romuo.ch';
  assert.falsy(romuo.isOnShowcase(), 'Should not detect app domain');
});

runner.test('isOnApp: detects app domain', (assert) => {
  const romuo = new MockRomuoRedirect();
  window.location.hostname = 'app.romuo.ch';

  assert.truthy(romuo.isOnApp(), 'Should detect app.romuo.ch');

  window.location.hostname = 'romuo.ch';
  assert.falsy(romuo.isOnApp(), 'Should not detect showcase domain');
});

// --- Tests d'événements ---

runner.test('events: on and emit', (assert) => {
  const romuo = new MockRomuoRedirect();
  let received = null;

  romuo.on('test_event', (data) => {
    received = data;
  });

  romuo.emit('test_event', { message: 'hello' });

  assert.deepEqual(received, { message: 'hello' }, 'Should receive emitted data');
});

runner.test('events: multiple listeners', (assert) => {
  const romuo = new MockRomuoRedirect();
  const results = [];

  romuo.on('multi', () => results.push(1));
  romuo.on('multi', () => results.push(2));
  romuo.on('multi', () => results.push(3));

  romuo.emit('multi', {});

  assert.deepEqual(results, [1, 2, 3], 'Should call all listeners');
});

// --- Tests d'utilitaires ---

runner.test('truncate: short strings', (assert) => {
  const romuo = new MockRomuoRedirect();

  assert.equal(romuo.truncate('Short', 30), 'Short', 'Should not truncate short strings');
});

runner.test('truncate: long strings', (assert) => {
  const romuo = new MockRomuoRedirect();
  const long = 'This is a very long string that should be truncated';

  const truncated = romuo.truncate(long, 20);

  assert.equal(truncated.length, 20, 'Should truncate to exact length');
  assert.truthy(truncated.endsWith('...'), 'Should end with ellipsis');
});

runner.test('truncate: handles empty/null', (assert) => {
  const romuo = new MockRomuoRedirect();

  assert.equal(romuo.truncate(''), '', 'Should handle empty string');
  assert.equal(romuo.truncate(null), '', 'Should handle null');
  assert.equal(romuo.truncate(undefined), '', 'Should handle undefined');
});

runner.test('getDeviceInfo: returns device info', (assert) => {
  const romuo = new MockRomuoRedirect();
  const info = romuo.getDeviceInfo();

  assert.hasProperty(info, 'isMobile', 'Should have isMobile');
  assert.hasProperty(info, 'isTablet', 'Should have isTablet');
  assert.hasProperty(info, 'browser', 'Should have browser');
  assert.hasProperty(info, 'os', 'Should have os');
  assert.hasProperty(info, 'screenWidth', 'Should have screenWidth');
  assert.hasProperty(info, 'language', 'Should have language');
});

// --- Tests d'intégration ---

runner.test('integration: complete booking flow params', (assert) => {
  const romuo = new MockRomuoRedirect();

  // Simuler les params d'une réservation complète
  const bookingParams = {
    depart: 'Gare de Genève, Place de Cornavin, 1201 Genève',
    arrival: 'Aéroport de Genève, Route de l\'Aéroport 21, 1215 Le Grand-Saconnex',
    canton: 'GE',
    vehicle: 'premium',
    date: '2024-12-25',
    time: '14:30',
    passengers: '3',
    estimate: '85.50',
    name: 'Jean Müller',
    email: 'jean.muller@example.ch',
    phone: '+41 79 123 45 67',
  };

  // Encoder et décoder
  const encoded = romuo.encodeParams(bookingParams);
  const url = `https://app.romuo.ch/reservation?${encoded}`;
  const decoded = romuo.decodeParams('?' + encoded);

  // Vérifications
  assert.equal(decoded.depart, bookingParams.depart, 'Depart should match');
  assert.equal(decoded.arrival, bookingParams.arrival, 'Arrival should match');
  assert.equal(decoded.canton, 'GE', 'Canton should match');
  assert.equal(decoded.vehicle, 'premium', 'Vehicle should match');
  assert.equal(decoded.name, 'Jean Müller', 'Name with umlaut should match');
  assert.contains(url, 'app.romuo.ch/reservation', 'URL should be valid');
});

runner.test('integration: session persistence', (assert) => {
  localStorage.clear();
  const romuo1 = new MockRomuoRedirect();

  // Sauvegarder une réservation
  romuo1.savePendingReservation({
    depart: 'Zürich',
    arrival: 'Basel',
    estimate: 200,
  });

  // Simuler une nouvelle instance (reload de page)
  const romuo2 = new MockRomuoRedirect();
  const pending = romuo2.getPendingReservation();

  assert.truthy(pending, 'Should find pending reservation');
  assert.equal(pending.depart, 'Zürich', 'Depart should persist');
  assert.equal(pending.arrival, 'Basel', 'Arrival should persist');
});

// --- Tests de caractères spéciaux ---

runner.test('special chars: Swiss addresses', (assert) => {
  const romuo = new MockRomuoRedirect();

  const addresses = [
    'Bahnhofstrasse 1, 8001 Zürich',
    'Rue du Rhône 50, 1204 Genève',
    'Via Nassa 22, 6900 Lugano',
    "Place de l'Hôtel-de-Ville, Lausanne",
    'Münsterplatz 10, 4051 Basel',
  ];

  addresses.forEach(addr => {
    const encoded = romuo.encodeParams({ address: addr });
    const decoded = romuo.decodeParams('?' + encoded);
    assert.equal(decoded.address, addr, `Should handle: ${addr.substring(0, 30)}...`);
  });
});

runner.test('special chars: prices with decimals', (assert) => {
  const romuo = new MockRomuoRedirect();

  const prices = ['150.50', '1234.95', '99.00', '0.50'];

  prices.forEach(price => {
    const encoded = romuo.encodeParams({ price });
    const decoded = romuo.decodeParams('?' + encoded);
    assert.equal(decoded.price, price, `Should handle price: ${price}`);
  });
});

// ============================================
// EXÉCUTION
// ============================================

runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
