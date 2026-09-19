// cdp-flow.mjs — drive the real page in headless Chrome over the DevTools protocol and screenshot each state.
// Verifies the menu → game → pause-menu flow that a static --screenshot cannot reach.
//
//   node cdp-flow.mjs [url] [outDir]
//
// Steps: wait until the menu reports ready → shot 1 · press Enter (drive) → shot 2 · hold W for a moment →
// press Escape (pause menu) → shot 3. Prints console errors from the page. Exit code 1 on any failure.

import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:8000/';
const out = process.argv[3] || '.shots';
const port = 9333;
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
const chrome = chromePaths.find(existsSync);
if (!chrome) { console.error('Chrome not found'); process.exit(1); }
await mkdir(out, { recursive: true });

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  '--window-size=1600,900', `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP || '/tmp'}/stm-cdp`,
  '--autoplay-policy=no-user-gesture-required', url,
], { stdio: 'ignore' });
const cleanup = () => { try { proc.kill(); } catch {} };
process.on('exit', cleanup);

const sleep = ms => new Promise(r => setTimeout(r, ms));
let target = null;
for (let i = 0; i < 60 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find(t => t.type === 'page' && t.url.startsWith('http'));
  } catch {}
  if (!target) await sleep(250);
}
if (!target) { console.error('No page target'); cleanup(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const key = async (code, keyName, vk, holdMs = 60) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
};
const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${out}/${name}.png`, Buffer.from(data, 'base64'));
  console.log('shot', name);
};
const waitFor = async (expr, label, timeout = 90000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { if (await evaluate(expr)) return true; await sleep(300); }
  throw new Error(`timeout waiting for ${label}`);
};

let failed = false;
try {
  await send('Runtime.enable'); await send('Page.enable');
  await waitFor(`!!document.querySelector('.stm-btn.primary.is-ready')`, 'menu ready');
  await sleep(1200); // let the reveal animation finish
  const state1 = await evaluate(`({ paused: document.body.classList.contains('stm-open'), label: document.querySelector('[data-primary-label]').textContent, status: document.querySelector('[data-status-text]').textContent, canvas: !!document.querySelector('canvas:not(.stm-bg)') })`);
  console.log('menu state', state1);
  await shot('flow-1-menu-ready');

  await key('Enter', 'Enter', 13);
  await sleep(1500);
  const state2 = await evaluate(`({ menuHidden: document.querySelector('.stm').hidden, bodyOpen: document.body.classList.contains('stm-open'), overlayHidden: document.querySelector('#overlay').hidden, hudVisible: getComputedStyle(document.querySelector('header')).visibility })`);
  console.log('after Enter', state2);
  if (!state2.menuHidden || state2.bodyOpen || !state2.overlayHidden) { failed = true; console.error('FAIL: menu did not hand over to the game cleanly'); }
  await shot('flow-2-driving');

  await key('KeyW', 'w', 87, 900); // drive forward briefly
  await sleep(600);
  const speed = await evaluate(`document.querySelector('#meter').textContent`);
  console.log('meter after W', speed);

  await key('Escape', 'Escape', 27);
  await sleep(1200);
  const state3 = await evaluate(`({ menuHidden: document.querySelector('.stm').hidden, label: document.querySelector('[data-primary-label]').textContent, chip: document.querySelector('[data-chip-text]').textContent, restartShown: !document.querySelector('[data-restart]').hidden })`);
  console.log('after Esc', state3);
  if (state3.menuHidden || state3.label !== 'Resume') { failed = true; console.error('FAIL: Esc did not reopen the menu as a pause screen'); }
  await shot('flow-3-paused');

  await key('Escape', 'Escape', 27); // resume
  await sleep(900);
  const state4 = await evaluate(`document.querySelector('.stm').hidden`);
  console.log('after second Esc, menu hidden:', state4);
  if (!state4) { failed = true; console.error('FAIL: Esc did not resume'); }
} catch (error) {
  failed = true; console.error(error.message);
} finally {
  if (errors.length) { failed = true; console.error('page errors:\n  ' + errors.join('\n  ')); } else console.log('no page errors');
  ws.close(); cleanup();
  process.exit(failed ? 1 : 0);
}
