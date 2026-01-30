const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

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

  const code = (body.code || "").trim();
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: "Code required" }) };
  }

  try {
    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("galleries")
      .select("slug, title")
      .eq("is_public", false)
      .eq("codeword", code);

    if (error) {
      console.error("Supabase error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    if (!rows || rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ valid: false, error: "Invalid code" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const galleries = rows.map((r) => ({ slug: r.slug, title: r.title || r.slug }));

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, galleries }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
