'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Fixture = {
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

type FilterType = 'all' | 'scheduled' | 'live' | 'finished'

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
    background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,80,16,0.38) 0%, transparent 60%);
    padding: 40px 16px 100px;
    font-family: 'Barlow', sans-serif;
    color: #fff;
  }
  .container { max-width: 860px; margin: 0 auto; }

  /* Header */
  .header { margin-bottom: 28px; }
  .league-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px; padding: 5px 14px 5px 5px; margin-bottom: 16px;
  }
  .badge-dot {
    width: 26px; height: 26px; background: linear-gradient(135deg,#22c55e,#16a34a);
    border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:13px;
  }
  .badge-text {
    font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
    letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.4);
  }
  .title {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(44px,9vw,80px); line-height:0.88; letter-spacing:0.02em; color:#fff;
  }
  .title-accent { color:#22c55e; }
  .subtitle {
    font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600;
    letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-top:8px;
  }

  /* Filter tabs */
  .filter-tabs { display:flex; gap:6px; margin-bottom:24px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .filter-tabs::-webkit-scrollbar { display:none; }
  .filter-tab {
    flex-shrink:0; padding:8px 16px; border-radius:100px; border:none; cursor:pointer;
    font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase; transition:all 0.15s;
    background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35);
    border:1px solid rgba(255,255,255,0.08); white-space:nowrap;
  }
  .filter-tab.active { background:rgba(34,197,94,0.15); color:#22c55e; border-color:rgba(34,197,94,0.3); }

  /* Month group */
  .month-group { margin-bottom:28px; }
  .month-label {
    font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.2);
    margin-bottom:8px; padding-left:2px;
    display:flex; align-items:center; gap:10px;
  }
  .month-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.05); }

  /* Fixture card */
  .fixture-card {
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:14px 16px; margin-bottom:8px;
    position:relative; transition:background 0.15s;
  }
  .fixture-card:hover { background:rgba(255,255,255,0.05); }
  .fixture-card.live { border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.04); }
  .fixture-card.live::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:#ef4444; border-radius:2px 0 0 2px; }

  /* Top row: date + badge */
  .card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .card-date { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.08em; color:rgba(255,255,255,0.28); }

  /* Badges */
  .badge { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 9px; border-radius:100px; }
  .badge-live { background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); animation:pulse 2s ease infinite; }
  .badge-finished { background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.2); }
  .badge-scheduled { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.28); border:1px solid rgba(255,255,255,0.08); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* Scoreline row */
  .scoreline {
    display:grid;
    grid-template-columns: 1fr auto 1fr;
    align-items:center;
    gap:8px;
  }
  .team-name {
    font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700;
    color:#fff; letter-spacing:0.02em; line-height:1.2;
  }
  .team-name.home { text-align:left; }
  .team-name.away { text-align:right; }
  .team-name.winner { color:#22c55e; }
  .team-name.loser { color:rgba(255,255,255,0.3); }

  /* Show short name on mobile */
  .name-long { display:inline; }
  .name-short { display:none; }
  @media (max-width:520px) {
    .name-long { display:none; }
    .name-short { display:inline; }
    .team-name { font-size:13px; }
  }

  .score-box { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .score { font-family:'Bebas Neue',sans-serif; font-size:30px; color:#fff; line-height:1; min-width:22px; text-align:center; }
  .score-sep { font-family:'Bebas Neue',sans-serif; font-size:18px; color:rgba(255,255,255,0.2); }
  .score-vs { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; color:rgba(255,255,255,0.2); padding:0 6px; }

  /* Result tag */
  .result-tag { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); }
  .result-pill { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 8px; border-radius:4px; }
  .r-home { background:rgba(34,197,94,0.12); color:#22c55e; }
  .r-away { background:rgba(59,130,246,0.12); color:#60a5fa; }
  .r-draw { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); }

  /* Empty */
  .empty { text-align:center; padding:48px 24px; }
  .empty-icon { font-size:40px; margin-bottom:10px; }
  .empty-text { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:64px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }
`

function FixtureCard({ fixture }: { fixture: Fixture }) {
    const date = new Date(fixture.match_date)
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const isFinished = fixture.status === 'finished'
    const isLive = fixture.status === 'live'
    const homeWin = isFinished && fixture.home_score > fixture.away_score
    const awayWin = isFinished && fixture.home_score < fixture.away_score

    return (
        <div className={`fixture-card${isLive ? ' live' : ''}`}>
            <div className="card-top">
                <span className="card-date">{dateStr} · {timeStr}</span>
                {isLive && <span className="badge badge-live">🔴 Live</span>}
                {isFinished && <span className="badge badge-finished">✅ Result</span>}
                {fixture.status === 'scheduled' && <span className="badge badge-scheduled">🕐 Upcoming</span>}
            </div>

            <div className="scoreline">
                <div className={`team-name home${homeWin ? ' winner' : awayWin ? ' loser' : ''}`}>
                    <span className="name-long">{fixture.home_team.name}</span>
                    <span className="name-short">{shortName(fixture.home_team.name)}</span>
                </div>

                <div className="score-box">
                    {(isFinished || isLive) ? (
                        <>
                            <span className="score">{fixture.home_score ?? 0}</span>
                            <span className="score-sep">-</span>
                            <span className="score">{fixture.away_score ?? 0}</span>
                        </>
                    ) : (
                        <span className="score-vs">vs</span>
                    )}
                </div>

                <div className={`team-name away${awayWin ? ' winner' : homeWin ? ' loser' : ''}`}>
                    <span className="name-long">{fixture.away_team.name}</span>
                    <span className="name-short">{shortName(fixture.away_team.name)}</span>
                </div>
            </div>

            {isFinished && (
                <div className="result-tag">
                    {homeWin && <span className="result-pill r-home">Home Win</span>}
                    {awayWin && <span className="result-pill r-away">Away Win</span>}
                    {!homeWin && !awayWin && <span className="result-pill r-draw">Draw</span>}
                </div>
            )}
        </div>
    )
}

export default function FixturesPage() {
    const [fixtures, setFixtures] = useState<Fixture[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')

    useEffect(() => { fetchFixtures() }, [])

    const fetchFixtures = async () => {
        const { data: matchesData } = await supabase
            .from('matches')
            .select('id, home_team_id, away_team_id, match_date, status, home_score, away_score')
            .order('match_date', { ascending: true })

        const { data: teamsData } = await supabase.from('teams').select('id, name')
        if (!matchesData || !teamsData) { setLoading(false); return }

        const fixtures = matchesData.map((m: any) => ({
            ...m,
            home_team: { name: teamsData.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown' },
            away_team: { name: teamsData.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown' },
        }))

        setFixtures(fixtures)
        setLoading(false)
    }

    const filtered = fixtures.filter(f => filter === 'all' || f.status === filter)

    const grouped = filtered.reduce((acc: Record<string, Fixture[]>, f) => {
        const key = new Date(f.match_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        if (!acc[key]) acc[key] = []
        acc[key].push(f)
        return acc
    }, {})

    const counts = {
        all: fixtures.length,
        scheduled: fixtures.filter(f => f.status === 'scheduled').length,
        live: fixtures.filter(f => f.status === 'live').length,
        finished: fixtures.filter(f => f.status === 'finished').length,
    }

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">
                <div className="container">
                    <div className="header">
                        <div className="league-badge">
                            <div className="badge-dot">📅</div>
                            <span className="badge-text">Naija FC Sheffield</span>
                        </div>
                        <h1 className="title">Fixtures<br /><span className="title-accent">&amp; Results</span></h1>
                        <p className="subtitle">Sheffield 7-a-side · Season 1 · 2026</p>
                    </div>

                    <div className="filter-tabs">
                        {(['all', 'live', 'scheduled', 'finished'] as FilterType[]).map(f => (
                            <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                                {f === 'all' && `All (${counts.all})`}
                                {f === 'live' && `🔴 Live (${counts.live})`}
                                {f === 'scheduled' && `Upcoming (${counts.scheduled})`}
                                {f === 'finished' && `Results (${counts.finished})`}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="loading-wrap">
                            <div className="spinner" />
                            <span className="loading-text">Loading fixtures...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon">📭</div>
                            <div className="empty-text">No fixtures found</div>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([month, items]) => (
                            <div key={month} className="month-group">
                                <div className="month-label">{month}</div>
                                {items.map(f => <FixtureCard key={f.id} fixture={f} />)}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}