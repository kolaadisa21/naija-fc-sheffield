'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Team = { id: string; name: string }
type Player = { id: string; name: string; team_id: string }
type MatchEvent = {
    id: string
    type: string
    minute: number
    player_id: string | null
    team_id: string
    player?: { name: string }
}
type Match = {
    id: string
    home_team_id: string
    away_team_id: string
    home_score: number
    away_score: number
    status: string
    home_team: Team
    away_team: Team
}

type ModalType = 'goal' | 'assist' | 'yellow' | 'red' | 'potm' | null

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #080f08;
    background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,80,16,0.4) 0%, transparent 60%);
    font-family: 'Barlow', sans-serif;
    padding-bottom: 80px;
  }

  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    position: sticky; top: 0; z-index: 20;
    backdrop-filter: blur(10px);
  }
  .back-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 8px 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.5); cursor: pointer; letter-spacing: 0.05em;
  }
  .topbar-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 20px;
    color: #fff; letter-spacing: 0.05em;
  }
  .end-btn {
    background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px; padding: 8px 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    color: #f87171; cursor: pointer; letter-spacing: 0.05em;
  }

  .content { padding: 16px; max-width: 600px; margin: 0 auto; }

  /* Scoreboard */
  .scoreboard {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 20px 16px;
    margin-bottom: 20px; text-align: center;
  }
  .scoreboard-teams {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .sb-team { flex: 1; }
  .sb-team-name {
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em;
    line-height: 1.2;
  }
  .sb-team-name.home { text-align: left; }
  .sb-team-name.away { text-align: right; }
  .sb-scores {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .sb-score {
    font-family: 'Bebas Neue', sans-serif; font-size: 56px; color: #fff;
    line-height: 1; min-width: 44px; text-align: center;
  }
  .sb-sep {
    font-family: 'Bebas Neue', sans-serif; font-size: 32px;
    color: rgba(255,255,255,0.2);
  }
  .live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 100px; padding: 4px 12px; margin-bottom: 12px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #f87171;
  }
  .live-dot {
    width: 6px; height: 6px; background: #f87171; border-radius: 50%;
    animation: pulse 1.5s ease infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* Action buttons grid */
  .actions-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-bottom: 20px;
  }
  .action-btn {
    padding: 18px 12px; border: none; border-radius: 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    letter-spacing: 0.04em; cursor: pointer;
    transition: transform 0.1s, opacity 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .action-btn:active { transform: scale(0.96); }
  .action-btn .icon { font-size: 28px; line-height: 1; }
  .action-btn .label { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }

  .btn-goal { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
  .btn-assist { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
  .btn-yellow { background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.3); color: #facc15; }
  .btn-red { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
  .btn-potm { background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.25); color: #c084fc; }
  .btn-undo { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); grid-column: span 2; }

  /* Events feed */
  .events-section { margin-bottom: 20px; }
  .events-title {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.25);
    margin-bottom: 10px;
  }
  .event-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; margin-bottom: 6px;
  }
  .event-icon { font-size: 18px; flex-shrink: 0; }
  .event-info { flex: 1; }
  .event-player {
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700;
    color: #fff; letter-spacing: 0.02em;
  }
  .event-meta {
    font-family: 'Barlow', sans-serif; font-size: 12px;
    color: rgba(255,255,255,0.3);
  }
  .event-minute {
    font-family: 'Bebas Neue', sans-serif; font-size: 18px;
    color: rgba(255,255,255,0.2);
  }
  .no-events {
    text-align: center; padding: 24px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.15);
  }

  /* Modal overlay */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
  }
  .modal {
    background: #111a11; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px 20px 0 0; padding: 24px 20px 40px;
    width: 100%; max-width: 600px;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

  .modal-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 28px;
    color: #fff; letter-spacing: 0.04em; margin-bottom: 4px;
  }
  .modal-subtitle {
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.3);
    margin-bottom: 20px;
  }

  .team-tabs {
    display: flex; gap: 8px; margin-bottom: 16px;
  }
  .team-tab {
    flex: 1; padding: 10px; border-radius: 10px; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase; transition: all 0.15s;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .team-tab.active {
    background: rgba(34,197,94,0.15); color: #22c55e;
    border-color: rgba(34,197,94,0.3);
  }

  .player-list { max-height: 280px; overflow-y: auto; margin-bottom: 16px; }
  .player-btn {
    width: 100%; padding: 12px 16px; margin-bottom: 6px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; text-align: left; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
    color: #fff; letter-spacing: 0.02em; transition: background 0.15s;
  }
  .player-btn:hover { background: rgba(255,255,255,0.08); }
  .player-btn.selected {
    background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #22c55e;
  }

  .minute-input-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .minute-label {
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4);
    flex-shrink: 0;
  }
  .minute-input {
    flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 10px 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700;
    color: #fff; outline: none; width: 80px;
  }
  .minute-input:focus { border-color: #22c55e; }

  .modal-actions { display: flex; gap: 8px; }
  .modal-cancel {
    flex: 1; padding: 14px; border-radius: 10px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    color: rgba(255,255,255,0.4); cursor: pointer; letter-spacing: 0.05em;
  }
  .modal-confirm {
    flex: 2; padding: 14px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    color: #fff; cursor: pointer; letter-spacing: 0.05em;
    transition: opacity 0.2s;
  }
  .modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

  .skip-btn {
    width: 100%; padding: 10px; margin-bottom: 12px;
    background: transparent; border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 8px; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.3); letter-spacing: 0.05em;
  }

  .loading-wrap { display: flex; align-items: center; justify-content: center; padding: 80px 0; gap: 12px; }
  .spinner { width: 32px; height: 32px; border: 2px solid rgba(34,197,94,0.2); border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); }
