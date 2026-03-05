'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

type Event = {
  id: string
  type: string
  minute: number | null
  player_name: string
  team_id: string
}

type Player = {
  id: string
  name: string
  shirt_number: number | null
  position: string | null
  team_id: string
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

function eventIcon(type: string) {
  if (type === 'goal')   return '⚽'
  if (type === 'assist') return '🅰️'
  if (type === 'yellow') return '🟨'
  if (type === 'red')    return '🟥'
  if (type === 'potm')   return '⭐'
  return '•'
}

function eventLabel(type: string) {
  if (type === 'goal')   return 'Goal'
  if (type === 'assist') return 'Assist'
  if (type === 'yellow') return 'Yellow Card'
  if (type === 'red')    return 'Red Card'
  if (type === 'potm')   return 'Player of the Match'
  return type
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page { min-height:100vh; background:#080f08; color:#fff; padding:24px 16px 100px; font-family:'Barlow',sans-serif; }
  .container { max-width:860px; margin:0 auto; }

  /* Back */
  .back { display:inline-flex; align-items:center; gap:6px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.3); text-decoration:none; margin-bottom:20px; transition:color 0.15s; }
  .back:hover { color:#22c55e; }

  /* Hero score card */
  .score-card {
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.09);
    border-radius:18px; padding:24px 20px; margin-bottom:20px; position:relative; overflow:hidden;
  }
  .score-card.live { border-color:rgba(239,68,68,0.35); background:rgba(239,68,68,0.04); }
  .score-card.live::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#ef4444,#dc2626); }

  .card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .meta-date { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.08em; color:rgba(255,255,255,0.3); }

  .live-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:100px; padding:4px 12px; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; color:#f87171; }
  .live-dot { width:5px; height:5px; background:#f87171; border-radius:50%; animation:blink 1.2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .fin-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); border-radius:100px; padding:4px 12px; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; color:#22c55e; }
  .upc-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:100px; padding:4px 12px; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; color:rgba(255,255,255,0.35); }

  /* Main scoreline */
  .scoreline { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; }
  .team-block { display:flex; flex-direction:column; gap:6px; }
  .team-block.home { align-items:flex-start; }
  .team-block.away { align-items:flex-end; }
  .team-initials { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:16px; }
  .team-link { text-decoration:none; }
  .team-link:hover .team-name { color:#22c55e; }
  .team-name { font-family:'Barlow Condensed',sans-serif; font-size:clamp(13px,3.5vw,18px); font-weight:700; color:#fff; letter-spacing:0.02em; line-height:1.2; transition:color 0.15s; }
  .team-name.home { text-align:left; }
  .team-name.away { text-align:right; }
  .team-name.winner { color:#22c55e; }
  .team-name.loser { color:rgba(255,255,255,0.3); }

  .score-center { display:flex; flex-direction:column; align-items:center; gap:4px; }
  .scores { display:flex; align-items:center; gap:10px; }
  .score { font-family:'Bebas Neue',sans-serif; font-size:clamp(52px,12vw,80px); color:#fff; line-height:1; }
  .score-sep { font-family:'Bebas Neue',sans-serif; font-size:32px; color:rgba(255,255,255,0.2); }
  .score-vs { font-family:'Bebas Neue',sans-serif; font-size:28px; color:rgba(255,255,255,0.2); }
  .kick-time { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.08em; color:rgba(255,255,255,0.2); }

  /* Result banner */
  .result-banner { margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; }
  .result-text { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }
  .r-home { color:#22c55e; }
  .r-away { color:#60a5fa; }
  .r-draw { color:rgba(255,255,255,0.35); }

  /* Section */
  .section { margin-bottom:20px; }
  .section-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:0.04em; color:#fff; margin-bottom:12px; }

  /* Events timeline — 3-col grid: left (home) | centre (minute) | right (away) */
  .events-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }
  .event-row {
    display:grid;
    grid-template-columns: 1fr 48px 1fr;
    align-items:center;
    padding:10px 14px;
    border-bottom:1px solid rgba(255,255,255,0.04);
    transition:background 0.1s;
    gap:4px;
  }
  .event-row:last-child { border-bottom:none; }
  .event-row:hover { background:rgba(255,255,255,0.03); }

  /* Centre minute bubble */
  .event-min-wrap { display:flex; flex-direction:column; align-items:center; gap:2px; }
  .event-min {
    font-family:'Bebas Neue',sans-serif; font-size:15px; line-height:1;
    color:#fff;
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
    border-radius:6px; padding:3px 6px; min-width:34px; text-align:center;
  }
  .event-min-line { width:1px; height:100%; background:rgba(255,255,255,0.06); }

  /* Home side (left column) */
  .event-home { display:flex; align-items:center; gap:8px; justify-content:flex-end; }
  .event-home .event-info { text-align:right; }

  /* Away side (right column) */
  .event-away { display:flex; align-items:center; gap:8px; justify-content:flex-start; }
  .event-away .event-info { text-align:left; }

  /* Empty placeholder when event is on the other side */
  .event-side-empty { display:block; }

  .event-icon { font-size:18px; flex-shrink:0; line-height:1; }
  .event-player { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; color:#fff; letter-spacing:0.02em; }
  .event-type { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:600; letter-spacing:0.05em; color:rgba(255,255,255,0.28); margin-top:1px; }
  .no-events { padding:28px; text-align:center; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Squad lists */
  .squads { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:480px) { .squads { grid-template-columns:1fr; } }
  .squad-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }
  .squad-head { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); }
  .squad-team-name { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.04em; color:#fff; }
  .squad-row { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); }
  .squad-row:last-child { border-bottom:none; }
  .squad-num { font-family:'Bebas Neue',sans-serif; font-size:16px; color:rgba(255,255,255,0.2); min-width:20px; text-align:center; }
  .squad-name { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; flex:1; }
  .squad-pos { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.06em; color:rgba(255,255,255,0.25); }

  /* Skeleton */
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  .sk { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:600px 100%; animation:shimmer 1.4s ease infinite; border-radius:6px; }
  .sk-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:24px 20px; margin-bottom:20px; }
  .sk-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }

  /* POTM highlight */
  .potm-card { background:rgba(234,179,8,0.06); border:1px solid rgba(234,179,8,0.2); border-radius:14px; padding:16px; display:flex; align-items:center; gap:14px; }
  .potm-icon { font-size:32px; flex-shrink:0; }
  .potm-label { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(234,179,8,0.7); }
  .potm-name { font-family:'Bebas Neue',sans-serif; font-size:24px; color:#facc15; letter-spacing:0.04em; line-height:1.1; }
  .potm-team { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; color:rgba(255,255,255,0.3); margin-top:2px; }
`

function SkeletonLoader() {
  return (
    <div>
      <div className="sk-card">
        <div className="sk-row">
          <div className="sk" style={{ height:12, width:160 }} />
          <div className="sk" style={{ height:22, width:70, borderRadius:100 }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center' }}>
          <div>
            <div className="sk" style={{ height:44, width:44, borderRadius:12, marginBottom:8 }} />
            <div className="sk" style={{ height:16, width:'70%' }} />
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div className="sk" style={{ height:80, width:50, borderRadius:8 }} />
            <div className="sk" style={{ height:32, width:24 }} />
            <div className="sk" style={{ height:80, width:50, borderRadius:8 }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <div className="sk" style={{ height:44, width:44, borderRadius:12 }} />
            <div className="sk" style={{ height:16, width:'70%' }} />
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, overflow:'hidden' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div className="sk" style={{ height:20, width:20, borderRadius:'50%', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div className="sk" style={{ height:14, width:'50%', marginBottom:4 }} />
              <div className="sk" style={{ height:10, width:'30%' }} />
            </div>
            <div className="sk" style={{ height:20, width:30 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const BADGE_COLORS = [
  { bg:'rgba(239,68,68,0.2)',  color:'#f87171' },
  { bg:'rgba(59,130,246,0.2)', color:'#60a5fa' },
  { bg:'rgba(168,85,247,0.2)', color:'#c084fc' },
  { bg:'rgba(234,179,8,0.2)',  color:'#facc15' },
  { bg:'rgba(20,184,166,0.2)', color:'#2dd4bf' },
  { bg:'rgba(249,115,22,0.2)', color:'#fb923c' },
]

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch]     = useState<Match | null>(null)
  const [events, setEvents]   = useState<Event[]>([])
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const fetchAll = async () => {
    const [
      { data: matchData },
      { data: eventsData },
      { data: teamsData },
      { data: playersData },
    ] = await Promise.all([
      supabase.from('matches').select('*').eq('id', id).single(),
      supabase.from('match_events').select('id, type, minute, player_id, team_id').eq('match_id', id).order('minute', { ascending: true }),
      supabase.from('teams').select('id, name'),
      supabase.from('players').select('id, name, shirt_number, position, team_id').order('shirt_number', { ascending: true }),
    ])

    if (!matchData || !teamsData) { setLoading(false); return }

    const homeTeam = teamsData.find(t => t.id === matchData.home_team_id)
    const awayTeam = teamsData.find(t => t.id === matchData.away_team_id)

    setMatch({
      ...matchData,
      home_team: homeTeam || { id: matchData.home_team_id, name: 'Unknown' },
      away_team: awayTeam || { id: matchData.away_team_id, name: 'Unknown' },
    })

    if (eventsData && playersData) {
      setEvents(eventsData.map((e: any) => {
        const player = playersData.find((p: any) => p.id === e.player_id)
        return { ...e, player_name: player?.name || 'Unknown' }
      }))
      setHomePlayers(playersData.filter((p: any) => p.team_id === matchData.home_team_id))
      setAwayPlayers(playersData.filter((p: any) => p.team_id === matchData.away_team_id))
    }

    setLoading(false)
  }

  const potmEvent = events.find(e => e.type === 'potm')
  const matchEvents = events.filter(e => e.type !== 'potm')
  const isLive = match?.status === 'live'
  const isFinished = match?.status === 'finished'
  const homeWin = isFinished && (match?.home_score ?? 0) > (match?.away_score ?? 0)
  const awayWin = isFinished && (match?.away_score ?? 0) > (match?.home_score ?? 0)

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">
        <div className="container">
          <Link href="/fixtures" className="back">← Back to Fixtures</Link>

          {loading ? <SkeletonLoader /> : !match ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.3)', fontFamily:'Barlow Condensed,sans-serif', letterSpacing:'0.1em', textTransform:'uppercase' }}>Match not found</div>
          ) : (
            <>
              {/* Score Card */}
              <div className={`score-card${isLive ? ' live' : ''}`}>
                <div className="card-meta">
                  <span className="meta-date">{fmt(match.match_date)} · {fmtTime(match.match_date)}</span>
                  {isLive     && <div className="live-pill"><div className="live-dot" />Live Now</div>}
                  {isFinished && <div className="fin-pill">✅ Final</div>}
                  {match.status === 'scheduled' && <div className="upc-pill">🕐 Upcoming</div>}
                </div>

                <div className="scoreline">
                  <div className="team-block home">
                    <Link href={`/teams/${match.home_team.id}`} className="team-link">
                      <div className="team-initials" style={{ background:BADGE_COLORS[0].bg, color:BADGE_COLORS[0].color }}>
                        {match.home_team.name.split(' ').map(w => w[0]).join('').slice(0,3)}
                      </div>
                    </Link>
                    <Link href={`/teams/${match.home_team.id}`} className="team-link">
                      <div className={`team-name home${homeWin?' winner':awayWin?' loser':''}`}>{shortName(match.home_team.name)}</div>
                    </Link>
                  </div>

                  <div className="score-center">
                    {(isLive || isFinished) ? (
                      <div className="scores">
                        <span className="score">{match.home_score ?? 0}</span>
                        <span className="score-sep">-</span>
                        <span className="score">{match.away_score ?? 0}</span>
                      </div>
                    ) : (
                      <>
                        <div className="score-vs">vs</div>
                        <div className="kick-time">{fmtTime(match.match_date)}</div>
                      </>
                    )}
                  </div>

                  <div className="team-block away">
                    <Link href={`/teams/${match.away_team.id}`} className="team-link">
                      <div className="team-initials" style={{ background:BADGE_COLORS[1].bg, color:BADGE_COLORS[1].color, marginLeft:'auto' }}>
                        {match.away_team.name.split(' ').map(w => w[0]).join('').slice(0,3)}
                      </div>
                    </Link>
                    <Link href={`/teams/${match.away_team.id}`} className="team-link">
                      <div className={`team-name away${awayWin?' winner':homeWin?' loser':''}`}>{shortName(match.away_team.name)}</div>
                    </Link>
                  </div>
                </div>

                {isFinished && (
                  <div className="result-banner">
                    {homeWin && <span className="result-text r-home">🏆 {shortName(match.home_team.name)} Win</span>}
                    {awayWin && <span className="result-text r-away">🏆 {shortName(match.away_team.name)} Win</span>}
                    {!homeWin && !awayWin && <span className="result-text r-draw">🤝 Draw</span>}
                  </div>
                )}
              </div>

              {/* POTM */}
              {potmEvent && (
                <div className="section">
                  <div className="potm-card">
                    <div className="potm-icon">⭐</div>
                    <div>
                      <div className="potm-label">Player of the Match</div>
                      <div className="potm-name">{potmEvent.player_name}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Events */}
              {(isLive || isFinished) && (
                <div className="section">
                  <div className="section-title">Match Events</div>
                  <div className="events-card">
                    {matchEvents.length === 0 ? (
                      <div className="no-events">{isLive ? 'No events yet — kick off!' : 'No events recorded'}</div>
                    ) : (
                      matchEvents.map(e => {
                        const isHome = e.team_id === match.home_team.id
                        return (
                          <div key={e.id} className="event-row">
                            {/* Left: home event */}
                            {isHome ? (
                              <div className="event-home">
                                <div className="event-info">
                                  <div className="event-player">{e.player_name}</div>
                                  <div className="event-type">{eventLabel(e.type)}</div>
                                </div>
                                <div className="event-icon">{eventIcon(e.type)}</div>
                              </div>
                            ) : (
                              <div className="event-side-empty" />
                            )}

                            {/* Centre: minute */}
                            <div className="event-min-wrap">
                              <div className="event-min">{e.minute ?? '—'}&apos;</div>
                            </div>

                            {/* Right: away event */}
                            {!isHome ? (
                              <div className="event-away">
                                <div className="event-icon">{eventIcon(e.type)}</div>
                                <div className="event-info">
                                  <div className="event-player">{e.player_name}</div>
                                  <div className="event-type">{eventLabel(e.type)}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="event-side-empty" />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Squads */}
              {(homePlayers.length > 0 || awayPlayers.length > 0) && (
                <div className="section">
                  <div className="section-title">Squads</div>
                  <div className="squads">
                    {[{ team: match.home_team, players: homePlayers }, { team: match.away_team, players: awayPlayers }].map(({ team, players }) => (
                      <div key={team.id} className="squad-card">
                        <div className="squad-head">
                          <Link href={`/teams/${team.id}`} style={{ textDecoration:'none' }}>
                            <div className="squad-team-name">{shortName(team.name)}</div>
                          </Link>
                        </div>
                        {players.map(p => (
                          <Link key={p.id} href={`/players/${p.id}`} style={{ textDecoration:'none', display:'block' }}>
                            <div className="squad-row" style={{ cursor:'pointer' }}>
                              <div className="squad-num">{p.shirt_number ?? '—'}</div>
                              <div className="squad-name">{p.name}</div>
                              <div className="squad-pos">{p.position === 'GK' ? 'GK' : ''}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}