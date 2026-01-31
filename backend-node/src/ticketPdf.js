import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const REQUIRED_FIELDS = [
  "company.name",
  "company.address",
  "company.phone",
  "company.licenseNumber",
  "company.siret",
  "customer.name",
  "customer.phone",
  "pickupTime",
  "pickupAddress",
  "dropoffAddress",
  "price.totalTTC"
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value));

const formatDateTimeExact = (value) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "medium"
  }).format(new Date(value));

const collectStream = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

const validateTicketData = (payload) => {
  const missing = [];

  for (const field of REQUIRED_FIELDS) {
    const parts = field.split(".");
    let cursor = payload;
    for (const part of parts) {
      cursor = cursor?.[part];
    }

    if (cursor === undefined || cursor === null || cursor === "") {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const error = new Error(
      `Champs obligatoires manquants: ${missing.map((item) => item).join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }
};

const buildPriceLines = (price) => {
  const lines = [];
  if (price.details?.length) {
    price.details.forEach((detail) => {
      if (detail?.label && detail?.amount !== undefined) {
        lines.push(`${detail.label} : ${formatCurrency(detail.amount)}`);
      }
    });
  }

  if (lines.length === 0) {
    if (price.base !== undefined) {
      lines.push(`Forfait de base : ${formatCurrency(price.base)}`);
    }
    if (price.distance !== undefined) {
      lines.push(`Distance : ${formatCurrency(price.distance)}`);
    }
    if (price.duration !== undefined) {
      lines.push(`Temps : ${formatCurrency(price.duration)}`);
    }
  }

  lines.push(`Total TTC : ${formatCurrency(price.totalTTC)}`);
  return lines;
};

export async function generateTicketPDF({
  reservationId,
  company,
  customer,
  pickupTime,
  pickupAddress,
  dropoffAddress,
  price,
  outputDir,
  saveToDisk = false,
  sendEmailSimulation = false,
  logoPath,
  notes
}) {
  validateTicketData({
    company,
    customer,
    pickupTime,
    pickupAddress,
    dropoffAddress,
    price
  });

  const qrPayload = {
    reservationId,
    companyName: company.name,
    customerName: customer.name,
    customerPhone: customer.phone,
    pickupTime,
    pickupAddress,
    dropoffAddress,
    priceTTC: price.totalTTC
  };

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const passThrough = new PassThrough();
  doc.pipe(passThrough);

  let filePath;
  if (saveToDisk) {
    fs.mkdirSync(outputDir, { recursive: true });
    filePath = path.join(outputDir, `bon-reservation-${reservationId}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));
  }

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

  doc.rect(30, 30, pageWidth + 40, pageHeight + 40).lineWidth(1).stroke("#1f2937");

  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 80 });
  } else {
    doc
      .rect(50, 45, 80, 50)
      .lineWidth(1)
      .stroke("#9ca3af")
      .fontSize(10)
      .fillColor("#6b7280")
      .text("LOGO", 50, 63, { width: 80, align: "center" });
  }

  doc
    .fillColor("#111827")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Bon de Réservation VTC", 150, 50, { align: "right" })
    .moveDown(0.5)
    .fontSize(12)
    .font("Helvetica")
    .text(`Conforme à l'article L. 3142-1 du code des transports`, {
      align: "right"
    });

  doc.moveDown(1.5);

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Entreprise VTC", { underline: true })
    .moveDown(0.3)
    .fontSize(11)
    .font("Helvetica")
    .text(company.name)
    .text(company.address)
    .text(`Téléphone : ${company.phone}`)
    .text(`Email : ${company.email || "contact@vtc.fr"}`)
    .text(`Licence VTC : ${company.licenseNumber}`)
    .text(`SIRET : ${company.siret}`);

  doc.moveDown();

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Client", { underline: true })
    .moveDown(0.3)
    .fontSize(11)
    .font("Helvetica")
    .text(`Nom : ${customer.name}`)
    .text(`Téléphone : ${customer.phone}`)
    .text(`Email : ${customer.email || "Non renseigné"}`);

  doc.moveDown();

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Course", { underline: true })
    .moveDown(0.3)
    .fontSize(11)
    .font("Helvetica")
    .text(`Date/heure exacte de prise en charge : ${formatDateTimeExact(pickupTime)}`)
    .text(`Adresse de départ : ${pickupAddress}`)
    .text(`Adresse d'arrivée : ${dropoffAddress}`);

  doc.moveDown();

  doc.fontSize(13).font("Helvetica-Bold").text("Prix TTC détaillé", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica");
  buildPriceLines(price).forEach((line) => doc.text(line));

  if (notes) {
    doc.moveDown();
    doc.fontSize(11).fillColor("#4b5563").text(notes);
    doc.fillColor("#111827");
  }

  doc
    .image(qrBuffer, doc.page.width - 170, doc.page.height - 220, {
      width: 120
    })
    .fontSize(9)
    .fillColor("#6b7280")
    .text("QR code de réservation", doc.page.width - 180, doc.page.height - 90, {
      width: 140,
      align: "center"
    });

  doc
    .fontSize(10)
    .fillColor("#111827")
    .text(
      `Document généré le ${new Date().toLocaleString("fr-FR")} - Bon de réservation officiel.`,
      50,
      doc.page.height - 70,
      { align: "left" }
    );

  doc.end();

  const buffer = await collectStream(passThrough);

  let emailSimulation;
  if (sendEmailSimulation) {
    emailSimulation = {
      to: customer.email || "client@exemple.fr",
      subject: "Votre bon de réservation VTC",
      message: "Envoi simulé du bon de réservation PDF."
    };
    console.log("[EMAIL SIMULATION]", emailSimulation);
  }

  return { buffer, filePath, emailSimulation };
}
