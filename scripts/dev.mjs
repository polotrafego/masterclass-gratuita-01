/**
 * Servidor local: serve `public/` e roteia /masterclass/api/* para api/*.js,
 * imitando o que a Vercel faz. Sem dependências.
 *
 *   npm run dev            → http://localhost:5310/masterclass
 *   MOCK_LEAD=1 npm run dev → a API responde ok sem chamar o LeadLovers
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const pub = join(raiz, "public");
const porta = Number(process.env.PORT || 5310);
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".json": "application/json" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let caminho = decodeURIComponent(url.pathname);

  const api = caminho.match(/^\/(?:masterclass\/)?api\/([\w-]+)$/);
  if (api) {
    let corpo = "";
    for await (const parte of req) corpo += parte;
    const resposta = {
      statusCode: 200,
      setHeader: (k, v) => res.setHeader(k, v),
      status(c) { this.statusCode = c; return this; },
      json(o) { res.writeHead(this.statusCode, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); },
    };
    if (process.env.MOCK_LEAD) {
      await new Promise((r) => setTimeout(r, 700));
      return resposta.json({ ok: true, mock: true });
    }
    const { default: handler } = await import(`../api/${api[1]}.js?t=${Date.now()}`);
    return handler({ method: req.method, body: corpo, headers: req.headers }, resposta);
  }

  if (caminho === "/") { res.writeHead(302, { Location: "/masterclass" }); return res.end(); }
  let arquivo = normalize(join(pub, caminho));
  if (!arquivo.startsWith(pub)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(arquivo)).isDirectory()) arquivo = join(arquivo, "index.html");
  } catch {
    arquivo += ".html";
  }
  try {
    const dados = await readFile(arquivo);
    res.writeHead(200, { "Content-Type": tipos[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(dados);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404");
  }
}).listen(porta, () => console.log(`Masterclass em http://localhost:${porta}/masterclass`));
