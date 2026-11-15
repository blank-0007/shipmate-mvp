import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LIVE_URL = process.env.LIVE_URL || 'https://shipmate-mvp.kaushaldhaked007.workers.dev';
const TEMP_VIDEO_DIR = path.resolve(process.cwd(), 'temp_videos');
const OUTPUT_MP4 = path.resolve(process.cwd(), 'shipmate_demo.mp4');
const OUTPUT_WEBM = path.resolve(process.cwd(), 'shipmate_demo.webm');

if (!fs.existsSync(TEMP_VIDEO_DIR)) {
  fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });
}

// Format date for datetime-local input
function toLocalDatetimeInputValue(date) {
  const d = new Date(date);
  const offsetMs = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

// Injects an animated visible cursor highlight on every page
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('playwright-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'playwright-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '24px';
    cursor.style.height = '24px';
    cursor.style.borderRadius = '50%';
    cursor.style.border = '2px solid rgba(16, 185, 129, 0.95)';
    cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
    cursor.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999999';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.transition = 'transform 0.08s ease-out, background-color 0.15s ease, border-color 0.15s ease';
    cursor.style.left = '640px';
    cursor.style.top = '360px';
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    window.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
      cursor.style.backgroundColor = 'rgba(245, 158, 11, 0.85)';
      cursor.style.borderColor = 'rgba(245, 158, 11, 1)';
    });
    window.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
      cursor.style.borderColor = 'rgba(16, 185, 129, 0.95)';
    });
  });
}

async function smoothMoveAndClick(page, locator) {
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
    await page.waitForTimeout(250);
  }
  await locator.click();
}

