const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");
let databasePool = null;

// ------------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------------

app.use(cors());

app.use(express.json());

// ------------------------------------------------------------
// DATA STORAGE
// ------------------------------------------------------------

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function readLegacyRequests() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read requests:", error.message);

    return [];
  }
}

function saveLegacyRequests(requests) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(requests, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to save requests:",
      error.message
    );

    return false;
  }
}

function createRequestId() {
  const number = Math.floor(
    100000 + Math.random() * 900000
  );

  return "LG-" + number;
}

function createTrackingKey() {
  return crypto.randomBytes(32).toString("hex");
}

function hashTrackingKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function hasValidTrackingKey(request, key) {
  const expectedHash = request?.trackingKeyHash;

  if (!expectedHash || !key || !/^[a-f0-9]{64}$/i.test(key)) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashTrackingKey(key), "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function getPublicRequest(request) {
  const allowedTimelineTypes = new Set(["created", "status_changed"]);

  return {
    id: request.id,
    type: request.type,
    city: request.city,
    timing: request.timing,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    timeline: Array.isArray(request.timeline)
      ? request.timeline
        .filter((event) => allowedTimelineTypes.has(event.type))
        .map((event) => ({
          type: event.type,
          status: event.status,
          occurredAt: event.occurredAt
        }))
      : []
  };
}

async function initializeStorage() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured. Using local file storage.");
    return;
  }

  databasePool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await databasePool.query(`
    CREATE INDEX IF NOT EXISTS requests_created_at_idx
    ON requests (created_at DESC)
  `);

  const legacyRequests = readLegacyRequests();

  for (const request of legacyRequests) {
    if (!request?.id) {
      continue;
    }

    await databasePool.query(
      `INSERT INTO requests (id, data, created_at, updated_at)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [
        request.id,
        JSON.stringify(request),
        request.createdAt || new Date().toISOString(),
        request.updatedAt || request.createdAt || new Date().toISOString()
      ]
    );
  }

  console.log("PostgreSQL storage is ready.");
}

async function readRequests() {
  if (!databasePool) {
    return readLegacyRequests();
  }

  const result = await databasePool.query(
    "SELECT data FROM requests ORDER BY created_at DESC"
  );

  return result.rows.map((row) => row.data);
}

async function saveRequests(requests) {
  if (!databasePool) {
    return saveLegacyRequests(requests);
  }

  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    for (const request of requests) {
      await client.query(
        `INSERT INTO requests (id, data, created_at, updated_at)
         VALUES ($1, $2::jsonb, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           data = EXCLUDED.data,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [
          request.id,
          JSON.stringify(request),
          request.createdAt || new Date().toISOString(),
          request.updatedAt || request.createdAt || new Date().toISOString()
        ]
      );
    }

    const requestIds = requests.map((request) => request.id);

    if (requestIds.length) {
      await client.query(
        "DELETE FROM requests WHERE NOT (id = ANY($1::text[]))",
        [requestIds]
      );
    } else {
      await client.query("DELETE FROM requests");
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to save requests:", error.message);
    return false;
  } finally {
    client.release();
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      expiresAt: Date.now() + ADMIN_TOKEN_TTL_MS
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function isValidAdminToken(token) {
  if (!token || !process.env.ADMIN_TOKEN_SECRET) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return data.role === "admin" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function hasMatchingAdminPassword(password) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || typeof password !== "string") {
    return false;
  }

  const provided = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

function requireAdmin(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !isValidAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication is required."
    });
  }

  return next();
}

// ------------------------------------------------------------
// VIBER NOTIFICATION
// ------------------------------------------------------------

