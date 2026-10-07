import { expect, test } from '@playwright/test'
import { PUBLISHED_ASSET_URLS } from '../src/config/assetManifest'

// The server falls back to index.html for unknown paths (status 200), so "served" means a
// response that is not that HTML fallback.
async function isServed(request: import('@playwright/test').APIRequestContext, url: string) {
  const response = await request.get(url)
  return response.ok() && !(response.headers()['content-type'] ?? '').includes('text/html')
}

test('the build publishes every asset the game loads', async ({ request }) => {
  for (const url of PUBLISHED_ASSET_URLS) {
    expect(await isServed(request, url), url).toBe(true)
  }
})

test('the build does not publish the unused challenge files', async ({ request }) => {
  for (const url of ['/sample.png', '/vector/tiles_vector.svg', '/sounds/ocean_ambience_loop.wav']) {
    expect(await isServed(request, url), url).toBe(false)
  }
})
