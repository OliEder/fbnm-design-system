import { test, expect } from '@playwright/test'

const BASE = '/fbnm-design-system'

function extractCssUrl(cssValue: string): string | null {
  const m = cssValue.match(/url\(["']?([^"')]+)["']?\)/)
  return m ? m[1] : null
}

test.describe('Bilder laden korrekt (keine 404)', () => {

  test('Logo in Navigation — Netzwerkrequest gibt 200', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/navigation/`)
    const logo = page.locator('.fbnm-nav img').first()
    await expect(logo).toBeVisible()

    const src = await logo.getAttribute('src')
    expect(src, 'Logo hat kein src-Attribut').toBeTruthy()

    const response = await page.request.get(src!)
    expect(response.status(), `Logo src="${src}" → HTTP ${response.status()}`).toBe(200)
  })

  test('Logo in Navigation — img.complete (kein broken-image)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/navigation/`)
    const logo = page.locator('.fbnm-nav img').first()
    await expect(logo).toBeVisible()

    const isComplete = await logo.evaluate((el) => {
      const img = el as HTMLImageElement
      return img.complete && img.naturalHeight > 0
    })
    expect(isComplete, 'Logo-Bild nicht vollständig geladen (naturalHeight = 0)').toBe(true)
  })

  test('Logo in Seiten-Demo — Netzwerkrequest gibt 200', async ({ page }) => {
    await page.goto(`${BASE}/seiten/`)
    const logo = page.locator('.fbnm-nav img').first()
    await expect(logo).toBeVisible()

    const src = await logo.getAttribute('src')
    const response = await page.request.get(src!)
    expect(response.status(), `Seiten-Logo src="${src}" → HTTP ${response.status()}`).toBe(200)
  })

  test('Hero Hintergrundbild — CSS-URL vorhanden und HTTP 200', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/hero/`)
    const hero = page.locator('.fbnm-hero').first()
    await expect(hero).toBeVisible()

    const bgImage = await hero.evaluate(el => getComputedStyle(el).backgroundImage)
    expect(bgImage, 'Hero hat kein background-image (none)').not.toBe('none')
    expect(bgImage).toMatch(/url\(/)

    const url = extractCssUrl(bgImage)
    expect(url, 'Konnte URL aus background-image nicht extrahieren').not.toBeNull()

    const response = await page.request.get(url!)
    expect(response.status(), `Hintergrundbild "${url}" → HTTP ${response.status()}`).toBe(200)
  })

  test('Hero Hintergrundbild — in Seiten-Komposition vorhanden und HTTP 200', async ({ page }) => {
    await page.goto(`${BASE}/seiten/`)
    const hero = page.locator('.fbnm-hero').first()
    await expect(hero).toBeVisible()

    const bgImage = await hero.evaluate(el => getComputedStyle(el).backgroundImage)
    expect(bgImage, 'Seiten-Hero hat kein background-image').not.toBe('none')

    const url = extractCssUrl(bgImage)
    expect(url).not.toBeNull()

    const response = await page.request.get(url!)
    expect(response.status(), `Seiten-Hero-Bild "${url}" → HTTP ${response.status()}`).toBe(200)
  })

  test('Training-Foto — zweite Hero-Variante HTTP 200', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/hero/`)
    const heroes = page.locator('.fbnm-hero')
    const count = await heroes.count()
    expect(count, 'Zu wenige Hero-Blöcke').toBeGreaterThanOrEqual(2)

    const bgImage = await heroes.nth(1).evaluate(el => getComputedStyle(el).backgroundImage)
    if (!bgImage || bgImage === 'none') return

    const url = extractCssUrl(bgImage)
    if (!url) return

    const response = await page.request.get(url)
    expect(response.status(), `Training-Bild "${url}" → HTTP ${response.status()}`).toBe(200)
  })

  test('PlayerCard-Bilder — alle img HTTP 200', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/playercard/`)
    const images = page.locator('.fbnm-playercard img')
    const count = await images.count()
    expect(count, 'Keine PlayerCard img-Elemente').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      if (!src) continue
      // Absolute URL prüfen — externe Bilder (Unsplash) überspringen wenn nicht erreichbar
      if (src.startsWith('http') && !src.includes('localhost')) continue
      const response = await page.request.get(src)
      expect(response.status(), `PlayerCard Bild ${i + 1} src="${src}" → ${response.status()}`).toBe(200)
    }
  })

  test('Keine Bild-404-Fehler auf Seiten-Demo (networkidle)', async ({ page }) => {
    const failed: string[] = []

    page.on('response', response => {
      const url = response.url()
      if (/\.(jpe?g|png|svg|webp|gif)(\?|$)/i.test(url) && response.status() >= 400) {
        failed.push(`HTTP ${response.status()} → ${url}`)
      }
    })

    await page.goto(`${BASE}/seiten/`)
    await page.waitForLoadState('networkidle')

    expect(failed, `Fehlgeschlagene Bild-Requests:\n${failed.join('\n')}`).toEqual([])
  })

  test('Keine Bild-404-Fehler auf Komponenten/Hero-Seite', async ({ page }) => {
    const failed: string[] = []

    page.on('response', response => {
      const url = response.url()
      if (/\.(jpe?g|png|svg|webp|gif)(\?|$)/i.test(url) && response.status() >= 400) {
        failed.push(`HTTP ${response.status()} → ${url}`)
      }
    })

    await page.goto(`${BASE}/komponenten/hero/`)
    await page.waitForLoadState('networkidle')

    expect(failed, `Fehlgeschlagene Bild-Requests:\n${failed.join('\n')}`).toEqual([])
  })
})
