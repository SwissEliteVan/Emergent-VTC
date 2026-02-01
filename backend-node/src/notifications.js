/**
 * VTC Suisse - Notification Service
 * Email and SMS notifications for bookings
 */

import nodemailer from 'nodemailer';

// ============================================
// Configuration
// ============================================

const config = {
  // Email (SMTP)
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'VTC Suisse <noreply@vtc-suisse.ch>',

  // SMS (Twilio or similar)
  SMS_ENABLED: process.env.SMS_ENABLED === 'true',
  SMS_ACCOUNT_SID: process.env.SMS_ACCOUNT_SID || '',
  SMS_AUTH_TOKEN: process.env.SMS_AUTH_TOKEN || '',
  SMS_FROM: process.env.SMS_FROM || '+41000000000',

  // Company info
  COMPANY: {
    name: 'VTC Suisse Sàrl',
    phone: '+41 22 123 45 67',
    email: 'contact@vtc-suisse.ch',
    website: 'https://vtc-suisse.ch',
  },
};

// ============================================
// Email Transporter
// ============================================

let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter && config.EMAIL_USER && config.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }
  return emailTransporter;
}

// Test email connection
export async function testEmailConnection() {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Email Templates
// ============================================

const emailTemplates = {
  /**
   * Booking confirmation email
   */
  bookingConfirmation: (booking) => ({
    subject: `Confirmation de réservation VTC - ${booking.id}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #D52B1E; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .booking-id { background: #f8f8f8; border-left: 4px solid #D52B1E; padding: 16px; margin-bottom: 24px; }
    .booking-id strong { font-size: 18px; color: #D52B1E; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; color: #333; margin: 0 0 12px 0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-label { color: #666; }
    .detail-value { font-weight: 500; color: #333; }
    .route { background: #f8f8f8; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .route-point { display: flex; align-items: center; margin: 8px 0; }
    .route-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 12px; }
    .route-dot.pickup { background: #10B981; }
    .route-dot.dropoff { background: #D52B1E; }
    .price-box { background: #D52B1E; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
    .price-box .amount { font-size: 32px; font-weight: 700; }
    .price-box .label { font-size: 14px; opacity: 0.9; }
    .footer { background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px; }
    .footer a { color: #D52B1E; }
    .button { display: inline-block; background: #D52B1E; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇨🇭 VTC Suisse</h1>
      <p>Votre réservation est confirmée</p>
    </div>

    <div class="content">
      <div class="booking-id">
        <p style="margin: 0 0 4px 0; color: #666;">Numéro de réservation</p>
        <strong>${booking.id}</strong>
      </div>

      <p>Bonjour ${booking.customer.name},</p>
      <p>Nous vous confirmons votre réservation de véhicule avec chauffeur. Voici les détails de votre course :</p>

      <div class="section">
        <h2>📍 Trajet</h2>
        <div class="route">
          <div class="route-point">
            <div class="route-dot pickup"></div>
            <div>
              <strong>Départ</strong><br>
              <span style="color: #666;">${booking.origin.address}</span>
            </div>
          </div>
          <div class="route-point">
            <div class="route-dot dropoff"></div>
            <div>
              <strong>Arrivée</strong><br>
              <span style="color: #666;">${booking.destination.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📅 Date et heure</h2>
        <div class="detail-row">
          <span class="detail-label">Date de prise en charge</span>
          <span class="detail-value">${formatDate(booking.pickupTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heure</span>
          <span class="detail-value">${formatTime(booking.pickupTime)}</span>
        </div>
      </div>

      <div class="section">
        <h2>🚗 Véhicule</h2>
        <div class="detail-row">
          <span class="detail-label">Type de véhicule</span>
          <span class="detail-value">${getVehicleLabel(booking.vehicleType)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passagers</span>
          <span class="detail-value">${booking.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type de trajet</span>
          <span class="detail-value">${getTripTypeLabel(booking.tripType)}</span>
        </div>
      </div>

      <div class="price-box">
        <div class="label">Prix total TTC</div>
        <div class="amount">CHF ${booking.price.totalTTC.toFixed(2)}</div>
        <div class="label">(dont TVA 7.7% : CHF ${booking.price.vatAmount.toFixed(2)})</div>
      </div>

      <div class="section">
        <h2>💳 Paiement</h2>
        <div class="detail-row">
          <span class="detail-label">Mode de paiement</span>
          <span class="detail-value">${getPaymentMethodLabel(booking.paymentMethod)}</span>
        </div>
      </div>

      ${booking.notes ? `
      <div class="section">
        <h2>📝 Notes</h2>
        <p style="color: #666;">${booking.notes}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${config.COMPANY.website}/booking/${booking.id}" class="button">
          Voir ma réservation
        </a>
      </div>

      <div style="margin-top: 32px; padding: 16px; background: #f8f8f8; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Informations importantes</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
          <li>Votre chauffeur vous contactera 15 minutes avant l'heure de prise en charge</li>
          <li>Annulation gratuite jusqu'à 24h avant le départ</li>
          <li>En cas de retard, veuillez nous contacter au ${config.COMPANY.phone}</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p><strong>${config.COMPANY.name}</strong></p>
      <p>
        <a href="tel:${config.COMPANY.phone}">${config.COMPANY.phone}</a> |
        <a href="mailto:${config.COMPANY.email}">${config.COMPANY.email}</a>
      </p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
VTC Suisse - Confirmation de réservation

Numéro de réservation: ${booking.id}

Bonjour ${booking.customer.name},

Votre réservation est confirmée.

TRAJET
Départ: ${booking.origin.address}
Arrivée: ${booking.destination.address}
Date: ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}

VÉHICULE
Type: ${getVehicleLabel(booking.vehicleType)}
Passagers: ${booking.passengers}

PRIX
Total TTC: CHF ${booking.price.totalTTC.toFixed(2)}
(dont TVA 7.7%: CHF ${booking.price.vatAmount.toFixed(2)})

Mode de paiement: ${getPaymentMethodLabel(booking.paymentMethod)}

${booking.notes ? `Notes: ${booking.notes}` : ''}

---
${config.COMPANY.name}
${config.COMPANY.phone}
${config.COMPANY.email}
    `,
  }),

  /**
   * Booking reminder (sent 24h before)
   */
  bookingReminder: (booking) => ({
    subject: `Rappel: Votre course VTC demain - ${booking.id}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #D52B1E; color: white; padding: 24px; text-align: center; }
    .content { padding: 32px; }
    .highlight { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; }
    .footer { background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel de votre course</h1>
    </div>
    <div class="content">
      <p>Bonjour ${booking.customer.name},</p>

      <div class="highlight">
        <strong>Votre course est prévue demain!</strong>
        <p style="margin: 8px 0 0 0;">
          📅 ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}
        </p>
      </div>

      <p><strong>Départ:</strong> ${booking.origin.address}</p>
      <p><strong>Arrivée:</strong> ${booking.destination.address}</p>
      <p><strong>Véhicule:</strong> ${getVehicleLabel(booking.vehicleType)}</p>

      <p style="margin-top: 24px;">
        Votre chauffeur vous contactera 15 minutes avant l'heure de prise en charge.
      </p>

      <p>
        En cas de modification ou d'annulation, veuillez nous contacter au
        <a href="tel:${config.COMPANY.phone}">${config.COMPANY.phone}</a>.
      </p>
    </div>
    <div class="footer">
      <p>${config.COMPANY.name} | ${config.COMPANY.phone}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Rappel: Votre course VTC demain

Bonjour ${booking.customer.name},

Votre course est prévue demain!

Date: ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}
Départ: ${booking.origin.address}
Arrivée: ${booking.destination.address}
Véhicule: ${getVehicleLabel(booking.vehicleType)}

Votre chauffeur vous contactera 15 minutes avant l'heure de prise en charge.

${config.COMPANY.name}
${config.COMPANY.phone}
    `,
  }),

  /**
   * Driver assigned notification
   */
  driverAssigned: (booking, driver) => ({
    subject: `Votre chauffeur pour la course ${booking.id}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #10B981; color: white; padding: 24px; text-align: center; }
    .content { padding: 32px; }
    .driver-card { background: #f8f8f8; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .driver-avatar { width: 80px; height: 80px; border-radius: 50%; background: #D52B1E; color: white; font-size: 32px; font-weight: bold; line-height: 80px; margin: 0 auto 16px; }
    .footer { background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Chauffeur assigné</h1>
    </div>
    <div class="content">
      <p>Bonjour ${booking.customer.name},</p>
      <p>Un chauffeur a été assigné à votre course:</p>

      <div class="driver-card">
        <div class="driver-avatar">${driver.name.split(' ').map(n => n[0]).join('')}</div>
        <h2 style="margin: 0 0 8px 0;">${driver.name}</h2>
        <p style="margin: 0; color: #666;">
          ${driver.vehicle_model}<br>
          <strong>${driver.vehicle_plate}</strong>
        </p>
        <p style="margin: 16px 0 0 0;">
          ⭐ ${driver.rating}/5 | ${driver.trips_count} courses
        </p>
      </div>

      <p><strong>Date:</strong> ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}</p>
      <p><strong>Départ:</strong> ${booking.origin.address}</p>

      <p style="margin-top: 24px;">
        ${driver.name} vous contactera 15 minutes avant l'heure de prise en charge.
      </p>
    </div>
    <div class="footer">
      <p>${config.COMPANY.name} | ${config.COMPANY.phone}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Chauffeur assigné

Bonjour ${booking.customer.name},

Un chauffeur a été assigné à votre course:

Chauffeur: ${driver.name}
Véhicule: ${driver.vehicle_model}
Plaque: ${driver.vehicle_plate}
Note: ${driver.rating}/5

Date: ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}
Départ: ${booking.origin.address}

${driver.name} vous contactera 15 minutes avant l'heure de prise en charge.

${config.COMPANY.name}
${config.COMPANY.phone}
    `,
  }),

  /**
   * Booking cancellation
   */
  bookingCancelled: (booking, reason) => ({
    subject: `Annulation de réservation - ${booking.id}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #EF4444; color: white; padding: 24px; text-align: center; }
    .content { padding: 32px; }
    .footer { background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Réservation annulée</h1>
    </div>
    <div class="content">
      <p>Bonjour ${booking.customer.name},</p>
      <p>Votre réservation <strong>${booking.id}</strong> a été annulée.</p>

      ${reason ? `<p><strong>Motif:</strong> ${reason}</p>` : ''}

      <p><strong>Trajet prévu:</strong></p>
      <ul>
        <li>De: ${booking.origin.address}</li>
        <li>À: ${booking.destination.address}</li>
        <li>Date: ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}</li>
      </ul>

      <p style="margin-top: 24px;">
        Si vous souhaitez effectuer une nouvelle réservation, visitez notre site ou contactez-nous.
      </p>
    </div>
    <div class="footer">
      <p>${config.COMPANY.name} | ${config.COMPANY.phone}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Réservation annulée

Bonjour ${booking.customer.name},

Votre réservation ${booking.id} a été annulée.

${reason ? `Motif: ${reason}` : ''}

Trajet prévu:
- De: ${booking.origin.address}
- À: ${booking.destination.address}
- Date: ${formatDate(booking.pickupTime)} à ${formatTime(booking.pickupTime)}

${config.COMPANY.name}
${config.COMPANY.phone}
    `,
  }),
};

// ============================================
// SMS Templates
// ============================================

const smsTemplates = {
  bookingConfirmation: (booking) =>
    `VTC Suisse: Réservation ${booking.id} confirmée. ` +
    `${formatDate(booking.pickupTime)} ${formatTime(booking.pickupTime)}. ` +
    `CHF ${booking.price.totalTTC.toFixed(0)}. Info: ${config.COMPANY.phone}`,

  bookingReminder: (booking) =>
    `VTC Suisse: Rappel course demain ${formatTime(booking.pickupTime)}. ` +
    `Départ: ${truncate(booking.origin.address, 40)}. ` +
    `Ref: ${booking.id}`,

  driverAssigned: (booking, driver) =>
    `VTC Suisse: Votre chauffeur ${driver.name} (${driver.vehicle_plate}) ` +
    `vous prendra en charge à ${formatTime(booking.pickupTime)}. Ref: ${booking.id}`,

  bookingCancelled: (booking) =>
    `VTC Suisse: Réservation ${booking.id} annulée. Contact: ${config.COMPANY.phone}`,
};

// ============================================
// Helper Functions
// ============================================

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('fr-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getVehicleLabel(type) {
  const labels = {
    eco: 'Eco',
    berline: 'Berline',
    van: 'Van (7 places)',
    luxe: 'Luxe',
  };
  return labels[type] || type;
}

function getTripTypeLabel(type) {
  const labels = {
    oneway: 'Aller simple',
    roundtrip: 'Aller-retour',
    halfday: 'Demi-journée',
  };
  return labels[type] || type;
}

function getPaymentMethodLabel(method) {
  const labels = {
    twint: 'TWINT',
    card: 'Carte bancaire',
    cash: 'Espèces',
    invoice: 'Facture',
  };
  return labels[method] || method;
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length - 3) + '...' : str;
}

// ============================================
// Send Functions
// ============================================

/**
 * Send email notification
 */
export async function sendEmail(to, templateName, data) {
  const transporter = getEmailTransporter();

  if (!transporter) {
    console.warn('Email not configured, skipping notification');
    return { success: false, error: 'Email not configured' };
  }

  const templateFn = emailTemplates[templateName];
  if (!templateFn) {
    return { success: false, error: `Unknown template: ${templateName}` };
  }

  const template = templateFn(data.booking, data.driver);

  try {
    const result = await transporter.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`Email sent: ${templateName} to ${to}`, { messageId: result.messageId });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS notification (placeholder - needs Twilio/other provider)
 */
export async function sendSMS(to, templateName, data) {
  if (!config.SMS_ENABLED) {
    console.warn('SMS not enabled, skipping notification');
    return { success: false, error: 'SMS not enabled' };
  }

  const templateFn = smsTemplates[templateName];
  if (!templateFn) {
    return { success: false, error: `Unknown template: ${templateName}` };
  }

  const message = templateFn(data.booking, data.driver);

  // TODO: Integrate with Twilio or other SMS provider
  console.log(`SMS would be sent to ${to}: ${message}`);

  return { success: true, message: 'SMS queued (demo mode)' };
}

/**
 * Send booking confirmation (email + SMS)
 */
export async function sendBookingConfirmation(booking) {
  const results = {
    email: null,
    sms: null,
  };

  // Send email
  if (booking.customer?.email) {
    results.email = await sendEmail(
      booking.customer.email,
      'bookingConfirmation',
      { booking }
    );
  }

  // Send SMS
  if (booking.customer?.phone) {
    results.sms = await sendSMS(
      booking.customer.phone,
      'bookingConfirmation',
      { booking }
    );
  }

  return results;
}

/**
 * Send booking reminder (email + SMS)
 */
export async function sendBookingReminder(booking) {
  const results = {
    email: null,
    sms: null,
  };

  if (booking.customer?.email) {
    results.email = await sendEmail(
      booking.customer.email,
      'bookingReminder',
      { booking }
    );
  }

  if (booking.customer?.phone) {
    results.sms = await sendSMS(
      booking.customer.phone,
      'bookingReminder',
      { booking }
    );
  }

  return results;
}

/**
 * Send driver assigned notification
 */
export async function sendDriverAssigned(booking, driver) {
  const results = {
    email: null,
    sms: null,
  };

  if (booking.customer?.email) {
    results.email = await sendEmail(
      booking.customer.email,
      'driverAssigned',
      { booking, driver }
    );
  }

  if (booking.customer?.phone) {
    results.sms = await sendSMS(
      booking.customer.phone,
      'driverAssigned',
      { booking, driver }
    );
  }

  return results;
}

/**
 * Send cancellation notification
 */
export async function sendBookingCancelled(booking, reason = null) {
  const results = {
    email: null,
    sms: null,
  };

  if (booking.customer?.email) {
    results.email = await sendEmail(
      booking.customer.email,
      'bookingCancelled',
      { booking, reason }
    );
  }

  if (booking.customer?.phone) {
    results.sms = await sendSMS(
      booking.customer.phone,
      'bookingCancelled',
      { booking }
    );
  }

  return results;
}

// ============================================
// Scheduled Reminders
// ============================================

/**
 * Check for upcoming bookings and send reminders
 * Should be called periodically (e.g., every hour)
 */
export async function processBookingReminders(reservationsMap) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

  let remindersSent = 0;

  for (const booking of reservationsMap.values()) {
    // Skip if not confirmed or already completed
    if (!['confirmed', 'assigned'].includes(booking.status)) continue;

    // Skip if already reminded
    if (booking.reminderSent) continue;

    const pickupTime = new Date(booking.pickupTime);

    // Check if pickup is tomorrow
    if (pickupTime >= tomorrowStart && pickupTime <= tomorrowEnd) {
      await sendBookingReminder(booking);
      booking.reminderSent = true;
      remindersSent++;
    }
  }

  console.log(`Processed booking reminders: ${remindersSent} sent`);
  return remindersSent;
}

export default {
  sendEmail,
  sendSMS,
  sendBookingConfirmation,
  sendBookingReminder,
  sendDriverAssigned,
  sendBookingCancelled,
  processBookingReminders,
  testEmailConnection,
};
