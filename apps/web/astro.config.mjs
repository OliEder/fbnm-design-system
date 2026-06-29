import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const dir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  output: 'static',
  site: 'https://www.fibalon-baskets.de',
  compressHTML: true,
  build: {
    assets: '_astro',
  },
  vite: {
    resolve: {
      alias: {
        '@ds': resolve(dir, '../../packages/design-system/src'),
      },
    },
  },
})
