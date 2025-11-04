#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import puppeteer from 'puppeteer';

const DIST = path.resolve(process.cwd(), 'dist');
const PORT = process.env.PRERENDER_PORT || 4173;

function build() {
  console.log('Running build...');
  execSync('npm run build', { stdio: 'inherit' });
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      const parsed = url.parse(req.url || '/');
      let pathname = decodeURIComponent(parsed.pathname || '/');
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filePath = path.join(DIST, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const stream = fs.createReadStream(filePath);
        res.writeHead(200);
        stream.pipe(res);
      } else {
        // fallback to root index.html for SPA routes
        const index = path.join(DIST, 'index.html');
        if (fs.existsSync(index)) {
          res.writeHead(200);
          fs.createReadStream(index).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Static server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function renderRoutes(routes) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const r of routes) {
      const u = `http://localhost:${PORT}${r}`;
      console.log('Rendering', u);
      await page.goto(u, { waitUntil: 'networkidle2', timeout: 60000 });
      // wait small extra time for client rendering
      await page.waitForTimeout(300);
      const html = await page.content();
      const outPath = path.join(DIST, r === '/' ? 'index.html' : r.replace(/(^\/|\/$)/g, '') + '/index.html');
      const outDir = path.dirname(outPath);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, html, 'utf8');
      console.log('Wrote', outPath);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  build();
  const server = await startStaticServer();
  try {
    await renderRoutes(['/', '/portfolio']);
    console.log('Prerender complete.');
  } catch (err) {
    console.error('Prerender failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

main();
