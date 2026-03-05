'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Player = {
    id: string
    name: string
    position: string
    shirt_number: number | null
    team_id: string
    team_name: string
}

type StatSummary = {
    goals: number
    assists: number
    yellow: number
    red: number
    potm: number
    matches: number
}

type MatchAppearance = {
    match_id: string
    match_date: string
    home_team: string
    away_team: string
    home_score: number
    away_score: number
    status: string
    events: { type: string; minute: number | null }[]
}

function shortName(name: string): string {
    const map: Record<string, string> = {
        'HILLSBOROUGH WANDERERS': 'Hillsborough',
        'ECCLESALL RANGERS': 'Ecclesall',
        'SHIREGREEN UNITED FC': 'Shiregreen',
        'PITSMOOR ROVERS': 'Pitsmoor',
        'DARNALL CITY STARS': 'Darnall',
        'BROOMHILL ATHLETIC': 'Broomhill',
    }
    return map[name] || name.split(' ')[0]
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #080f08;
    font-family: 'Barlow', sans-serif;
    color: #fff;
    padding-bottom: 100px;
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    padding: 0 24px 32px;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 100% 100% at 80% 0%, rgba(34,197,94,0.12) 0%, transparent 55%),
      radial-gradient(ellipse 60% 80% at 10% 100%, rgba(16,80,16,0.25) 0%, transparent 50%);
  }
  .hero-grid {
    position: absolute; inset: 0; z-index: 0; opacity: 0.035;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px),
      repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px);
  }
  .hero-inner { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; }

  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3);
    text-decoration: none; padding: 20px 0 20px; transition: color 0.15s;
  }
  .back-link:hover { color: #22c55e; }

  .player-header { display: flex; align-items: flex-end; gap: 20px; margin-bottom: 8px; }

  .player-avatar {
    width: 72px; height: 72px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,80,16,0.4));
    border: 1px solid rgba(34,197,94,0.25);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #22c55e;
    flex-shrink: 0;
  }

  .player-info {}
  .player-number {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3);
    margin-bottom: 4px;
  }
  .player-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 8vw, 64px);
    line-height: 0.9; letter-spacing: 0.02em; color: #fff;
  }
  .player-meta {
    display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap;
  }
  .meta-pill {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px; padding: 4px 12px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.07em; color: rgba(255,255,255,0.45);
  }
  .meta-pill.green { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.25); color: #22c55e; }

  /* ── Body ── */
  .body { padding: 0 24px; max-width: 860px; margin: 0 auto; }

  /* ── Stat grid ── */
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 32px; margin-top: 28px; }
  @media (min-width: 500px) { .stat-grid { grid-template-columns: repeat(5, 1fr); } }

  .stat-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 14px 10px; text-align: center;
  }
  .stat-card-icon  { font-size: 18px; margin-bottom: 5px; }
  .stat-card-value { font-family: 'Bebas Neue', sans-serif; font-size: 28px; line-height: 1; }
  .stat-card-label { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.22); margin-top: 3px; }

  /* ── Section head ── */
  .sec-head { margin-bottom: 12px; margin-top: 28px; }
  .sec-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: #fff; letter-spacing: 0.04em; }

  /* ── Match history ── */
  .match-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 14px 16px; margin-bottom: 8px;
  }
  .match-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .match-date { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.07em; color: rgba(255,255,255,0.25); }
  .match-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .m-team { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); flex: 1; }
  .m-team.home { text-align: left; }
  .m-team.away { text-align: right; }
  .m-scores { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
  .m-score { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: #fff; line-height: 1; min-width: 18px; text-align: center; }
  .m-sep { font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: rgba(255,255,255,0.2); }

  .match-events { display: flex; gap: 6px; flex-wrap: wrap; }
  .event-tag {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; padding: 3px 8px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.04em; color: rgba(255,255,255,0.45);
  }
  .event-tag.goal   { background: rgba(34,197,94,0.1);  border-color: rgba(34,197,94,0.25);  color: #22c55e; }
  .event-tag.assist { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #60a5fa; }
  .event-tag.yellow { background: rgba(234,179,8,0.1);  border-color: rgba(234,179,8,0.25);  color: #facc15; }
  .event-tag.red    { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.25);  color: #f87171; }
  .event-tag.potm   { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.25); color: #c084fc; }

  /* ── Empty ── */
  .empty { text-align: center; padding: 40px 20px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.18); }

  /* Loading */
  .loading-wrap { display: flex; align-items: center; justify-content: center; padding: 80px 0; gap: 10px; }
  .spinner { width: 28px; height: 28px; border: 2px solid rgba(34,197,94,0.2); border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); }
`

const STAT_DEFS = [
    { key: 'goals', icon: '⚽', label: 'Goals', color: '#22c55e' },
    { key: 'assists', icon: '🅰️', label: 'Assists', color: '#60a5fa' },
    { key: 'yellow', icon: '🟨', label: 'Yellows', color: '#facc15' },
    { key: 'red', icon: '🟥', label: 'Reds', color: '#f87171' },
    { key: 'potm', icon: '⭐', label: 'POTM', color: '#c084fc' },
]

export default function PlayerProfilePage() {
    const params = useParams()
    const playerId = params?.id as string

    const [player, setPlayer] = useState<Player | null>(null)
    const [stats, setStats] = useState<StatSummary>({ goals: 0, assists: 0, yellow: 0, red: 0, potm: 0, matches: 0 })
    const [appearances, setAppearances] = useState<MatchAppearance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (playerId) fetchData() }, [playerId])

    const fetchData = async () => {
        // Player info
        const { data: playerData } = await supabase
            .from('players')
            .select('id, name, position, shirt_number, team_id')
            .eq('id', playerId)
            .single()

        if (!playerData) { setLoading(false); return }

        const { data: teamsData } = await supabase.from('teams').select('id, name')
        const teamName = teamsData?.find((t: any) => t.id === playerData.team_id)?.name || 'Unknown'

        setPlayer({ ...playerData, team_name: teamName })

        // All events for this player
        const { data: events } = await supabase
            .from('match_events')
            .select('id, type, minute, match_id')
            .eq('player_id', playerId)

        if (!events) { setLoading(false); return }

        // Stats summary
        const summary = { goals: 0, assists: 0, yellow: 0, red: 0, potm: 0, matches: 0 }
        events.forEach((e: any) => {
            if (e.type === 'goal') summary.goals++
            if (e.type === 'assist') summary.assists++
            if (e.type === 'yellow') summary.yellow++
            if (e.type === 'red') summary.red++
            if (e.type === 'potm') summary.potm++
        })

        // Unique matches played
        const matchIds = [...new Set(events.map((e: any) => e.match_id))]
        summary.matches = matchIds.length
        setStats(summary)

        // Fetch those matches
        if (matchIds.length > 0) {
            const { data: matchesData } = await supabase
                .from('matches')
                .select('id, home_team_id, away_team_id, match_date, status, home_score, away_score')
                .in('id', matchIds)
                .order('match_date', { ascending: false })

            if (matchesData && teamsData) {
                const enriched = matchesData.map((m: any) => ({
                    match_id: m.id,
                    match_date: m.match_date,
                    home_team: teamsData.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown',
                    away_team: teamsData.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown',
                    home_score: m.home_score,
                    away_score: m.away_score,
                    status: m.status,
                    events: events.filter((e: any) => e.match_id === m.id).map((e: any) => ({ type: e.type, minute: e.minute })),
                }))
                setAppearances(enriched)
            }
        }

        setLoading(false)
    }

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

    const eventLabel = (type: string, minute: number | null) => {
        const icons: Record<string, string> = { goal: '⚽ Goal', assist: '🅰️ Assist', yellow: '🟨 Yellow', red: '🟥 Red', potm: '⭐ POTM' }
        const label = icons[type] || type
        return minute ? `${label} ${minute}'` : label
    }

    if (loading) return (
        <>
            <style>{STYLES}</style>
            <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        </>
    )

    if (!player) return (
        <>
            <style>{STYLES}</style>
            <div className="empty">Player not found</div>
        </>
    )

    const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">

                {/* Hero */}
                <div className="hero">
                    <div className="hero-bg" />
                    <div className="hero-grid" />
                    <div className="hero-inner">
                        <Link href="/stats" className="back-link">← Back to Stats</Link>

                        <div className="player-header">
                            <div className="player-avatar">{initials}</div>
                            <div className="player-info">
                                {player.shirt_number && (
                                    <div className="player-number">#{player.shirt_number}</div>
                                )}
                                <div className="player-name">{player.name}</div>
                            </div>
                        </div>

                        <div className="player-meta">
                            <span className="meta-pill green">
                                {shortName(player.team_name)}
                            </span>
                            <span className="meta-pill">
                                {player.position === 'GK' ? '🧤 Goalkeeper' : '⚽ Outfield'}
                            </span>
                            <span className="meta-pill">
                                {stats.matches} {stats.matches === 1 ? 'appearance' : 'appearances'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="body">

                    {/* Stat grid */}
                    <div className="stat-grid">
                        {STAT_DEFS.map(s => (
                            <div key={s.key} className="stat-card">
                                <div className="stat-card-icon">{s.icon}</div>
                                <div className="stat-card-value" style={{ color: stats[s.key as keyof StatSummary] > 0 ? s.color : 'rgba(255,255,255,0.2)' }}>
                                    {stats[s.key as keyof StatSummary]}
                                </div>
                                <div className="stat-card-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Match history */}
                    <div className="sec-head">
                        <div className="sec-title">🏟️ Match History</div>
                    </div>

                    {appearances.length === 0 ? (
                        <div className="empty">No match appearances yet</div>
                    ) : (
                        appearances.map(m => (
                            <div key={m.match_id} className="match-card">
                                <div className="match-top">
                                    <span className="match-date">{fmt(m.match_date)}</span>
                                </div>
                                <div className="match-line">
                                    <div className="m-team home">{shortName(m.home_team)}</div>
                                    <div className="m-scores">
                                        <span className="m-score">{m.home_score}</span>
                                        <span className="m-sep">-</span>
                                        <span className="m-score">{m.away_score}</span>
                                    </div>
                                    <div className="m-team away">{shortName(m.away_team)}</div>
                                </div>
                                <div className="match-events">
                                    {m.events.map((e, i) => (
                                        <span key={i} className={`event-tag ${e.type}`}>
                                            {eventLabel(e.type, e.minute)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                </div>
            </div>
        </>
    )
}