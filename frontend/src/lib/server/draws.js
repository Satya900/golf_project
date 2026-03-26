import { supabaseAdmin } from '@/lib/server/supabase'

function randomUniqueNumbers(count = 5, max = 45) {
  const pool = Array.from({ length: max }, (_, i) => i + 1)
  const picks = []
  while (picks.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length)
    picks.push(pool.splice(index, 1)[0])
  }
  return picks.sort((a, b) => a - b)
}

export function generateWinningNumbers() {
  return randomUniqueNumbers()
}

function addMonths(dateString, months) {
  const date = new Date(dateString)
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  return next.toISOString().slice(0, 10)
}

export async function algorithmicDraw() {
  const scoresResult = await supabaseAdmin.from('scores').select('score')
  const scoreRows = scoresResult.data || []
  if (scoreRows.length < 5) return generateWinningNumbers()

  const counts = new Map()
  for (const row of scoreRows) {
    counts.set(row.score, (counts.get(row.score) || 0) + 1)
  }

  const available = Array.from({ length: 45 }, (_, i) => i + 1)
  const winning = new Set()

  const pickWeighted = (numbers, weightFn) => {
    const pool = numbers.filter((number) => !winning.has(number))
    if (!pool.length) return null

    const totalWeight = pool.reduce((sum, number) => sum + weightFn(number), 0)
    let target = Math.random() * totalWeight

    for (const number of pool) {
      target -= weightFn(number)
      if (target <= 0) return number
    }

    return pool[pool.length - 1]
  }

  while (winning.size < 3) {
    const number = pickWeighted(available, (value) => (counts.get(value) || 0) + 1)
    if (number == null) break
    winning.add(number)
  }

  while (winning.size < 5) {
    const number = pickWeighted(available, (value) => 1 / ((counts.get(value) || 0) + 1))
    if (number == null) break
    winning.add(number)
  }

  while (winning.size < 5) {
    const number = pickWeighted(available, () => 1)
    if (number == null) break
    winning.add(number)
  }

  return Array.from(winning).sort((a, b) => a - b)
}

export async function getScoreFrequencyInsights() {
  const scoresResult = await supabaseAdmin.from('scores').select('score')
  const scoreRows = scoresResult.data || []
  const counts = new Map()

  for (const row of scoreRows) {
    counts.set(row.score, (counts.get(row.score) || 0) + 1)
  }

  const ranked = Array.from({ length: 45 }, (_, index) => ({
    score: index + 1,
    count: counts.get(index + 1) || 0,
  }))

  return {
    most_frequent: ranked
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.score - b.score)
      .slice(0, 5),
    least_frequent: ranked
      .sort((a, b) => a.count - b.count || a.score - b.score)
      .slice(0, 5),
  }
}

export async function calculatePrizePool() {
  const active = await supabaseAdmin.from('subscriptions').select('plan').eq('status', 'active')
  const rows = active.data || []
  const monthlyRate = 10
  const yearlyRate = 8.33
  const total = rows.reduce((sum, sub) => sum + (sub.plan === 'month' ? monthlyRate : yearlyRate), 0)
  const prizePortion = total * 0.6

  return {
    total: Number(prizePortion.toFixed(2)),
    five_match: Number((prizePortion * 0.4).toFixed(2)),
    four_match: Number((prizePortion * 0.35).toFixed(2)),
    three_match: Number((prizePortion * 0.25).toFixed(2)),
    subscriber_count: rows.length,
  }
}

export async function findWinners(drawId, winningNumbers) {
  const usersResult = await supabaseAdmin.from('subscriptions').select('user_id').eq('status', 'active')
  const users = usersResult.data || []
  const winningSet = new Set(winningNumbers)
  const winners = []

  for (const subscriber of users) {
    const scoresResult = await supabaseAdmin
      .from('scores')
      .select('score')
      .eq('user_id', subscriber.user_id)
      .order('played_date', { ascending: false })
      .limit(5)
      

    const userScores = (scoresResult.data || []).map((row) => row.score)
    if (userScores.length < 5) continue

    const matchedNumbers = [...new Set(userScores.filter((score) => winningSet.has(score)))].sort((a, b) => a - b)
    if (matchedNumbers.length < 3) continue

    winners.push({
      draw_id: drawId,
      user_id: subscriber.user_id,
      match_type: `${matchedNumbers.length}-match`,
      matched_numbers: matchedNumbers,
    })
  }

  return winners
}

