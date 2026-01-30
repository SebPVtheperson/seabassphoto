const { createClient } = require("@supabase/supabase-js");
const { requireAuth } = require("./_admin-auth");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

function json(data, status = 200) {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}

exports.handler = async (event) => {
  const authError = requireAuth(event);
  if (authError) return authError;

  const method = event.httpMethod;
  const supabase = getSupabase();

  try {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, slug, title, is_public, codeword, images, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json({ galleries: data || [] });
    }

    if (method === "POST") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const { slug, title, is_public, codeword, images } = body;
      if (!slug || !title) {
        return json({ error: "slug and title required" }, 400);
      }
      const row = {
        slug: String(slug).trim().toLowerCase().replace(/\s+/g, "-"),
        title: String(title).trim(),
        is_public: !!is_public,
        codeword: is_public ? null : (codeword || "").trim() || null,
        images: Array.isArray(images) ? images : [],
      };
      const { data, error } = await supabase.from("galleries").insert(row).select().single();
      if (error) throw error;
      return json({ gallery: data });
    }

    if (method === "PATCH") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const { id, slug, title, is_public, codeword, images } = body;
      if (!id) return json({ error: "id required" }, 400);

      const updates = {};
      if (slug !== undefined) updates.slug = String(slug).trim().toLowerCase().replace(/\s+/g, "-");
      if (title !== undefined) updates.title = String(title).trim();
      if (is_public !== undefined) {
        updates.is_public = !!is_public;
        if (is_public) updates.codeword = null;
      }
      if (codeword !== undefined && updates.codeword === undefined) updates.codeword = (codeword || "").trim() || null;
      if (images !== undefined) updates.images = Array.isArray(images) ? images : [];

      const { data, error } = await supabase.from("galleries").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return json({ gallery: data });
    }

    if (method === "DELETE") {
      const id = event.queryStringParameters?.id;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await supabase.from("galleries").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }

    return { statusCode: 405, body: "" };
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "Server error" }, 500);
  }
};
