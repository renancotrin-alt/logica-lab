import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Lógica Lab tutor", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Lógica Lab — Pense, teste, aprenda<\/title>/i);
  assert.match(html, /NÓ \/ TUTOR DE RACIOCÍNIO/);
  assert.match(html, /Exemplo ou teste\?/);
  assert.match(html, /Explique meu código/);
  assert.match(html, /Editor de Lógica pura/);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("keeps contextual tutoring and safe chat scrolling", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function buildTutorAnswer\(/);
  assert.match(page, /Não: o código do triplo é um EXEMPLO parecido/);
  assert.match(page, /Você não deve escrever 2 \+ 2/);
  assert.match(page, /describeCodeState\(code, language, lesson\)/);
  assert.match(page, /className="answer-line-highlight"/);
  assert.match(page, /className=\{`terminal-panel/);
  assert.match(page, /RESPONDA AQUI · LINHA/);
  assert.match(
    page,
    /useEffect\(\(\) => \{\s*chatEnd\.current\?\.scrollIntoView\(\{ behavior: "smooth" \}\);\s*\}, \[messages\]\);/,
  );
  assert.match(css, /\.message span \{[^}]*white-space:\s*pre-line;/);
  assert.match(css, /\.editor-card \{[^}]*background:\s*var\(--terminal\)/);
  assert.match(css, /\.answer-line-highlight \{[^}]*var\(--code-green\)/);
});
