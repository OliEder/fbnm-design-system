import ical from 'node-ical'

export interface Game {
  uid: string
  date: Date
  time: string
  homeTeam: string
  awayTeam: string
  location: string
  competition: string
  isHome: boolean
  homeScore?: number
  awayScore?: number
}

function parseTeams(summary: string): { homeTeam: string; awayTeam: string } {
  const separators = [' : ', ' - ', ' vs. ', ' vs ', ' gegen ']
  for (const sep of separators) {
    if (summary.includes(sep)) {
      const [home, away] = summary.split(sep)
      return { homeTeam: home.trim(), awayTeam: away.trim() }
    }
  }
  return { homeTeam: summary.trim(), awayTeam: '?' }
}

function parseScore(description: string): { homeScore?: number; awayScore?: number } {
  const match = description?.match(/(\d+)\s*:\s*(\d+)/)
  if (match) {
    return { homeScore: parseInt(match[1]), awayScore: parseInt(match[2]) }
  }
  return {}
}

export async function fetchGamesFromIcal(
  icalUrl: string,
  ownTeamName: string
): Promise<Game[]> {
  const events = await ical.fromURL(icalUrl)

  return Object.values(events)
    .filter((e): e is ical.VEvent => e.type === 'VEVENT')
    .map(e => {
      const start = e.start as Date
      const { homeTeam, awayTeam } = parseTeams(e.summary ?? '')
      const isHome = homeTeam.toLowerCase().includes(ownTeamName.toLowerCase())
      const time = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      const score = e.description ? parseScore(e.description) : {}
      const categories = e.categories
      const competition = Array.isArray(categories)
        ? categories.join(', ')
        : typeof categories === 'string'
          ? categories
          : ''

      return {
        uid: e.uid ?? `${start.getTime()}`,
        date: start,
        time,
        homeTeam,
        awayTeam,
        location: (e.location ?? '').trim(),
        competition,
        isHome,
        ...score,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function getUpcomingGames(games: Game[], count = 5): Game[] {
  const now = new Date()
  return games.filter(g => g.date >= now).slice(0, count)
}

export function getPastGames(games: Game[], count = 10): Game[] {
  const now = new Date()
  return games
    .filter(g => g.date < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, count)
}

export function getNextGame(games: Game[]): Game | undefined {
  return getUpcomingGames(games, 1)[0]
}