async function sendViberNotification(request) {
  const token = process.env.VIBER_AUTH_TOKEN;
  const receiver = process.env.VIBER_RECEIVER_ID;

  if (!token || !receiver) {
    console.log(
      "Viber notification skipped: credentials not configured."
    );

    return;
  }

  const message = [
    "NEW LOCALGEO REQUEST",
    "",
    "ID: " + request.id,
    "Type: " + request.type,
    "City: " + request.city,
    "Timing: " + request.timing,
    "",
    "Address: " + request.address,
    "",
    "Description: " + request.description,
    "",
    "Customer: " + request.customer.name,
    "Email: " + request.customer.email,
    "Contact: " +
      (request.customer.contact || "Not provided")
  ].join("\n");

  try {
    const response = await fetch(
      "https://chatapi.viber.com/pa/send_message",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Viber-Auth-Token": token
        },

        body: JSON.stringify({
          receiver: receiver,
          type: "text",
          text: message
        })
      }
    );

    const result = await response.json();

    if (result.status !== 0) {
      console.error("Viber API error:", result);

      return;
    }

    console.log(
      "Viber notification sent successfully."
    );
  } catch (error) {
    console.error(
      "Viber notification failed:",
      error.message
    );
  }
}

// ------------------------------------------------------------
// EMAIL NOTIFICATION
// ------------------------------------------------------------

async function sendEmailNotification(request) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.NOTIFICATION_EMAIL;
  const sender = process.env.EMAIL_FROM;

  if (!apiKey || !recipient || !sender) {
    console.log("Email notification skipped: not configured.");
    return;
  }

  const adminUrl = "https://cubecubic.github.io/LocalGeo/admin/";
  const customer = request.customer || {};
  const subject = `New LocalGeo request — ${request.id}`;
  const text = [
    "NEW LOCALGEO REQUEST",
    "",
    `ID: ${request.id}`,
    `Type: ${request.type}`,
    `City: ${request.city}`,
    `Timing: ${request.timing}`,
    "",
    `Address: ${request.address}`,
    `Description: ${request.description}`,
    "",
    `Customer: ${customer.name || "Not provided"}`,
    `Email: ${customer.email || "Not provided"}`,
    `Contact: ${customer.contact || "Not provided"}`,
    "",
    `Admin Inbox: ${adminUrl}`
  ].join("\n");
  const html = `
    <h2>New LocalGeo request</h2>
    <p><strong>ID:</strong> ${escapeHtml(request.id)}</p>
    <p><strong>Type:</strong> ${escapeHtml(request.type)}<br />
    <strong>City:</strong> ${escapeHtml(request.city)}<br />
    <strong>Timing:</strong> ${escapeHtml(request.timing)}</p>
    <p><strong>Address</strong><br />${escapeHtml(request.address)}</p>
    <p><strong>Description</strong><br />${escapeHtml(request.description)}</p>
    <p><strong>Customer:</strong> ${escapeHtml(customer.name)}<br />
    <strong>Email:</strong> ${escapeHtml(customer.email)}<br />
    <strong>Contact:</strong> ${escapeHtml(customer.contact || "Not provided")}</p>
    <p><a href="${adminUrl}">Open Admin Inbox</a></p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `localgeo-request-${request.id}`
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: subject,
        text: text,
        html: html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Email notification failed:", result);
      return;
    }

    console.log("Email notification sent:", result.id);
  } catch (error) {
    console.error("Email notification failed:", error.message);
  }
}

// ------------------------------------------------------------
// CUSTOMER EMAIL CONFIRMATION
// ------------------------------------------------------------

async function sendCustomerConfirmation(request) {
  if (process.env.SEND_CUSTOMER_CONFIRMATIONS !== "true") {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM;
  const customer = request.customer || {};

  if (!apiKey || !sender || !customer.email) {
    console.log("Customer confirmation skipped: not configured.");
    return;
  }

  const subject = `We received your LocalGeo request — ${request.id}`;
  const text = [
    `Hello ${customer.name || "there"},`,
    "",
    "We received your LocalGeo request and will review it shortly.",
    "We will contact you to confirm availability and pricing before any work is scheduled.",
    "",
    `Request ID: ${request.id}`,
    `Service: ${request.type}`,
    `City: ${request.city}`,
    `Timing: ${request.timing}`,
    `Address: ${request.address}`,
    `Description: ${request.description}`,
    "",
    "LocalGeo"
  ].join("\n");
  const html = `
    <h2>We received your request</h2>
    <p>Hello ${escapeHtml(customer.name || "there")},</p>
    <p>We will review your request and contact you to confirm availability and pricing before any work is scheduled.</p>
    <p><strong>Request ID:</strong> ${escapeHtml(request.id)}<br />
    <strong>Service:</strong> ${escapeHtml(request.type)}<br />
    <strong>City:</strong> ${escapeHtml(request.city)}<br />
    <strong>Timing:</strong> ${escapeHtml(request.timing)}</p>
    <p><strong>Address</strong><br />${escapeHtml(request.address)}</p>
    <p><strong>Description</strong><br />${escapeHtml(request.description)}</p>
    <p>LocalGeo</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `localgeo-customer-confirmation-${request.id}`
      },
      body: JSON.stringify({
        from: sender,
        to: [customer.email],
        subject,
        text,
        html
      })
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Customer confirmation failed:", result);
      return;
    }

    console.log("Customer confirmation sent:", result.id);
  } catch (error) {
    console.error("Customer confirmation failed:", error.message);
  }
}

