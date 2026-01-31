// Edge function: proxies POST to serverless functions (rewrites only support GET)
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const targetPath = path.replace(/^\/api\//, "/.netlify/functions/");
  const targetUrl = new URL(targetPath + url.search, url.origin);

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
  });

  const response = await fetch(proxyRequest);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config = { path: "/api/*" };
