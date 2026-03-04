'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string }
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
  .page { min-height:100vh; background:#080f08; background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(16,80,16,0.4) 0%,transparent 60%); font-family:'Barlow',sans-serif; padding-bottom:80px; }

  .topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); position:sticky; top:0; z-index:20; backdrop-filter:blur(10px); }
  .back-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:rgba(255,255,255,0.5); cursor:pointer; letter-spacing:0.05em; }
  .topbar-title { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#fff; letter-spacing:0.05em; }
  .add-btn { background:linear-gradient(135deg,#22c55e,#16a34a); border:none; border-radius:8px; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; cursor:pointer; letter-spacing:0.05em; }

  .content { padding:20px 16px; max-width:700px; margin:0 auto; }

  .section-title { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-bottom:10px; padding-left:2px; }

  .fixture-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; margin-bottom:8px; }
  .fixture-card.live { border-color:rgba(239,68,68,0.3); }
  .fixture-card.finished { opacity:0.6; }

  .card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .card-date { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.07em; color:rgba(255,255,255,0.28); }
  .badge { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 9px; border-radius:100px; }
  .badge-live { background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); }
  .badge-finished { background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.2); }
  .badge-scheduled { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.28); border:1px solid rgba(255,255,255,0.08); }

  .scoreline { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
  .team-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; letter-spacing:0.02em; flex:1; }
  .team-name.home { text-align:left; }
  .team-name.away { text-align:right; }
  .score-box { display:flex; align-items:center; gap:5px; flex-shrink:0; }
  .score { font-family:'Bebas Neue',sans-serif; font-size:28px; color:#fff; line-height:1; min-width:20px; text-align:center; }
  .score-sep { font-family:'Bebas Neue',sans-serif; font-size:16px; color:rgba(255,255,255,0.2); }
  .score-vs { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; color:rgba(255,255,255,0.2); padding:0 6px; }

  .card-actions { display:flex; gap:6px; }
  .btn-edit { flex:1; padding:9px; border-radius:8px; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.25); font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#60a5fa; cursor:pointer; letter-spacing:0.04em; }

  .section-gap { margin-top:28px; }

  /* Modal */
  .overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
  .modal { background:#111a11; border:1px solid rgba(255,255,255,0.1); border-radius:20px 20px 0 0; padding:24px 20px 40px; width:100%; max-width:600px; animation:slideUp 0.25s ease; }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:26px; color:#fff; letter-spacing:0.04em; margin-bottom:4px; }
  .modal-sub { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.06em; color:rgba(255,255,255,0.3); margin-bottom:20px; }

  .field { margin-bottom:14px; }
  .field-label { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:6px; display:block; }
  .field-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:11px 14px; font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:600; color:#fff; outline:none; }
  .field-input:focus { border-color:#22c55e; }
  .field-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:11px 14px; font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:600; color:#fff; outline:none; cursor:pointer; }
  .field-select option { background:#111a11; }

  .two-fields { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

  .modal-btns { display:flex; gap:8px; margin-top:20px; }
  .modal-cancel { flex:1; padding:13px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; }
  .modal-save { flex:2; padding:13px; border-radius:10px; border:none; background:linear-gradient(135deg,#22c55e,#16a34a); font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; cursor:pointer; }
  .modal-save:disabled { opacity:0.4; cursor:not-allowed; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }
`

export default function AdminFixturesPage() {
    const router = useRouter()
    const [fixtures, setFixtures] = useState<Fixture[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Fixture | null>(null)
    const [homeTeamId, setHomeTeamId] = useState('')
    const [awayTeamId, setAwayTeamId] = useState('')
    const [matchDate, setMatchDate] = useState('')
    const [matchTime, setMatchTime] = useState('')
    const [saving, setSaving] = useState(false)
    const [isNewFixture, setIsNewFixture] = useState(false)

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/admin/login')
    }

    const fetchData = async () => {
        const { data: matchesData } = await supabase
            .from('matches')
            .select('id, home_team_id, away_team_id, match_date, status, home_score, away_score')
            .order('match_date', { ascending: true })

        const { data: teamsData } = await supabase.from('teams').select('id, name').order('name')

        if (!matchesData || !teamsData) { setLoading(false); return }

        const withTeams = matchesData.map((m: any) => ({
            ...m,
            home_team: { name: teamsData.find((t: any) => t.id === m.home_team_id)?.name || 'Unknown' },
            away_team: { name: teamsData.find((t: any) => t.id === m.away_team_id)?.name || 'Unknown' },
        }))

        setFixtures(withTeams)
        setTeams(teamsData)
        setLoading(false)
    }

    const openEdit = (fixture: Fixture) => {
        setIsNewFixture(false)
        setEditing(fixture)
        const d = new Date(fixture.match_date)
        setHomeTeamId(fixture.home_team_id)
        setAwayTeamId(fixture.away_team_id)
        setMatchDate(d.toISOString().slice(0, 10))
        setMatchTime(d.toTimeString().slice(0, 5))
        setShowModal(true)
    }

    const openNew = () => {
        setIsNewFixture(true)
        setEditing(null)
        setHomeTeamId(teams[0]?.id || '')
        setAwayTeamId(teams[1]?.id || '')
        setMatchDate('')
        setMatchTime('10:00')
        setShowModal(true)
    }

    const closeModal = () => { setShowModal(false); setEditing(null) }

    const saveFixture = async () => {
        if (!matchDate || !matchTime) return
        setSaving(true)

        const dateTime = `${matchDate}T${matchTime}:00`

        if (isNewFixture) {
            await supabase.from('matches').insert({
                home_team_id: homeTeamId,
                away_team_id: awayTeamId,
                match_date: dateTime,
                status: 'scheduled',
                home_score: 0,
                away_score: 0,
            })
        } else if (editing) {
            await supabase.from('matches').update({
                home_team_id: homeTeamId,
                away_team_id: awayTeamId,
                match_date: dateTime,
            }).eq('id', editing.id)
        }

        await fetchData()
        setSaving(false)
        closeModal()
    }

    const grouped = {
        live: fixtures.filter(f => f.status === 'live'),
        scheduled: fixtures.filter(f => f.status === 'scheduled'),
        finished: fixtures.filter(f => f.status === 'finished'),
    }

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const FixCard = ({ fixture }: { fixture: Fixture }) => (
        <div className={`fixture-card${fixture.status === 'live' ? ' live' : fixture.status === 'finished' ? ' finished' : ''}`}>
            <div className="card-top">
                <span className="card-date">{fmt(fixture.match_date)} · {fmtTime(fixture.match_date)}</span>
                {fixture.status === 'live' && <span className="badge badge-live">🔴 Live</span>}
                {fixture.status === 'finished' && <span className="badge badge-finished">✅ Result</span>}
                {fixture.status === 'scheduled' && <span className="badge badge-scheduled">🕐 Upcoming</span>}
            </div>
            <div className="scoreline">
                <div className="team-name home">{shortName(fixture.home_team.name)}</div>
                <div className="score-box">
                    {fixture.status !== 'scheduled' ? (
                        <><span className="score">{fixture.home_score}</span><span className="score-sep">-</span><span className="score">{fixture.away_score}</span></>
                    ) : (
                        <span className="score-vs">vs</span>
                    )}
                </div>
                <div className="team-name away">{shortName(fixture.away_team.name)}</div>
            </div>
            <div className="card-actions">
                <button className="btn-edit" onClick={() => openEdit(fixture)}>✏️ Edit / Reschedule</button>
            </div>
        </div>
    )

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">
                <div className="topbar">
                    <button className="back-btn" onClick={() => router.push('/admin/dashboard')}>← Back</button>
                    <div className="topbar-title">📅 Fixtures</div>
                    <button className="add-btn" onClick={openNew}>+ Add</button>
                </div>

                <div className="content">
                    {loading ? (
                        <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading...</span></div>
                    ) : (
                        <>
                            {grouped.live.length > 0 && (
                                <div>
                                    <div className="section-title">🔴 Live Now</div>
                                    {grouped.live.map(f => <FixCard key={f.id} fixture={f} />)}
                                </div>
                            )}
                            <div className={grouped.live.length > 0 ? 'section-gap' : ''}>
                                <div className="section-title">📅 Upcoming ({grouped.scheduled.length})</div>
                                {grouped.scheduled.map(f => <FixCard key={f.id} fixture={f} />)}
                            </div>
                            {grouped.finished.length > 0 && (
                                <div className="section-gap">
                                    <div className="section-title">✅ Results ({grouped.finished.length})</div>
                                    {grouped.finished.map(f => <FixCard key={f.id} fixture={f} />)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">{isNewFixture ? 'Add Fixture' : 'Edit Fixture'}</div>
                        <div className="modal-sub">{isNewFixture ? 'Create a new match' : `Editing: ${shortName(editing?.home_team.name || '')} vs ${shortName(editing?.away_team.name || '')}`}</div>

                        <div className="field">
                            <label className="field-label">Home Team</label>
                            <select className="field-select" value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div className="field">
                            <label className="field-label">Away Team</label>
                            <select className="field-select" value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div className="two-fields">
                            <div className="field">
                                <label className="field-label">Date</label>
                                <input className="field-input" type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
                            </div>
                            <div className="field">
                                <label className="field-label">Kick-off Time</label>
                                <input className="field-input" type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="modal-btns">
                            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                            <button className="modal-save" onClick={saveFixture} disabled={saving || !matchDate}>
                                {saving ? 'Saving...' : isNewFixture ? 'Add Fixture' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}