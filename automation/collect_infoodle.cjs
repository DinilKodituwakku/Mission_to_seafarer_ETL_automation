// Download the last seven Melbourne calendar days; never overwrite old exports.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');
const url = process.env.INFOODLE_URL;
if (!url || !url.startsWith('https://')) throw new Error('Set INFOODLE_URL to your authorised HTTPS sign-in report page.');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const fmt = new Intl.DateTimeFormat('en-CA', {timeZone:'Australia/Melbourne', year:'numeric',month:'2-digit',day:'2-digit'});
const today = fmt.format(new Date());
const previous = new Date(Date.parse(today + 'T12:00:00Z') - 6 * 86400000).toISOString().slice(0,10);
(async () => {
 const browser = await chromium.launch({executablePath:edge, headless:true});
 try {
  const page = await browser.newPage({acceptDownloads:true});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#daterange').click();
  await page.getByText('Last 7 Days', {exact:true}).click();
  const selected = await page.locator('#daterange').inputValue();
  if (!selected.includes(previous.replaceAll('-', '/')) || !selected.includes(today.replaceAll('-', '/'))) throw new Error('Infoodle did not select the expected date range.');
  await page.locator('#submit').click();
  const csvButton = page.getByRole('button', {name:'CSV', exact:true});
  await csvButton.waitFor({state:'visible',timeout:60000});
  await page.waitForFunction(() => { const t = document.querySelector('table[id="2"]'); return t && !t.innerText.includes('Loading...'); }, null, {timeout:60000});
  const [download] = await Promise.all([page.waitForEvent('download'), csvButton.click()]);
  const failure = await download.failure();
  if (failure) throw new Error(`Export failed: ${failure}`);
  const folder = path.join(root,'data','sign_ins','exports');
  fs.mkdirSync(folder,{recursive:true});
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/, 'Z');
  const destination = path.join(folder, `infoodle_${previous}_${today}_${stamp}.csv`);
  await download.saveAs(destination);
  const first = fs.readFileSync(destination,'utf8').split(/\r?\n/,1)[0];
  if (!first.includes('Time') || !first.includes('Ship')) { fs.unlinkSync(destination); throw new Error('Export did not contain the expected Time and Ship columns.'); }
  console.log(`Saved ${previous} through ${today}: ${destination}`);
 } finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 10000))]); }
})().then(() => process.exit(0)).catch(error => {console.error(new Date().toISOString(), error.message); process.exit(1);});
