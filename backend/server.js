const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

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

function readRequests() {
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

function saveRequests(requests) {
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

app.get("/api/requests", requireAdmin, (req, res) => {
  try {
    const requests = readRequests();

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

app.post("/api/requests", (req, res) => {
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

    const requests = readRequests();

    // --------------------------------------------------------
    // CREATE NEW REQUEST
    // --------------------------------------------------------

    const createdAt = new Date().toISOString();

    const newRequest = {
      id: createRequestId(),

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

    const saved = saveRequests(requests);

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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "LocalGeo request received successfully.",

      request: newRequest
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

app.patch("/api/requests/:id", requireAdmin, (req, res) => {
  try {
    const requestId = req.params.id;

    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "contacted",
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

    const requests = readRequests();

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

    const saved = saveRequests(requests);

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
// DELETE REQUEST
// ------------------------------------------------------------

app.delete("/api/requests/:id", requireAdmin, (req, res) => {
  try {
    const requestId = req.params.id;
    const requests = readRequests();
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

    if (!saveRequests(requests)) {
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