async function run() {
  console.log('====================================================');
  console.log(`🎬 Recording ShipMate Demo Video (Target: 95-105s)`);
  console.log(`🌐 Live URL: ${LIVE_URL}`);
  console.log('====================================================');

  const overallStart = Date.now();

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Re-inject cursor on navigation
  page.on('load', async () => {
    try {
      await injectCursor(page);
    } catch (e) {}
  });

  try {
    // -------------------------------------------------------------
    // 1. SETUP SCREEN (0:00 – ~0:28)
    // -------------------------------------------------------------
    console.log('[1/4] Setup Screen: Loading Live URL...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await page.waitForTimeout(3000); // 3s opening pause

    // Type Hackathon Name
    console.log('Typing Hackathon Name: "Devfolio AI Sprint"...');
    const hackathonInput = page.locator('input[placeholder*="Smart India Hackathon"], input[placeholder*="TreeHacks"]');
    await smoothMoveAndClick(page, hackathonInput);
    await hackathonInput.pressSequentially('Devfolio AI Sprint', { delay: 55 });
    await page.waitForTimeout(1000);

    // Enter Public GitHub Repo URL
    console.log('Typing GitHub Repo URL...');
    const repoInput = page.locator('input[placeholder*="github.com/owner/repository"]');
    await smoothMoveAndClick(page, repoInput);
    await repoInput.pressSequentially('https://github.com/blank-0007/shipmate-mvp', { delay: 35 });
    await page.waitForTimeout(1000);

    // Enter Sprint Started At: 8 hours ago so inactivity triggers immediately for 0-commit members
    console.log('Setting Sprint Start (8h ago) and Deadline (~36h from now)...');
    const sprintStartInput = page.locator('input[type="datetime-local"]').first();
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    await sprintStartInput.fill(toLocalDatetimeInputValue(eightHoursAgo));
    await page.waitForTimeout(800);

    // Set Submission Deadline: 36 hours from now
    const deadlineInput = page.locator('input[type="datetime-local"]').nth(1);
    const thirtySixHours = new Date(Date.now() + 36 * 60 * 60 * 1000);
    await deadlineInput.fill(toLocalDatetimeInputValue(thirtySixHours));
    await page.waitForTimeout(800);

    // Enter Figma URL
    console.log('Typing Figma Design URL...');
    const figmaInput = page.locator('input[placeholder*="figma.com/design"]');
    await smoothMoveAndClick(page, figmaInput);
    await figmaInput.pressSequentially('https://www.figma.com/design/WMh3VfmntoPtzRnOLuF1Qi/ShipMate-Wireframe?node-id=0-1', { delay: 25 });
    await page.waitForTimeout(1000);

    // Fill 4 Teammates:
    // 1. blank-0007 (Active Lead)
    // 2. torvalds (Silent Developer - triggers 6h alert)
    // 3. gaearon (Silent Developer - triggers 6h alert)
    // 4. shadcn (Designer)
    console.log('Configuring 4 Teammates...');
    const handleInputs = page.locator('input[placeholder="github_username"]');

    // Member 1
    await smoothMoveAndClick(page, handleInputs.nth(0));
    await handleInputs.nth(0).pressSequentially('blank-0007', { delay: 50 });
    await page.waitForTimeout(400);

    // Member 2
    await smoothMoveAndClick(page, handleInputs.nth(1));
    await handleInputs.nth(1).pressSequentially('torvalds', { delay: 50 });
    await page.waitForTimeout(400);

    // Member 3
    await smoothMoveAndClick(page, handleInputs.nth(2));
    await handleInputs.nth(2).pressSequentially('gaearon', { delay: 50 });
    await page.waitForTimeout(400);

    // Member 4 (Designer)
    await smoothMoveAndClick(page, handleInputs.nth(3));
    await handleInputs.nth(3).pressSequentially('shadcn', { delay: 50 });
    await page.waitForTimeout(400);

    // Ensure Designer toggle is on for member 4
    const designerCheckboxes = page.locator('input[type="checkbox"]');
    const isChecked = await designerCheckboxes.nth(3).isChecked();
    if (!isChecked) {
      await smoothMoveAndClick(page, designerCheckboxes.nth(3));
      await page.waitForTimeout(400);
    }

    // Pause on completed form
    console.log('Pausing on completed setup form...');
    await page.waitForTimeout(2500);

    // Submit form
    console.log('Clicking "Launch Sprint Monitor"...');
    const submitBtn = page.locator('button[type="submit"]:has-text("Launch Sprint Monitor")');
    await smoothMoveAndClick(page, submitBtn);

    // Wait for One-Time Lead Key Modal
    await page.waitForSelector('text=Sprint Room Initialized!', { timeout: 15000 });
    await injectCursor(page);
    console.log('Lead Link Modal displayed.');
    await page.waitForTimeout(3000); // Pause to read privacy rules

    // Click "Copy" Lead URL
    console.log('Clicking "Copy" Lead URL...');
    const copyLeadBtn = page.locator('button:has-text("Copy")').first();
    await smoothMoveAndClick(page, copyLeadBtn);
    await page.waitForTimeout(2000); // Show "Copied" feedback

    // Click "Copy Team Notice"
    console.log('Clicking "Copy Team Notice"...');
    const copyNoticeBtn = page.locator('button:has-text("Copy Team Notice")');
    await smoothMoveAndClick(page, copyNoticeBtn);
    await page.waitForTimeout(2000); // Show "Copied Notice" feedback

    // Enter Dashboard
    console.log('Entering Sprint Dashboard...');
    const enterDashBtn = page.locator('button:has-text("Enter Sprint Dashboard")');
    await smoothMoveAndClick(page, enterDashBtn);

    // -------------------------------------------------------------
    // 2. ACTIVITY PULSE & PRIVATE ALERT (0:28 – ~0:54)
    // -------------------------------------------------------------
    console.log('[2/4] Activity Pulse & Telemetry Loading...');
    await page.waitForURL(/\/room\/[a-zA-Z0-9-]+#k=/, { timeout: 15000 });
    await injectCursor(page);

    // Wait for telemetry cards & private alert banner to appear
    await page.waitForSelector('text=Private to Team Lead', { timeout: 12000 });
    console.log('Telemetry loaded: Active vs Silent cards visible.');
    await page.waitForTimeout(4500); // 4.5s pause to read telemetry cards

    // Move to and focus on "Private to Team Lead" Banner
    console.log('Hovering over "Private to Team Lead" Banner...');
    const privateBanner = page.locator('text=Private to Team Lead').first();
    const bannerBox = await privateBanner.boundingBox();
    if (bannerBox) {
      await page.mouse.move(bannerBox.x + 80, bannerBox.y + 10, { steps: 16 });
    }
    await page.waitForTimeout(3500); // 3.5s pause on private alert banner

    // Click "Copy WhatsApp Ping"
    console.log('Clicking "WhatsApp Ping" for silent teammate...');
    const whatsappBtn = page.locator('button:has-text("WhatsApp Ping")').first();
    await smoothMoveAndClick(page, whatsappBtn);
    await page.waitForTimeout(3000); // 3s pause showing "Copied!" green feedback

    // Mouse over teammate cards: Active (@blank-0007) vs Silent (@torvalds)
    const memberCards = page.locator('a:has-text("@blank-0007")').first();
    const cardBox = await memberCards.boundingBox();
    if (cardBox) {
      await page.mouse.move(cardBox.x + 50, cardBox.y + 40, { steps: 16 });
      await page.waitForTimeout(3000); // 3s pause on verified active contributor
    }

    // -------------------------------------------------------------
    // 3. EARLY TRIAGE & PERSISTENCE CHECK (0:54 – ~1:22)
    // -------------------------------------------------------------
    console.log('[3/4] Early Triage Modal...');
    // Click "Triage" button on the silent member (@torvalds)
    const triageBtns = page.locator('button:has-text("Triage")');
    // Click triage
    await smoothMoveAndClick(page, triageBtns.first());

    await page.waitForSelector('text=Private Early Triage Advisor', { timeout: 6000 });
    await injectCursor(page);
    console.log('Triage Advisor Modal open. Showing options [A], [B], [C]...');
    await page.waitForTimeout(4000); // 4s pause showing all 3 options

    // Click [A] Switch to Fallback API
    console.log('Selecting option: [A] Switch to Fallback API...');
    const optionA = page.locator('input[value="fallback_api"]').first();
    await smoothMoveAndClick(page, optionA);
    await page.waitForTimeout(1500);

    // Type Triage Reason Note
    console.log('Typing triage context note...');
    const noteField = page.locator('input[placeholder*="Auth service down"]').first();
    await smoothMoveAndClick(page, noteField);
    await noteField.pressSequentially('Mocking API endpoints with static JSON for demo', { delay: 45 });
    await page.waitForTimeout(1500);

    // Click "Persist Decision"
    console.log('Clicking "Persist Decision"...');
    const persistBtn = page.locator('button:has-text("Persist Decision")').first();
    await smoothMoveAndClick(page, persistBtn);

    // Modal closes, verify UI reflects "Fallback API Active"
    await page.waitForSelector('text=Fallback API Active', { timeout: 8000 });
    console.log('Triage decision reflected on card: "Fallback API Active".');
    await page.waitForTimeout(4000); // 4s pause

    // RELOAD browser page to prove database persistence
    console.log('🔄 Reloading page to prove Supabase database persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    await injectCursor(page);
    await page.waitForSelector('text=Fallback API Active', { timeout: 10000 });
    console.log('✅ Persistence verified! State survived browser reload.');
    await page.waitForTimeout(4500); // 4.5s pause to inspect persisted state

    // -------------------------------------------------------------
    // 4. VERIFIED PROOF-OF-SHIP MANIFEST (1:22 – ~1:45)
    // -------------------------------------------------------------
    console.log('[4/4] Navigating to Proof-of-Ship Manifest...');
    const manifestNavBtn = page.locator('a:has-text("Manifest")').first();
    await smoothMoveAndClick(page, manifestNavBtn);

    await page.waitForURL(/\/manifest/, { timeout: 10000 });
    await injectCursor(page);
    await page.waitForSelector('text=Verified Proof-of-Ship Manifest', { timeout: 10000 });
    console.log('Manifest view loaded.');
    await page.waitForTimeout(4500); // 4.5s pause on header & stats

    // Smooth scroll down to Contributor Breakdown Table
    console.log('Scrolling down to Contributor Breakdown Table...');
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await page.waitForTimeout(5000); // 5s pause to inspect Verified vs Unverified badges

    // Smooth scroll down to Triage Decisions Audit Log Table
    console.log('Scrolling to Early Triage Audit Log Table...');
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await page.waitForTimeout(4500); // 4.5s pause on timestamped audit trail

    // Click "Copy Submission Markdown" (Copy Judge Summary)
    console.log('Clicking "Copy Submission Markdown"...');
    const copyMdBtn = page.locator('button:has-text("Copy Submission Markdown")').first();
    await smoothMoveAndClick(page, copyMdBtn);
    await page.waitForTimeout(3500); // 3.5s pause showing "Copied Markdown!"

    // Scroll smoothly back up to summary header
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(4000); // 4s final hold

    console.log('Recording flow completed.');
  } finally {
    // Close context to flush video to disk
    await context.close();
    await browser.close();
  }

  const overallElapsedSeconds = ((Date.now() - overallStart) / 1000).toFixed(1);
  console.log(`Recording finished in ${overallElapsedSeconds}s.`);

  // Find generated webm file
  const videoFiles = fs.readdirSync(TEMP_VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No recorded video file found in temp_videos!');
  }

  // Sort by modification time (latest)
  videoFiles.sort((a, b) => {
    return fs.statSync(path.join(TEMP_VIDEO_DIR, b)).mtimeMs - fs.statSync(path.join(TEMP_VIDEO_DIR, a)).mtimeMs;
  });

  const latestWebm = path.join(TEMP_VIDEO_DIR, videoFiles[0]);
  console.log(`Raw video saved at: ${latestWebm}`);

  // Copy raw webm to project root
  fs.copyFileSync(latestWebm, OUTPUT_WEBM);

  // Convert to MP4 using ffmpeg
  console.log('Converting video to MP4 via ffmpeg...');
  try {
    // Re-encode with h264 for universal compatibility
    execSync(`ffmpeg -y -i "${latestWebm}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${OUTPUT_MP4}"`, {
      stdio: 'inherit',
    });
    console.log(`✨ Successfully generated MP4 at: ${OUTPUT_MP4}`);
  } catch (ffmpegErr) {
    console.warn('ffmpeg conversion failed or not installed, keeping webm', ffmpegErr);
  }

  // Check duration of output mp4
  try {
    const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT_MP4}"`)
      .toString()
      .trim();
    const durationSec = parseFloat(probe);
    console.log(`====================================================`);
    console.log(`🎬 FINAL VIDEO DURATION: ${durationSec.toFixed(1)} seconds (${(durationSec / 60).toFixed(2)} minutes)`);
    console.log(`📁 Video Path: ${OUTPUT_MP4}`);
    console.log(`====================================================`);

    if (durationSec < 90 || durationSec > 115) {
      console.warn(`⚠️ Warning: Duration is ${durationSec}s, target was 90-115s.`);
    } else {
      console.log(`🎯 PERFECT: Duration is within the 90–115s requirement!`);
    }
  } catch (e) {
    console.log('Could not probe duration with ffprobe');
  }
}

run().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
