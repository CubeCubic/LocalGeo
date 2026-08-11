const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

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
    console.error("Failed to save requests:", error.message);
    return false;
  }
}

function createRequestId() {
  const number = Math.floor(100000 + Math.random() * 900000);
  return "LG-" + number;
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
    "Contact: " + (request.customer.contact || "Not provided")
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

    console.log("Viber notification sent successfully.");
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
    version: "1.0.0"
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
// GET REQUESTS
// ------------------------------------------------------------

app.get("/api/requests", (req, res) => {
  const requests = readRequests();

  res.json({
    success: true,
    count: requests.length,
    requests: requests
  });
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

    // Validation
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

    // Read existing requests
    const requests = readRequests();

    // Create request
    const newRequest = {
      id: createRequestId(),
      createdAt: new Date().toISOString(),
      status: "new",

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

    // Save
    requests.push(newRequest);

    const saved = saveRequests(requests);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: "Failed to save request."
      });
    }

    // Log
    console.log("");
    console.log("========================================");
    console.log("NEW LOCALGEO REQUEST");
    console.log("========================================");
    console.log("ID:", newRequest.id);
    console.log("Type:", newRequest.type);
    console.log("City:", newRequest.city);
    console.log("Address:", newRequest.address);
    console.log("Customer:", newRequest.customer.name);
    console.log("Email:", newRequest.customer.email);
    console.log("========================================");
    console.log("");

    // Send Viber notification
    // This does not block the request response.
    sendViberNotification(newRequest);

    // Response
    return res.status(201).json({
      success: true,
      message: "LocalGeo request received successfully.",
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
// 404
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
  console.error("Server error:", error);

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
  console.log("========================================");
  console.log("             LOCALGEO API");
  console.log("========================================");
  console.log("Server:   http://localhost:" + PORT);
  console.log("Health:   http://localhost:" + PORT + "/health");
  console.log(
    "Requests: http://localhost:" + PORT + "/api/requests"
  );
  console.log("========================================");
  console.log("");
});