const { createToken } = require("./_admin-auth");

const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

exports.handler = async (event) => {
  const method = (event.httpMethod || "").toUpperCase();
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" }, body: "" };
  }
  if (method !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed", received: method }) };
  }

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
