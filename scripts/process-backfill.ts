import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/instagram');
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');

const backfillScripts = path.join(__dirname, 'instagram-backfill.json');
const BACKFILL_PATH = existsSync(backfillScripts)
  ? backfillScripts
  : path.join(PROJECT_ROOT, 'instagram-backfill.json');

// Generate random delay in milliseconds
function randomDelay(minSec = 1.0, maxSec = 2.5): Promise<void> {
  const ms = Math.floor((Math.random() * (maxSec - minSec) + minSec) * 1000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size > 0;
  } catch {
    return false;
  }
}

// Download image file to local path
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Error] Failed to download image from ${url}: ${response.statusText}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(destPath, buffer);
    return true;
  } catch (error) {
    console.error(`[Error] Exception downloading image from ${url}:`, error);
    return false;
  }
}

// Parse date from caption text (e.g., "Photo shared by Suena Bien on May 07, 2026...")
function parseDateFromCaption(caption: string): string | null {
  const match = caption.match(/(?:Photo|Video|Image) shared by .*? on ([A-Za-z]+ \d{1,2}, \d{4})/i);
  if (match && match[1]) {
    const date = new Date(match[1] + ' UTC');
    if (!isNaN(date.getTime())) {
      // Set to 12:00:00 UTC to prevent timezone offset shifts from changing the day
      date.setUTCHours(12, 0, 0, 0);
      return date.toISOString();
    }
  }
  return null;
}

// Clean up auto-generated Instagram accessibility descriptions
// Returns empty string if the caption is strictly AI-generated
function cleanCaption(caption: string): string {
  if (!caption) return '';
  const trimmed = caption.trim();
  
  // 1. Check if the caption is purely an Instagram-generated description
  // Starts with "Photo/Video/Image/Map shared by" (case-insensitive)
  if (/^(?:Photo|Video|Image|Map) shared by /i.test(trimmed)) {
    return '';
  }
  
  // Starts with "Photo/Video/Image/Map by" (case-insensitive)
  if (/^(?:Photo|Video|Image|Map) by /i.test(trimmed)) {
    return '';
  }

  // Starts with "May be an image/cartoon/graphic/illustration/photo/close-up/pop art..." (case-insensitive)
  if (/^May be /i.test(trimmed)) {
    return '';
  }

  // Starts with "No photo description available" (case-insensitive)
  if (/^No photo description /i.test(trimmed)) {
    return '';
  }

  // 2. Clean up leftover junk captions that are just a list of tags/usernames and formatting/filler words.
  const words = trimmed.split(/[\s,]+/);
  let junkWordCount = 0;
  for (const word of words) {
    const w = word.toLowerCase().replace(/[.:;!()?]/g, '');
    if (!w) {
      junkWordCount++;
      continue;
    }
    const isTag = w.startsWith('@');
    const isFiller = ['and', 'with', 'tagging', 'shared', 'by', 'on', 'in', 'at', 'to', 'or', 'of'].includes(w);
    const isJunkFragment = ['uk', 'ldn', 'g', 'pof', 'music', 'soundsystem'].includes(w);
    const isUsernamePart = /^[a-zA-Z0-9_\.-]+$/.test(w) && (w.endsWith('_') || w.startsWith('_') || isTag || isJunkFragment);
    
    if (isTag || isFiller || isJunkFragment || isUsernamePart || w.length <= 2) {
      junkWordCount++;
    }
  }

  // If more than 85% of the words are junk/tags/formatting, it is a junk caption
  if (words.length > 0 && (junkWordCount / words.length) >= 0.85) {
    return '';
  }
  
  return trimmed;
}