`

const EVENT_ICONS: Record<string, string> = {
    goal: '⚽', assist: '🅰️', yellow: '🟨', red: '🟥', potm: '⭐'
}
const EVENT_LABELS: Record<string, string> = {
    goal: 'Goal', assist: 'Assist', yellow: 'Yellow Card', red: 'Red Card', potm: 'Player of the Match'
}

export default function LiveMatchPage() {
    const router = useRouter()
    const params = useParams()
    const matchId = params.id as string

    const [match, setMatch] = useState<Match | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [events, setEvents] = useState<MatchEvent[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [modal, setModal] = useState<ModalType>(null)
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [minute, setMinute] = useState<string>('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchAll()
    }, [matchId])

    const fetchAll = async () => {
        // Fetch match
        const { data: matchData } = await supabase
            .from('matches')
            .select('id, home_team_id, away_team_id, home_score, away_score, status')
            .eq('id', matchId)
            .single()

        if (!matchData) return

        // Fetch teams
        const { data: teamsData } = await supabase.from('teams').select('id, name')
        if (!teamsData) return

        const homeTeam = teamsData.find(t => t.id === matchData.home_team_id)!
        const awayTeam = teamsData.find(t => t.id === matchData.away_team_id)!

        setMatch({ ...matchData, home_team: homeTeam, away_team: awayTeam })
        setSelectedTeam(matchData.home_team_id)

        // Fetch players
        const { data: playersData } = await supabase
            .from('players')
            .select('id, name, team_id')
            .in('team_id', [matchData.home_team_id, matchData.away_team_id])
            .order('name')

        setPlayers(playersData || [])

        // Fetch events
        await fetchEvents()
        setLoading(false)
    }

    const fetchEvents = async () => {
        const { data } = await supabase
            .from('match_events')
            .select('id, type, minute, player_id, team_id')
            .eq('match_id', matchId)
            .order('minute', { ascending: false })

        // Get player names
        if (data && data.length > 0) {
            const playerIds = data.map(e => e.player_id).filter(Boolean)
            const { data: playerData } = await supabase
                .from('players')
                .select('id, name')
                .in('id', playerIds)

            const eventsWithPlayers = data.map(e => ({
                ...e,
                player: playerData?.find(p => p.id === e.player_id)
            }))
            setEvents(eventsWithPlayers as any)
        } else {
            setEvents([])
        }
    }

    const openModal = (type: ModalType) => {
        setModal(type)
        setSelectedPlayer('')
        setMinute('')
        if (match) setSelectedTeam(match.home_team_id)
    }

    const closeModal = () => {
        setModal(null)
        setSelectedPlayer('')
        setMinute('')
    }

    const saveEvent = async () => {
        if (!match) return
        setSaving(true)

        const eventMinute = parseInt(minute) || 0

        // Insert event
        await supabase.from('match_events').insert({
            match_id: matchId,
            type: modal,
            minute: eventMinute,
            player_id: selectedPlayer || null,
            team_id: selectedTeam,
        })

        // If goal — update score
        if (modal === 'goal') {
            if (selectedTeam === match.home_team_id) {
                await supabase
                    .from('matches')
                    .update({ home_score: (match.home_score || 0) + 1 })
                    .eq('id', matchId)
            } else {
                await supabase
                    .from('matches')
                    .update({ away_score: (match.away_score || 0) + 1 })
                    .eq('id', matchId)
            }
        }

        await fetchAll()
        setSaving(false)
        closeModal()
    }

    const undoLastEvent = async () => {
        if (events.length === 0) return

        const last = events[0]

        // Delete event
        await supabase.from('match_events').delete().eq('id', last.id)

        // If it was a goal — decrement score
        if (last.type === 'goal' && match) {
            if (last.team_id === match.home_team_id) {
                await supabase
                    .from('matches')
                    .update({ home_score: Math.max(0, (match.home_score || 0) - 1) })
                    .eq('id', matchId)
            } else {
                await supabase
                    .from('matches')
                    .update({ away_score: Math.max(0, (match.away_score || 0) - 1) })
                    .eq('id', matchId)
            }
        }

        await fetchAll()
    }

    const endMatch = async () => {
        await supabase.from('matches').update({ status: 'finished' }).eq('id', matchId)
        router.push('/admin/dashboard')
    }

    const filteredPlayers = players.filter(p => p.team_id === selectedTeam)

    if (loading) {
        return (
            <>
                <style>{STYLES}</style>
                <div className="page">
                    <div className="loading-wrap">
                        <div className="spinner" />
                        <span className="loading-text">Loading match...</span>
                    </div>
                </div>
            </>
        )
    }

    if (!match) return null

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">

                {/* Top bar */}
                <div className="topbar">
                    <button className="back-btn" onClick={() => router.push('/admin/dashboard')}>← Back</button>
                    <div className="topbar-title">Live Match</div>
                    <button className="end-btn" onClick={endMatch}>End ⏹</button>
                </div>

                <div className="content">

                    {/* Scoreboard */}
                    <div className="scoreboard">
                        <div className="live-badge">
                            <div className="live-dot" />
                            Live
                        </div>
                        <div className="scoreboard-teams">
                            <div className="sb-team">
                                <div className="sb-team-name home">{match.home_team.name}</div>
                            </div>
                            <div className="sb-scores">
                                <span className="sb-score">{match.home_score ?? 0}</span>
                                <span className="sb-sep">-</span>
                                <span className="sb-score">{match.away_score ?? 0}</span>
                            </div>
                            <div className="sb-team">
                                <div className="sb-team-name away">{match.away_team.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="actions-grid">
                        <button className="action-btn btn-goal" onClick={() => openModal('goal')}>
                            <span className="icon">⚽</span>
                            <span className="label">Goal</span>
                        </button>
                        <button className="action-btn btn-assist" onClick={() => openModal('assist')}>
                            <span className="icon">🅰️</span>
                            <span className="label">Assist</span>
                        </button>
                        <button className="action-btn btn-yellow" onClick={() => openModal('yellow')}>
                            <span className="icon">🟨</span>
                            <span className="label">Yellow Card</span>
                        </button>
                        <button className="action-btn btn-red" onClick={() => openModal('red')}>
                            <span className="icon">🟥</span>
                            <span className="label">Red Card</span>
                        </button>
                        <button className="action-btn btn-potm" onClick={() => openModal('potm')}>
                            <span className="icon">⭐</span>
                            <span className="label">POTM</span>
                        </button>
                        <button className="action-btn btn-undo" onClick={undoLastEvent}>
                            <span className="icon">↩️</span>
                            <span className="label">Undo Last</span>
                        </button>
                    </div>

                    {/* Events feed */}
                    <div className="events-section">
                        <div className="events-title">Match Events</div>
                        {events.length === 0 ? (
                            <div className="no-events">No events yet</div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="event-item">
                                    <span className="event-icon">{EVENT_ICONS[event.type] || '📋'}</span>
                                    <div className="event-info">
                                        <div className="event-player">
                                            {event.player?.name || 'Unknown Player'}
                                        </div>
                                        <div className="event-meta">{EVENT_LABELS[event.type]}</div>
                                    </div>
                                    <div className="event-minute">{event.minute}&apos;</div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">
                            {EVENT_ICONS[modal]} {EVENT_LABELS[modal]}
                        </div>
                        <div className="modal-subtitle">Select team and player</div>

                        {/* Minute input */}
                        <div className="minute-input-row">
                            <span className="minute-label">Minute</span>
                            <input
                                className="minute-input"
                                type="number"
                                min="1"
                                max="90"
                                placeholder="0"
                                value={minute}
                                onChange={e => setMinute(e.target.value)}
                            />
                        </div>

                        {/* Team tabs */}
                        <div className="team-tabs">
                            <button
                                className={`team-tab${selectedTeam === match.home_team_id ? ' active' : ''}`}
                                onClick={() => { setSelectedTeam(match.home_team_id); setSelectedPlayer('') }}
                            >
                                {match.home_team.name}
                            </button>
                            <button
                                className={`team-tab${selectedTeam === match.away_team_id ? ' active' : ''}`}
                                onClick={() => { setSelectedTeam(match.away_team_id); setSelectedPlayer('') }}
                            >
                                {match.away_team.name}
                            </button>
                        </div>

                        {/* Player list */}
                        <div className="player-list">
                            {modal !== 'goal' && modal !== 'yellow' && modal !== 'red' && (
                                <button className="skip-btn" onClick={() => setSelectedPlayer('')}>
                                    Skip — no player selected
                                </button>
                            )}
                            {filteredPlayers.map(player => (
                                <button
                                    key={player.id}
                                    className={`player-btn${selectedPlayer === player.id ? ' selected' : ''}`}
                                    onClick={() => setSelectedPlayer(player.id)}
                                >
                                    {player.name}
                                </button>
                            ))}
                        </div>

                        {/* Confirm / Cancel */}
                        <div className="modal-actions">
                            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                            <button
                                className="modal-confirm"
                                onClick={saveEvent}
                                disabled={saving || (modal !== 'potm' && !selectedPlayer)}
                            >
                                {saving ? 'Saving...' : `Save ${EVENT_LABELS[modal]}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}