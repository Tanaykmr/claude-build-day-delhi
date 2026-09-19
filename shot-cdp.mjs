// shot-cdp.mjs — headless screenshot over the DevTools protocol (Track A).
//
//   node shot-cdp.mjs <out.png> <url> [timeout_ms] [WxH]
//
// Replaces `chrome --screenshot --virtual-time-budget=...` for this project. Virtual time stops advancing
// while a media element is still loading, and the front-end menu constructs an Audio element for its theme on
// every page load, so every virtual-time capture began returning the "Loading…" overlay instead of a frame.
// This waits on REAL time instead: launch, wait until the page has a canvas and is past its loading overlay,
// let it settle, then Page.captureScreenshot. Console errors and page exceptions are printed, so a capture
// that silently renders the wrong thing is visible in the log.
//
// shot.sh delegates here and keeps its own arguments, so capture.sh and every documented URL still work.
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const [out, url, timeoutArg, sizeArg] = process.argv.slice(2);
if (!out || !url) { console.error('usage: node shot-cdp.mjs <out.png> <url> [timeout_ms] [WxH]'); process.exit(2); }
const timeout = Math.max(3000, Number(timeoutArg) || 20000);
const size = (sizeArg || '1600,900').replace('x', ',');
const [width, height] = size.split(',').map(n => Math.max(64, Number(n) || 0));
const settle = Number(process.env.SHOT_SETTLE_MS || 900);   // extra real time after the page looks ready

const chrome = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!chrome) { console.error('Chrome not found'); process.exit(1); }

const port = 9400 + (process.pid % 500);                     // parallel captures must not share a debug port
const profile = `${process.env.TMPDIR || '/tmp'}/snap-shot-cdp-${process.pid}`;
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required', `--window-size=${width},${height}`,
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
const cleanup = () => { try { proc.kill(); } catch { /* already gone */ } };
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const deadline = Date.now() + timeout;

let target = null;
while (!target && Date.now() < deadline) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find(t => t.type === 'page');
  } catch { /* the browser is still starting */ }
  if (!target) await sleep(200);
}
if (!target) { console.error('shot-cdp: no page target'); cleanup(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map(), problems = [];
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
  if (m.method === 'Runtime.exceptionThrown') problems.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push(m.params.args.map(a => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async expression => {
  try { return (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value; }
  catch { return null; }
};

let failed = false;
try {
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  // Ready = the renderer's canvas exists and the startup overlay is no longer on its loading message. A page
  // that fails outright (the error overlay) is also "ready": capturing it is how the failure gets reported.
  const READY = `(() => {
    const canvas = document.querySelector('canvas.scene') || document.querySelector('canvas');
    if (!canvas || !canvas.width) return false;
    const title = document.querySelector('#status-title')?.textContent || '';
    const overlay = document.querySelector('#overlay');
    return (overlay?.hidden ?? true) || !title.startsWith('Loading');
  })()`;
  let ready = false;
  while (!ready && Date.now() < deadline) { ready = !!(await evaluate(READY)); if (!ready) await sleep(200); }
  if (!ready) console.error(`shot-cdp: ${out} timed out waiting for a rendered frame (${timeout} ms)`);
  await sleep(settle);
  // SHOT_EVAL=<expression> prints a value from the live page next to the capture: a cheap probe for state that
  // a screenshot cannot show (particle counts, race phase, camera clip).
  if (process.env.SHOT_EVAL) console.log(`eval: ${JSON.stringify(await evaluate(process.env.SHOT_EVAL))}`);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buffer = Buffer.from(data, 'base64');
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buffer);
  console.log(`${buffer.length} bytes written to file ${out}`);   // same line shot.sh has always grepped for
} catch (error) {
  console.error(`shot-cdp: ${error.message}`);
  failed = true;
}
if (problems.length) console.error(`shot-cdp: page reported ${problems.length} error(s):\n  ${problems.slice(0, 5).join('\n  ')}`);
try { ws.close(); } catch { /* closing anyway */ }
cleanup();
process.exit(failed ? 1 : 0);
