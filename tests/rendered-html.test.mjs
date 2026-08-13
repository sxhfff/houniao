import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: {},
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Houniao application dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>候鸟｜秋招记录与面试复盘<\/title>/);
  assert.match(html, /我的投递/);
  assert.match(html, /简历库/);
  assert.match(html, /面试复盘/);
});
