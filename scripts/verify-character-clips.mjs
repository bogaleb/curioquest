import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.CURIO_TEST_URL || 'http://localhost:5173';
const errors = [];
await mkdir('outputs/character-tests', { recursive: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const videoRequests = [];
    page.on('request', request => { if (request.url().includes('/media/characters/') && request.url().endsWith('.mp4')) videoRequests.push(request.url()); });
    await page.goto(`${base}/kid-preview?screen=characters`, { waitUntil: 'networkidle' });
    assert.equal(videoRequests.length, 0, 'Posters must not preload movies');
    const video = page.locator('video');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('video')?.currentTime > .1);
    assert.ok(videoRequests.some(url => url.endsWith('/luna-letter-trace.mp4')));
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    assert.equal(await video.evaluate(node => node.paused), true);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByLabel('Paused', { exact: true }).check();
    await page.waitForFunction(() => document.querySelector('video')?.paused);
    assert.ok(await page.getByRole('button', { name: 'Play', exact: true }).isDisabled());
    assert.ok(await page.getByRole('button', { name: '1. Left sloping line' }).isDisabled());
    await page.getByLabel('Paused', { exact: true }).uncheck();
    await page.getByLabel('Narration', { exact: true }).uncheck();
    assert.equal(await page.getByRole('button', { name: 'Listen to description' }).count(), 0);
    await page.locator('.character-letter').scrollIntoViewIfNeeded();
    const letterBox = await page.locator('.character-letter').boundingBox();
    await page.mouse.move(letterBox.x + letterBox.width * .5, letterBox.y + letterBox.height * 40 / 280);
    await page.mouse.down();
    await page.mouse.move(letterBox.x + letterBox.width * 60 / 280, letterBox.y + letterBox.height * 240 / 280, { steps: 20 });
    await page.mouse.up();
    assert.ok(await page.getByRole('button', { name: '2. Right sloping line', exact: true }).isEnabled(), 'A real pointer stroke should advance the guide');
    for (const name of ['2. Right sloping line', '3. Line across the middle']) await page.getByRole('button', { name, exact: true }).click();
    await page.locator('[data-clip="luna-praise"]').waitFor();
    assert.equal(await page.locator('video').getAttribute('src'), null, 'A celebration must not autoplay');
    await page.screenshot({ path: `outputs/character-tests/reading-${width}.png`, fullPage: true });

    await page.getByLabel('Section').selectOption('/play');
    await page.getByRole('button', { name: '3', exact: true }).click();
    assert.match(await page.locator('.character-feedback').innerText(), /Touch each apple first/);
    for (let i = 1; i <= 3; i++) await page.getByRole('button', { name: `Count apple ${i}`, exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    assert.match(await page.locator('.character-feedback').innerText(), /Try again/);
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.locator('[data-clip="milo-dance"]').waitFor();
    await page.screenshot({ path: `outputs/character-tests/counting-${width}.png`, fullPage: true });

    await page.getByLabel('Section').selectOption('/science');
    await page.getByRole('button', { name: 'Flower', exact: true }).click();
    assert.match(await page.locator('.character-feedback').innerText(), /Look again/);
    for (const name of ['Seed', 'Sprout', 'Flower']) await page.getByRole('button', { name, exact: true }).click();
    await page.locator('[data-clip="bea-celebrate"]').waitFor();

    await page.getByLabel('Section').selectOption('/create');
    for (const name of ['Drum', 'Clap', 'Drum']) await page.getByRole('button', { name, exact: true }).click();
    await page.locator('[data-clip="riff-celebrate"]').waitFor();

    await page.getByLabel('Section').selectOption('/worlds');
    await page.locator('.character-shelf button').last().click();
    await page.getByRole('button', { name: 'Ready to breathe in' }).click();
    assert.ok(parseFloat(await page.locator('.breathing-orb').evaluate(node => getComputedStyle(node).transitionDuration)) <= .001);
    await page.getByRole('button', { name: 'Ready to breathe out' }).click();
    await page.getByRole('button', { name: 'I am ready', exact: true }).click();
    await page.locator('[data-clip="tuno-proud"]').waitFor();

    await page.getByLabel('Offline', { exact: true }).check();
    const beforeOffline = videoRequests.length;
    await page.getByLabel('Section').selectOption('/read');
    assert.ok(await page.getByRole('button', { name: 'Play', exact: true }).isDisabled());
    await page.getByRole('button', { name: '1. Left sloping line', exact: true }).click();
    assert.equal(videoRequests.length, beforeOffline);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
    await page.getByLabel('Offline', { exact: true }).uncheck();

    // Verify every authored clip actually decodes, rather than just checking its filename.
    if (width === 1440) {
      await page.getByLabel('Section').selectOption('/theater');
      assert.equal(await page.locator('.character-shelf button').count(), 24);
      for (let i = 0; i < 24; i++) {
        await page.locator('.character-shelf button').nth(i).click();
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.videoWidth === 1280 && v.currentTime > 0; });
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
      }
      console.log('PASS: all 24 videos decode through the app');
    }

    // A network failure keeps the activity usable, and retry can recover.
    await page.getByLabel('Section').selectOption('/stories');
    await page.getByLabel('Section').selectOption('/read');
    await page.route('**/media/characters/luna-letter-trace.mp4', route => route.abort());
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByText('The movie could not play.', { exact: false }).waitFor();
    assert.ok(await page.getByRole('button', { name: '1. Left sloping line', exact: true }).isEnabled());
    await page.unroute('**/media/characters/luna-letter-trace.mp4');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
    console.log(`PASS ${width}px: lazy video, play/pause, settings, five activities, celebrations, reduced motion, failure/retry`);
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
