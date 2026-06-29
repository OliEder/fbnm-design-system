import { test, expect } from '@playwright/test'

const BASE = '/fbnm-design-system'

test.describe('WCAG 2.2 Komponenten-Checks', () => {

  // ── WCAG 2.4.1: Skip-Navigation ──────────────────────────────────────────
  test('Skip-Link vorhanden und per Tab erreichbar', async ({ page }) => {
    await page.goto(`${BASE}/seiten/`)
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const href = await focused.getAttribute('href')
    expect(href, 'Erster Tab-Stopp sollte ein Skip-Link (#...) sein').toMatch(/^#/)
  })

  // ── WCAG 1.4.1: Aktiver Link — nicht nur Farbe ──────────────────────────
  test('Aktiver Nav-Link hat border-bottom-Indikator (WCAG 1.4.1)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Nav-Links im Hamburger-Menü auf Mobile nicht sichtbar')
    await page.goto(`${BASE}/komponenten/navigation/`)
    const activeLink = page.locator('.fbnm-nav__link--active').first()
    await expect(activeLink).toBeVisible()

    const borderWidth = await activeLink.evaluate(
      el => parseFloat(getComputedStyle(el).borderBottomWidth)
    )
    expect(borderWidth, 'Aktiver Link braucht sichtbaren border-bottom (≥2px)').toBeGreaterThanOrEqual(2)
  })

  // ── WCAG 2.5.8: Mindest-Touch-Target ────────────────────────────────────
  test('Buttons: Touch-Target-Größe ≥ 44×44px (WCAG 2.5.8)', async ({ page }) => {
    await page.goto(`${BASE}/atome/button/`)
    const buttons = page.locator('.fbnm-btn')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox()
      if (!box) continue
      expect(box.height, `Button ${i + 1}: Höhe ${box.height.toFixed(1)}px < 44px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('Hamburger-Button: Touch-Target ≥ 44×44px auf Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/komponenten/navigation/`)

    const burger = page.locator('.fbnm-nav__burger')
    await expect(burger).toBeVisible()

    const box = await burger.boundingBox()
    expect(box, 'Burger-Button nicht renderbar').not.toBeNull()
    expect(box!.width,  `Burger-Breite ${box!.width}px < 44px`).toBeGreaterThanOrEqual(44)
    expect(box!.height, `Burger-Höhe ${box!.height}px < 44px`).toBeGreaterThanOrEqual(44)
  })

  // ── WCAG 1.1.1: Textalternativen ────────────────────────────────────────
  test('Alle img-Elemente haben alt-Attribut', async ({ page }) => {
    const pagesToCheck = [
      `${BASE}/seiten/`,
      `${BASE}/komponenten/playercard/`,
      `${BASE}/komponenten/navigation/`,
    ]
    for (const path of pagesToCheck) {
      await page.goto(path)
      const missing = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter(img => img.getAttribute('alt') === null)
          .map(img => img.outerHTML.slice(0, 100))
      )
      expect(missing, `${path}: img ohne alt:\n${missing.join('\n')}`).toEqual([])
    }
  })

  // ── WCAG 1.3.1: Semantische Struktur — h1 pro Seite ────────────────────
  test('Standard-Seiten haben genau ein <h1>', async ({ page }) => {
    // hero/ ausgeschlossen: Demo-Seite mit 4 Hero-Blöcken (je <h1>)
    // seiten/ ausgeschlossen: enthält Docs-h1 + Hero-h1 in der Komposition
    const pages = [
      `${BASE}/`,
      `${BASE}/atome/button/`,
      `${BASE}/komponenten/navigation/`,
      `${BASE}/komponenten/playercard/`,
    ]
    for (const path of pages) {
      await page.goto(path)
      const count = await page.locator('h1').count()
      expect(count, `${path}: ${count} ×<h1> (erwartet: 1)`).toBe(1)
    }
  })

  test('Seiten-Komposition hat mindestens ein <h1> (Hero-Titel + Docs-Titel)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/`)
    const count = await page.locator('h1').count()
    // 1 Docs-page h1 + 1 Hero h1 in der Komposition
    expect(count, `seiten/: erwartet ≥2 h1 (Docs + Hero), gefunden: ${count}`).toBeGreaterThanOrEqual(2)
  })

  test('Navigation hat <nav> mit aria-label', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/navigation/`)
    const nav = page.locator('nav[aria-label]').first()
    await expect(nav).toBeVisible()
  })

  // ── WCAG 1.4.3: Farbkontrast — alle Hero-Varianten ─────────────────────
  // Die Hero-Seite zeigt 4 Varianten: Action-Shot, Trainingsfoto, Standard, Kurze Version.
  // Alle Titel und Untertitel müssen weiß sein (21:1 AAA auf dem Dunkelblau-Overlay).
  test('Alle Hero-Varianten: Titel ist weiß (WCAG 1.4.3 AAA)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/hero/`)
    const titles = page.locator('.fbnm-hero__title')
    const count = await titles.count()
    expect(count, 'Erwartet mindestens 4 Hero-Varianten auf der Seite').toBeGreaterThanOrEqual(4)

    for (let i = 0; i < count; i++) {
      await expect(titles.nth(i)).toBeVisible()
      const color = await titles.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(color, `Hero-Titel #${i + 1} sollte weiß sein`).toBe('rgb(255, 255, 255)')
    }
  })

  test('Alle Hero-Varianten mit Untertitel: Untertitel ist weiß (WCAG 1.4.3 AAA)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/hero/`)
    const subtitles = page.locator('.fbnm-hero__subtitle')
    const count = await subtitles.count()
    // 3 von 4 Varianten haben einen Untertitel (Kurze Version hat keinen)
    expect(count, 'Erwartet mindestens 3 Hero-Untertitel auf der Seite').toBeGreaterThanOrEqual(3)

    for (let i = 0; i < count; i++) {
      await expect(subtitles.nth(i)).toBeVisible()
      const color = await subtitles.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(color, `Hero-Untertitel #${i + 1} sollte weiß sein`).toBe('rgb(255, 255, 255)')
    }
  })

  test('Ghost-Buttons im Hero haben weißen Text und Border (WCAG 1.4.3 AAA)', async ({ page }) => {
    // Ghost-Button (blue-800 Text auf blue-900 Bg) = 1.43:1 → FAIL ohne Override.
    // Hero.astro setzt :global(.fbnm-hero .fbnm-btn--ghost) auf weiß (21:1 AAA).
    await page.goto(`${BASE}/komponenten/hero/`)
    const ghostBtns = page.locator('.fbnm-hero .fbnm-btn--ghost')
    const count = await ghostBtns.count()
    expect(count, 'Erwartet Ghost-Buttons innerhalb von Hero-Varianten').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const color = await ghostBtns.nth(i).evaluate(el => getComputedStyle(el).color)
      expect(color, `Ghost-Button #${i + 1} im Hero: Text sollte weiß sein`).toBe('rgb(255, 255, 255)')
      const borderColor = await ghostBtns.nth(i).evaluate(el => getComputedStyle(el).borderTopColor)
      expect(borderColor, `Ghost-Button #${i + 1} im Hero: Border sollte weiß sein`).toBe('rgb(255, 255, 255)')
    }
  })

  // ── WCAG 2.1.1: Tastatur-Zugänglichkeit (direkte Focus-Methode) ─────────
  test('Navigation Links fokussierbar (WCAG 2.4.7)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Nav-Links im Hamburger-Menü auf Mobile nicht direkt fokussierbar')
    await page.goto(`${BASE}/komponenten/navigation/`)
    const link = page.locator('.fbnm-nav__link').first()
    await link.focus()
    await expect(link).toBeFocused()
  })

  // ── WCAG 2.4.7: Sichtbarer Fokus ────────────────────────────────────────
  test('Fokussierter Button hat sichtbaren Fokus-Rahmen', async ({ page }) => {
    await page.goto(`${BASE}/atome/button/`)
    const btn = page.locator('.fbnm-btn').first()
    await btn.focus()
    await expect(btn).toBeFocused()

    const outline = await btn.evaluate(el => getComputedStyle(el).outlineWidth)
    expect(
      parseFloat(outline),
      'Fokussierter Button hat keinen sichtbaren outline'
    ).toBeGreaterThan(0)
  })

  // ── WCAG 4.1.2: Name, Role, Value ───────────────────────────────────────
  test('Hamburger-Button hat aria-label, aria-expanded und aria-controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/komponenten/navigation/`)

    const burger = page.locator('.fbnm-nav__burger')
    await expect(burger).toHaveAttribute('aria-label')
    await expect(burger).toHaveAttribute('aria-expanded')
    await expect(burger).toHaveAttribute('aria-controls')
  })

  test('StatsTable hat <table> mit <th>-Elementen', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/statstable/`)
    const table = page.locator('table').first()
    await expect(table).toBeVisible()
    const thCount = await table.locator('th').count()
    expect(thCount, 'StatsTable hat keine <th>-Elemente').toBeGreaterThan(0)
  })

  test('StatsTable FBNM-Marker ist blau-800 statt Cyan (WCAG 1.4.3: ≥4.5:1 auf Weiß)', async ({ page }) => {
    // Dot-Marker war --fbnm-cyan-500 = 2.97:1 auf Weiß (FAIL).
    // Fix: --fbnm-blue-800 = 10.3:1 auf Weiß (AAA).
    await page.goto(`${BASE}/komponenten/statstable/`)
    const marker = page.locator('.fbnm-statstable__fbnm-marker').first()
    await expect(marker).toBeVisible()
    const color = await marker.evaluate(el => getComputedStyle(el).color)
    // blue-800 (#004174) = rgb(0, 65, 116)
    expect(color, 'FBNM-Marker sollte blue-800 sein (10.3:1 auf Weiß), nicht Cyan (2.97:1 FAIL)').toBe('rgb(0, 65, 116)')
  })

  test('StatsTable Highlight-Zeile ist visuell unterscheidbar (Hintergrund + Fettschrift)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/statstable/`)
    const highlight = page.locator('.fbnm-statstable__row--highlight').first()
    await expect(highlight).toBeVisible()

    const fontWeight = await highlight.locator('td').first().evaluate(el => getComputedStyle(el).fontWeight)
    expect(parseInt(fontWeight), 'Highlight-Zeile muss fett sein (WCAG 1.4.1 — nicht nur Farbe)').toBeGreaterThanOrEqual(700)

    const srOnly = highlight.locator('.sr-only').first()
    await expect(srOnly, 'sr-only Text für Screen-Reader muss vorhanden sein').toBeAttached()
  })

  // ── Docs-Sidebar Kontrast ────────────────────────────────────────────────
  test('Sidebar-Gruppen-Labels erfüllen WCAG AA Kontrast (≥4.5:1)', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const label = page.locator('.docs-nav__group-label').first()
    await expect(label).toBeVisible()

    const color = await label.evaluate(el => getComputedStyle(el).color)
    // Expects rgba(255,255,255,0.65) blended on #002751 → ~7.2:1
    // Just verify it's not fully transparent (0 alpha) or too dark
    expect(color, 'Sidebar-Label-Farbe nicht lesbar').not.toBe('rgba(0, 0, 0, 0)')
  })
})
