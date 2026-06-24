import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/instagram');
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');

interface CliArgs {
  force: boolean;
  targetPost: string | null;
}

// Simple CLI arguments parser
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    force: false,
    targetPost: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--force' || args[i] === '-f') {
      result.force = true;
    } else if (args[i] === '--post' || args[i] === '-p') {
      result.targetPost = args[i + 1] || null;
      i++;
    }
  }

  return result;
}

// Generate random delay in milliseconds
function randomDelay(minSec = 1.5, maxSec = 3.5): Promise<void> {
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
      console.error(`[Error] Failed to download image: ${response.statusText}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(destPath, buffer);
    return true;
  } catch (error) {
    console.error(`[Error] Exception downloading image:`, error);
    return false;
  }
}

// Clean up auto-generated Instagram accessibility descriptions
function cleanCaption(caption: string): string {
  if (!caption) return '';
  const trimmed = caption.trim();
  
  if (/^(?:Photo|Video|Image|Map) shared by /i.test(trimmed)) return '';
  if (/^(?:Photo|Video|Image|Map) by /i.test(trimmed)) return '';
  if (/^May be /i.test(trimmed)) return '';
  if (/^No photo description /i.test(trimmed)) return '';

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

  if (words.length > 0 && (junkWordCount / words.length) >= 0.85) {
    return '';
  }
  
  return trimmed;
}

async function main() {
  const args = parseArgs();
  const username = 'suenabien.soundsystem';

  console.log(`Starting Instagram Sync for user: @${username}`);
  if (args.force) console.log('--> [Force Mode] Ignoring cache, refetching all posts.');
  if (args.targetPost) console.log(`--> [Target Mode] Specifically updating post: ${args.targetPost}`);

  // Ensure content directories exist
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const headers: Record<string, string> = {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'x-ig-app-id': '936619743392459',
    'referer': 'https://www.instagram.com/',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
  };

  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  console.log(`Fetching profile recent posts publicly...`);

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 429) {
        console.error('[Error] Instagram rate limit reached (HTTP 429). Exiting.');
        process.exit(1);
      }
      throw new Error(`Instagram returned HTTP ${response.status}: ${response.statusText}`);
    }
    const json: any = await response.json();
    const user = json.data?.user;
    if (!user) {
      throw new Error('Could not find user data in response.');
    }

    const media = user.edge_owner_to_timeline_media;
    const edges = media?.edges || [];

    if (edges.length === 0) {
      console.log('No posts found.');
      return;
    }

    console.log(`Processing ${edges.length} posts...`);
    let postsProcessed = 0;

    for (const edge of edges) {
      const node = edge.node;
      const shortcode = node.shortcode;
      const id = node.id;
      const jsonPath = path.join(CONTENT_DIR, `${shortcode}.json`);

      // Determine media type
      let mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' = 'IMAGE';
      if (node.__typename === 'GraphVideo') {
        mediaType = 'VIDEO';
      } else if (node.__typename === 'GraphSidecar') {
        mediaType = 'CAROUSEL_ALBUM';
      }

      const isTargeted = args.targetPost !== null && args.targetPost === shortcode;
      
      let isFullyCached = false;
      if (!args.force && !isTargeted) {
        const jsonExists = await fileExists(jsonPath);
        if (jsonExists) {
          if (mediaType === 'CAROUSEL_ALBUM') {
            const children = node.edge_sidecar_to_children?.edges || [];
            let allChildrenExist = true;
            for (let i = 0; i < children.length; i++) {
              const imagePath = path.join(IMAGES_DIR, `${shortcode}_${i}.jpg`);
              if (!(await fileExists(imagePath))) {
                allChildrenExist = false;
                break;
              }
            }
            isFullyCached = allChildrenExist;
          } else {
            const imagePath = path.join(IMAGES_DIR, `${shortcode}.jpg`);
            isFullyCached = await fileExists(imagePath);
          }
        }
      }

      if (isFullyCached) {
        console.log(`[Cache Hit] Post ${shortcode} is already synced. Skipping.`);
        postsProcessed++;
        continue;
      }

      if (args.targetPost && !isTargeted) {
        continue;
      }

      console.log(`[Syncing] Post ${shortcode} (${mediaType})...`);

      let localImage: string | undefined;
      let localImages: string[] | undefined;

      if (mediaType === 'CAROUSEL_ALBUM') {
        const children = node.edge_sidecar_to_children?.edges || [];
        localImages = [];
        for (let i = 0; i < children.length; i++) {
          const childNode = children[i].node;
          const imagePath = path.join(IMAGES_DIR, `${shortcode}_${i}.jpg`);
          const imageUrl = childNode.display_url;

          console.log(`  Downloading slide ${i + 1}/${children.length}...`);
          await randomDelay();
          const success = await downloadImage(imageUrl, imagePath);
          if (success) {
            localImages.push(`./images/${shortcode}_${i}.jpg`);
          }
        }
        if (localImages.length > 0) {
          localImage = localImages[0];
        }
      } else {
        const imagePath = path.join(IMAGES_DIR, `${shortcode}.jpg`);
        const imageUrl = node.display_url;

        console.log(`  Downloading image...`);
        await randomDelay();
        const success = await downloadImage(imageUrl, imagePath);
        if (success) {
          localImage = `./images/${shortcode}.jpg`;
        }
      }

      // 2. Prepare JSON schema data
      const rawCaption = node.edge_media_to_caption?.edges[0]?.node?.text || '';
      const caption = cleanCaption(rawCaption);
      const timestamp = new Date(node.taken_at_timestamp * 1000).toISOString();
      const permalink = `https://www.instagram.com/p/${shortcode}/`;

      const postData = {
        id,
        shortcode,
        caption,
        permalink,
        timestamp,
        mediaType,
        localImage,
        localImages,
      };

      // 3. Write metadata file
      await fs.writeFile(jsonPath, JSON.stringify(postData, null, 2), 'utf-8');
      console.log(`  Saved metadata to ${shortcode}.json`);

      postsProcessed++;
    }

    console.log(`Sync finished. Processed ${postsProcessed} posts in this run.`);
  } catch (error: any) {
    console.error('[Error] Failed to fetch recent page:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Error] Fatal script error:', err);
  process.exit(1);
});
