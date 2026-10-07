import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { PUBLISHED_ASSET_URLS } from './src/config/assetManifest.ts'

/**
 * `assets/` holds the whole challenge pack (reference screenshots, vector sources, unused
 * sounds...). The production build publishes only the files listed in the asset manifest, which
 * is the same list the game code loads from, so nothing it needs can be left out.
 */
function publishUsedAssets(): Plugin {
  return {
    name: 'publish-used-assets',
    apply: 'build',
    generateBundle() {
      for (const url of PUBLISHED_ASSET_URLS) {
        this.emitFile({
          type: 'asset',
          fileName: url.slice(1),
          source: readFileSync(new URL(`./assets${url}`, import.meta.url)),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), publishUsedAssets()],
  // The dev server serves every file in assets/; the build copies only the manifest (see above).
  publicDir: command === 'build' ? false : 'assets',
}))
