const crypto = require("crypto");

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function createToken() {
  const password = getAdminPassword();
  if (!password) throw new Error("ADMIN_PASSWORD not set");
  const payload = {
    exp: Date.now() + TOKEN_TTL_MS,
    iat: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", password).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifyToken(token) {
  const password = getAdminPassword();
  if (!password || !token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const expectedSig = crypto.createHmac("sha256", password).update(payloadB64).digest("base64url");
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

function getBearerToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

function requireAuth(event) {
  const token = getBearerToken(event);
  if (!verifyToken(token)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  return null;
}

module.exports = { createToken, verifyToken, getBearerToken, requireAuth };
