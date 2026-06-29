import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = '/fbnm-design-system'

const allPages = [
  { path: `${BASE}/`,                              name: 'Startseite (Docs)' },
  { path: `${BASE}/tokens/`,                       name: 'Tokens: Farben' },
  { path: `${BASE}/tokens/typografie/`,            name: 'Tokens: Typografie' },
  { path: `${BASE}/tokens/abstaende/`,             name: 'Tokens: Abstände' },
  { path: `${BASE}/atome/button/`,                 name: 'Atom: Button' },
  { path: `${BASE}/atome/badge/`,                  name: 'Atom: Badge' },
  { path: `${BASE}/atome/card/`,                   name: 'Atom: Card' },
  { path: `${BASE}/komponenten/navigation/`,       name: 'Komponente: Navigation' },
  { path: `${BASE}/komponenten/hero/`,             name: 'Komponente: Hero' },
  { path: `${BASE}/komponenten/footer/`,           name: 'Komponente: Footer' },
  { path: `${BASE}/komponenten/gamecard/`,         name: 'Komponente: GameCard' },
  { path: `${BASE}/komponenten/spielplan/`,        name: 'Komponente: GameSchedule (Spielplan)' },
  { path: `${BASE}/komponenten/playercard/`,       name: 'Komponente: PlayerCard' },
  { path: `${BASE}/komponenten/statstable/`,       name: 'Komponente: StatsTable' },
  { path: `${BASE}/komponenten/liveticker/`,       name: 'Komponente: LiveTicker' },
  { path: `${BASE}/seiten/`,                       name: 'Seiten: Startseite-Komposition' },
]

for (const { path, name } of allPages) {
  test(`Barrierefreiheit — ${name}`, async ({ page }) => {
    await page.goto(path)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // Exclude third-party embedded iframes if any
      .exclude('iframe')
      .analyze()

    const violationSummary = results.violations
      .map(v =>
        `[${v.id}] ${v.description}\n` +
        v.nodes.slice(0, 3).map(n => `  ↳ ${n.html.slice(0, 120)}`).join('\n')
      )
      .join('\n\n')

    expect(results.violations, violationSummary).toEqual([])
  })
}
