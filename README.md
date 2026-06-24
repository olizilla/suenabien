# Suena Bien website

🔊 A soundsystem for dancing 💃

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

see: https://docs.astro.build/en/basics/project-structure

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Instagram Feed Replication (Indie-Web Sync)

We capture and republish our Instagram posts to our own website. The content is saved locally as JSON and optimized WebP images, which are loaded using Astro 7 Content Collections.

This uses a two-part architecture:
1. **Recent Posts Sync**: An unauthenticated script that pulls the latest 12 posts from your public profile. This is the only reliable way to fetch fresh posts without login session cookies.
2. **Historical Cache**: Old historical posts are saved permanently on disk as JSON files under `src/content/instagram/`. They were loaded via a one-time browser console backfill script to bypass Instagram's login wall and will never be overwritten.

### Setup

1.  **Create your local `.env` file**:
    ```bash
    cp .env.example .env
    ```
2.  **Set your username**:
    Open `.env` and set `INSTAGRAM_USERNAME` to your Instagram handle:
    ```env
    INSTAGRAM_USERNAME=suenabien
    ```

### How to Run the Sync

*   **Incremental Sync (Daily updates)**:
    Fetches the first page of recent posts publicly. It stops as soon as it hits a post that is already cached on disk.
    ```bash
    npm run sync:instagram
    ```
*   **Force Refresh Recent Feed**:
    Re-scrapes the latest posts and refreshes their assets:
    ```bash
    npm run sync:instagram -- --force
    ```
*   **Refresh a Specific Post**:
    ```bash
    npm run sync:instagram -- --post SHORTCODE
    ```

