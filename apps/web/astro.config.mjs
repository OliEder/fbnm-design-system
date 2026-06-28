import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  site: 'https://www.fibalon-baskets.de',
  compressHTML: true,
  build: {
    assets: '_astro',
  },
})
