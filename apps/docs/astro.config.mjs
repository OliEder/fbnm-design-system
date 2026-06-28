import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const dir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  site: 'https://olieder.github.io',
  base: '/fbnm-design-system',
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@ds': resolve(dir, '../../packages/design-system/src'),
      },
    },
  },
})
