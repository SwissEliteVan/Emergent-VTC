# Sécurité & conformité RGPD (VTC France)

> **Note** : Les exemples ci-dessous sont fournis à titre informatif et ne remplacent pas un conseil juridique.

## 1. Mesures de sécurité obligatoires

### Protection contre les injections et XSS (Node.js/Express)
- **Toujours** utiliser des requêtes paramétrées/ORM et valider les entrées côté serveur.
- Échapper la sortie HTML côté serveur si vous générez des pages (ou côté client via un sanitizer).

```js
// backend/middleware/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
    },
  },
  hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "no-referrer" },
  frameguard: { action: "deny" },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const validateCreateRide = [
  body("pickup").isString().trim().isLength({ min: 3, max: 120 }),
  body("dropoff").isString().trim().isLength({ min: 3, max: 120 }),
  body("passengers").isInt({ min: 1, max: 6 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  },
];
```

### Hash des données sensibles
- **Mots de passe** : utiliser `bcrypt` (ou `argon2`) avec un coût adapté.
- **Tokens sensibles** : utiliser `crypto.scrypt` et un sel.

```js
// backend/utils/crypto.js
import bcrypt from "bcrypt";
import crypto from "node:crypto";

export async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export function hashToken(token) {
  const salt = process.env.TOKEN_SALT;
  const hash = crypto.scryptSync(token, salt, 64);
  return hash.toString("hex");
}
```

### Validation d’inputs côté serveur
- Centraliser les validateurs (ex. `express-validator`) et refuser toute requête invalide.

```js
// backend/routes/rides.js
import express from "express";
import { validateCreateRide } from "../middleware/security.js";

const router = express.Router();

router.post("/", validateCreateRide, async (req, res) => {
  // Utiliser un ORM ou des requêtes paramétrées ici
  res.status(201).json({ status: "created" });
});

export default router;
```

### Headers de sécurité HTTP (CSP, HSTS, etc.)
- Utiliser `helmet` pour CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, etc.

```js
// backend/app.js
import express from "express";
import { apiLimiter, securityHeaders } from "./middleware/security.js";

const app = express();

app.use(securityHeaders);
app.use(apiLimiter);
app.use(express.json());

export default app;
```

### Frontend : prévention XSS
- Éviter `innerHTML`, préférer `textContent`.
- Si HTML nécessaire, utiliser un sanitizer (ex. DOMPurify).

```html
<script type="module">
  import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js";

  const unsafeHtml = "<img src=x onerror=alert(1)>";
  const safe = DOMPurify.sanitize(unsafeHtml, { ALLOWED_TAGS: ["b", "i", "strong"] });
  document.querySelector("#message").innerHTML = safe;
</script>
```

## 2. Conformité RGPD

### Mentions légales obligatoires
- Identité de l’éditeur, adresse, email, SIRET, directeur de la publication, hébergeur, etc.

### Gestion des consentements cookies
- Banner de consentement (opt-in) pour cookies non essentiels.
- Journaliser le consentement (horodatage, version du texte).

```html
<div id="cookie-banner" hidden>
  <p>Nous utilisons des cookies pour améliorer l’expérience. Acceptez-vous ?</p>
  <button id="accept">Accepter</button>
  <button id="reject">Refuser</button>
</div>
<script>
  const banner = document.getElementById("cookie-banner");
  const consent = localStorage.getItem("cookie_consent");

  if (!consent) banner.hidden = false;

  document.getElementById("accept").onclick = () => {
    localStorage.setItem("cookie_consent", "accepted");
    banner.hidden = true;
  };
  document.getElementById("reject").onclick = () => {
    localStorage.setItem("cookie_consent", "rejected");
    banner.hidden = true;
  };
</script>
```

### Politique de confidentialité
Inclure :
- Finalités de traitement (réservation, facturation, support).
- Base légale (contrat, consentement, obligation légale).
- Durées de conservation.
- Sous-traitants (hébergeur, emailing).
- Droits des personnes et contact DPO.

### Droit à l’oubli et export des données
- Offrir un endpoint pour exporter et supprimer.

```js
// backend/routes/privacy.js
import express from "express";

const router = express.Router();

router.get("/export", async (req, res) => {
  const userId = req.user.id;
  const payload = { id: userId, rides: [] };
  res.json(payload);
});

router.delete("/delete", async (req, res) => {
  const userId = req.user.id;
  // Anonymiser ou supprimer selon exigences légales
  res.status(204).send();
});

export default router;
```

### Durée de conservation des données
- Définir une politique de rétention (ex. : 5 ans pour factures, 3 ans pour marketing). Proposer une purge automatisée.

```js
// backend/jobs/retention.js
import { purgeOldData } from "../services/retention.js";

export async function runRetentionJob() {
  await purgeOldData({ marketingDays: 365 * 3, billingDays: 365 * 5 });
}
```

## 3. Sécurité des paiements (si ajout futur)

### Conformité PCI DSS niveau 4
- **Ne jamais stocker** de données de carte.
- Utiliser des solutions hébergées (Stripe Checkout, SumUp Hosted).

### Intégration Stripe/SumUp sécurisée

```js
// backend/routes/payments.js
import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: req.body.priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
  });

  res.json({ url: session.url });
});

export default router;
```

```js
// backend/routes/webhooks.js
import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/stripe", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  // Journaliser l’événement
  res.json({ received: true });
});

export default router;
```

### Journalisation des transactions
- Journaliser **qui** a payé, **quand**, **montant**, **statut**, **ID transaction**, sans données carte.

## 4. Protection des données clients

### Chiffrement des données au repos
- Chiffrement côté base (ex. MongoDB encryption) ou chiffrement applicatif.

```js
// backend/utils/encryption.js
import crypto from "node:crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY, "hex");

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload) {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
```

### Backup sécurisé
- Sauvegardes chiffrées, stockées hors site, rotation et accès restreint.

```bash
# Exemple de sauvegarde MongoDB + chiffrement avec OpenSSL
mongodump --archive | openssl enc -aes-256-cbc -salt -out backup.enc
```

### Procédure en cas de fuite de données
- Détection, containment, analyse d’impact, notification CNIL < 72h si nécessaire.
- Informer les utilisateurs affectés si risque élevé.
- Tenir un registre des incidents.

```
Checklist interne (exemple) :
1) Isoler l’incident
2) Identifier les données impactées
3) Révocation des secrets et rotation clés
4) Notifier DPO/CNIL si requis
5) Communication utilisateurs
6) Post-mortem et correctifs
```
