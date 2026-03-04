'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type StatRow = {
    player_id: string
    player_name: string
    team_name: string
    count: number
}

type Tab = 'goals' | 'assists' | 'yellow' | 'red' | 'potm'

const TABS: { key: Tab; label: string; icon: string; color: string; emptyMsg: string }[] = [
    { key: 'goals', label: 'Top Scorers', icon: '⚽', color: '#22c55e', emptyMsg: 'No goals scored yet' },
    { key: 'assists', label: 'Assists', icon: '🅰️', color: '#60a5fa', emptyMsg: 'No assists recorded yet' },
    { key: 'yellow', label: 'Yellows', icon: '🟨', color: '#facc15', emptyMsg: 'No yellow cards yet' },
    { key: 'red', label: 'Reds', icon: '🟥', color: '#f87171', emptyMsg: 'No red cards yet' },
    { key: 'potm', label: 'POTM', icon: '⭐', color: '#c084fc', emptyMsg: 'No POTM awards yet' },
]

function shortTeam(name: string): string {
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
    font-family: 'Barlow', sans-serif; color: #fff;
  }
  .container { max-width: 700px; margin: 0 auto; }

  /* Header */
  .header { margin-bottom: 28px; }
  .league-badge {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:100px; padding:5px 14px 5px 5px; margin-bottom:16px;
  }
  .badge-dot {
    width:26px; height:26px; background:linear-gradient(135deg,#22c55e,#16a34a);
    border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px;
  }
  .badge-text {
    font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
    letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.4);
  }
  .title { font-family:'Bebas Neue',sans-serif; font-size:clamp(44px,9vw,80px); line-height:0.88; letter-spacing:0.02em; }
  .title-accent { color:#22c55e; }
  .subtitle { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-top:8px; }

  /* Tab bar */
  .tab-bar { display:flex; gap:6px; margin-bottom:24px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .tab-bar::-webkit-scrollbar { display:none; }
  .tab-btn {
    flex-shrink:0; padding:8px 14px; border-radius:100px;
    font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.15s;
    background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35);
    border:1px solid rgba(255,255,255,0.08);
    display:flex; align-items:center; gap:5px; white-space:nowrap;
  }

  /* Leaderboard card */
  .leaderboard { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }

  /* Desktop grid: # | Player | Team | Count */
  .lb-grid { grid-template-columns: 40px 1fr 160px 52px; }
  /* Mobile grid: # | Player | Count (hide team) */
  @media (max-width:520px) {
    .lb-grid { grid-template-columns: 36px 1fr 44px !important; }
    .hide-mobile { display:none !important; }
  }

  .lb-header {
    display:grid; padding:11px 16px;
    background:rgba(255,255,255,0.03);
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .lb-hd {
    font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700;
    letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); text-align:center;
  }
  .lb-hd.left { text-align:left; }

  .lb-row {
    display:grid; padding:0 16px; height:62px; align-items:center;
    border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s;
    position:relative; animation:fadeIn 0.3s ease both;
  }
  .lb-row:last-child { border-bottom:none; }
  .lb-row:hover { background:rgba(255,255,255,0.03); }

  @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

  /* Top 3 highlights */
  .lb-row.r1 { background:linear-gradient(90deg,rgba(251,191,36,0.08) 0%,transparent 55%); }
  .lb-row.r1::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#fbbf24,#f59e0b); }
  .lb-row.r2 { background:linear-gradient(90deg,rgba(148,163,184,0.05) 0%,transparent 55%); }
  .lb-row.r3 { background:linear-gradient(90deg,rgba(180,120,60,0.05) 0%,transparent 55%); }

  .cell-rank { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:rgba(255,255,255,0.2); text-align:center; }

  .cell-player {}
  .player-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; letter-spacing:0.02em; line-height:1.2; }
  .player-team-mobile {
    display:none;
    font-family:'Barlow',sans-serif; font-size:11px; color:rgba(255,255,255,0.3); margin-top:1px;
  }
  @media (max-width:520px) { .player-team-mobile { display:block; } }

  .cell-team { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; color:rgba(255,255,255,0.3); letter-spacing:0.03em; line-height:1.3; }

  .cell-count { text-align:center; }
  .count-badge {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:34px; height:26px; border-radius:6px;
    font-family:'Bebas Neue',sans-serif; font-size:18px;
  }

  /* Empty */
  .empty { text-align:center; padding:56px 24px; }
  .empty-icon { font-size:40px; margin-bottom:10px; }
  .empty-text { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:64px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }
