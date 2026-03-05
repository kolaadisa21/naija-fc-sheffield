'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

type Match = {
  id: string
  home_team_id: string
  away_team_id: string
  status: string
  home_score: number
  away_score: number
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
  return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

const TEAM_COLORS = [
  { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  { bg: 'rgba(234,179,8,0.15)', color: '#facc15' },
  { bg: 'rgba(20,184,166,0.15)', color: '#2dd4bf' },
  { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #080f08;
    background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,80,16,0.4) 0%, transparent 60%);
    padding: 40px 16px 100px;
    font-family: 'Barlow', sans-serif;
  }

  .container { max-width: 860px; margin: 0 auto; }
  .header { margin-bottom: 32px; }

  .league-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 5px 14px 5px 5px; margin-bottom: 16px; }
  .badge-dot { width: 26px; height: 26px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .badge-text { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
  .title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(44px, 9vw, 80px); line-height: 0.88; color: #fff; letter-spacing: 0.02em; }
  .title span { color: #22c55e; }
  .subtitle { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-top: 8px; }
  .season-tag { display: inline-block; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); border-radius: 6px; padding: 3px 10px; margin-top: 12px; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #22c55e; }

  .table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
  .col-def { grid-template-columns: 36px 1fr 38px 38px 38px 38px 42px 42px 46px 52px; }

  @media (max-width: 600px) {
    .col-def { grid-template-columns: 28px 1fr 32px 32px 32px 38px 44px; }
    .hide-mobile { display: none !important; }
    .team-avatar { display: none !important; }
  }

  .col-headers { display: grid; padding: 12px 14px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); gap: 0; }
  .col-hd { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.22); text-align: center; }
  .col-hd.left { text-align: left; }

  .team-row { display: grid; padding: 0 14px; align-items: center; height: 58px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; position: relative; gap: 0; }
  .team-row:last-child { border-bottom: none; }
  .team-row:hover { background: rgba(255,255,255,0.03); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .row-champ { background: linear-gradient(90deg, rgba(251,191,36,0.08) 0%, transparent 55%); }
  .row-champ::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #fbbf24, #f59e0b); }
  .row-top { background: linear-gradient(90deg, rgba(34,197,94,0.06) 0%, transparent 55%); }
  .row-top::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #22c55e, #16a34a); }

  .cell-pos { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.2); text-align: center; }
  .cell-pos.champ { color: #fbbf24; }
  .cell-team { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
  .team-avatar { width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 0.02em; }
  .team-name-full { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 1; }
  .name-desktop { display: block; }
  .name-mobile { display: none; }
  @media (max-width: 600px) { .name-desktop { display: none; } .name-mobile { display: block; } }

  .cell-stat { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.45); text-align: center; }
  .cell-stat.bright { color: rgba(255,255,255,0.75); }
  .gd-pos { color: #22c55e !important; }
  .gd-neg { color: #f87171 !important; }
  .gd-zero { color: rgba(255,255,255,0.2) !important; }

  .cell-pts { text-align: center; }
  .pts-badge { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 26px; border-radius: 6px; font-family: 'Bebas Neue', sans-serif; font-size: 17px; }
  .pts-champ { background: rgba(251,191,36,0.14); color: #fbbf24; border: 1px solid rgba(251,191,36,0.28); }
  .pts-top   { background: rgba(34,197,94,0.1);  color: #22c55e; border: 1px solid rgba(34,197,94,0.22); }
  .pts-norm  { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.08); }

  /* Live badge */
  .live-badge { display: inline-flex; align-items: center; gap: 3px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.35); border-radius: 4px; padding: 2px 6px; font-family: 'Barlow Condensed', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: #f87171; flex-shrink: 0; }
  .live-badge-dot { width: 4px; height: 4px; background: #f87171; border-radius: 50%; animation: livePulse 1.2s ease infinite; }
  @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.2} }

  .legend { display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-family: 'Barlow', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25); }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; }

  .loading-wrap { display: flex; align-items: center; justify-content: center; padding: 64px 0; gap: 10px; }
  .spinner { width: 28px; height: 28px; border: 2px solid rgba(34,197,94,0.2); border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); }

  .mobile-note { display: none; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.15); text-align: right; margin-bottom: 8px; }
  @media (max-width: 600px) { .mobile-note { display: block; } }
