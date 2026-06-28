export interface GameState {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  quarter: number
  timeRemaining: string
  isLive: boolean
  lastUpdated: string
}

export interface LiveScoreAdapter {
  getCurrentGame(): Promise<GameState | null>
}

export class PollingAdapter implements LiveScoreAdapter {
  private url: string

  constructor(url: string) {
    this.url = url
  }

  async getCurrentGame(): Promise<GameState | null> {
    try {
      const res = await fetch(this.url, { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json() as GameState | null
      return data?.isLive ? data : null
    } catch {
      return null
    }
  }
}

// Placeholder for future Basketball-Bund live API
export class BasketballBundLiveAdapter implements LiveScoreAdapter {
  async getCurrentGame(): Promise<GameState | null> {
    // TODO: implement when official live API is available
    return null
  }
}

export function createLiveScoreAdapter(): LiveScoreAdapter {
  const url = '/api/live-score.php'
  return new PollingAdapter(url)
}