`

function rankIcon(i: number) {
    if (i === 0) return '👑'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return String(i + 1)
}

function rowClass(i: number) {
    if (i === 0) return 'lb-row lb-grid r1'
    if (i === 1) return 'lb-row lb-grid r2'
    if (i === 2) return 'lb-row lb-grid r3'
    return 'lb-row lb-grid'
}

export default function StatsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('goals')
    const [stats, setStats] = useState<Record<Tab, StatRow[]>>({ goals: [], assists: [], yellow: [], red: [], potm: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()

        const channel = supabase
            .channel('stats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, () => fetchStats())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchStats = async () => {
        const { data: events } = await supabase.from('match_events').select('type, player_id')
        const { data: players } = await supabase.from('players').select('id, name, team_id')
        const { data: teams } = await supabase.from('teams').select('id, name')
        if (!events || !players || !teams) { setLoading(false); return }

        const build = (type: string): StatRow[] => {
            const counts: Record<string, number> = {}
            events.filter(e => e.type === type && e.player_id).forEach(e => { counts[e.player_id] = (counts[e.player_id] || 0) + 1 })
            return Object.entries(counts).map(([pid, count]) => {
                const p = players.find(p => p.id === pid)
                const t = teams.find(t => t.id === p?.team_id)
                return { player_id: pid, player_name: p?.name || 'Unknown', team_name: t?.name || 'Unknown', count }
            }).sort((a, b) => b.count - a.count)
        }

        setStats({ goals: build('goal'), assists: build('assist'), yellow: build('yellow'), red: build('red'), potm: build('potm') })
        setLoading(false)
    }

    const tab = TABS.find(t => t.key === activeTab)!
    const rows = stats[activeTab]

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">
                <div className="container">
                    <div className="header">
                        <div className="league-badge">
                            <div className="badge-dot">📊</div>
                            <span className="badge-text">Naija FC Sheffield</span>
                        </div>
                        <h1 className="title">Player<br /><span className="title-accent">Stats</span></h1>
                        <p className="subtitle">Sheffield 7-a-side · Season 1 · 2026</p>
                    </div>

                    {/* Tabs */}
                    <div className="tab-bar">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                className="tab-btn"
                                style={activeTab === t.key ? { background: `${t.color}20`, borderColor: `${t.color}40`, color: t.color } : {}}
                                onClick={() => setActiveTab(t.key)}
                            >
                                <span>{t.icon}</span><span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Leaderboard */}
                    {loading ? (
                        <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading stats...</span></div>
                    ) : rows.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon">{tab.icon}</div>
                            <div className="empty-text">{tab.emptyMsg}</div>
                        </div>
                    ) : (
                        <div className="leaderboard">
                            <div className="lb-header lb-grid">
                                <div className="lb-hd">#</div>
                                <div className="lb-hd left">Player</div>
                                <div className="lb-hd left hide-mobile">Team</div>
                                <div className="lb-hd">{tab.icon}</div>
                            </div>
                            {rows.map((row, i) => (
                                <div key={row.player_id} className={rowClass(i)} style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="cell-rank">{rankIcon(i)}</div>
                                    <div className="cell-player">
                                        <div className="player-name">{row.player_name}</div>
                                        <div className="player-team-mobile">{shortTeam(row.team_name)}</div>
                                    </div>
                                    <div className="cell-team hide-mobile">{shortTeam(row.team_name)}</div>
                                    <div className="cell-count">
                                        <span className="count-badge" style={{ background: `${tab.color}18`, color: tab.color, border: `1px solid ${tab.color}30` }}>
                                            {row.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}