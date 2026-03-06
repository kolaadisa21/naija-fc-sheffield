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

  /* Events timeline — 3-col: home | minute | away */
  .events-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }

  /* Column labels row */
  .events-header {
    display: grid;
    grid-template-columns: 1fr 48px 1fr;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
  }
  .events-header-home {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(34,197,94,0.6);
  }
  .events-header-min {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.15);
    text-align: center;
  }
  .events-header-away {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(96,165,250,0.6);
    text-align: right;
  }

  .event-row {
    display: grid;
    grid-template-columns: 1fr 48px 1fr;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.1s;
    gap: 4px;
  }
  .event-row:last-child { border-bottom: none; }
  .event-row:hover { background: rgba(255,255,255,0.025); }

  /* Home side — content right-aligned, icon on far right */
  .event-home-side {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    min-width: 0;
  }
  .event-home-side .event-text { text-align: right; min-width: 0; }

  /* Away side — icon on far left, content left-aligned */
  .event-away-side {
    display: flex; align-items: center; justify-content: flex-start; gap: 8px;
    min-width: 0;
  }
  .event-away-side .event-text { text-align: left; min-width: 0; }

  .event-empty { display: block; min-width: 0; }

  .event-icon { font-size: 17px; flex-shrink: 0; line-height: 1; }
  .event-icon.small { font-size: 13px; }
  .event-player { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; letter-spacing:0.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .event-label  { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:600; letter-spacing:0.05em; color:rgba(255,255,255,0.28); margin-top:1px; }

  /* Minute bubble */
  .event-min-col { display: flex; flex-direction: column; align-items: center; }
  .event-min-bubble {
    font-family: 'Bebas Neue', sans-serif; font-size: 13px; line-height: 1;
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px; padding: 3px 6px; min-width: 32px; text-align: center;
  }

  .no-events { padding:28px; text-align:center; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Squad lists — always side by side, no header */
  .squads {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    overflow: hidden;
  }
  .squads .squad-col:first-child { border-right: 1px solid rgba(255,255,255,0.06); }
  .squad-col { min-width: 0; }

  /* Colour bar at top of each column instead of text header */
  .squad-bar {
    height: 3px;
    width: 100%;
  }

  /* Player rows */
  .squad-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.12s;
    text-decoration: none;
  }
  .squad-row:last-child { border-bottom: none; }
  .squad-row:hover { background: rgba(255,255,255,0.04); }
  .squad-num { display: none; }
  .squad-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
    text-align: center;
    width: 100%;
  }
  .squad-row:hover .squad-name { color: #22c55e; }
  .squad-pos {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #facc15;
    background: rgba(234,179,8,0.1);
    border: 1px solid rgba(234,179,8,0.2);
    border-radius: 3px;
    padding: 1px 5px;
    flex-shrink: 0;
  }
  /* Inline event badges on squad rows — centred below name */
  .squad-badges { display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap; }
  .sq-badge {
    font-size: 12px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    gap: 1px;
  }
  .sq-badge-count {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    line-height: 1;
  }
  /* 2-yellow-to-red in events timeline */
  .event-2y { font-family:'Barlow Condensed',sans-serif; font-size:9px; font-weight:700; letter-spacing:0.05em; color:#f87171; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); border-radius:3px; padding:1px 4px; margin-left:3px; }

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
  const rawMatchEvents = events.filter(e => e.type !== 'potm')
  const isLive = match?.status === 'live'
  const isFinished = match?.status === 'finished'
  const homeWin = isFinished && (match?.home_score ?? 0) > (match?.away_score ?? 0)
  const awayWin = isFinished && (match?.away_score ?? 0) > (match?.home_score ?? 0)

  // Build processed events: 2 yellows for same player → 2nd becomes red (2Y)
  const matchEvents = (() => {
    const yellowCount: Record<string, number> = {}
    return rawMatchEvents.map(e => {
      if (e.type === 'yellow') {
        yellowCount[e.player_name] = (yellowCount[e.player_name] || 0) + 1
        if (yellowCount[e.player_name] === 2) {
          return { ...e, type: 'red', secondYellow: true }
        }
      }
      return { ...e, secondYellow: false }
    })
  })()

  // Per-player stats for squad badges
  const playerStats: Record<string, { goals: number; assists: number; yellows: number; red: boolean }> = {}
  rawMatchEvents.forEach(e => {
    const k = e.player_name
    if (!playerStats[k]) playerStats[k] = { goals: 0, assists: 0, yellows: 0, red: false }
    if (e.type === 'goal')   playerStats[k].goals++
    if (e.type === 'assist') playerStats[k].assists++
    if (e.type === 'yellow') playerStats[k].yellows++
    if (e.type === 'red')    playerStats[k].red = true
  })
  // 2 yellows = red on squad too
  Object.values(playerStats).forEach(s => { if (s.yellows >= 2) s.red = true })

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
                    {/* Column labels */}
                    <div className="events-header">
                      <span className="events-header-home">{shortName(match.home_team.name)}</span>
                      <span className="events-header-min">Min</span>
                      <span className="events-header-away">{shortName(match.away_team.name)}</span>
                    </div>
                    {matchEvents.length === 0 ? (
                      <div className="no-events">{isLive ? 'No events yet — kick off!' : 'No events recorded'}</div>
                    ) : (
                      matchEvents.map((e: any) => {
                        const isHome = e.team_id === match.home_team.id
                        const icon = e.secondYellow ? '🟨🟥' : eventIcon(e.type)
                        const label = e.secondYellow ? '2nd Yellow → Red' : eventLabel(e.type)
                        const iconEl = (
                          <span className={`event-icon${e.secondYellow ? ' small' : ''}`}>{icon}</span>
                        )
                        const textEl = (
                          <div className="event-text">
                            <div className="event-player">{e.player_name}</div>
                            <div className="event-label">{label}</div>
                          </div>
                        )
                        return (
                          <div key={e.id} className="event-row">
                            {/* Left — home */}
                            {isHome ? (
                              <div className="event-home-side">{textEl}{iconEl}</div>
                            ) : (
                              <span className="event-empty" />
                            )}
                            {/* Centre — minute */}
                            <div className="event-min-col">
                              <div className="event-min-bubble">{e.minute ?? '—'}'</div>
                            </div>
                            {/* Right — away */}
                            {!isHome ? (
                              <div className="event-away-side">{iconEl}{textEl}</div>
                            ) : (
                              <span className="event-empty" />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Squads — side by side, colour bar header */}
              {(homePlayers.length > 0 || awayPlayers.length > 0) && (
                <div className="section">
                  <div className="section-title">Squads</div>
                  <div className="squads">
                    {([
                      { team: match.home_team, players: homePlayers, color: '#22c55e' },
                      { team: match.away_team, players: awayPlayers, color: '#60a5fa' },
                    ] as { team: any; players: any[]; color: string }[]).map(({ team, players, color }) => (
                      <div key={team.id} className="squad-col">
                        <div className="squad-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                        {players.map(p => {
                          const ps = playerStats[p.name]
                          const yellowsToShow = ps ? (ps.yellows >= 2 ? 1 : ps.yellows) : 0
                          return (
                            <Link key={p.id} href={`/players/${p.id}`} style={{ textDecoration:'none', display:'block' }}>
                              <div className="squad-row">
                                <div className="squad-name">{p.name}</div>
                                {p.position === 'GK' && <div className="squad-pos">GK</div>}
                                {ps && (
                                  <div className="squad-badges">
                                    {ps.goals > 0 && (
                                      <span className="sq-badge">
                                        ⚽{ps.goals > 1 && <span className="sq-badge-count">×{ps.goals}</span>}
                                      </span>
                                    )}
                                    {ps.assists > 0 && (
                                      <span className="sq-badge">
                                        🅰️{ps.assists > 1 && <span className="sq-badge-count">×{ps.assists}</span>}
                                      </span>
                                    )}
                                    {yellowsToShow > 0 && <span className="sq-badge">🟨</span>}
                                    {ps.red && <span className="sq-badge">🟥</span>}
                                  </div>
                                )}
                              </div>
                            </Link>
                          )
                        })}
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