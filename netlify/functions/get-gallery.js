const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "" };
  }

  const params = event.queryStringParameters || {};
  const slug = (params.gallery || params.slug || "").trim();
  const code = (params.code || "").trim();

  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Gallery slug required" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const supabase = getSupabase();
    const { data: gallery, error } = await supabase
      .from("galleries")
      .select("slug, title, is_public, codeword, images")
      .eq("slug", slug)
      .single();

    if (error || !gallery) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Gallery not found" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    if (gallery.is_public) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          title: gallery.title || gallery.slug,
          images: gallery.images || [],
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    if (!code || code !== gallery.codeword) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Access denied" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title: gallery.title || gallery.slug,
        images: gallery.images || [],
      }),
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