`

function calculateTable(teams: { id: string; name: string }[], matches: Match[]): TeamStats[] {
  return teams.map(team => {
    const relevant = matches.filter(m =>
      (m.status === 'finished' || m.status === 'live') &&
      (m.home_team_id === team.id || m.away_team_id === team.id)
    )
    let wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0
    relevant.forEach(m => {
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
  }).sort((a, b) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for
  )
}

export default function LeagueTablePage() {
  const [table, setTable]         = useState<TeamStats[]>([])
  const [loading, setLoading]     = useState(true)
  const [liveTeamIds, setLiveTeamIds] = useState<Set<string>>(new Set())

  const teamsRef   = useRef<{ id: string; name: string }[]>([])
  const matchesRef = useRef<Match[]>([])

  useEffect(() => {
    const init = async () => {
      const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
        supabase.from('teams').select('id, name'),
        supabase.from('matches').select('id, home_team_id, away_team_id, status, home_score, away_score'),
      ])
      if (!teamsData || !matchesData) return
      teamsRef.current   = teamsData
      matchesRef.current = matchesData
      setTable(calculateTable(teamsData, matchesData))
      const live = matchesData.find((m: any) => m.status === 'live')
      setLiveTeamIds(new Set(live ? [live.home_team_id, live.away_team_id] : []))
      setLoading(false)
    }
    init()

    const interval = setInterval(async () => {
      const { data: matchesData } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, status, home_score, away_score')
      if (!matchesData || !teamsRef.current.length) return
      matchesRef.current = matchesData
      setTable(calculateTable(teamsRef.current, matchesData))
      const live = matchesData.find((m: any) => m.status === 'live')
      setLiveTeamIds(new Set(live ? [live.home_team_id, live.away_team_id] : []))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">
        <div className="container">

          <div className="header">
            <div className="league-badge">
              <div className="badge-dot">⚽</div>
              <span className="badge-text">Naija FC Sheffield</span>
            </div>
            <h1 className="title">League<br /><span>Table</span></h1>
            <p className="subtitle">Sheffield 7-a-side · 6 Teams</p>
            <div className="season-tag">⚡ Season 1 · 2026</div>
          </div>

          <p className="mobile-note">Showing: P · W · L · GD · PTS</p>

          <div className="table-card">
            <div className="col-headers col-def">
              <div className="col-hd">#</div>
              <div className="col-hd left">Team</div>
              <div className="col-hd">P</div>
              <div className="col-hd">W</div>
              <div className="col-hd hide-mobile">D</div>
              <div className="col-hd">L</div>
              <div className="col-hd hide-mobile">GF</div>
              <div className="col-hd hide-mobile">GA</div>
              <div className="col-hd">GD</div>
              <div className="col-hd">PTS</div>
            </div>

            {loading ? (
              <div className="loading-wrap">
                <div className="spinner" />
                <span className="loading-text">Loading...</span>
              </div>
            ) : (
              table.map((team, i) => {
                const color = TEAM_COLORS[i % 6]
                const gd = team.goal_difference
                const gdStr = gd > 0 ? `+${gd}` : `${gd}`
                const gdClass = gd > 0 ? 'cell-stat gd-pos' : gd < 0 ? 'cell-stat gd-neg' : 'cell-stat gd-zero'
                const rowClass = i === 0 ? 'team-row col-def row-champ' : i <= 2 ? 'team-row col-def row-top' : 'team-row col-def'
                const ptsClass = i === 0 ? 'pts-badge pts-champ' : i <= 2 ? 'pts-badge pts-top' : 'pts-badge pts-norm'
                const isLive = liveTeamIds.has(team.id)

                return (
                  <div key={team.id} className={rowClass}>
                    <div className={`cell-pos${i === 0 ? ' champ' : ''}`}>
                      {i === 0 ? '👑' : i + 1}
                    </div>
                    <div className="cell-team">
                      <div className="team-avatar" style={{ background: color.bg, color: color.color }}>
                        {initials(team.name)}
                      </div>
                      <Link href={`/teams/${team.id}`} className="team-name-full" style={{ textDecoration: 'none' }}>
                        <span className="name-desktop">{team.name}</span>
                        <span className="name-mobile">{shortName(team.name)}</span>
                      </Link>
                      {isLive && (
                        <span className="live-badge">
                          <div className="live-badge-dot" />LIVE
                        </span>
                      )}
                    </div>
                    <div className="cell-stat bright">{team.played}</div>
                    <div className="cell-stat bright">{team.wins}</div>
                    <div className="cell-stat hide-mobile">{team.draws}</div>
                    <div className="cell-stat">{team.losses}</div>
                    <div className="cell-stat hide-mobile">{team.goals_for}</div>
                    <div className="cell-stat hide-mobile">{team.goals_against}</div>
                    <div className={gdClass}>{gdStr}</div>
                    <div className="cell-pts">
                      <span className={ptsClass}>{team.points}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#fbbf24' }} />
              <span>Champions</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#22c55e' }} />
              <span>Top 3</span>
            </div>
            <div className="legend-item">
              <div className="live-badge" style={{ borderRadius: '4px' }}>
                <div className="live-badge-dot" />LIVE
              </div>
              <span>Playing now</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}