export async function ensureUpcomingDraw(seedDate) {
  const baseDate = seedDate || new Date().toISOString().slice(0, 10)
  const nextDrawDate = addMonths(baseDate, 1)
  const existing = await supabaseAdmin.from('draws').select('id').eq('draw_date', nextDrawDate).limit(1)
  if ((existing.data || []).length) return existing.data[0]

  const latestPublished = await supabaseAdmin
    .from('draws')
    .select('jackpot_rollover')
    .eq('status', 'published')
    .order('draw_date', { ascending: false })
    .limit(1)

  const created = await supabaseAdmin.from('draws').insert({
    draw_date: nextDrawDate,
    draw_type: 'random',
    winning_numbers: [],
    jackpot_rollover: latestPublished.data?.[0]?.jackpot_rollover || 0,
  }).select('*').single()

  return created.data
}

export async function prepareDrawPreview(drawId, { persist = false } = {}) {
  const draw = await supabaseAdmin.from('draws').select('*').eq('id', drawId).single()
  if (!draw.data) {
    const error = new Error('Draw not found')
    error.status = 404
    throw error
  }
  if (draw.data.status === 'published') {
    const error = new Error('Draw already published')
    error.status = 400
    throw error
  }

  const winningNumbers = draw.data.draw_type === 'algorithmic' ? await algorithmicDraw() : generateWinningNumbers()
  const pool = await calculatePrizePool()
  const previous = await supabaseAdmin
    .from('draws')
    .select('jackpot_rollover')
    .eq('status', 'published')
    .order('draw_date', { ascending: false })
    .limit(1)
  const rollover = previous.data?.[0]?.jackpot_rollover || 0

  const winners = await findWinners(drawId, winningNumbers)
  const grouped = {
    '5-match': winners.filter((winner) => winner.match_type === '5-match'),
    '4-match': winners.filter((winner) => winner.match_type === '4-match'),
    '3-match': winners.filter((winner) => winner.match_type === '3-match'),
  }

  const poolBreakdown = {
    total_prize_pool: pool.total,
    five_match_pool: pool.five_match + rollover,
    four_match_pool: pool.four_match,
    three_match_pool: pool.three_match,
  }
  const newRollover = grouped['5-match'].length ? 0 : poolBreakdown.five_match_pool

  for (const winner of grouped['5-match']) winner.prize_amount = Number((poolBreakdown.five_match_pool / grouped['5-match'].length).toFixed(2))
  for (const winner of grouped['4-match']) winner.prize_amount = Number((poolBreakdown.four_match_pool / grouped['4-match'].length).toFixed(2))
  for (const winner of grouped['3-match']) winner.prize_amount = Number((poolBreakdown.three_match_pool / grouped['3-match'].length).toFixed(2))

  if (persist) {
    await supabaseAdmin.from('draws').update({
      winning_numbers: winningNumbers,
      ...poolBreakdown,
      jackpot_rollover: newRollover,
      status: 'simulated',
    }).eq('id', drawId)

    await supabaseAdmin.from('draw_results').delete().eq('draw_id', drawId)
    for (const winner of winners) {
      await supabaseAdmin.from('draw_results').insert(winner)
    }
  }

  return {
    draw: draw.data,
    winning_numbers: winningNumbers,
    winners_count: winners.length,
    pool: poolBreakdown,
    jackpot_rollover: newRollover,
    results: winners,
  }
}

export async function getParticipationSummary(userId) {
  const [publishedDraws, activeSubscription, upcomingDraws, enteredDraws, results] = await Promise.all([
    supabaseAdmin.from('draws').select('id', { count: 'exact' }).eq('status', 'published'),
    supabaseAdmin.from('subscriptions').select('id, status').eq('user_id', userId).eq('status', 'active').limit(1),
    supabaseAdmin.from('draws').select('*').neq('status', 'published').order('draw_date').limit(1),
    supabaseAdmin.from('scores').select('id').eq('user_id', userId),
    supabaseAdmin.from('draw_results').select('id, prize_amount').eq('user_id', userId),
  ])

  const hasEntry = (enteredDraws.data || []).length === 5 && (activeSubscription.data || []).length > 0
  const drawsEntered = hasEntry ? publishedDraws.count || 0 : 0
  const totalWon = (results.data || []).reduce((sum, row) => sum + Number(row.prize_amount || 0), 0)

  return {
    draws_entered: drawsEntered,
    upcoming_draw: upcomingDraws.data?.[0] || null,
    can_enter_next_draw: hasEntry,
    total_won: Number(totalWon.toFixed(2)),
  }
}
