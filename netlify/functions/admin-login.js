const { createToken } = require("./_admin-auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const password = (body.password || "").trim();
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Admin not configured" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  if (password !== expected) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid password" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const token = createToken();
    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
