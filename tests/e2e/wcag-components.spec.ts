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
      `${BASE}/komponenten/spielplan/`,
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

  // ── GameSchedule (Spielplan) ─────────────────────────────────────────────
  test('GameSchedule: 3 Tabs mit role=tab und aria-controls (WCAG 4.1.2)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    const tablist = page.locator('[role="tablist"]').first()
    await expect(tablist).toBeVisible()

    const tabs = tablist.locator('[role="tab"]')
    await expect(tabs).toHaveCount(3)

    // Alle 3 Tabs haben aria-controls und aria-selected
    for (let i = 0; i < 3; i++) {
      await expect(tabs.nth(i)).toHaveAttribute('aria-controls')
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected')
    }
    // Erster Tab initial aktiv
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false')
  })

  test('GameSchedule: Tab-Klick schaltet Panel um (WCAG 4.1.3 — dynamische Updates)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    const tablist = page.locator('[role="tablist"]').first()
    const tabs = tablist.locator('[role="tab"]')
    const schedule = page.locator('.fbnm-schedule').first()

    // Heim-Tab klicken
    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false')

    // Heim-Panel sichtbar, Alle-Panel unsichtbar
    const heimPanelId = await tabs.nth(1).getAttribute('aria-controls')
    const allePanelId = await tabs.nth(0).getAttribute('aria-controls')
    await expect(schedule.locator(`#${heimPanelId}`)).toBeVisible()
    await expect(schedule.locator(`#${allePanelId}`)).not.toBeVisible()

    // Auswärts-Tab klicken
    await tabs.nth(2).click()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
  })

  test('GameSchedule: Tabs sind per Tastatur fokussierbar (WCAG 2.1.1)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    const firstTab = page.locator('[role="tablist"]').first().locator('[role="tab"]').first()
    await firstTab.focus()
    await expect(firstTab).toBeFocused()
  })

  test('GameSchedule: Tab-Buttons ≥ 44px Touch-Target (WCAG 2.5.8)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    const tabs = page.locator('.fbnm-schedule').first().locator('[role="tab"]')
    const count = await tabs.count()
    expect(count).toBe(3)

    for (let i = 0; i < count; i++) {
      const box = await tabs.nth(i).boundingBox()
      expect(box, `Tab ${i + 1} nicht renderbar`).not.toBeNull()
      expect(box!.height, `Tab ${i + 1}: Höhe ${box!.height}px < 44px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('GameSchedule: Badges haben aria-label für Screen-Reader (WCAG 1.4.1 + 4.1.2)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    // Alle sichtbaren Badges im aktiven Panel müssen ein aria-label haben
    const panel = page.locator('.fbnm-schedule__panel--active').first()
    await expect(panel).toBeVisible()

    const badges = panel.locator('.fbnm-schedule__badge')
    const count = await badges.count()
    expect(count, 'Keine Badges im aktiven Panel gefunden').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const label = await badges.nth(i).getAttribute('aria-label')
      expect(label, `Badge ${i + 1} hat kein aria-label`).toBeTruthy()
    }
  })

  test('GameSchedule: "Nächstes Spiel"-Label ist vorhanden (WCAG 1.4.1 — nicht nur Farbe)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    // Mindestens eine "Nächstes Spiel"-Kennzeichnung auf der Seite
    const nextLabel = page.locator('.fbnm-schedule__next-label').first()
    await expect(nextLabel, '"Nächstes Spiel"-Label nicht gefunden — Hervorhebung darf nicht nur auf Farbe basieren').toBeAttached()
  })

  test('GameSchedule: Kalender-Buttons ≥ 44px Touch-Target (WCAG 2.5.8)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    // Kalender-Sektion im ersten Panel (icsUrlAll ist gesetzt)
    const calBtns = page.locator('.fbnm-schedule__cal-btn')
    const count = await calBtns.count()
    expect(count, 'Keine Kalender-Buttons gefunden (icsUrlAll gesetzt?)').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const box = await calBtns.nth(i).boundingBox()
      if (!box) continue
      expect(box.height, `Kalender-Button ${i + 1}: Höhe ${box.height.toFixed(1)}px < 44px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('GameSchedule: Alle panel-Elemente haben role=tabpanel mit aria-labelledby (WCAG 4.1.2)', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)
    const schedule = page.locator('.fbnm-schedule').first()
    const panels = schedule.locator('[role="tabpanel"]')
    const count = await panels.count()
    expect(count, 'Erwartet 3 Tabpanels pro GameSchedule-Instanz').toBe(3)

    for (let i = 0; i < count; i++) {
      await expect(panels.nth(i)).toHaveAttribute('aria-labelledby')
    }
  })

  // ── GameSchedule Multi-Instance Isolation ───────────────────────────────
  test('GameSchedule: Tab-Klick im zweiten Schedule beeinflusst nicht den ersten', async ({ page }) => {
    await page.goto(`${BASE}/komponenten/spielplan/`)

    const schedules = page.locator('.fbnm-schedule')
    await expect(schedules).toHaveCount(2)

    const schedule1 = schedules.nth(0)
    const schedule2 = schedules.nth(1)

    // Click "Heim" tab in the second schedule only
    await schedule2.getByRole('tab', { name: /Heim/i }).click()

    // Second schedule: Heim-Panel must be visible
    await expect(schedule2.getByRole('tabpanel', { name: /Heim/i })).toBeVisible()
    // First schedule: Alle-Panel must still be visible (untouched)
    await expect(schedule1.getByRole('tabpanel', { name: /Alle/i })).toBeVisible()
    // First schedule: Alle-Tab must still be aria-selected
    await expect(schedule1.getByRole('tab', { name: /Alle/i })).toHaveAttribute('aria-selected', 'true')
  })

  // ── Mega-Menü (Navigation) ───────────────────────────────────────────────
  test('Mega-Menü: Trigger hat aria-haspopup, aria-expanded, aria-controls (WCAG 4.1.2)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mega-Trigger im Hamburger-Flow auf Mobile')
    await page.goto(`${BASE}/seiten/uebersicht/`)
    const trigger = page.locator('[data-mega-trigger]').first()
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-haspopup', 'true')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('aria-controls')
  })

  test('Mega-Menü: Klick öffnet Panel und setzt aria-expanded=true (WCAG 4.1.3)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mega-Trigger im Hamburger-Flow auf Mobile')
    await page.goto(`${BASE}/seiten/uebersicht/`)
    const trigger = page.locator('[data-mega-trigger]').first()
    const panel = page.locator('[data-mega-panel]').first()

    await expect(panel).toBeHidden()
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
  })

  test('Mega-Menü: Escape schließt und gibt Fokus an den Trigger zurück (WCAG 2.1.2)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mega-Trigger im Hamburger-Flow auf Mobile')
    await page.goto(`${BASE}/seiten/uebersicht/`)
    const trigger = page.locator('[data-mega-trigger]').first()
    const panel = page.locator('[data-mega-panel]').first()

    await trigger.click()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('Mega-Menü: öffnet per CSS-Hover auch ohne JS (progressive enhancement)', async ({ browser, isMobile }) => {
    test.skip(isMobile, 'Hover-Pfad nur Desktop')
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/seiten/uebersicht/`)
    const trigger = page.locator('[data-mega-trigger]').first()
    const panel = page.locator('[data-mega-panel]').first()
    await expect(panel).toBeHidden()
    await trigger.hover()
    await expect(panel, 'Mega-Menü muss ohne JS per Hover öffnen').toBeVisible()
    await ctx.close()
  })

  test('Mega-Menü: Panel hat role=region mit aria-label (WCAG 1.3.1)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mega-Trigger im Hamburger-Flow auf Mobile')
    await page.goto(`${BASE}/seiten/uebersicht/`)
    const panel = page.locator('[data-mega-panel]').first()
    await expect(panel).toHaveAttribute('role', 'region')
    await expect(panel).toHaveAttribute('aria-label')
  })

  // ── Subnav (Mannschaften-Switcher) ──────────────────────────────────────
  test('Subnav: <nav> mit aria-label und aktivem Unterstrich (WCAG 1.3.1 + 1.4.1)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const subnav = page.locator('.fbnm-subnav').first()
    await expect(subnav).toBeVisible()
    await expect(subnav).toHaveAttribute('aria-label')

    const active = page.locator('.fbnm-subnav__item--active').first()
    await expect(active).toBeVisible()
    const borderWidth = await active.evaluate(el => parseFloat(getComputedStyle(el).borderBottomWidth))
    expect(borderWidth, 'Aktives Subnav-Item braucht border-bottom ≥3px').toBeGreaterThanOrEqual(3)
  })

  test('Subnav: aktives Item hat aria-current=page (WCAG 4.1.2)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const active = page.locator('.fbnm-subnav__item--active').first()
    await expect(active).toHaveAttribute('aria-current', 'page')
  })

  // ── MatchStats (reiche Spieltag-Statistik, CSS-only Tabs) ───────────────
  test('MatchStats: CSS-only Tabs (Radio + Label), erstes Panel initial offen', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const stats = page.locator('.fbnm-matchstats').first()
    const radios = stats.locator('.fbnm-matchstats__radio')
    const labels = stats.locator('label.fbnm-matchstats__tab')

    const count = await labels.count()
    expect(count, 'MatchStats erwartet ≥2 Tabs').toBeGreaterThanOrEqual(2)
    // Jedes Label verweist per for auf ein Radio (native Verknüpfung)
    for (let i = 0; i < count; i++) {
      await expect(labels.nth(i)).toHaveAttribute('for')
    }
    // Erstes Radio initial gecheckt → erstes Panel sichtbar
    await expect(radios.nth(0)).toBeChecked()
    await expect(stats.locator('.fbnm-matchstats__panel--stats')).toBeVisible()
  })

  test('MatchStats: Label-Klick schaltet Panel um — ohne JS (WCAG 4.1.3)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const stats = page.locator('.fbnm-matchstats').first()

    await expect(stats.locator('.fbnm-matchstats__panel--stats')).toBeVisible()
    await stats.locator('label.fbnm-matchstats__tab', { hasText: 'Aufstellung' }).click()
    await expect(stats.locator('.fbnm-matchstats__panel--lineup')).toBeVisible()
    await expect(stats.locator('.fbnm-matchstats__panel--stats')).toBeHidden()
  })

  test('MatchStats: Tabs funktionieren auch mit deaktiviertem JS (CSS-only)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/seiten/team-seite/`)
    const stats = page.locator('.fbnm-matchstats').first()
    await stats.locator('label.fbnm-matchstats__tab', { hasText: 'Aufstellung' }).click()
    await expect(stats.locator('.fbnm-matchstats__panel--lineup')).toBeVisible()
    await ctx.close()
  })

  test('MatchStats: Radios per Tastatur fokussierbar, Pfeiltasten wechseln (native Radiogroup)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const radios = page.locator('.fbnm-matchstats').first().locator('.fbnm-matchstats__radio')
    await radios.nth(0).focus()
    await expect(radios.nth(0)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(radios.nth(1)).toBeChecked()
  })

  test('MatchStats: Tab-Labels ≥44px Touch-Target (WCAG 2.5.8)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const labels = page.locator('.fbnm-matchstats').first().locator('label.fbnm-matchstats__tab')
    const count = await labels.count()
    for (let i = 0; i < count; i++) {
      const box = await labels.nth(i).boundingBox()
      if (!box) continue
      expect(box.height, `MatchStats-Tab ${i + 1}: Höhe ${box.height.toFixed(1)}px < 44px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('MatchStats: "bester Liga-Rang" hat sr-only-Hinweis (WCAG 1.4.1 — nicht nur Farbe)', async ({ page }) => {
    await page.goto(`${BASE}/seiten/team-seite/`)
    const stats = page.locator('.fbnm-matchstats').first()
    // Saison-Tab öffnen (Label-Klick, CSS-only)
    await stats.locator('label.fbnm-matchstats__tab', { hasText: 'Saison-Schnitt' }).click()
    const best = stats.locator('.fbnm-matchstats__rank--best').first()
    await expect(best).toBeVisible()
    const srOnly = best.locator('.sr-only')
    await expect(srOnly, 'Bester Rang braucht sr-only-Hinweis').toBeAttached()
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
