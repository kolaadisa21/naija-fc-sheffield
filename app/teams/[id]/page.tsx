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
}

type TeamData = {
    id: string
    name: string
}

type TableRow = {
    played: number
    wins: number
    draws: number
    losses: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
}

type MatchResult = {
    id: string
    match_date: string
    home_team: string
    away_team: string
    home_team_id: string
    away_team_id: string
    home_score: number
    away_score: number
    status: string
}

type TopStat = { player_id: string; name: string; count: number }

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

  .page { min-height:100vh; background:#080f08; font-family:'Barlow',sans-serif; color:#fff; padding-bottom:100px; }

  /* Hero */
  .hero { position:relative; padding:0 24px 32px; overflow:hidden; }
  .hero-bg {
    position:absolute; inset:0; z-index:0;
    background:
      radial-gradient(ellipse 100% 80% at 80% 0%, rgba(34,197,94,0.12) 0%, transparent 55%),
      radial-gradient(ellipse 60% 80% at 5% 100%, rgba(16,80,16,0.25) 0%, transparent 50%);
  }
  .hero-grid { position:absolute; inset:0; z-index:0; opacity:0.035; background-image:repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px); }
  .hero-inner { position:relative; z-index:1; max-width:860px; margin:0 auto; }

  .back-link { display:inline-flex; align-items:center; gap:6px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.3); text-decoration:none; padding:20px 0; transition:color 0.15s; }
  .back-link:hover { color:#22c55e; }

  .team-header { display:flex; align-items:center; gap:16px; margin-bottom:12px; }
  .team-badge { width:64px; height:64px; border-radius:14px; background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,80,16,0.4)); border:1px solid rgba(34,197,94,0.25); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:22px; color:#22c55e; flex-shrink:0; }
  .team-name { font-family:'Bebas Neue',sans-serif; font-size:clamp(34px,8vw,60px); line-height:0.9; letter-spacing:0.02em; color:#fff; }
  .team-sub { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.28); margin-top:8px; }

  /* Body */
  .body { padding:0 24px; max-width:860px; margin:0 auto; }

  /* Stats strip */
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:24px; margin-bottom:0; }
  .stat-box { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 10px; text-align:center; }
  .stat-val { font-family:'Bebas Neue',sans-serif; font-size:28px; color:#22c55e; line-height:1; }
  .stat-lbl { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-top:3px; }

  /* Section */
  .sec { margin-top:28px; }
  .sec-title { font-family:'Bebas Neue',sans-serif; font-size:24px; color:#fff; letter-spacing:0.04em; margin-bottom:12px; }

  /* Form strip */
  .form-strip { display:flex; gap:6px; flex-wrap:wrap; }
  .form-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:16px; }
  .form-w { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#22c55e; }
  .form-d { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.4); }
  .form-l { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); color:#f87171; }

  /* Results */
  .result-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:13px 16px; margin-bottom:8px; display:flex; align-items:center; gap:12px; }
  .result-card.win  { border-left:3px solid #22c55e; }
  .result-card.loss { border-left:3px solid #f87171; }
  .result-card.draw { border-left:3px solid rgba(255,255,255,0.2); }
  .res-date { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.06em; color:rgba(255,255,255,0.25); min-width:70px; }
  .res-teams { flex:1; font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; color:#fff; letter-spacing:0.02em; }
  .res-score { font-family:'Bebas Neue',sans-serif; font-size:22px; color:#fff; letter-spacing:0.04em; min-width:40px; text-align:center; }
  .res-badge { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 8px; border-radius:5px; min-width:36px; text-align:center; }
  .res-badge.W { background:rgba(34,197,94,0.12); color:#22c55e; }
  .res-badge.D { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.35); }
  .res-badge.L { background:rgba(239,68,68,0.1); color:#f87171; }

  /* Top stats */
  .top-stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; margin-bottom:8px; display:flex; align-items:center; gap:12px; text-decoration:none; transition:border-color 0.15s; }
  .top-stat-card:hover { border-color:rgba(34,197,94,0.25); }
  .top-stat-icon { font-size:22px; flex-shrink:0; }
  .top-stat-info { flex:1; }
  .top-stat-label { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:3px; }
  .top-stat-name { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:700; color:#fff; letter-spacing:0.02em; }
  .top-stat-count { font-family:'Bebas Neue',sans-serif; font-size:26px; color:#22c55e; }

  /* Squad */
  .squad-list { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }
  .squad-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.04); text-decoration:none; transition:background 0.15s; }
  .squad-row:last-child { border-bottom:none; }
  .squad-row:hover { background:rgba(255,255,255,0.04); }
  .squad-num { font-family:'Bebas Neue',sans-serif; font-size:18px; color:rgba(255,255,255,0.2); min-width:28px; text-align:center; }
  .squad-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; letter-spacing:0.02em; flex:1; }
  .squad-pos { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.06em; color:rgba(255,255,255,0.25); }
  .squad-gk { color:#60a5fa; }

  /* Empty */
  .empty { text-align:center; padding:32px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }

  @media (min-width:600px) {
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
  }
`

export default function TeamPage() {
    const params = useParams()
    const teamId = params?.id as string

    const [team, setTeam] = useState<TeamData | null>(null)
    const [tableRow, setTableRow] = useState<TableRow | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [results, setResults] = useState<MatchResult[]>([])
    const [topScorer, setTopScorer] = useState<TopStat | null>(null)
    const [topAssist, setTopAssist] = useState<TopStat | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (teamId) fetchData() }, [teamId])

    const fetchData = async () => {
        const [
            { data: teamData },
            { data: playersData },
            { data: tableData },
            { data: matchesData },
            { data: teamsData },
            { data: eventsData },
        ] = await Promise.all([
            supabase.from('teams').select('id, name').eq('id', teamId).single(),
            supabase.from('players').select('id, name, position, shirt_number').eq('team_id', teamId).order('shirt_number', { ascending: true, nullsFirst: false }),
            supabase.from('league_table').select('*').eq('id', teamId).single(),
            supabase.from('matches').select('id,home_team_id,away_team_id,match_date,status,home_score,away_score')
                .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
                .eq('status', 'finished')
                .order('match_date', { ascending: false })
                .limit(5),
            supabase.from('teams').select('id, name'),
            supabase.from('match_events').select('type, player_id').in('type', ['goal', 'assist']),
        ])

        if (!teamData) { setLoading(false); return }
        setTeam(teamData)
        setTableRow(tableData || null)
        setPlayers(playersData || [])

        // Build results with team names
        if (matchesData && teamsData) {
            const enriched = matchesData.map((m: any) => ({
                id: m.id,
                match_date: m.match_date,
                home_team: teamsData.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown',
                away_team: teamsData.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown',
                home_team_id: m.home_team_id,
                away_team_id: m.away_team_id,
                home_score: m.home_score,
                away_score: m.away_score,
                status: m.status,
            }))
            setResults(enriched)
        }

        // Top scorer + assister from this team's players
        if (eventsData && playersData) {
            const teamPlayerIds = (playersData || []).map((p: any) => p.id)

            const buildTop = (type: string): TopStat | null => {
                const counts: Record<string, number> = {}
                eventsData.filter((e: any) => e.type === type && teamPlayerIds.includes(e.player_id))
                    .forEach((e: any) => { counts[e.player_id] = (counts[e.player_id] || 0) + 1 })
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
                if (!sorted.length) return null
                const [pid, count] = sorted[0]
                const p = (playersData || []).find((p: any) => p.id === pid)
                return p ? { player_id: pid, name: p.name, count } : null
            }

            setTopScorer(buildTop('goal'))
            setTopAssist(buildTop('assist'))
        }

        setLoading(false)
    }

    const getResult = (m: MatchResult): 'W' | 'D' | 'L' => {
        const isHome = m.home_team_id === teamId
        const teamScore = isHome ? m.home_score : m.away_score
        const oppScore = isHome ? m.away_score : m.home_score
        if (teamScore > oppScore) return 'W'
        if (teamScore < oppScore) return 'L'
        return 'D'
    }

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    if (loading) return (
        <><style>{STYLES}</style>
            <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading...</span></div></>
    )

    if (!team) return (
        <><style>{STYLES}</style><div className="empty">Team not found</div></>
    )

    const initials = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    const formResults = [...results].reverse().slice(-5)

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">

                {/* Hero */}
                <div className="hero">
                    <div className="hero-bg" />
                    <div className="hero-grid" />
                    <div className="hero-inner">
                        <Link href="/table" className="back-link">← Back to Table</Link>
                        <div className="team-header">
                            <div className="team-badge">{initials}</div>
                            <div>
                                <div className="team-name">{shortName(team.name)}</div>
                                <div className="team-sub">{team.name} · Season 1 · 2026</div>
                            </div>
                        </div>

                        {/* Stats row */}
                        {tableRow && (
                            <div className="stats-row">
                                {[
                                    { val: tableRow.played, lbl: 'Played' },
                                    { val: tableRow.wins, lbl: 'Wins' },
                                    { val: tableRow.draws, lbl: 'Draws' },
                                    { val: tableRow.losses, lbl: 'Losses' },
                                ].map(s => (
                                    <div key={s.lbl} className="stat-box">
                                        <div className="stat-val">{s.val}</div>
                                        <div className="stat-lbl">{s.lbl}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="body">

                    <div className="two-col">
                        {/* Recent results */}
                        <div className="sec">
                            <div className="sec-title">🏁 Recent Results</div>

                            {/* Form strip */}
                            {results.length > 0 && (
                                <div className="form-strip" style={{ marginBottom: 12 }}>
                                    {[...results].reverse().map((m, i) => {
                                        const r = getResult(m)
                                        return <div key={i} className={`form-badge form-${r.toLowerCase()}`}>{r}</div>
                                    })}
                                </div>
                            )}

                            {results.length === 0 ? (
                                <div className="empty">No results yet</div>
                            ) : (
                                results.map(m => {
                                    const r = getResult(m)
                                    const isHome = m.home_team_id === teamId
                                    const oppName = shortName(isHome ? m.away_team : m.home_team)
                                    const scoreStr = `${m.home_score} - ${m.away_score}`
                                    return (
                                        <div key={m.id} className={`result-card ${r === 'W' ? 'win' : r === 'L' ? 'loss' : 'draw'}`}>
                                            <div className="res-date">{fmt(m.match_date)}</div>
                                            <div className="res-teams">{isHome ? 'vs' : '@'} {oppName}</div>
                                            <div className="res-score">{scoreStr}</div>
                                            <div className={`res-badge ${r}`}>{r}</div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Top performers */}
                        <div className="sec">
                            <div className="sec-title">⭐ Top Performers</div>
                            {topScorer ? (
                                <Link href={`/players/${topScorer.player_id}`} className="top-stat-card">
                                    <div className="top-stat-icon">⚽</div>
                                    <div className="top-stat-info">
                                        <div className="top-stat-label">Top Scorer</div>
                                        <div className="top-stat-name">{topScorer.name}</div>
                                    </div>
                                    <div className="top-stat-count">{topScorer.count}</div>
                                </Link>
                            ) : <div className="empty">No goals yet</div>}

                            {topAssist ? (
                                <Link href={`/players/${topAssist.player_id}`} className="top-stat-card">
                                    <div className="top-stat-icon">🅰️</div>
                                    <div className="top-stat-info">
                                        <div className="top-stat-label">Top Assister</div>
                                        <div className="top-stat-name">{topAssist.name}</div>
                                    </div>
                                    <div className="top-stat-count">{topAssist.count}</div>
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    {/* Squad */}
                    <div className="sec">
                        <div className="sec-title">👥 Squad ({players.length})</div>
                        {players.length === 0 ? (
                            <div className="empty">No players added yet</div>
                        ) : (
                            <div className="squad-list">
                                {players.map(p => (
                                    <Link key={p.id} href={`/players/${p.id}`} className="squad-row">
                                        <div className="squad-num">{p.shirt_number || '—'}</div>
                                        <div className="squad-name">{p.name}</div>
                                        <div className={`squad-pos${p.position === 'GK' ? ' squad-gk' : ''}`}>
                                            {p.position === 'GK' ? '🧤 GK' : '⚽ Outfield'}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    )
}