// ------------------------------------------------------------
// ROOT
// ------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    service: "LocalGeo API",
    status: "online",
    version: "1.1.0"
  });
});

// ------------------------------------------------------------
// HEALTH CHECK
// ------------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    storage: databasePool ? "postgresql" : "file",
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// ADMIN LOGIN
// ------------------------------------------------------------

app.post("/api/admin/login", (req, res) => {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOKEN_SECRET) {
    console.error("Admin authentication is not configured.");

    return res.status(503).json({
      success: false,
      error: "Admin authentication is not configured."
    });
  }

  if (!hasMatchingAdminPassword(req.body?.password)) {
    return res.status(401).json({
      success: false,
      error: "Incorrect password."
    });
  }

  return res.json({
    success: true,
    token: createAdminToken(),
    expiresIn: ADMIN_TOKEN_TTL_MS / 1000
  });
});

// ------------------------------------------------------------
// GET ALL REQUESTS
// ------------------------------------------------------------

app.get("/api/requests", requireAdmin, async (req, res) => {
  try {
    const requests = await readRequests();

    res.json({
      success: true,
      count: requests.length,
      requests: requests
    });
  } catch (error) {
    console.error(
      "Failed to get requests:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to load requests."
    });
  }
});

// ------------------------------------------------------------
// CREATE REQUEST
// ------------------------------------------------------------

