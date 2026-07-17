import handler from "./server.js";

export default async function vercelHandler(req, res) {
  // Build a Web API Request from the Vercel IncomingMessage
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, `${proto}://${host}`);

  const init = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await streamToBuffer(req);
    init.duplex = "half";
  }

  const webReq = new Request(url.toString(), init);
  const webRes = await handler.fetch(webReq);

  res.statusCode = webRes.status;
  for (const [key, value] of webRes.headers.entries()) {
    res.setHeader(key, value);
  }

  const body = await webRes.arrayBuffer();
  res.end(Buffer.from(body));
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
