'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page {
    min-height: 100vh;
    background: #080f08;
    background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,80,16,0.4) 0%, transparent 60%);
    font-family: 'Barlow', sans-serif;
    padding-bottom: 60px;
  }
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    position: sticky; top: 0; z-index: 10;
    backdrop-filter: blur(10px);
  }
  .topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: #fff; letter-spacing: 0.05em; }
  .topbar-title span { color: #22c55e; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .user-pill { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: rgba(255,255,255,0.3); }
  .logout-btn {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 8px 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: 0.05em; color: #f87171; cursor: pointer; transition: background 0.2s;
  }
  .logout-btn:hover { background: rgba(239,68,68,0.15); }
  .content { padding: 24px 16px; max-width: 700px; margin: 0 auto; }

  /* ── Quick links ── */
  .quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
  .quick-link {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 14px 16px; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .quick-link:hover { background: rgba(255,255,255,0.06); border-color: rgba(34,197,94,0.25); }
  .quick-link-icon { font-size: 22px; flex-shrink: 0; }
  .quick-link-text {}
  .quick-link-title { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; color: #fff; }
  .quick-link-sub { font-family: 'Barlow', sans-serif; font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 2px; }

  .section { margin-bottom: 32px; }
  .section-title {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.25);
    margin-bottom: 12px; padding-left: 4px;
  }
  .fixture-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 16px; margin-bottom: 10px;
  }
  .fixture-card.is-live { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
  .fixture-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .fixture-date { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); }
  .scoreline { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .team-block { flex: 1; }
  .team-block.home { text-align: left; }
  .team-block.away { text-align: right; }
  .team-block-name { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
  .score-block { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .score-num { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #fff; line-height: 1; min-width: 28px; text-align: center; }
  .score-sep { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: rgba(255,255,255,0.2); }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn {
    flex: 1; min-width: 120px; padding: 12px 16px; border: none; border-radius: 10px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
    letter-spacing: 0.05em; cursor: pointer; transition: opacity 0.2s, transform 0.1s; text-align: center;
  }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-start { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
  .btn-manage { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
  .btn-end { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
  .btn-reset { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 13px; }
  .badge { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 100px; }
  .badge-live { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); animation: pulse 2s ease infinite; }
  .badge-finished { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
  .badge-scheduled { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.08); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  .empty { text-align: center; padding: 32px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; color: rgba(255,255,255,0.15); text-transform: uppercase; }
  .loading-wrap { display: flex; align-items: center; justify-content: center; padding: 80px 0; gap: 12px; }
  .spinner { width: 32px; height: 32px; border: 2px solid rgba(34,197,94,0.2); border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); }
`

function getStatusBadge(status: string) {
    if (status === 'live') return <span className="badge badge-live">🔴 LIVE</span>
    if (status === 'finished') return <span className="badge badge-finished">✅ Finished</span>
    return <span className="badge badge-scheduled">🕐 Scheduled</span>
}

type FixtureCardProps = {
    fixture: Fixture
    isLive?: boolean
    actionLoading: string | null
    onStart?: () => void
    onManage?: () => void
    onEnd?: () => void
    onReset?: () => void
}

function FixtureCard({ fixture, isLive, actionLoading, onStart, onManage, onEnd, onReset }: FixtureCardProps) {
    const date = new Date(fixture.match_date)
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const isLoading = actionLoading === fixture.id

    return (
        <div className={`fixture-card${isLive ? ' is-live' : ''}`}>
            <div className="fixture-top">
                <span className="fixture-date">{dateStr} · {timeStr}</span>
                {getStatusBadge(fixture.status)}
            </div>
            <div className="scoreline">
                <div className="team-block home">
                    <div className="team-block-name">{fixture.home_team.name}</div>
                </div>
                <div className="score-block">
                    <span className="score-num">{fixture.home_score ?? 0}</span>
                    <span className="score-sep">-</span>
                    <span className="score-num">{fixture.away_score ?? 0}</span>
                </div>
                <div className="team-block away">
                    <div className="team-block-name">{fixture.away_team.name}</div>
                </div>
            </div>
            <div className="actions">
                {fixture.status === 'scheduled' && (
                    <button className="btn btn-start" onClick={onStart} disabled={isLoading}>
                        {isLoading ? 'Starting...' : '▶ Start Match'}
                    </button>
                )}
                {fixture.status === 'live' && (
                    <>
                        <button className="btn btn-manage" onClick={onManage} disabled={isLoading}>
                            ⚡ Manage Live
                        </button>
                        <button className="btn btn-end" onClick={onEnd} disabled={isLoading}>
                            {isLoading ? 'Ending...' : '⏹ End Match'}
                        </button>
                    </>
                )}
                {fixture.status === 'finished' && (
                    <button className="btn btn-reset" onClick={onReset} disabled={isLoading}>
                        {isLoading ? 'Resetting...' : '↩ Reset Match'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default function AdminDashboardPage() {
    const router = useRouter()
    const [fixtures, setFixtures] = useState<Fixture[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        checkAuth()
        fetchFixtures()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
            return
        }
        setUserEmail(session.user.email || '')
    }

    const fetchFixtures = async () => {
        const { data: matchesData, error } = await supabase
            .from('matches')
            .select('id, home_team_id, away_team_id, match_date, status, home_score, away_score')
            .order('match_date', { ascending: true })

        if (error) { console.error('Error fetching fixtures:', error); return }

        const { data: teamsData } = await supabase.from('teams').select('id, name')
        if (!matchesData || !teamsData) return

        const fixtures = matchesData.map((match: any) => ({
            ...match,
            home_team: { name: teamsData.find((t: any) => t.id === match.home_team_id)?.name || 'Unknown' },
            away_team: { name: teamsData.find((t: any) => t.id === match.away_team_id)?.name || 'Unknown' },
        }))

        setFixtures(fixtures)
        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const startMatch = async (fixtureId: string) => {
        setActionLoading(fixtureId)
        await supabase.from('matches').update({ status: 'live', home_score: 0, away_score: 0 }).eq('id', fixtureId)
        await fetchFixtures()
        setActionLoading(null)
        router.push(`/admin/match/${fixtureId}`)
    }

    const endMatch = async (fixtureId: string) => {
        setActionLoading(fixtureId)
        await supabase.from('matches').update({ status: 'finished' }).eq('id', fixtureId)
        await fetchFixtures()
        setActionLoading(null)
    }

    const resetMatch = async (fixtureId: string) => {
        setActionLoading(fixtureId)
        await supabase.from('matches').update({ status: 'scheduled', home_score: 0, away_score: 0 }).eq('id', fixtureId)
        await supabase.from('match_events').delete().eq('match_id', fixtureId)
        await fetchFixtures()
        setActionLoading(null)
    }

    const grouped = {
        live: fixtures.filter(f => f.status === 'live'),
        scheduled: fixtures.filter(f => f.status === 'scheduled'),
        finished: fixtures.filter(f => f.status === 'finished'),
    }

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">
                <div className="topbar">
                    <div className="topbar-title">⚽ <span>Naija FC</span> Admin</div>
                    <div className="topbar-right">
                        <span className="user-pill">{userEmail}</span>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                </div>

                <div className="content">

                    {/* ── Quick Links ── */}
                    <div className="quick-links">
                        <div className="quick-link" onClick={() => router.push('/admin/players')}>
                            <div className="quick-link-icon">👤</div>
                            <div className="quick-link-text">
                                <div className="quick-link-title">Manage Players</div>
                                <div className="quick-link-sub">Add, edit, remove players</div>
                            </div>
                        </div>
                        <div className="quick-link" onClick={() => router.push('/admin/fixtures')}>
                            <div className="quick-link-icon">📅</div>
                            <div className="quick-link-text">
                                <div className="quick-link-title">Manage Fixtures</div>
                                <div className="quick-link-sub">Edit, reschedule matches</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-wrap">
                            <div className="spinner" />
                            <span className="loading-text">Loading fixtures...</span>
                        </div>
                    ) : (
                        <>
                            {grouped.live.length > 0 && (
                                <div className="section">
                                    <div className="section-title">🔴 Live Now</div>
                                    {grouped.live.map(f => (
                                        <FixtureCard key={f.id} fixture={f} isLive actionLoading={actionLoading}
                                            onManage={() => router.push(`/admin/match/${f.id}`)}
                                            onEnd={() => endMatch(f.id)}
                                            onReset={() => resetMatch(f.id)}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="section">
                                <div className="section-title">📅 Upcoming Fixtures</div>
                                {grouped.scheduled.length === 0 ? (
                                    <div className="empty">No upcoming fixtures</div>
                                ) : (
                                    grouped.scheduled.map(f => (
                                        <FixtureCard key={f.id} fixture={f} actionLoading={actionLoading}
                                            onStart={() => startMatch(f.id)}
                                        />
                                    ))
                                )}
                            </div>
                            {grouped.finished.length > 0 && (
                                <div className="section">
                                    <div className="section-title">✅ Results</div>
                                    {grouped.finished.map(f => (
                                        <FixtureCard key={f.id} fixture={f} actionLoading={actionLoading}
                                            onReset={() => resetMatch(f.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}