// Find if there is an existing JSON file for this shortcode (matches old/new format)
async function findJsonFile(shortcode: string): Promise<string | null> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const match = files.find(f => f === `${shortcode}.json` || f.endsWith(`-${shortcode}.json`));
    return match ? path.join(CONTENT_DIR, match) : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('Starting Instagram Backfill Processing...');

  // Ensure content directories exist
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  if (!(await fileExists(BACKFILL_PATH))) {
    console.error(`[Error] Backfill file not found at: ${BACKFILL_PATH}`);
    process.exit(1);
  }

  const rawData = await fs.readFile(BACKFILL_PATH, 'utf-8');
  const backfillPosts = JSON.parse(rawData);
  console.log(`Loaded ${backfillPosts.length} posts from backfill JSON.`);

  // Pass 1: Resolve all known dates (cache or caption parse)
  const resolvedPosts: any[] = [];
  for (let idx = 0; idx < backfillPosts.length; idx++) {
    const post = backfillPosts[idx];
    const shortcode = post.shortcode;
    
    let timestamp: Date | null = null;
    let existingData: any = null;

    const existingPath = await findJsonFile(shortcode);
    if (existingPath) {
      try {
        existingData = JSON.parse(await fs.readFile(existingPath, 'utf-8'));
      } catch {
        // Ignore
      }
    }

    // Try parsing from the backfill caption first (highest accuracy source for historical posts)
    const parsedStr = parseDateFromCaption(post.caption || '');
    if (parsedStr) {
      timestamp = new Date(parsedStr);
    }

    // Fallback to existing JSON's timestamp if we couldn't parse one from the caption
    if (!timestamp && existingData?.timestamp) {
      const date = new Date(existingData.timestamp);
      if (!isNaN(date.getTime())) {
        date.setUTCHours(12, 0, 0, 0);
        timestamp = date;
      }
    }

    resolvedPosts.push({
      ...post,
      existingData,
      timestamp,
    });
  }

  // Pass 2: Interpolate missing dates to preserve correct timeline order
  for (let i = 0; i < resolvedPosts.length; i++) {
    if (resolvedPosts[i].timestamp === null) {
      // Find nearest previous known date (j < i)
      let prevIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (resolvedPosts[j].timestamp !== null) {
          prevIdx = j;
          break;
        }
      }
      
      // Find nearest next known date (k > i)
      let nextIdx = -1;
      for (let k = i + 1; k < resolvedPosts.length; k++) {
        if (resolvedPosts[k].timestamp !== null) {
          nextIdx = k;
          break;
        }
      }
      
      let computedTime = Date.now();
      
      if (prevIdx !== -1 && nextIdx !== -1) {
        // Interpolate linearly between prev and next
        const tPrev = resolvedPosts[prevIdx].timestamp.getTime();
        const tNext = resolvedPosts[nextIdx].timestamp.getTime();
        computedTime = tPrev + (tNext - tPrev) * ((i - prevIdx) / (nextIdx - prevIdx));
      } else if (prevIdx !== -1) {
        // Subtract 1 day per step from prev
        computedTime = resolvedPosts[prevIdx].timestamp.getTime() - (i - prevIdx) * 24 * 60 * 60 * 1000;
      } else if (nextIdx !== -1) {
        // Add 1 day per step to next
        computedTime = resolvedPosts[nextIdx].timestamp.getTime() + (nextIdx - i) * 24 * 60 * 60 * 1000;
      } else {
        computedTime = Date.now() - i * 24 * 60 * 60 * 1000;
      }
      
      resolvedPosts[i].timestamp = new Date(computedTime);
      console.log(`[Interpolating Date] Post ${resolvedPosts[i].shortcode} set to: ${resolvedPosts[i].timestamp.toISOString().split('T')[0]}`);
    }
  }

  // Pass 3: Process downloads and write updated JSON files
  let newlySynced = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < resolvedPosts.length; idx++) {
    const post = resolvedPosts[idx];
    const shortcode = post.shortcode;
    const imagePath = path.join(IMAGES_DIR, `${shortcode}.jpg`);

    const imageExists = await fileExists(imagePath);
    const hasCarousel = post.existingData && post.existingData.mediaType === 'CAROUSEL_ALBUM' && post.existingData.localImages && post.existingData.localImages.length > 0;
    
    let localImage = post.existingData?.localImage || (imageExists ? `./images/${shortcode}.jpg` : undefined);
    
    if (!localImage && !hasCarousel && post.mediaUrl) {
      console.log(`[Syncing Image] Post ${shortcode}...`);
      await randomDelay();
      const success = await downloadImage(post.mediaUrl, imagePath);
      if (success) {
        localImage = `./images/${shortcode}.jpg`;
      }
      newlySynced++;
    } else {
      skippedCount++;
    }

    let mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' = post.existingData?.mediaType || 'IMAGE';
    if (mediaType === 'IMAGE' && post.caption && post.caption.toLowerCase().startsWith('video')) {
      mediaType = 'VIDEO';
    }

    // Determine final caption:
    // 1. Start with cleaned backfill caption
    let caption = cleanCaption(post.caption || '');
    // 2. If we already had a custom user-written caption in cache, preserve it!
    // BUT only do this if the backfill caption itself was not generated (i.e. caption !== '')
    if (caption !== '' && post.existingData?.caption) {
      const existingCleaned = cleanCaption(post.existingData.caption);
      if (existingCleaned !== '') {
        caption = post.existingData.caption;
      }
    }

    // Compile complete post metadata
    const postData = {
      id: post.id || shortcode,
      shortcode,
      caption,
      permalink: post.permalink || `https://www.instagram.com/p/${shortcode}/`,
      timestamp: post.timestamp.toISOString(),
      mediaType,
      localImage,
      localImages: post.existingData?.localImages,
    };

    const dateStr = post.timestamp.toISOString().split('T')[0];
    const targetJsonPath = path.join(CONTENT_DIR, `${dateStr}-${shortcode}.json`);
    const existingPath = await findJsonFile(shortcode);

    if (existingPath && existingPath !== targetJsonPath) {
      await fs.unlink(existingPath);
      console.log(`[Renaming] Moving post ${shortcode} from ${path.basename(existingPath)} to ${path.basename(targetJsonPath)}`);
    }

    await fs.writeFile(targetJsonPath, JSON.stringify(postData, null, 2), 'utf-8');
  }

  console.log(`Backfill finished. Processed ${resolvedPosts.length} posts. Images downloaded: ${newlySynced}, cached: ${skippedCount}.`);
}

main().catch((err) => {
  console.error('[Error] Backfill execution failed:', err);
  process.exit(1);
});
