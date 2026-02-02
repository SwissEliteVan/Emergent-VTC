/**
 * VTC Suisse - SQLite Database Module
 * Persistence pour réservations, clients, et chauffeurs
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Configuration
// ============================================

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'vtc-suisse.db');

// ============================================
// Database Class
// ============================================

class VTCDatabase {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database connection and create tables
   */
  init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Connect to database
    this.db = new Database(this.dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Create tables
    this.createTables();

    console.log(`[Database] Connected to ${this.dbPath}`);

    return this;
  }

  /**
   * Create database tables
   */
  createTables() {
    // Customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        language TEXT DEFAULT 'fr',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Drivers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        license_number TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'berline',
        vehicle_plate TEXT,
        vehicle_model TEXT,
        status TEXT DEFAULT 'available',
        rating REAL DEFAULT 5.0,
        total_trips INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Reservations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        driver_id TEXT,
        status TEXT DEFAULT 'pending',

        -- Pickup details
        pickup_address TEXT NOT NULL,
        pickup_lat REAL NOT NULL,
        pickup_lon REAL NOT NULL,
        pickup_time TEXT NOT NULL,

        -- Dropoff details
        dropoff_address TEXT NOT NULL,
        dropoff_lat REAL NOT NULL,
        dropoff_lon REAL NOT NULL,

        -- Trip details
        vehicle_type TEXT DEFAULT 'berline',
        trip_type TEXT DEFAULT 'oneway',
        passengers INTEGER DEFAULT 1,
        distance_km REAL,
        duration_min INTEGER,

        -- Pricing
        price_base REAL,
        price_distance REAL,
        price_time REAL,
        price_night_surcharge REAL DEFAULT 0,
        price_weekend_surcharge REAL DEFAULT 0,
        price_airport_surcharge REAL DEFAULT 0,
        price_subtotal REAL,
        price_vat REAL,
        price_total REAL,
        currency TEXT DEFAULT 'CHF',

        -- Payment
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'pending',
        paid_at TEXT,

        -- Notes
        customer_notes TEXT,
        driver_notes TEXT,
        admin_notes TEXT,

        -- Timestamps
        created_at TEXT DEFAULT (datetime('now')),
        confirmed_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        cancelled_at TEXT,
        updated_at TEXT DEFAULT (datetime('now')),

        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      )
    `);

    // Estimates table (temporary, for price quotes)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS estimates (
        id TEXT PRIMARY KEY,
        origin_address TEXT,
        origin_lat REAL NOT NULL,
        origin_lon REAL NOT NULL,
        destination_address TEXT,
        destination_lat REAL NOT NULL,
        destination_lon REAL NOT NULL,
        vehicle_type TEXT DEFAULT 'berline',
        trip_type TEXT DEFAULT 'oneway',
        passengers INTEGER DEFAULT 1,
        pickup_time TEXT,
        distance_km REAL,
        duration_min INTEGER,
        price_total REAL,
        price_data TEXT,
        valid_until TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Payments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        reservation_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'CHF',
        method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        transaction_id TEXT,
        provider_response TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT,

        FOREIGN KEY (reservation_id) REFERENCES reservations(id)
      )
    `);

    // Audit log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        old_data TEXT,
        new_data TEXT,
        user_id TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_driver ON reservations(driver_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_pickup_time ON reservations(pickup_time);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
      CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON estimates(valid_until);
    `);
  }

  // ============================================
  // Customer Methods
  // ============================================

  /**
   * Create or update a customer
   */
  upsertCustomer(customer) {
    const stmt = this.db.prepare(`
      INSERT INTO customers (id, name, email, phone, language)
      VALUES (@id, @name, @email, @phone, @language)
      ON CONFLICT(email) DO UPDATE SET
        name = @name,
        phone = @phone,
        language = @language,
        updated_at = datetime('now')
      RETURNING *
    `);

    return stmt.get({
      id: customer.id || uuidv4(),
      name: customer.name,
      email: customer.email.toLowerCase(),
      phone: customer.phone,
      language: customer.language || 'fr',
    });
  }

  /**
   * Get customer by email
   */
  getCustomerByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE email = ?');
    return stmt.get(email.toLowerCase());
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id) {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id);
  }

  // ============================================
  // Driver Methods
  // ============================================

  /**
   * Create a driver
   */
  createDriver(driver) {
    const stmt = this.db.prepare(`
      INSERT INTO drivers (id, name, email, phone, license_number, vehicle_type, vehicle_plate, vehicle_model)
      VALUES (@id, @name, @email, @phone, @licenseNumber, @vehicleType, @vehiclePlate, @vehicleModel)
      RETURNING *
    `);

    return stmt.get({
      id: driver.id || uuidv4(),
      name: driver.name,
      email: driver.email.toLowerCase(),
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType || 'berline',
      vehiclePlate: driver.vehiclePlate || null,
      vehicleModel: driver.vehicleModel || null,
    });
  }

  /**
   * Get available drivers
   */
  getAvailableDrivers(vehicleType = null) {
    let query = 'SELECT * FROM drivers WHERE status = ?';
    const params = ['available'];

    if (vehicleType) {
      query += ' AND vehicle_type = ?';
      params.push(vehicleType);
    }

    query += ' ORDER BY rating DESC, total_trips DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get driver by ID
   */
  getDriverById(id) {
    const stmt = this.db.prepare('SELECT * FROM drivers WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Update driver status
   */
  updateDriverStatus(id, status) {
    const stmt = this.db.prepare(`
      UPDATE drivers SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    return stmt.run(status, id);
  }

  // ============================================
  // Reservation Methods
  // ============================================

  /**
   * Create a reservation
   */
  createReservation(reservation) {
    const stmt = this.db.prepare(`
      INSERT INTO reservations (
        id, customer_id, driver_id, status,
        pickup_address, pickup_lat, pickup_lon, pickup_time,
        dropoff_address, dropoff_lat, dropoff_lon,
        vehicle_type, trip_type, passengers, distance_km, duration_min,
        price_base, price_distance, price_time,
        price_night_surcharge, price_weekend_surcharge, price_airport_surcharge,
        price_subtotal, price_vat, price_total, currency,
        payment_method, customer_notes, confirmed_at
      ) VALUES (
        @id, @customerId, @driverId, @status,
        @pickupAddress, @pickupLat, @pickupLon, @pickupTime,
        @dropoffAddress, @dropoffLat, @dropoffLon,
        @vehicleType, @tripType, @passengers, @distanceKm, @durationMin,
        @priceBase, @priceDistance, @priceTime,
        @priceNightSurcharge, @priceWeekendSurcharge, @priceAirportSurcharge,
        @priceSubtotal, @priceVat, @priceTotal, @currency,
        @paymentMethod, @customerNotes, datetime('now')
      )
      RETURNING *
    `);

    const price = reservation.price || {};

    return stmt.get({
      id: reservation.id,
      customerId: reservation.customerId || null,
      driverId: reservation.driverId || null,
      status: reservation.status || 'confirmed',
      pickupAddress: reservation.origin.address,
      pickupLat: reservation.origin.lat,
      pickupLon: reservation.origin.lon,
      pickupTime: reservation.pickupTime,
      dropoffAddress: reservation.destination.address,
      dropoffLat: reservation.destination.lat,
      dropoffLon: reservation.destination.lon,
      vehicleType: reservation.vehicleType || 'berline',
      tripType: reservation.tripType || 'oneway',
      passengers: reservation.passengers || 1,
      distanceKm: reservation.route?.distanceKm || 0,
      durationMin: reservation.route?.durationMin || 0,
      priceBase: price.breakdown?.baseFare || 0,
      priceDistance: price.breakdown?.distanceFare || 0,
      priceTime: price.breakdown?.timeFare || 0,
      priceNightSurcharge: price.breakdown?.nightSurcharge || 0,
      priceWeekendSurcharge: price.breakdown?.weekendSurcharge || 0,
      priceAirportSurcharge: price.breakdown?.airportSurcharge || 0,
      priceSubtotal: price.subtotalHT || 0,
      priceVat: price.vatAmount || 0,
      priceTotal: price.totalTTC || 0,
      currency: price.currency || 'CHF',
      paymentMethod: reservation.paymentMethod || 'cash',
      customerNotes: reservation.notes || null,
    });
  }

  /**
   * Get reservation by ID
   */
  getReservationById(id) {
    const stmt = this.db.prepare(`
      SELECT r.*,
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             d.name as driver_name, d.phone as driver_phone, d.vehicle_plate, d.vehicle_model
      FROM reservations r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * Get reservations with filters
   */
  getReservations(filters = {}) {
    let query = `
      SELECT r.*,
             c.name as customer_name, c.email as customer_email,
             d.name as driver_name
      FROM reservations r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters.customerId) {
      query += ' AND r.customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters.driverId) {
      query += ' AND r.driver_id = ?';
      params.push(filters.driverId);
    }

    if (filters.dateFrom) {
      query += ' AND r.pickup_time >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND r.pickup_time <= ?';
      params.push(filters.dateTo);
    }

    if (filters.paymentStatus) {
      query += ' AND r.payment_status = ?';
      params.push(filters.paymentStatus);
    }

    query += ' ORDER BY r.pickup_time DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Update reservation status
   */
  updateReservationStatus(id, status, additionalData = {}) {
    let updates = ['status = ?', 'updated_at = datetime(\'now\')'];
    const params = [status];

    // Add timestamp based on status
    if (status === 'started') {
      updates.push('started_at = datetime(\'now\')');
    } else if (status === 'completed') {
      updates.push('completed_at = datetime(\'now\')');
    } else if (status === 'cancelled') {
      updates.push('cancelled_at = datetime(\'now\')');
    }

    // Add driver if assigning
    if (additionalData.driverId) {
      updates.push('driver_id = ?');
      params.push(additionalData.driverId);
    }

    // Add notes
    if (additionalData.adminNotes) {
      updates.push('admin_notes = ?');
      params.push(additionalData.adminNotes);
    }

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE reservations SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(...params);
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(reservationId, status, transactionId = null) {
    const stmt = this.db.prepare(`
      UPDATE reservations
      SET payment_status = ?,
          paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE paid_at END,
          updated_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(status, status, reservationId);
  }

  // ============================================
  // Estimate Methods
  // ============================================

  /**
   * Save an estimate
   */
  saveEstimate(estimate) {
    const stmt = this.db.prepare(`
      INSERT INTO estimates (
        id, origin_address, origin_lat, origin_lon,
        destination_address, destination_lat, destination_lon,
        vehicle_type, trip_type, passengers, pickup_time,
        distance_km, duration_min, price_total, price_data, valid_until
      ) VALUES (
        @id, @originAddress, @originLat, @originLon,
        @destinationAddress, @destinationLat, @destinationLon,
        @vehicleType, @tripType, @passengers, @pickupTime,
        @distanceKm, @durationMin, @priceTotal, @priceData, @validUntil
      )
      RETURNING *
    `);

    return stmt.get({
      id: estimate.id,
      originAddress: estimate.origin?.address || null,
      originLat: estimate.origin.lat,
      originLon: estimate.origin.lon,
      destinationAddress: estimate.destination?.address || null,
      destinationLat: estimate.destination.lat,
      destinationLon: estimate.destination.lon,
      vehicleType: estimate.vehicleType,
      tripType: estimate.tripType,
      passengers: estimate.passengers,
      pickupTime: estimate.pickupTime || null,
      distanceKm: estimate.route.distanceKm,
      durationMin: estimate.route.durationMin,
      priceTotal: estimate.price.totalTTC,
      priceData: JSON.stringify(estimate.price),
      validUntil: estimate.validUntil,
    });
  }

  /**
   * Get estimate by ID
   */
  getEstimateById(id) {
    const stmt = this.db.prepare('SELECT * FROM estimates WHERE id = ? AND valid_until > datetime(\'now\')');
    const result = stmt.get(id);

    if (result && result.price_data) {
      result.price = JSON.parse(result.price_data);
    }

    return result;
  }

  /**
   * Clean up expired estimates
   */
  cleanupExpiredEstimates() {
    const stmt = this.db.prepare('DELETE FROM estimates WHERE valid_until < datetime(\'now\')');
    return stmt.run();
  }

  // ============================================
  // Statistics Methods
  // ============================================

  /**
   * Get dashboard statistics
   */
  getStatistics(dateFrom = null, dateTo = null) {
    const params = [];
    let dateFilter = '';

    if (dateFrom) {
      dateFilter += ' AND created_at >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      dateFilter += ' AND created_at <= ?';
      params.push(dateTo);
    }

    // Total reservations by status
    const reservationsByStatus = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM reservations
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `).all(...params);

    // Revenue
    const revenue = this.db.prepare(`
      SELECT
        SUM(price_total) as total_revenue,
        SUM(price_vat) as total_vat,
        COUNT(*) as total_trips,
        AVG(price_total) as avg_trip_value
      FROM reservations
      WHERE status = 'completed' ${dateFilter}
    `).get(...params);

    // Top customers
    const topCustomers = this.db.prepare(`
      SELECT c.id, c.name, c.email,
             COUNT(r.id) as trip_count,
             SUM(r.price_total) as total_spent
      FROM customers c
      JOIN reservations r ON c.id = r.customer_id
      WHERE r.status = 'completed' ${dateFilter}
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 10
    `).all(...params);

    // Reservations by vehicle type
    const byVehicleType = this.db.prepare(`
      SELECT vehicle_type, COUNT(*) as count, SUM(price_total) as revenue
      FROM reservations
      WHERE status = 'completed' ${dateFilter}
      GROUP BY vehicle_type
    `).all(...params);

    // Reservations by payment method
    const byPaymentMethod = this.db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(price_total) as revenue
      FROM reservations
      WHERE status = 'completed' ${dateFilter}
      GROUP BY payment_method
    `).all(...params);

    return {
      reservationsByStatus: Object.fromEntries(reservationsByStatus.map(r => [r.status, r.count])),
      revenue: {
        total: revenue?.total_revenue || 0,
        vat: revenue?.total_vat || 0,
        trips: revenue?.total_trips || 0,
        avgValue: revenue?.avg_trip_value || 0,
      },
      topCustomers,
      byVehicleType,
      byPaymentMethod,
    };
  }

  // ============================================
  // Audit Log
  // ============================================

  /**
   * Log an action
   */
  logAction(entityType, entityId, action, oldData = null, newData = null, userId = null, ipAddress = null) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (entity_type, entity_id, action, old_data, new_data, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      entityType,
      entityId,
      action,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      userId,
      ipAddress
    );
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('[Database] Connection closed');
    }
  }
}

// ============================================
// Singleton Export
// ============================================

let dbInstance = null;

export function initDatabase(dbPath = DB_PATH) {
  if (!dbInstance) {
    dbInstance = new VTCDatabase(dbPath);
    dbInstance.init();
  }
  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export { VTCDatabase };
export default { initDatabase, getDatabase, VTCDatabase };
