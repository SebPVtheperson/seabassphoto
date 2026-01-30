const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return { statusCode: 405, body: "" };
  }

  try {
    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("galleries")
      .select("slug, title")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const galleries = (rows || []).map((r) => ({
      slug: r.slug,
      title: r.title || r.slug,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ galleries }),
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