app.get("/api/track/:id", async (req, res) => {
  try {
    const requestId = req.params.id;
    const trackingKey = typeof req.query.key === "string"
      ? req.query.key
      : "";
    const requests = await readRequests();
    const request = requests.find((item) => item.id === requestId);

    if (!request || !hasValidTrackingKey(request, trackingKey)) {
      return res.status(404).json({
        success: false,
        error: "Request not found."
      });
    }

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      request: getPublicRequest(request)
    });
  } catch (error) {
    console.error("Failed to load public request status:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to load the request status."
    });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const {
      type,
      city,
      address,
      description,
      timing,
      name,
      email,
      contact
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !type ||
      !city ||
      !address ||
      !description ||
      !name ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing."
      });
    }

    // --------------------------------------------------------
    // READ EXISTING REQUESTS
    // --------------------------------------------------------

    const requests = await readRequests();

    // --------------------------------------------------------
    // CREATE NEW REQUEST
    // --------------------------------------------------------

    const createdAt = new Date().toISOString();
    const trackingKey = createTrackingKey();

    const newRequest = {
      id: createRequestId(),

      trackingKeyHash: hashTrackingKey(trackingKey),

      createdAt: createdAt,

      updatedAt: createdAt,

      status: "new",

      timeline: [
        {
          type: "created",
          status: "new",
          occurredAt: createdAt
        }
      ],

      type: type,

      city: city,

      address: address,

      description: description,

      timing: timing || "As soon as possible",

      customer: {
        name: name,

        email: email,

        contact: contact || ""
      }
    };

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    requests.push(newRequest);

    const saved = await saveRequests(requests);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: "Failed to save request."
      });
    }

    // --------------------------------------------------------
    // SERVER LOG
    // --------------------------------------------------------

    console.log("");

    console.log(
      "========================================"
    );

    console.log("NEW LOCALGEO REQUEST");

    console.log(
      "========================================"
    );

    console.log("ID:", newRequest.id);

    console.log("Type:", newRequest.type);

    console.log("City:", newRequest.city);

    console.log("Address:", newRequest.address);

    console.log(
      "Customer:",
      newRequest.customer.name
    );

    console.log(
      "Email:",
      newRequest.customer.email
    );

    console.log(
      "========================================"
    );

    console.log("");

    // --------------------------------------------------------
    // VIBER NOTIFICATION
    // --------------------------------------------------------

    sendViberNotification(newRequest);

    sendEmailNotification(newRequest);

    sendCustomerConfirmation(newRequest);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "LocalGeo request received successfully.",

      request: {
        ...newRequest,
        trackingKey: trackingKey
      }
    });
  } catch (error) {
    console.error(
      "Unexpected error while creating request:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// ------------------------------------------------------------
// UPDATE REQUEST STATUS
// ------------------------------------------------------------

app.patch("/api/requests/:id", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;

    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "contacted",
      "assigned",
      "in_progress",
      "completed",
      "cancelled"
    ];

    // --------------------------------------------------------
    // VALIDATE STATUS
    // --------------------------------------------------------

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status."
      });
    }

    // --------------------------------------------------------
    // READ REQUESTS
    // --------------------------------------------------------

    const requests = await readRequests();

    // --------------------------------------------------------
    // FIND REQUEST
    // --------------------------------------------------------

    const requestIndex = requests.findIndex(
      (request) => request.id === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Request not found."
      });
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    const request = requests[requestIndex];
    const updatedAt = new Date().toISOString();

    if (!Array.isArray(request.timeline)) {
      request.timeline = [
        {
          type: "created",
          status: "new",
          occurredAt: request.createdAt
        }
      ];
    }

    if (request.status !== status) {
      request.status = status;
      request.timeline.push({
        type: "status_changed",
        status: status,
        occurredAt: updatedAt
      });
    }

    request.updatedAt = updatedAt;

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    const saved = await saveRequests(requests);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: "Failed to update request."
      });
    }

    // --------------------------------------------------------
    // LOG
    // --------------------------------------------------------

    console.log("");

    console.log(
      "LOCALGEO REQUEST UPDATED"
    );

    console.log(
      "ID:",
      requests[requestIndex].id
    );

    console.log(
      "Status:",
      requests[requestIndex].status
    );

    console.log("");

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,

      message:
        "Request status updated.",

      request: requests[requestIndex]
    });
  } catch (error) {
    console.error(
      "Failed to update request:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// ------------------------------------------------------------
// ASSIGN OPERATION DETAILS
// ------------------------------------------------------------

app.put("/api/requests/:id/assignment", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const assignee = typeof req.body?.assignee === "string"
      ? req.body.assignee.trim()
      : "";
    const operatorNote = typeof req.body?.operatorNote === "string"
      ? req.body.operatorNote.trim()
      : "";
    const currency = typeof req.body?.currency === "string"
      ? req.body.currency.trim().toUpperCase()
      : "GEL";
    const rawClientPrice = req.body?.clientPrice ?? req.body?.price;
    const clientPrice = rawClientPrice === "" || rawClientPrice === null || rawClientPrice === undefined
      ? null
      : Number(rawClientPrice);
    const rawOperatorPayout = req.body?.operatorPayout;
    const operatorPayout = rawOperatorPayout === "" || rawOperatorPayout === null || rawOperatorPayout === undefined
      ? null
      : Number(rawOperatorPayout);
    const rawJobExpenses = req.body?.jobExpenses;
    const jobExpenses = rawJobExpenses === "" || rawJobExpenses === null || rawJobExpenses === undefined
      ? null
      : Number(rawJobExpenses);
    const clientPaymentStatus = req.body?.clientPaymentStatus || "unpaid";
    const operatorPaymentStatus = req.body?.operatorPaymentStatus || "unpaid";

    if (!assignee) {
      return res.status(400).json({
        success: false,
        error: "An assignee is required."
      });
    }

    if (assignee.length > 120 || operatorNote.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Assignment details are too long."
      });
    }

    if (!Number.isFinite(clientPrice) && clientPrice !== null) {
      return res.status(400).json({
        success: false,
        error: "Client price must be a number."
      });
    }

    if (!Number.isFinite(operatorPayout) && operatorPayout !== null) {
      return res.status(400).json({
        success: false,
        error: "Operator payout must be a number."
      });
    }

    if (!Number.isFinite(jobExpenses) && jobExpenses !== null) {
      return res.status(400).json({
        success: false,
        error: "Job expenses must be a number."
      });
    }

    if (
      (clientPrice !== null && clientPrice < 0) ||
      (operatorPayout !== null && operatorPayout < 0) ||
      (jobExpenses !== null && jobExpenses < 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "Amounts cannot be negative."
      });
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return res.status(400).json({
        success: false,
        error: "Currency must be a three-letter code."
      });
    }

    if (
      !["unpaid", "paid"].includes(clientPaymentStatus) ||
      !["unpaid", "paid"].includes(operatorPaymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment status."
      });
    }

    const requests = await readRequests();
    const requestIndex = requests.findIndex(
      (request) => request.id === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Request not found."
      });
    }

    const request = requests[requestIndex];
    const updatedAt = new Date().toISOString();

    if (!Array.isArray(request.timeline)) {
      request.timeline = [{
        type: "created",
        status: "new",
        occurredAt: request.createdAt
      }];
    }

    const nextAssignment = {
      assignee: assignee,
      clientPrice: clientPrice,
      operatorPayout: operatorPayout,
      jobExpenses: jobExpenses,
      margin: clientPrice !== null && operatorPayout !== null && jobExpenses !== null
        ? clientPrice - operatorPayout - jobExpenses
        : null,
      currency: currency,
      clientPaymentStatus: clientPaymentStatus,
      operatorPaymentStatus: operatorPaymentStatus,
      operatorNote: operatorNote,
      updatedAt: updatedAt
    };

    const currentAssignment = request.assignment || {};
    const previousClientPrice = currentAssignment.clientPrice ?? currentAssignment.price ?? null;
    const previousClientPaymentStatus =
      currentAssignment.clientPaymentStatus || "unpaid";
    const previousOperatorPaymentStatus =
      currentAssignment.operatorPaymentStatus || "unpaid";
    request.assignment = nextAssignment;

    if (currentAssignment.assignee !== nextAssignment.assignee) {
      request.timeline.push({
        type: "executor_assigned",
        assignee: nextAssignment.assignee,
        occurredAt: updatedAt
      });
    }

    if (previousClientPrice !== nextAssignment.clientPrice) {
      request.timeline.push({
        type: "client_price_updated",
        clientPrice: nextAssignment.clientPrice,
        currency: nextAssignment.currency,
        occurredAt: updatedAt
      });
    }

    if ((currentAssignment.operatorPayout ?? null) !== nextAssignment.operatorPayout) {
      request.timeline.push({
        type: "executor_payout_updated",
        operatorPayout: nextAssignment.operatorPayout,
        currency: nextAssignment.currency,
        occurredAt: updatedAt
      });
    }

    if ((currentAssignment.jobExpenses ?? null) !== nextAssignment.jobExpenses) {
      request.timeline.push({
        type: "job_expenses_updated",
        jobExpenses: nextAssignment.jobExpenses,
        currency: nextAssignment.currency,
        occurredAt: updatedAt
      });
    }

    if ((currentAssignment.currency || "GEL") !== nextAssignment.currency) {
      request.timeline.push({
        type: "currency_updated",
        currency: nextAssignment.currency,
        occurredAt: updatedAt
      });
    }

    if ((currentAssignment.operatorNote || "") !== nextAssignment.operatorNote) {
      request.timeline.push({
        type: "executor_instructions_updated",
        operatorNote: nextAssignment.operatorNote,
        occurredAt: updatedAt
      });
    }

    if (
      previousClientPaymentStatus !== nextAssignment.clientPaymentStatus
    ) {
      request.timeline.push({
        type: nextAssignment.clientPaymentStatus === "paid"
          ? "client_paid"
          : "client_payment_marked_unpaid",
        occurredAt: updatedAt
      });
    }

    if (
      previousOperatorPaymentStatus !== nextAssignment.operatorPaymentStatus
    ) {
      request.timeline.push({
        type: nextAssignment.operatorPaymentStatus === "paid"
          ? "executor_paid"
          : "executor_payment_marked_unpaid",
        occurredAt: updatedAt
      });
    }

    if (request.status !== "assigned") {
      request.status = "assigned";
      request.timeline.push({
        type: "status_changed",
        status: "assigned",
        occurredAt: updatedAt
      });
    }

    request.updatedAt = updatedAt;

    if (!await saveRequests(requests)) {
      return res.status(500).json({
        success: false,
        error: "Failed to save assignment."
      });
    }

    return res.json({
      success: true,
      message: "Assignment saved.",
      request: request
    });
  } catch (error) {
    console.error("Failed to save assignment:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// ------------------------------------------------------------
// ADD TIMELINE NOTE
// ------------------------------------------------------------

app.post("/api/requests/:id/timeline", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const note = typeof req.body?.note === "string"
      ? req.body.note.trim()
      : "";
    const proofUrl = typeof req.body?.proofUrl === "string"
      ? req.body.proofUrl.trim()
      : "";

    if (!note) {
      return res.status(400).json({
        success: false,
        error: "A timeline note is required."
      });
    }

    if (note.length > 1000 || proofUrl.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "The timeline entry is too long."
      });
    }

    if (proofUrl && !/^https?:\/\//i.test(proofUrl)) {
      return res.status(400).json({
        success: false,
        error: "Proof link must start with http:// or https:// ."
      });
    }

    const requests = await readRequests();
    const requestIndex = requests.findIndex(
      (request) => request.id === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Request not found."
      });
    }

    const request = requests[requestIndex];
    const occurredAt = new Date().toISOString();

    if (!Array.isArray(request.timeline)) {
      request.timeline = [
        {
          type: "created",
          status: "new",
          occurredAt: request.createdAt
        }
      ];
    }

    request.timeline.push({
      type: "note",
      note: note,
      proofUrl: proofUrl || undefined,
      occurredAt: occurredAt
    });
    request.updatedAt = occurredAt;

    if (!await saveRequests(requests)) {
      return res.status(500).json({
        success: false,
        error: "Failed to save timeline entry."
      });
    }

    return res.status(201).json({
      success: true,
      message: "Timeline entry added.",
      request: request
    });
  } catch (error) {
    console.error("Failed to add timeline entry:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// ------------------------------------------------------------
// DELETE REQUEST
// ------------------------------------------------------------

app.delete("/api/requests/:id", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const requests = await readRequests();
    const requestIndex = requests.findIndex(
      (request) => request.id === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Request not found."
      });
    }

    requests.splice(requestIndex, 1);

    if (!await saveRequests(requests)) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete request."
      });
    }

    console.log("LOCALGEO REQUEST DELETED:", requestId);

    return res.json({
      success: true,
      message: "Request deleted."
    });
  } catch (error) {
    console.error("Failed to delete request:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// ------------------------------------------------------------
// 404 HANDLER
// ------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found."
  });
});

// ------------------------------------------------------------
// ERROR HANDLER
// ------------------------------------------------------------

app.use((error, req, res, next) => {
  console.error(
    "Server error:",
    error
  );

  res.status(500).json({
    success: false,
    error: "Internal server error."
  });
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------

async function startServer() {
  try {
    await initializeStorage();
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "             LOCALGEO API"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Server:   http://localhost:" + PORT
  );

  console.log(
    "Health:   http://localhost:" +
      PORT +
      "/health"
  );

  console.log(
    "Requests: http://localhost:" +
      PORT +
      "/api/requests"
  );

  console.log(
    "========================================"
  );

  console.log("");
  });
}

startServer();
