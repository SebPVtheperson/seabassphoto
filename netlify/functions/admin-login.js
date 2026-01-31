const { createToken } = require("./_admin-auth");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};

exports.handler = async (event) => {
  if ((event.httpMethod || "").toUpperCase() === "OPTIONS") {
    return { statusCode: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" }, body: "" };
  }

  // Accept any method - body must contain password (GET has no body, so will fail)
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const password = (body.password || "").trim();
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Admin not configured" }) };
  }

  if (password !== expected) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid password" }) };
  }

  try {
    const token = createToken();
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Server error" }) };
  }
};
