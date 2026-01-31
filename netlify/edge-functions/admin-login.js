// Edge Function: handles admin login directly (avoids 405 on POST with serverless)
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache",
};

function b64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createToken(password) {
  const payload = { exp: Date.now() + TOKEN_TTL_MS, iat: Date.now() };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: CORS,
    });
  }

  const expected = Deno.env.get("ADMIN_PASSWORD") || "";
  if (!expected) {
    return new Response(JSON.stringify({ error: "Admin not configured" }), {
      status: 500,
      headers: CORS,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: CORS,
    });
  }

  const password = (body.password || "").trim();
  if (password !== expected) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: CORS,
    });
  }

  try {
    const token = await createToken(expected);
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: CORS,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: CORS,
    });
  }
};

export const config = { path: "/api/admin-login" };
