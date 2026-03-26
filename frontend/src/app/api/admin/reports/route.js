import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { calculatePrizePool, getScoreFrequencyInsights } from '@/lib/server/draws'

export async function GET(request) {
  try {
    await requireAdmin(request)
    const [users, activeSubs, pool, contributions, draws, winners, drawRows, scoreInsights] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
      supabaseAdmin.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
      calculatePrizePool(),
      supabaseAdmin.from('charity_contributions').select('amount'),
      supabaseAdmin.from('draws').select('id', { count: 'exact' }).eq('status', 'published'),
      supabaseAdmin.from('draw_results').select('id, prize_amount'),
      supabaseAdmin.from('draws').select('id, draw_date, status, draw_type, total_prize_pool, jackpot_rollover').order('draw_date', { ascending: false }).limit(6),
      getScoreFrequencyInsights(),
    ])

    const totalCharity = (contributions.data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const totalPrizesAwarded = (winners.data || []).reduce((sum, row) => sum + Number(row.prize_amount || 0), 0)
    const drawStats = (drawRows.data || []).reduce((stats, draw) => {
      stats[draw.status] = (stats[draw.status] || 0) + 1
      stats[draw.draw_type] = (stats[draw.draw_type] || 0) + 1
      return stats
    }, { pending: 0, simulated: 0, published: 0, random: 0, algorithmic: 0 })

    return json({
      total_users: users.count || 0,
      active_subscribers: activeSubs.count || 0,
      prize_pool: pool,
      total_charity_contributions: Number(totalCharity.toFixed(2)),
      total_draws: draws.count || 0,
      total_winners: (winners.data || []).length,
      total_prizes_awarded: Number(totalPrizesAwarded.toFixed(2)),
      draw_statistics: drawStats,
      score_frequency: scoreInsights,
      recent_draws: drawRows.data || [],
    })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
