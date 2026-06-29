// Components
export { default as Button } from './components/Button/Button.astro'
export { default as Card } from './components/Card/Card.astro'
export { default as Badge } from './components/Badge/Badge.astro'
export { default as GameCard } from './components/GameCard/GameCard.astro'
export { default as Navigation } from './components/Navigation/Navigation.astro'
export { default as Footer } from './components/Footer/Footer.astro'
export { default as Hero } from './components/Hero/Hero.astro'
export { default as PlayerCard } from './components/PlayerCard/PlayerCard.astro'
export { default as StatsTable } from './components/StatsTable/StatsTable.astro'
export { default as LiveTicker } from './components/LiveTicker/LiveTicker.astro'

// Spielbericht (Match Report) — Komposition + Teilkomponenten
export { default as Spielbericht } from './components/Spielbericht/Spielbericht.astro'
export { default as ScoreSummary } from './components/ScoreSummary/ScoreSummary.astro'
export { default as PeriodTable } from './components/PeriodTable/PeriodTable.astro'
export { default as BoxScore } from './components/BoxScore/BoxScore.astro'
export { default as LeagueStandings } from './components/LeagueStandings/LeagueStandings.astro'

// Navigation-Ergänzungen + reiche Spieltag-Statistik
export { default as Subnav } from './components/Subnav/Subnav.astro'
export { default as MatchStats } from './components/MatchStats/MatchStats.astro'

// Tokens
export * from './tokens/index'

// Lib
export * from './lib/bbb-ical'
export * from './lib/live-score-adapter'
