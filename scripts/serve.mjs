import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const base = path.resolve(root);
const address = "http://127.0.0.1:5173";
function openBrowser() {
  if (!process.argv.includes("--open")) return;
  const command = process.platform === "win32" ? "cmd.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", address] : [address];
  const child = spawn(command, args, { stdio: "inherit", windowsHide: true });
  child.on("error", () => console.log("Open this address in your browser: " + address));
}
const mime = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
const server = http.createServer((req, res) => {
    let name;
    try {
      name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = path.resolve(
      base,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!file.startsWith(base + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-MigraMap-App": "local-diary",
      });
      res.end(body);
    });
  });
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    http.get(address, (res) => {
      res.resume();
      if (res.headers["x-migramap-app"] === "local-diary") {
        console.log("MigraMap is already running: " + address);
        openBrowser();
      } else {
        console.error("Port 5173 is occupied by another application. Close it and try again.");
        process.exitCode = 1;
      }
    }).on("error", () => { console.error("Could not reach the existing server. Please try again."); process.exitCode = 1; });
  } else {
    console.error("MigraMap could not start: " + error.message);
    process.exitCode = 1;
  }
});
server.listen(5173, "127.0.0.1", () => {
  console.log("MigraMap is ready: " + address);
  openBrowser();
});
