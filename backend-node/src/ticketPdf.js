/**
 * ================================================================
 * ROMUO VTC - Generateur de Bon de Reservation PDF
 * ================================================================
 * Conforme a la reglementation VTC :
 * - France : Article L. 3142-1 du code des transports
 * - Suisse : Ordonnance sur le transport de voyageurs
 *
 * Inclut :
 * - Informations entreprise (licence, SIRET/IDE)
 * - Informations client
 * - Details de la course
 * - Prix TTC detaille
 * - QR Code de verification
 * - Mentions legales obligatoires
 * ================================================================
 */

import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Champs obligatoires pour la conformite legale
 */
const REQUIRED_FIELDS = [
  'company.name',
  'company.address',
  'company.phone',
  'company.licenseNumber',
  'customer.name',
  'customer.phone',
  'pickupTime',
  'pickupAddress',
  'dropoffAddress',
  'price.totalTTC',
];

/**
 * Configuration par defaut
 */
const DEFAULT_CONFIG = {
  country: 'CH', // 'CH' pour Suisse, 'FR' pour France
  currency: 'CHF',
  language: 'fr',
  vatRate: 8.1, // TVA Suisse 2024
  colors: {
    primary: '#1a1a2e',
    secondary: '#d4af37',
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb',
  },
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formater un montant en devise
 * @param {number} value - Montant
 * @param {string} currency - Code devise (CHF, EUR)
 * @returns {string} Montant formate
 */
function formatCurrency(value, currency = 'CHF') {
  const numValue = Number(value) || 0;

  if (currency === 'CHF') {
    // Format suisse : 1'234.50 CHF
    return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' CHF';
  }

  // Format francais : 1 234,50 €
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(numValue);
}

/**
 * Formater une date/heure complete
 * @param {string|Date} value - Date
 * @param {string} locale - Locale (fr-FR, fr-CH)
 * @returns {string} Date formatee
 */
function formatDateTime(value, locale = 'fr-CH') {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error('Date invalide');
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formater une date courte
 */
function formatDateShort(value, locale = 'fr-CH') {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formater une heure
 */
function formatTime(value, locale = 'fr-CH') {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Collecter un stream en buffer
 */
function collectStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Valider les donnees du ticket
 */
function validateTicketData(payload) {
  const missing = [];
  const errors = [];

  // Verifier les champs obligatoires
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let cursor = payload;

    for (const part of parts) {
      cursor = cursor?.[part];
    }

    if (cursor === undefined || cursor === null || cursor === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const error = new Error(
      `Champs obligatoires manquants : ${missing.join(', ')}`
    );
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.fields = missing;
    throw error;
  }

  // Valider la date
  const pickupDate = new Date(payload.pickupTime);
  if (isNaN(pickupDate.getTime())) {
    const error = new Error('Date de prise en charge invalide');
    error.statusCode = 400;
    error.code = 'INVALID_DATE';
    throw error;
  }

  // Valider le prix
  const price = Number(payload.price?.totalTTC);
  if (isNaN(price) || price < 0) {
    const error = new Error('Prix TTC invalide');
    error.statusCode = 400;
    error.code = 'INVALID_PRICE';
    throw error;
  }

  return true;
}

/**
 * Construire les lignes de detail du prix
 */
function buildPriceBreakdown(price, currency = 'CHF') {
  const lines = [];

  // Details explicites fournis
  if (Array.isArray(price.details) && price.details.length > 0) {
    price.details.forEach((detail) => {
      if (detail?.label && detail?.amount !== undefined) {
        lines.push({
          label: detail.label,
          amount: formatCurrency(detail.amount, currency),
        });
      }
    });
  }
  // Sinon, construire a partir des composants
  else {
    if (price.baseFare !== undefined) {
      lines.push({
        label: 'Prise en charge',
        amount: formatCurrency(price.baseFare, currency),
      });
    }

    if (price.distanceFare !== undefined && price.distanceKm !== undefined) {
      lines.push({
        label: `Distance (${price.distanceKm} km)`,
        amount: formatCurrency(price.distanceFare, currency),
      });
    } else if (price.distanceFare !== undefined) {
      lines.push({
        label: 'Distance',
        amount: formatCurrency(price.distanceFare, currency),
      });
    }

    if (price.timeFare !== undefined && price.durationMin !== undefined) {
      lines.push({
        label: `Duree (${price.durationMin} min)`,
        amount: formatCurrency(price.timeFare, currency),
      });
    } else if (price.timeFare !== undefined) {
      lines.push({
        label: 'Temps',
        amount: formatCurrency(price.timeFare, currency),
      });
    }

    if (price.nightSurcharge !== undefined && price.nightSurcharge > 0) {
      lines.push({
        label: 'Supplement nuit (22h-6h)',
        amount: formatCurrency(price.nightSurcharge, currency),
        highlight: true,
      });
    }

    if (price.airportFee !== undefined && price.airportFee > 0) {
      lines.push({
        label: 'Supplement aeroport',
        amount: formatCurrency(price.airportFee, currency),
      });
    }

    if (price.luggageFee !== undefined && price.luggageFee > 0) {
      lines.push({
        label: 'Supplement bagages',
        amount: formatCurrency(price.luggageFee, currency),
      });
    }

    if (price.waitingFee !== undefined && price.waitingFee > 0) {
      lines.push({
        label: "Temps d'attente",
        amount: formatCurrency(price.waitingFee, currency),
      });
    }
  }

  return lines;
}

/**
 * Generer les donnees du QR code
 */
function generateQRData(data) {
  return JSON.stringify({
    v: 1, // Version du format
    ref: data.reservationId,
    company: data.company.name,
    customer: data.customer.name,
    phone: data.customer.phone,
    date: data.pickupTime,
    from: data.pickupAddress?.substring(0, 50),
    to: data.dropoffAddress?.substring(0, 50),
    price: data.price.totalTTC,
    currency: data.currency || 'CHF',
    generated: new Date().toISOString(),
  });
}

// ============================================
// FONCTION PRINCIPALE DE GENERATION PDF
// ============================================

/**
 * Generer un bon de reservation PDF conforme
 *
 * @param {Object} params - Parametres de generation
 * @param {string} params.reservationId - ID unique de la reservation
 * @param {Object} params.company - Informations entreprise
 * @param {string} params.company.name - Nom de l'entreprise
 * @param {string} params.company.address - Adresse complete
 * @param {string} params.company.phone - Telephone
 * @param {string} params.company.email - Email
 * @param {string} params.company.licenseNumber - Numero de licence VTC
 * @param {string} params.company.siret - SIRET (France) ou IDE (Suisse)
 * @param {string} [params.company.vatNumber] - Numero TVA
 * @param {Object} params.customer - Informations client
 * @param {string} params.customer.name - Nom du client
 * @param {string} params.customer.phone - Telephone
 * @param {string} [params.customer.email] - Email
 * @param {string|Date} params.pickupTime - Date/heure de prise en charge
 * @param {string} params.pickupAddress - Adresse de depart
 * @param {string} params.dropoffAddress - Adresse d'arrivee
 * @param {Object} params.price - Details du prix
 * @param {number} params.price.totalTTC - Prix total TTC
 * @param {Object} [params.options] - Options supplementaires
 * @param {string} [params.options.country='CH'] - Pays (CH ou FR)
 * @param {string} [params.options.currency='CHF'] - Devise
 * @param {string} [params.options.vehicleType] - Type de vehicule
 * @param {number} [params.options.passengers] - Nombre de passagers
 * @param {string} [params.outputDir] - Dossier de sortie pour enregistrement
 * @param {boolean} [params.saveToDisk=false] - Enregistrer sur disque
 * @param {boolean} [params.sendEmailSimulation=false] - Simuler envoi email
 * @param {string} [params.logoPath] - Chemin vers le logo
 * @param {string} [params.notes] - Notes supplementaires
 *
 * @returns {Promise<{buffer: Buffer, filePath?: string, emailSimulation?: Object}>}
 */
export async function generateTicketPDF({
  reservationId,
  company,
  customer,
  pickupTime,
  pickupAddress,
  dropoffAddress,
  price,
  options = {},
  outputDir,
  saveToDisk = false,
  sendEmailSimulation = false,
  logoPath,
  notes,
}) {
  // Configuration
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
  };
  const { country, currency, colors } = config;
  const locale = country === 'CH' ? 'fr-CH' : 'fr-FR';

  // Validation des donnees
  validateTicketData({
    company,
    customer,
    pickupTime,
    pickupAddress,
    dropoffAddress,
    price,
  });

  // Generer le QR code
  const qrData = generateQRData({
    reservationId,
    company,
    customer,
    pickupTime,
    pickupAddress,
    dropoffAddress,
    price,
    currency,
  });

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 150,
    color: {
      dark: colors.primary,
      light: '#ffffff',
    },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // Creer le document PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Bon de Reservation ${reservationId}`,
      Author: company.name,
      Subject: 'Bon de reservation VTC',
      Creator: 'Romuo VTC',
      Keywords: 'VTC, reservation, transport',
    },
  });

  // Streams
  const passThrough = new PassThrough();
  doc.pipe(passThrough);

  let filePath;
  if (saveToDisk && outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
    const fileName = `bon-reservation-${reservationId}-${Date.now()}.pdf`;
    filePath = path.join(outputDir, fileName);
    doc.pipe(fs.createWriteStream(filePath));
  }

  // Dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ============================================
  // EN-TETE
  // ============================================

  // Bordure du document
  doc
    .rect(30, 30, pageWidth - 60, pageHeight - 60)
    .lineWidth(1)
    .strokeColor(colors.primary)
    .stroke();

  // Ligne decorative en haut
  doc
    .rect(30, 30, pageWidth - 60, 5)
    .fill(colors.secondary);

  // Logo ou placeholder
  const logoX = marginLeft;
  const logoY = 50;

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, logoX, logoY, { width: 80 });
    } catch (e) {
      // Fallback si l'image ne charge pas
      drawLogoPlaceholder(doc, logoX, logoY, colors);
    }
  } else {
    drawLogoPlaceholder(doc, logoX, logoY, colors);
  }

  // Titre et reference
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(colors.primary)
    .text('BON DE RESERVATION VTC', marginLeft + 100, 50, {
      align: 'right',
      width: contentWidth - 100,
    });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.muted)
    .text(`Reference : ${reservationId?.toUpperCase() || 'N/A'}`, marginLeft + 100, 78, {
      align: 'right',
      width: contentWidth - 100,
    });

  doc
    .fontSize(9)
    .text(`Document genere le ${new Date().toLocaleString(locale)}`, marginLeft + 100, 93, {
      align: 'right',
      width: contentWidth - 100,
    });

  // Ligne de separation
  doc
    .moveTo(marginLeft, 120)
    .lineTo(pageWidth - marginRight, 120)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  // ============================================
  // INFORMATIONS ENTREPRISE
  // ============================================

  let yPos = 140;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.secondary)
    .text('ENTREPRISE VTC', marginLeft, yPos);

  yPos += 18;

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(colors.primary)
    .text(company.name, marginLeft, yPos);

  yPos += 16;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.text)
    .text(company.address, marginLeft, yPos);

  yPos += 14;
  doc.text(`Tel : ${company.phone}`, marginLeft, yPos);

  if (company.email) {
    yPos += 14;
    doc.text(`Email : ${company.email}`, marginLeft, yPos);
  }

  yPos += 14;
  doc
    .font('Helvetica-Bold')
    .text(`Licence VTC : ${company.licenseNumber}`, marginLeft, yPos);

  yPos += 14;
  const idLabel = country === 'CH' ? 'IDE' : 'SIRET';
  doc
    .font('Helvetica')
    .text(`${idLabel} : ${company.siret}`, marginLeft, yPos);

  if (company.vatNumber) {
    yPos += 14;
    doc.text(`N° TVA : ${company.vatNumber}`, marginLeft, yPos);
  }

  // ============================================
  // INFORMATIONS CLIENT
  // ============================================

  yPos += 30;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.secondary)
    .text('CLIENT', marginLeft, yPos);

  yPos += 18;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.text)
    .text(`${customer.name}`, marginLeft, yPos);

  yPos += 15;

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Telephone : ${customer.phone}`, marginLeft, yPos);

  if (customer.email) {
    yPos += 14;
    doc.text(`Email : ${customer.email}`, marginLeft, yPos);
  }

  // ============================================
  // DETAILS DE LA COURSE
  // ============================================

  yPos += 30;

  // Cadre pour la course
  const courseBoxY = yPos;
  const courseBoxHeight = 120;

  doc
    .rect(marginLeft, courseBoxY, contentWidth, courseBoxHeight)
    .fillColor(colors.background)
    .fill();

  doc
    .rect(marginLeft, courseBoxY, contentWidth, courseBoxHeight)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  yPos += 15;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.secondary)
    .text('DETAILS DE LA COURSE', marginLeft + 15, yPos);

  yPos += 20;

  // Date et heure
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(colors.primary)
    .text('Date et heure de prise en charge :', marginLeft + 15, yPos);

  yPos += 15;

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(colors.text)
    .text(formatDateTime(pickupTime, locale), marginLeft + 15, yPos);

  yPos += 22;

  // Depart
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#22c55e') // Vert pour depart
    .text('DEPART :', marginLeft + 15, yPos);

  doc
    .font('Helvetica')
    .fillColor(colors.text)
    .text(pickupAddress, marginLeft + 80, yPos, {
      width: contentWidth - 110,
    });

  yPos += 20;

  // Arrivee
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#ef4444') // Rouge pour arrivee
    .text('ARRIVEE :', marginLeft + 15, yPos);

  doc
    .font('Helvetica')
    .fillColor(colors.text)
    .text(dropoffAddress, marginLeft + 80, yPos, {
      width: contentWidth - 110,
    });

  // ============================================
  // INFORMATIONS SUPPLEMENTAIRES
  // ============================================

  yPos = courseBoxY + courseBoxHeight + 20;

  if (options.vehicleType || options.passengers) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(colors.muted);

    if (options.vehicleType) {
      doc.text(`Vehicule : ${options.vehicleType.toUpperCase()}`, marginLeft, yPos);
      yPos += 14;
    }

    if (options.passengers) {
      doc.text(`Passagers : ${options.passengers}`, marginLeft, yPos);
      yPos += 14;
    }

    yPos += 10;
  }

  // ============================================
  // TARIFICATION
  // ============================================

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.secondary)
    .text('TARIFICATION TTC', marginLeft, yPos);

  yPos += 20;

  // Lignes de prix
  const priceLines = buildPriceBreakdown(price, currency);
  const priceColWidth = 200;

  priceLines.forEach((line) => {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(line.highlight ? colors.secondary : colors.text)
      .text(line.label, marginLeft, yPos)
      .text(line.amount, marginLeft + priceColWidth, yPos, {
        width: 150,
        align: 'right',
      });

    yPos += 16;
  });

  // Ligne de separation
  yPos += 5;
  doc
    .moveTo(marginLeft, yPos)
    .lineTo(marginLeft + priceColWidth + 150, yPos)
    .strokeColor(colors.primary)
    .lineWidth(1)
    .stroke();

  yPos += 10;

  // Total
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(colors.primary)
    .text('TOTAL TTC', marginLeft, yPos)
    .fontSize(16)
    .fillColor(colors.secondary)
    .text(formatCurrency(price.totalTTC, currency), marginLeft + priceColWidth, yPos, {
      width: 150,
      align: 'right',
    });

  // ============================================
  // NOTES
  // ============================================

  if (notes) {
    yPos += 35;

    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(colors.muted)
      .text(`Note : ${notes}`, marginLeft, yPos, {
        width: contentWidth - 150,
      });
  }

  // ============================================
  // QR CODE
  // ============================================

  const qrSize = 100;
  const qrX = pageWidth - marginRight - qrSize - 10;
  const qrY = yPos > 500 ? yPos + 20 : 500;

  doc.image(qrBuffer, qrX, qrY, { width: qrSize });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(colors.muted)
    .text('Scanner pour verifier', qrX - 10, qrY + qrSize + 5, {
      width: qrSize + 20,
      align: 'center',
    });

  // ============================================
  // MENTIONS LEGALES
  // ============================================

  const legalY = pageHeight - 100;

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(colors.muted);

  if (country === 'FR') {
    doc.text(
      'Conforme a l\'article L. 3142-1 du code des transports.',
      marginLeft,
      legalY,
      { width: contentWidth }
    );
    doc.text(
      'Ce bon de reservation fait foi de la commande passee aupres de l\'exploitant VTC.',
      marginLeft,
      legalY + 12,
      { width: contentWidth }
    );
  } else {
    doc.text(
      'Conforme a l\'Ordonnance sur le transport de voyageurs (OTV) - Suisse.',
      marginLeft,
      legalY,
      { width: contentWidth }
    );
    doc.text(
      'Ce document constitue le bon de reservation officiel pour le service VTC commande.',
      marginLeft,
      legalY + 12,
      { width: contentWidth }
    );
  }

  doc.text(
    'Annulation gratuite jusqu\'a 2 heures avant la prise en charge. ' +
    'Le chauffeur vous attendra 15 minutes gratuitement.',
    marginLeft,
    legalY + 24,
    { width: contentWidth }
  );

  doc.text(
    `Paiement accepte : Especes, Carte bancaire${country === 'CH' ? ', TWINT' : ''}.`,
    marginLeft,
    legalY + 36,
    { width: contentWidth }
  );

  // ============================================
  // PIED DE PAGE
  // ============================================

  const footerY = pageHeight - 50;

  // Ligne de separation
  doc
    .moveTo(30, footerY - 10)
    .lineTo(pageWidth - 30, footerY - 10)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(colors.muted)
    .text(
      `${company.name} | ${company.phone} | ${company.email || ''}`,
      marginLeft,
      footerY,
      { align: 'center', width: contentWidth }
    );

  doc.text(
    `Licence ${company.licenseNumber} | ${idLabel} ${company.siret}`,
    marginLeft,
    footerY + 12,
    { align: 'center', width: contentWidth }
  );

  // Finaliser le document
  doc.end();

  // Collecter le buffer
  const buffer = await collectStream(passThrough);

  // Simulation d'envoi email
  let emailSimulation;
  if (sendEmailSimulation && customer.email) {
    emailSimulation = {
      to: customer.email,
      subject: `[${company.name}] Votre bon de reservation - ${formatDateShort(pickupTime, locale)}`,
      body: `Bonjour ${customer.name},\n\n` +
        `Nous vous confirmons votre reservation VTC pour le ${formatDateTime(pickupTime, locale)}.\n\n` +
        `Depart : ${pickupAddress}\n` +
        `Arrivee : ${dropoffAddress}\n\n` +
        `Montant total : ${formatCurrency(price.totalTTC, currency)}\n\n` +
        `Votre bon de reservation est joint a cet email.\n\n` +
        `Cordialement,\n${company.name}`,
      attachmentName: `bon-reservation-${reservationId}.pdf`,
      sentAt: new Date().toISOString(),
    };

    console.log('[EMAIL SIMULATION]', JSON.stringify(emailSimulation, null, 2));
  }

  return {
    buffer,
    filePath,
    emailSimulation,
    metadata: {
      reservationId,
      generatedAt: new Date().toISOString(),
      fileSize: buffer.length,
      country,
      currency,
    },
  };
}

/**
 * Dessiner un placeholder pour le logo
 */
function drawLogoPlaceholder(doc, x, y, colors) {
  doc
    .rect(x, y, 80, 50)
    .fillColor(colors.background)
    .fill();

  doc
    .rect(x, y, 80, 50)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.muted)
    .text('LOGO', x, y + 18, { width: 80, align: 'center' });
}

// ============================================
// EXPORT SUPPLEMENTAIRE POUR EXPRESS
// ============================================

/**
 * Middleware Express pour generer et envoyer un PDF
 *
 * @example
 * app.post('/api/ticket/:id', generateTicketMiddleware(getBookingById));
 */
export function generateTicketMiddleware(getBookingFn) {
  return async (req, res, next) => {
    try {
      const bookingId = req.params.id;
      const booking = await getBookingFn(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Reservation introuvable',
          code: 'NOT_FOUND',
        });
      }

      const { buffer } = await generateTicketPDF({
        reservationId: booking.id,
        company: {
          name: process.env.COMPANY_NAME || 'Romuo VTC',
          address: process.env.COMPANY_ADDRESS || 'Rue du Lac 15, 1003 Lausanne',
          phone: process.env.COMPANY_PHONE || '+41 21 123 45 67',
          email: process.env.COMPANY_EMAIL || 'contact@romuo.ch',
          licenseNumber: process.env.COMPANY_LICENSE || 'VTC-CH-2024-001',
          siret: process.env.COMPANY_TVA || 'CHE-123.456.789 TVA',
        },
        customer: booking.customer,
        pickupTime: booking.pickupTime,
        pickupAddress: booking.origin?.address || `${booking.origin?.lat}, ${booking.origin?.lng}`,
        dropoffAddress: booking.destination?.address || `${booking.destination?.lat}, ${booking.destination?.lng}`,
        price: booking.price,
        options: {
          country: 'CH',
          currency: 'CHF',
          vehicleType: booking.vehicleType,
          passengers: booking.passengers,
        },
      });

      const filename = `bon-reservation-${bookingId.slice(0, 8)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);

    } catch (error) {
      console.error('Ticket generation error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code || 'GENERATION_ERROR',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la generation du PDF',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

export default generateTicketPDF;
