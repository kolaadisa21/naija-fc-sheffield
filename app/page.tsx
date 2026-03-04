'use client'

import { useEffect, useState } from 'react'
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
  { bg: 'rgba(239,68,68,0.2)', color: '#f87171' },
  { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.2)', color: '#c084fc' },
  { bg: 'rgba(234,179,8,0.2)', color: '#facc15' },
  { bg: 'rgba(20,184,166,0.2)', color: '#2dd4bf' },
  { bg: 'rgba(249,115,22,0.2)', color: '#fb923c' },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #080f08;
    font-family: 'Barlow', sans-serif;
    color: #fff;
    padding-bottom: 100px;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 100vw;
    max-height: 600px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 20px 32px;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 120% 80% at 60% 20%, rgba(34,197,94,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 80% 60% at 20% 80%, rgba(16,80,16,0.35) 0%, transparent 50%),
      linear-gradient(180deg, #0a150a 0%, #080f08 100%);
  }

  /* Decorative pitch lines */
  .hero-pitch {
    position: absolute; inset: 0; opacity: 0.06;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,1) 48px, rgba(255,255,255,1) 49px),
      repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,1) 48px, rgba(255,255,255,1) 49px);
  }

  /* Big decorative number */
  .hero-number {
    position: absolute;
    right: -20px; top: -10px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(180px, 45vw, 320px);
    color: rgba(34,197,94,0.04);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  .hero-content { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; width: 100%; }

  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);
    border-radius: 100px; padding: 5px 14px 5px 8px; margin-bottom: 16px;
  }
  .hero-eyebrow-dot {
    width: 6px; height: 6px; background: #22c55e; border-radius: 50%;
    animation: blink 2s ease infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .hero-eyebrow-text {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: #22c55e;
  }

  .hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 13vw, 110px);
    line-height: 0.88; letter-spacing: 0.02em; color: #fff;
    margin-bottom: 12px;
  }
  .hero-title-green { color: #22c55e; }

  .hero-desc {
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3);
    margin-bottom: 24px;
  }

  .hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; }
  .cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none; border-radius: 10px; padding: 13px 22px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; color: #fff;
    text-decoration: none; cursor: pointer; transition: opacity 0.2s, transform 0.1s;
  }
  .cta-primary:hover { opacity: 0.9; }
  .cta-primary:active { transform: scale(0.97); }
  .cta-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px; padding: 13px 22px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.6);
    text-decoration: none; cursor: pointer; transition: background 0.2s;
  }
  .cta-secondary:hover { background: rgba(255,255,255,0.09); }

  /* ── Sections ── */
  .sections { padding: 0 16px; max-width: 900px; margin: 0 auto; }

  /* ── Section header ── */
  .section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px; margin-top: 40px;
  }
  .section-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 28px;
    color: #fff; letter-spacing: 0.04em;
  }
  .section-link {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #22c55e;
    text-decoration: none; display: flex; align-items: center; gap: 4px;
  }
  .section-link:hover { opacity: 0.8; }

  /* ── Live score card ── */
  .live-card {
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 16px; padding: 20px;
    position: relative; overflow: hidden;
    margin-bottom: 12px;
  }
  .live-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px; background: linear-gradient(180deg, #ef4444, #dc2626);
  }
  .live-card-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .live-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 100px; padding: 4px 12px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.1em; color: #f87171;
  }
  .live-pill-dot {
    width: 6px; height: 6px; background: #f87171; border-radius: 50%;
    animation: blink 1.2s ease infinite;
  }
  .live-match-date {
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; color: rgba(255,255,255,0.25);
  }
  .live-scoreline {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .live-team { flex: 1; }
  .live-team-name {
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    color: #fff; letter-spacing: 0.02em; line-height: 1.2;
  }
  .live-team-name.home { text-align: left; }
  .live-team-name.away { text-align: right; }
  .live-scores {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .live-score {
    font-family: 'Bebas Neue', sans-serif; font-size: 52px; color: #fff;
    line-height: 1; min-width: 40px; text-align: center;
  }
  .live-sep {
    font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: rgba(255,255,255,0.2);
  }

  /* ── No live card ── */
  .no-live-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 28px 20px; text-align: center;
  }
  .no-live-icon { font-size: 32px; margin-bottom: 8px; }
  .no-live-text {
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.2);
  }

  /* ── Upcoming fixture ── */
  .upcoming-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    text-decoration: none;
  }
  .upcoming-teams {
    display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0;
  }
  .upcoming-team-row {
    font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
    color: #fff; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .upcoming-vs {
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin: 2px 0;
  }
  .upcoming-right { text-align: right; flex-shrink: 0; }
  .upcoming-date {
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    color: #22c55e; letter-spacing: 0.04em;
  }
  .upcoming-time {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.06em; color: rgba(255,255,255,0.3); margin-top: 2px;
  }

  /* ── Mini table ── */
  .mini-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
  .mini-table-header {
    display: grid; grid-template-columns: 28px 1fr 32px 32px 32px 40px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .mth {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); text-align: center;
  }
  .mth.left { text-align: left; }
  .mini-row {
    display: grid; grid-template-columns: 28px 1fr 32px 32px 32px 40px;
    padding: 0 14px; height: 50px; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.04); position: relative;
    animation: fadeIn 0.3s ease both;
  }
  .mini-row:last-child { border-bottom: none; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .mini-row.champ { background: linear-gradient(90deg, rgba(251,191,36,0.07) 0%, transparent 60%); }
  .mini-row.champ::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#fbbf24,#f59e0b); }
  .mini-row.top { background: linear-gradient(90deg, rgba(34,197,94,0.05) 0%, transparent 60%); }
  .mini-row.top::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#22c55e,#16a34a); }
  .mini-pos { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; color:rgba(255,255,255,0.2); text-align:center; }
  .mini-pos.gold { color:#fbbf24; }
  .mini-team { display:flex; align-items:center; gap:7px; min-width:0; }
  .mini-avatar { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:10px; flex-shrink:0; }
  .mini-name { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mini-stat { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; color:rgba(255,255,255,0.4); text-align:center; }
  .mini-pts { text-align:center; }
  .mini-pts-badge { display:inline-flex; align-items:center; justify-content:center; width:30px; height:24px; border-radius:5px; font-family:'Bebas Neue',sans-serif; font-size:16px; }
  .pts-c { background:rgba(251,191,36,0.14); color:#fbbf24; border:1px solid rgba(251,191,36,0.28); }
  .pts-t { background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.22); }
  .pts-n { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.08); }

  /* ── Recent results ── */
  .result-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 16px 18px; margin-bottom: 8px;
  }
  .result-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
  }
  .result-date { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.08em; color:rgba(255,255,255,0.25); }
  .result-scoreline { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .r-team { flex:1; }
  .r-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; line-height:1.2; }
  .r-name.home { text-align:left; }
  .r-name.away { text-align:right; }
  .r-name.winner { color:#22c55e; }
  .r-name.loser { color:rgba(255,255,255,0.3); }
  .r-scores { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .r-score { font-family:'Bebas Neue',sans-serif; font-size:30px; color:#fff; line-height:1; min-width:22px; text-align:center; }
  .r-sep { font-family:'Bebas Neue',sans-serif; font-size:18px; color:rgba(255,255,255,0.2); }

  /* ── Stats strip ── */
  .stats-strip {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 40px;
  }
  .stat-tile {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 16px; text-align: center;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
  }
  .stat-tile:hover { background: rgba(255,255,255,0.06); border-color: rgba(34,197,94,0.2); }
  .stat-tile-icon { font-size: 26px; margin-bottom: 6px; }
  .stat-tile-value { font-family:'Bebas Neue',sans-serif; font-size:32px; color:#22c55e; line-height:1; }
  .stat-tile-label { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-top:4px; }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:48px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }

  @media (max-width: 480px) {
    .hero { min-height: 88vw; padding: 0 16px 28px; }
    .stats-strip { grid-template-columns: repeat(3,1fr); gap:8px; }
    .stat-tile { padding:14px 10px; }
    .stat-tile-value { font-size:26px; }
    .live-team-name { font-size:13px; }
    .live-score { font-size:44px; }
  }
`

export default function HomePage() {
  const [liveMatch, setLiveMatch] = useState<Match | null>(null)
  const [nextFixture, setNextFixture] = useState<Match | null>(null)
  const [recentResults, setRecentResults] = useState<Match[]>([])
  const [table, setTable] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ goals: 0, matches: 0, teams: 6 })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    // Fetch teams
    const { data: teamsData } = await supabase.from('teams').select('id, name')

    // Fetch matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status, home_score, away_score')
      .order('match_date', { ascending: true })

    // Fetch league table
    const { data: tableData } = await supabase.from('league_table').select('*')

    // Fetch goal count
    const { count: goalCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'goal')

    if (!matchesData || !teamsData) { setLoading(false); return }

    // Join teams
    const withTeams = matchesData.map((m: any) => ({
      ...m,
      home_team: { name: teamsData.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown' },
      away_team: { name: teamsData.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown' },
    }))

    // Live match
    const live = withTeams.find(m => m.status === 'live') || null
    setLiveMatch(live)

    // Next fixture
    const upcoming = withTeams.filter(m => m.status === 'scheduled')
    setNextFixture(upcoming[0] || null)

    // Recent results (last 3 finished)
    const finished = withTeams.filter(m => m.status === 'finished').reverse().slice(0, 3)
    setRecentResults(finished)

    // Table (top 6)
    setTable((tableData || []).slice(0, 6))

    // Stats
    const finishedCount = withTeams.filter(m => m.status === 'finished').length
    setStats({ goals: goalCount || 0, matches: finishedCount, teams: 6 })

    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">

        {/* ── HERO ── */}
        <div className="hero">
          <div className="hero-bg" />
          <div className="hero-pitch" />
          <div className="hero-number">7</div>
          <div className="hero-content">
            <div className="hero-eyebrow">
              <div className="hero-eyebrow-dot" />
              <span className="hero-eyebrow-text">Season 1 · 2026 · Sheffield</span>
            </div>
            <h1 className="hero-title">
              Naija FC<br />
              <span className="hero-title-green">Sheffield</span>
            </h1>
            <p className="hero-desc">7-a-side · 6 Teams · Live Scores</p>
            <div className="hero-ctas">
              <Link href="/table" className="cta-primary">📊 View Table</Link>
              <Link href="/fixtures" className="cta-secondary">📅 Fixtures</Link>
            </div>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        <div className="sections">

          {/* Stats strip */}
          <div className="stats-strip">
            <div className="stat-tile">
              <div className="stat-tile-icon">⚽</div>
              <div className="stat-tile-value">{loading ? '-' : stats.goals}</div>
              <div className="stat-tile-label">Goals</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-icon">🏟️</div>
              <div className="stat-tile-value">{loading ? '-' : stats.matches}</div>
              <div className="stat-tile-label">Played</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-icon">👥</div>
              <div className="stat-tile-value">{stats.teams}</div>
              <div className="stat-tile-label">Teams</div>
            </div>
          </div>

          {/* Live Score */}
          <div className="section-head">
            <div className="section-title">🔴 Live Score</div>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : liveMatch ? (
            <div className="live-card">
              <div className="live-card-top">
                <div className="live-pill">
                  <div className="live-pill-dot" />
                  Live Now
                </div>
                <span className="live-match-date">{formatDate(liveMatch.match_date)}</span>
              </div>
              <div className="live-scoreline">
                <div className="live-team">
                  <div className="live-team-name home">{shortName(liveMatch.home_team.name)}</div>
                </div>
                <div className="live-scores">
                  <span className="live-score">{liveMatch.home_score ?? 0}</span>
                  <span className="live-sep">-</span>
                  <span className="live-score">{liveMatch.away_score ?? 0}</span>
                </div>
                <div className="live-team">
                  <div className="live-team-name away">{shortName(liveMatch.away_team.name)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-live-card">
              <div className="no-live-icon">🕐</div>
              <div className="no-live-text">No match in progress</div>
            </div>
          )}

          {/* Next Fixture */}
          {nextFixture && (
            <>
              <div className="section-head">
                <div className="section-title">📅 Next Match</div>
                <Link href="/fixtures" className="section-link">All fixtures →</Link>
              </div>
              <Link href="/fixtures" className="upcoming-card">
                <div className="upcoming-teams">
                  <div className="upcoming-team-row">{shortName(nextFixture.home_team.name)}</div>
                  <div className="upcoming-vs">vs</div>
                  <div className="upcoming-team-row">{shortName(nextFixture.away_team.name)}</div>
                </div>
                <div className="upcoming-right">
                  <div className="upcoming-date">{formatDate(nextFixture.match_date)}</div>
                  <div className="upcoming-time">{formatTime(nextFixture.match_date)}</div>
                </div>
              </Link>
            </>
          )}

          {/* League Table */}
          <div className="section-head">
            <div className="section-title">📊 Table</div>
            <Link href="/table" className="section-link">Full table →</Link>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading...</span></div>
          ) : (
            <div className="mini-table">
              <div className="mini-table-header">
                <div className="mth">#</div>
                <div className="mth left">Team</div>
                <div className="mth">P</div>
                <div className="mth">W</div>
                <div className="mth">GD</div>
                <div className="mth">PTS</div>
              </div>
              {table.map((team, i) => {
                const c = TEAM_COLORS[i % 6]
                const rowClass = i === 0 ? 'mini-row champ' : i <= 2 ? 'mini-row top' : 'mini-row'
                const ptsClass = i === 0 ? 'mini-pts-badge pts-c' : i <= 2 ? 'mini-pts-badge pts-t' : 'mini-pts-badge pts-n'
                const gd = team.goal_difference
                const gdStr = gd > 0 ? `+${gd}` : `${gd}`
                return (
                  <div key={team.id} className={rowClass} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`mini-pos${i === 0 ? ' gold' : ''}`}>{i === 0 ? '👑' : i + 1}</div>
                    <div className="mini-team">
                      <div className="mini-avatar" style={{ background: c.bg, color: c.color }}>{initials(team.name)}</div>
                      <span className="mini-name">{shortName(team.name)}</span>
                    </div>
                    <div className="mini-stat">{team.played}</div>
                    <div className="mini-stat">{team.wins}</div>
                    <div className="mini-stat" style={{ color: gd > 0 ? '#22c55e' : gd < 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>{gdStr}</div>
                    <div className="mini-pts"><span className={ptsClass}>{team.points}</span></div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <>
              <div className="section-head">
                <div className="section-title">🏁 Recent Results</div>
                <Link href="/fixtures" className="section-link">All results →</Link>
              </div>
              {recentResults.map(match => {
                const homeWin = match.home_score > match.away_score
                const awayWin = match.away_score > match.home_score
                return (
                  <div key={match.id} className="result-card">
                    <div className="result-top">
                      <span className="result-date">{formatDate(match.match_date)}</span>
                    </div>
                    <div className="result-scoreline">
                      <div className="r-team">
                        <div className={`r-name home${homeWin ? ' winner' : awayWin ? ' loser' : ''}`}>
                          {shortName(match.home_team.name)}
                        </div>
                      </div>
                      <div className="r-scores">
                        <span className="r-score">{match.home_score}</span>
                        <span className="r-sep">-</span>
                        <span className="r-score">{match.away_score}</span>
                      </div>
                      <div className="r-team">
                        <div className={`r-name away${awayWin ? ' winner' : homeWin ? ' loser' : ''}`}>
                          {shortName(match.away_team.name)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

        </div>
      </div>
    </>
  )
}