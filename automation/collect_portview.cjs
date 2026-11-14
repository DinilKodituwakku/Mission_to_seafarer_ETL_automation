const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const url = process.env.PORTVIEW_URL;
if (!url || !url.startsWith('https://')) throw new Error('Set PORTVIEW_URL to your authorised HTTPS Ships in Port page.');
const profile = path.join(process.env.LOCALAPPDATA, 'SeafarersPortViewBrowser');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const python = path.join(root, '.venv', 'Scripts', 'python.exe');
(async () => {
 const login = process.argv.includes('--login');
 const context = await chromium.launchPersistentContext(profile, { executablePath: edge, headless: !login });
 try {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(url, {waitUntil:'domcontentloaded', timeout:45000});
  if (login) {
   console.log('Sign in to PortView in the browser, then close the browser window.');
   await new Promise(resolve => context.on('close', resolve));
   return;
  }
  if (await page.locator('input[type="password"]').count()) {
   const credentials = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(__dirname, 'read_portview_credential.ps1')], {encoding:'utf8'});
   if (credentials.status !== 0) throw new Error('PortView login needed: set up the encrypted login first.');
   let auth;
   try { auth = JSON.parse(credentials.stdout); } catch { throw new Error('Could not read the encrypted PortView login.'); }
   const form = page.locator('form').filter({has: page.locator('input[type="password"]')});
   if (await form.count() !== 1) throw new Error('PortView login form changed; sign in manually.');
   const user = form.locator('input[type="text"], input:not([type])');
   if (await user.count() !== 1) throw new Error('PortView username field changed; sign in manually.');
   try {
    await user.fill(auth.username);
    await form.locator('input[type="password"]').fill(auth.password);
    auth = null;
    await form.locator('#logon').click();
    await page.locator('input[type="password"]').waitFor({state:'hidden', timeout:30000});
   } catch {
    throw new Error('PortView automatic sign-in failed; check your login or sign in manually.');
   }
   await page.goto(url, {waitUntil:'domcontentloaded', timeout:45000});
  }
  const table = page.locator('table[id="scrltbl0:scroller:content"]');
  if (!await table.count()) throw new Error('Ships in Port table unavailable. Sign in again using the setup instructions.');
  const rows = await table.locator('tr').evaluateAll(rows => rows.map(row => Array.from(row.querySelectorAll('td,th'), cell => cell.innerText.trim())));
  if (!rows.length || !rows[0].includes('Berth') || !rows[0].includes('Ship') || rows.length < 2) throw new Error('Unexpected or empty table; no snapshot saved.');
  const result = spawnSync(python, [path.join(__dirname, 'save_snapshot.py')], {input: JSON.stringify(rows), encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr || 'Could not save snapshot');
  console.log(result.stdout.trim());
 } finally { await Promise.race([context.close().catch(() => {}), new Promise(resolve => setTimeout(resolve, 10000))]); }
})().then(() => process.exit(0)).catch(e => { console.error(new Date().toISOString(), e.message); process.exit(1); });
