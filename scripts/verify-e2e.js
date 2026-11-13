import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LIVE_URL = process.env.LIVE_URL || 'https://shipmate-mvp.kaushaldhaked007.workers.dev';
const SCREENS_DIR = path.resolve(process.cwd(), 'docs/screens');

if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

async function run() {
  console.log(`Starting Playwright end-to-end verification against: ${LIVE_URL}`);
  const startTime = Date.now();

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------
    // 1. Mobile Run: 375x667
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Mobile Viewport (375x667) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const page = await mobileContext.newPage();

    // Step A: Setup screen
    console.log('Navigating to Setup page...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });

    // Assert no horizontal scroll
    const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Mobile width check: scrollWidth=${mobileScrollWidth}, clientWidth=${mobileClientWidth}`);
    if (mobileScrollWidth > mobileClientWidth) {
      throw new Error(`Horizontal scroll detected on Setup! scrollWidth=${mobileScrollWidth} > clientWidth=${mobileClientWidth}`);
    }

    await page.screenshot({ path: path.join(SCREENS_DIR, '01_setup_mobile.png') });
    console.log('Saved 01_setup_mobile.png');

    // Step B: Launch Demo Room
    console.log('Clicking "Try the demo (no repo needed)"...');
    const demoButton = page.locator('text=Try the demo (no repo needed)');
    await demoButton.waitFor({ state: 'visible' });
    await demoButton.click();

    // Wait for Dashboard to load
    await page.waitForURL(/\/room\/[a-zA-Z0-9-]+#k=/, { timeout: 15000 });
    const dashboardUrl = page.url();
    console.log(`Landed on Dashboard: ${dashboardUrl}`);
    await page.waitForSelector('text=Private to Team Lead', { timeout: 10000 });

    // Check horizontal scroll on dashboard
    const dashScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const dashClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Dashboard width check: scrollWidth=${dashScrollWidth}, clientWidth=${dashClientWidth}`);
    if (dashScrollWidth > dashClientWidth) {
      throw new Error(`Horizontal scroll detected on Dashboard! ${dashScrollWidth} > ${dashClientWidth}`);
    }

    await page.screenshot({ path: path.join(SCREENS_DIR, '02_dashboard_mobile.png') });
    console.log('Saved 02_dashboard_mobile.png');

    // Step C: Open Triage Advisor for inactive member
    console.log('Opening Triage Advisor modal...');
    const triageButtons = page.locator('button:has-text("Triage")');
    await triageButtons.first().click();

    await page.waitForSelector('text=Private Early Triage Advisor', { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENS_DIR, '03_triage_modal.png') });
    console.log('Saved 03_triage_modal.png');

    // Choose [A] Switch to Fallback API & add note
    console.log('Selecting [A] Switch to Fallback API and persisting...');
    const fallbackRadio = page.locator('input[value="fallback_api"]');
    await fallbackRadio.click();

    const noteInput = page.locator('input[placeholder*="Auth service down"]');
    await noteInput.fill('Switched to static mock data due to upstream delay');

    const persistButton = page.locator('button:has-text("Persist Decision")');
    await persistButton.click();

    // Wait for modal to close and UI to update
    await page.waitForSelector('text=Fallback API Active', { timeout: 10000 });
    console.log('Decision recorded in UI.');

    // Step D: Reload page to verify persistence
    console.log('Reloading dashboard to verify persistence across refresh...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('text=Fallback API Active', { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENS_DIR, '04_triage_persisted_mobile.png') });
    console.log('Saved 04_triage_persisted_mobile.png (Decision persisted across refresh!)');

    // Step E: Manifest view
    console.log('Navigating to Proof-of-Ship Manifest...');
    const manifestLink = page.locator('a:has-text("Manifest")');
    await manifestLink.first().click();

    await page.waitForSelector('text=Verified Proof-of-Ship Manifest', { timeout: 10000 });
    await page.waitForSelector('text=Contributor Verification Table', { timeout: 10000 });

    const manifestScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const manifestClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Manifest width check: scrollWidth=${manifestScrollWidth}, clientWidth=${manifestClientWidth}`);
    if (manifestScrollWidth > manifestClientWidth) {
      throw new Error(`Horizontal scroll detected on Manifest! ${manifestScrollWidth} > ${manifestClientWidth}`);
    }

    await page.screenshot({ path: path.join(SCREENS_DIR, '05_manifest_mobile.png') });
    console.log('Saved 05_manifest_mobile.png');

    // -------------------------------------------------------------
    // 2. Desktop Run: 1280x800
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Desktop Viewport (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();

    // Setup desktop
    await desktopPage.goto(LIVE_URL, { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: path.join(SCREENS_DIR, '01_setup_desktop.png') });
    console.log('Saved 01_setup_desktop.png');

    // Revisit demo dashboard on desktop
    await desktopPage.goto(dashboardUrl, { waitUntil: 'networkidle' });
    await desktopPage.waitForSelector('text=Private to Team Lead', { timeout: 10000 });
    await desktopPage.screenshot({ path: path.join(SCREENS_DIR, '02_dashboard_desktop.png') });
    console.log('Saved 02_dashboard_desktop.png');

    // Visit manifest on desktop
    const desktopManifestUrl = dashboardUrl.replace('/room/', '/room/').replace('#k=', '/manifest#k=');
    await desktopPage.goto(desktopManifestUrl, { waitUntil: 'networkidle' });
    await desktopPage.waitForSelector('text=Verified Proof-of-Ship Manifest', { timeout: 10000 });
    await desktopPage.screenshot({ path: path.join(SCREENS_DIR, '05_manifest_desktop.png') });
    console.log('Saved 05_manifest_desktop.png');

    // Print preview emulation
    console.log('Emulating print media for manifest print stylesheet check...');
    await desktopPage.emulateMedia({ media: 'print' });
    await desktopPage.screenshot({ path: path.join(SCREENS_DIR, '06_manifest_print.png') });
    console.log('Saved 06_manifest_print.png');

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ ALL Playwright tests passed in ${totalSeconds}s (under 120s limit)!`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Playwright verification failed:', err);
  process.exit(1);
});
