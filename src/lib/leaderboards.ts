export type RankingMetric = 'points' | 'wins' | 'scoreDifference' | 'goalDifference' | 'setsDifference' | 'mapDifference' | 'placementPoints' | 'eliminationPoints' | 'totalScore'
export type LeaderboardEntry = { id: string; name: string; played: number; wins: number; losses: number; draws: number; points: number; scoreDifference?: number; goalDifference?: number; setsDifference?: number; mapDifference?: number; placementPoints?: number; eliminationPoints?: number; totalScore?: number }
export type RankingRule = { primary: RankingMetric; tieBreakers: RankingMetric[] }

const value = (entry: LeaderboardEntry, metric: RankingMetric) => entry[metric] ?? 0

/** Deterministic ranking for final results. Ties remain tied when rules cannot separate them. */
export function rankLeaderboard(entries: LeaderboardEntry[], rule: RankingRule): LeaderboardEntry[] {
  const metrics = [rule.primary, ...rule.tieBreakers.filter((metric, index, list) => metric !== rule.primary && list.indexOf(metric) === index)]
  return entries.map(entry => ({ ...entry })).sort((a, b) => {
    for (const metric of metrics) {
      const difference = value(b, metric) - value(a, metric)
      if (difference !== 0) return difference
    }
    return a.name.localeCompare(b.name)
  })
}

export function rankingReason(entry: LeaderboardEntry, opponent: LeaderboardEntry, rule: RankingRule): string {
  const metrics = [rule.primary, ...rule.tieBreakers]
  const deciding = metrics.find(metric => value(entry, metric) !== value(opponent, metric))
  if (!deciding) return 'All configured ranking values are equal.'
  return `${deciding}: ${value(entry, deciding)} versus ${value(opponent, deciding)}`
}
