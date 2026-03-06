'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Match = {
  id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  status: string
  home_score: number
  away_score: number
  home_team: { name: string }
  away_team: { name: string }
}

type MatchEvent = {
  id: string
  type: string
  minute: number | null
  player_name: string
  team_name: string
}

type TeamStats = {
  id: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
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

function initials(name: string): string {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

const TEAM_COLORS = [
  { bg: 'rgba(239,68,68,0.2)',  color: '#f87171' },
  { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.2)', color: '#c084fc' },
  { bg: 'rgba(234,179,8,0.2)',  color: '#facc15' },
  { bg: 'rgba(20,184,166,0.2)', color: '#2dd4bf' },
  { bg: 'rgba(249,115,22,0.2)', color: '#fb923c' },
]

function calculateTable(teams: any[], matches: any[]): TeamStats[] {
  return teams.map((team: any) => {
    const relevant = matches.filter((m: any) =>
      (m.status === 'finished' || m.status === 'live') &&
      (m.home_team_id === team.id || m.away_team_id === team.id)
    )
    let wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0
    relevant.forEach((m: any) => {
      const isHome = m.home_team_id === team.id
      const gf = isHome ? m.home_score : m.away_score
      const ga = isHome ? m.away_score : m.home_score
      goals_for += gf; goals_against += ga
      if (gf > ga) wins++
      else if (gf === ga) draws++
      else losses++
    })
    return {
      id: team.id, name: team.name,
      played: relevant.length, wins, draws, losses,
      goals_for, goals_against,
      goal_difference: goals_for - goals_against,
      points: wins * 3 + draws,
    }
  }).sort((a: any, b: any) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for
  )
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page { min-height: 100vh; background: #080f08; font-family: 'Barlow', sans-serif; color: #fff; padding-bottom: 100px; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 0 24px; }

  .hero { position: relative; padding-top: 36px; padding-bottom: 40px; overflow: hidden; }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 100% 100% at 75% 0%,  rgba(34,197,94,0.13) 0%, transparent 55%),
      radial-gradient(ellipse 60%  80% at 10% 100%, rgba(16,80,16,0.28)  0%, transparent 50%);
  }
  .hero-grid { position: absolute; inset: 0; z-index: 0; opacity: 0.04; background-image: repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px); }
  .hero-7 { position: absolute; right: 0; top: -20px; z-index: 0; font-family: 'Bebas Neue', sans-serif; font-size: clamp(160px, 28vw, 300px); color: rgba(34,197,94,0.045); line-height: 1; pointer-events: none; user-select: none; }
  .hero .wrap { position: relative; z-index: 1; }

  .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); border-radius: 100px; padding: 5px 14px 5px 8px; margin-bottom: 16px; width: fit-content; }
  .eyebrow-dot { width:6px; height:6px; background:#22c55e; border-radius:50%; animation:blink 2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .eyebrow-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#22c55e; }

  .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(54px, 10vw, 96px); line-height: 0.88; letter-spacing: 0.02em; color: #fff; margin-bottom: 10px; }
  .green { color: #22c55e; display: block; }
  .hero-sub { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.28); margin-bottom: 22px; }

  .ctas { display:flex; gap:10px; flex-wrap:wrap; }
  .btn-primary { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#22c55e,#16a34a); border:none; border-radius:10px; padding:12px 20px; font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#fff; text-decoration:none; transition:opacity 0.2s; }
  .btn-primary:hover { opacity:0.88; }
  .btn-secondary { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 20px; font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:rgba(255,255,255,0.55); text-decoration:none; transition:background 0.2s; }
  .btn-secondary:hover { background:rgba(255,255,255,0.09); }

  .stats-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:28px; }
  .stat-tile { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px 12px; text-align:center; transition:border-color 0.2s; }
  .stat-tile:hover { border-color:rgba(34,197,94,0.2); }
  .stat-icon { font-size:22px; margin-bottom:6px; }
  .stat-val  { font-family:'Bebas Neue',sans-serif; font-size:30px; color:#22c55e; line-height:1; }
  .stat-lbl  { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-top:3px; }

  .sec { margin-top: 32px; }
  .sec-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .sec-title { font-family:'Bebas Neue',sans-serif; font-size:26px; color:#fff; letter-spacing:0.04em; }
  .sec-link  { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#22c55e; text-decoration:none; }
  .sec-link:hover { opacity:0.8; }

  @media (min-width:680px) {
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
    .two-col-wide { display:grid; grid-template-columns:1.15fr 0.85fr; gap:20px; align-items:start; }
  }

  /* Live card */
  .live-card { background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.22); border-radius:14px; padding:16px 18px; position:relative; overflow:hidden; }
  .live-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#ef4444,#dc2626); }
  .live-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .live-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:100px; padding:3px 10px; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; color:#f87171; }
  .live-dot  { width:5px; height:5px; background:#f87171; border-radius:50%; animation:blink 1.2s ease infinite; }
  .live-date { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.06em; color:rgba(255,255,255,0.22); }
  .scoreline { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .s-team    { flex:1; }
  .s-name    { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; color:#fff; letter-spacing:0.02em; line-height:1.2; }
  .s-name.home { text-align:left; }
  .s-name.away { text-align:right; }
  .s-scores  { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .s-score   { font-family:'Bebas Neue',sans-serif; font-size:52px; color:#fff; line-height:1; min-width:36px; text-align:center; }
  .s-sep     { font-family:'Bebas Neue',sans-serif; font-size:28px; color:rgba(255,255,255,0.2); }

  .no-live { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:24px; text-align:center; }
  .no-live-icon { font-size:28px; margin-bottom:6px; }
  .no-live-txt  { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Next fixture */
  .next-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:18px; text-decoration:none; display:block; transition:border-color 0.2s; }
  .next-card:hover { border-color:rgba(34,197,94,0.2); }
  .next-date  { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#22c55e; margin-bottom:10px; }
  .next-team  { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:700; color:#fff; letter-spacing:0.02em; }
  .next-vs    { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.1em; color:rgba(255,255,255,0.2); text-transform:uppercase; margin:4px 0; }
  .next-time  { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.06em; color:rgba(255,255,255,0.25); margin-top:10px; }

  /* ── Mini table ── */
  .mini-table { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }

  /* 6 columns: # · Team · P · W · L · PTS */
  .mt-head { display:grid; grid-template-columns:26px 1fr 26px 26px 26px 34px; padding:10px 12px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); gap:0; }
  .mt-hd   { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); text-align:center; }
  .mt-hd.l { text-align:left; }

  .mt-row  { display:grid; grid-template-columns:26px 1fr 26px 26px 26px 34px; padding:0 12px; height:46px; align-items:center; border-bottom:1px solid rgba(255,255,255,0.04); position:relative; transition:background 0.15s; gap:0; }
  .mt-row:last-child { border-bottom:none; }
  .mt-row:hover { background:rgba(255,255,255,0.03); }
  .mt-row.ch { background:linear-gradient(90deg,rgba(251,191,36,0.07) 0%,transparent 60%); }
  .mt-row.ch::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#fbbf24,#f59e0b); }
  .mt-row.tp { background:linear-gradient(90deg,rgba(34,197,94,0.05) 0%,transparent 60%); }
  .mt-row.tp::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#22c55e,#16a34a); }

  .mt-pos  { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; color:rgba(255,255,255,0.2); text-align:center; }
  .mt-pos.g{ color:#fbbf24; }

  /* Team cell — avatar + name as a clickable link */
  .mt-team { display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden; }
  .mt-team-link { display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden; text-decoration:none; flex:1; }
  .mt-team-link:hover .mt-name { color:#22c55e; }
  .mt-av   { width:22px; height:22px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:9px; flex-shrink:0; }
  .mt-name { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:color 0.15s; }

  .mt-stat   { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; color:rgba(255,255,255,0.4); text-align:center; }
  .mt-stat.p { color:rgba(255,255,255,0.55); }
  .mt-stat.w { color:rgba(255,255,255,0.85); font-weight:700; }
  .mt-stat.l { color:rgba(239,68,68,0.65); }

  .pts-badge { display:inline-flex; align-items:center; justify-content:center; width:28px; height:22px; border-radius:4px; font-family:'Bebas Neue',sans-serif; font-size:14px; }
  .pts-c { background:rgba(251,191,36,0.14); color:#fbbf24; border:1px solid rgba(251,191,36,0.25); }
  .pts-t { background:rgba(34,197,94,0.1);   color:#22c55e; border:1px solid rgba(34,197,94,0.2); }
  .pts-n { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.45); border:1px solid rgba(255,255,255,0.08); }

  /* Live badge */
  .mt-live { display:inline-flex; align-items:center; gap:3px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); border-radius:4px; padding:1px 5px; font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:0.06em; color:#f87171; flex-shrink:0; margin-left:4px; }
  .mt-live-dot { width:4px; height:4px; background:#f87171; border-radius:50%; animation:livePulse 1.2s ease infinite; }
  @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.2} }

  /* Result cards */
  .result-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; margin-bottom:8px; }
  .res-top     { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .res-date    { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.07em; color:rgba(255,255,255,0.24); }
  .res-line    { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .r-name      { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; color:#fff; line-height:1.2; flex:1; }
  .r-name.home { text-align:left; }
  .r-name.away { text-align:right; }
  .r-name.win  { color:#22c55e; }
  .r-name.lose { color:rgba(255,255,255,0.28); }
  .r-scores    { display:flex; align-items:center; gap:5px; flex-shrink:0; }
  .r-score     { font-family:'Bebas Neue',sans-serif; font-size:28px; color:#fff; line-height:1; min-width:20px; text-align:center; }
  .r-sep       { font-family:'Bebas Neue',sans-serif; font-size:16px; color:rgba(255,255,255,0.2); }

  /* Event ticker */
  .ticker { margin-top: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(239,68,68,0.15); border-radius: 10px; overflow: hidden; }
  .ticker-head { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); }
  .ticker-head-dot { width:5px; height:5px; background:#f87171; border-radius:50%; animation:blink 1.2s ease infinite; }
  .ticker-head-txt { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.3); }
  .ticker-empty { padding:12px 14px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.07em; color:rgba(255,255,255,0.18); text-transform:uppercase; }
  .ticker-event { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); animation: slideIn 0.3s ease both; }
  .ticker-event:last-child { border-bottom: none; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .ticker-icon { font-size:16px; flex-shrink:0; }
  .ticker-info { flex:1; min-width:0; }
  .ticker-player { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; color:#fff; letter-spacing:0.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ticker-team   { font-family:'Barlow',sans-serif; font-size:11px; color:rgba(255,255,255,0.3); margin-top:1px; }
  .ticker-min    { font-family:'Bebas Neue',sans-serif; font-size:16px; color:rgba(255,255,255,0.25); flex-shrink:0; }

  .spin-wrap { display:flex; align-items:center; justify-content:center; padding:28px 0; }
  .spinner   { width:24px; height:24px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`

export default function HomePage() {
  const [liveMatch, setLiveMatch]         = useState<Match | null>(null)
  const [nextFixture, setNextFixture]     = useState<Match | null>(null)
  const [recentResults, setRecentResults] = useState<Match[]>([])
  const [table, setTable]                 = useState<TeamStats[]>([])
  const [loading, setLoading]             = useState(true)
  const [goals, setGoals]                 = useState(0)
  const [played, setPlayed]               = useState(0)
  const [liveEvents, setLiveEvents]       = useState<MatchEvent[]>([])
  const [liveTeamIds, setLiveTeamIds]     = useState<Set<string>>(new Set())

  const teamsRef = useRef<any[]>([])

  const processMatches = (teams: any[], matches: any[]) => {
    const withTeams = matches.map((m: any) => ({
      ...m,
      home_team: { name: teams.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown' },
      away_team: { name: teams.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown' },
    }))
    const live = withTeams.find((m: any) => m.status === 'live') || null
    setLiveMatch(live)
    setLiveTeamIds(new Set(live ? [live.home_team_id, live.away_team_id] : []))
    setNextFixture(withTeams.find((m: any) => m.status === 'scheduled') || null)
    setRecentResults(withTeams.filter((m: any) => m.status === 'finished').reverse().slice(0, 3))
    setTable(calculateTable(teams, matches).slice(0, 6))
    setPlayed(withTeams.filter((m: any) => m.status === 'finished').length)
    if (live) fetchLiveEvents(live.id)
    else setLiveEvents([])
  }

  useEffect(() => {
    const init = async () => {
      const [{ data: teams }, { data: matches }, { count: goalCount }] = await Promise.all([
        supabase.from('teams').select('id, name'),
        supabase.from('matches').select('id,home_team_id,away_team_id,match_date,status,home_score,away_score').order('match_date', { ascending: true }),
        supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('type', 'goal'),
      ])
      if (!teams || !matches) { setLoading(false); return }
      teamsRef.current = teams
      setGoals(goalCount || 0)
      processMatches(teams, matches)
      setLoading(false)
    }
    init()

    const interval = setInterval(async () => {
      if (!teamsRef.current.length) return
      const [{ data: matches }, { count: goalCount }] = await Promise.all([
        supabase.from('matches').select('id,home_team_id,away_team_id,match_date,status,home_score,away_score').order('match_date', { ascending: true }),
        supabase.from('match_events').select('*', { count: 'exact', head: true }).eq('type', 'goal'),
      ])
      if (!matches) return
      setGoals(goalCount || 0)
      processMatches(teamsRef.current, matches)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchLiveEvents = async (matchId: string) => {
    const { data: events } = await supabase
      .from('match_events').select('id, type, minute, player_id').eq('match_id', matchId)
      .order('created_at', { ascending: false }).limit(8)
    const { data: players } = await supabase.from('players').select('id, name, team_id')
    const { data: teams }   = await supabase.from('teams').select('id, name')
    if (!events || !players || !teams) return
    setLiveEvents(events.map((e: any) => {
      const p = players.find((p: any) => p.id === e.player_id)
      const t = teams.find((t: any) => t.id === p?.team_id)
      return { id: e.id, type: e.type, minute: e.minute, player_name: p?.name || 'Unknown', team_name: t?.name || '' }
    }))
  }

  const eventIcon = (type: string) => {
    if (type === 'goal')   return '⚽'
    if (type === 'assist') return '🅰️'
    if (type === 'yellow') return '🟨'
    if (type === 'red')    return '🟥'
    if (type === 'potm')   return '⭐'
    return '•'
  }

  const fmt     = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">

        <div className="hero">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-7">7</div>
          <div className="wrap">
            <div className="hero-eyebrow">
              <div className="eyebrow-dot" />
              <span className="eyebrow-text">Season 1 · 2026 · Sheffield</span>
            </div>
            <h1 className="hero-title">
              Naija FC
              <span className="green">Sheffield</span>
            </h1>
            <p className="hero-sub">7-a-side · 6 Teams · Live Scores</p>
            <div className="ctas">
              <Link href="/table"    className="btn-primary">📊 View Table</Link>
              <Link href="/fixtures" className="btn-secondary">📅 Fixtures</Link>
            </div>
            <div className="stats-strip">
              {[
                { icon: '⚽', val: loading ? '-' : goals,  lbl: 'Goals'  },
                { icon: '🏟️', val: loading ? '-' : played, lbl: 'Played' },
                { icon: '👥', val: 6,                       lbl: 'Teams'  },
              ].map(s => (
                <div key={s.lbl} className="stat-tile">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="wrap">

          <div className="two-col">
            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">🔴 Live Score</div>
              </div>
              {loading ? (
                <div className="spin-wrap"><div className="spinner" /></div>
              ) : liveMatch ? (
                <Link href={`/matches/${liveMatch.id}`} style={{ textDecoration:'none', display:'block' }}>
                  <div className="live-card">
                    <div className="live-top">
                      <div className="live-pill"><div className="live-dot" />Live Now</div>
                      <span className="live-date">{fmt(liveMatch.match_date)}</span>
                    </div>
                    <div className="scoreline">
                      <div className="s-team"><div className="s-name home">{shortName(liveMatch.home_team.name)}</div></div>
                      <div className="s-scores">
                        <span className="s-score">{liveMatch.home_score ?? 0}</span>
                        <span className="s-sep">-</span>
                        <span className="s-score">{liveMatch.away_score ?? 0}</span>
                      </div>
                      <div className="s-team"><div className="s-name away">{shortName(liveMatch.away_team.name)}</div></div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="no-live">
                  <div className="no-live-icon">🕐</div>
                  <div className="no-live-txt">No match in progress</div>
                </div>
              )}

              {liveMatch && (
                <div className="ticker">
                  <div className="ticker-head">
                    <div className="ticker-head-dot" />
                    <span className="ticker-head-txt">Match Events</span>
                  </div>
                  {liveEvents.length === 0 ? (
                    <div className="ticker-empty">No events yet — kick off!</div>
                  ) : (
                    liveEvents.map((e, i) => (
                      <div key={e.id} className="ticker-event" style={{ animationDelay: `${i * 40}ms` }}>
                        <div className="ticker-icon">{eventIcon(e.type)}</div>
                        <div className="ticker-info">
                          <div className="ticker-player">{e.player_name}</div>
                          <div className="ticker-team">{shortName(e.team_name)}</div>
                        </div>
                        {e.minute && <div className="ticker-min">{e.minute}'</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {nextFixture && (
              <div className="sec">
                <div className="sec-head">
                  <div className="sec-title">📅 Next Match</div>
                  <Link href="/fixtures" className="sec-link">All →</Link>
                </div>
                <Link href="/fixtures" className="next-card">
                  <div className="next-date">{fmt(nextFixture.match_date)}</div>
                  <div className="next-team">{shortName(nextFixture.home_team.name)}</div>
                  <div className="next-vs">vs</div>
                  <div className="next-team">{shortName(nextFixture.away_team.name)}</div>
                  <div className="next-time">🕐 {fmtTime(nextFixture.match_date)}</div>
                </Link>
              </div>
            )}
          </div>

          <div className="two-col-wide">
            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">📊 Table</div>
                <Link href="/table" className="sec-link">Full table →</Link>
              </div>
              {loading ? (
                <div className="spin-wrap"><div className="spinner" /></div>
              ) : (
                <div className="mini-table">
                  <div className="mt-head">
                    <div className="mt-hd">#</div>
                    <div className="mt-hd l">Team</div>
                    <div className="mt-hd">P</div>
                    <div className="mt-hd">W</div>
                    <div className="mt-hd">L</div>
                    <div className="mt-hd">PTS</div>
                  </div>
                  {table.map((team, i) => {
                    const c  = TEAM_COLORS[i % 6]
                    const rc = i === 0 ? 'mt-row ch' : i <= 2 ? 'mt-row tp' : 'mt-row'
                    const pc = i === 0 ? 'pts-badge pts-c' : i <= 2 ? 'pts-badge pts-t' : 'pts-badge pts-n'
                    const isLive = liveTeamIds.has(team.id)
                    return (
                      <div key={team.id} className={rc}>
                        <div className={`mt-pos${i===0?' g':''}`}>{i===0?'👑':i+1}</div>
                        <div className="mt-team">
                          <Link href={`/teams/${team.id}`} className="mt-team-link">
                            <div className="mt-av" style={{ background:c.bg, color:c.color }}>{initials(team.name)}</div>
                            <span className="mt-name">{shortName(team.name)}</span>
                          </Link>
                          {isLive && (
                            <span className="mt-live"><div className="mt-live-dot" />LIVE</span>
                          )}
                        </div>
                        <div className="mt-stat p">{team.played}</div>
                        <div className="mt-stat w">{team.wins}</div>
                        <div className="mt-stat l">{team.losses}</div>
                        <div style={{ textAlign:'center' }}><span className={pc}>{team.points}</span></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {recentResults.length > 0 && (
              <div className="sec">
                <div className="sec-head">
                  <div className="sec-title">🏁 Results</div>
                  <Link href="/fixtures" className="sec-link">All →</Link>
                </div>
                {recentResults.map(m => {
                  const hw = m.home_score > m.away_score
                  const aw = m.away_score > m.home_score
                  return (
                    <Link key={m.id} href={`/matches/${m.id}`} style={{ textDecoration:'none', display:'block' }}>
                      <div className="result-card" style={{ cursor:'pointer', transition:'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.14)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
                        <div className="res-top">
                          <span className="res-date">{fmt(m.match_date)}</span>
                        </div>
                        <div className="res-line">
                          <div className={`r-name home${hw?' win':aw?' lose':''}`}>{shortName(m.home_team.name)}</div>
                          <div className="r-scores">
                            <span className="r-score">{m.home_score}</span>
                            <span className="r-sep">-</span>
                            <span className="r-score">{m.away_score}</span>
                          </div>
                          <div className={`r-name away${aw?' win':hw?' lose':''}`}>{shortName(m.away_team.name)}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}