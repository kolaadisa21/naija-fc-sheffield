'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string }
type Player = { id: string; name: string; team_id: string; position: string; shirt_number: number | null }

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page { min-height:100vh; background:#080f08; background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(16,80,16,0.4) 0%,transparent 60%); font-family:'Barlow',sans-serif; padding-bottom:80px; }

  .topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); position:sticky; top:0; z-index:20; backdrop-filter:blur(10px); }
  .back-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:rgba(255,255,255,0.5); cursor:pointer; letter-spacing:0.05em; }
  .topbar-title { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#fff; letter-spacing:0.05em; }
  .add-btn { background:linear-gradient(135deg,#22c55e,#16a34a); border:none; border-radius:8px; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; cursor:pointer; letter-spacing:0.05em; }

  .content { padding:20px 16px; max-width:700px; margin:0 auto; }

  /* Team tabs */
  .team-tabs { display:flex; gap:6px; margin-bottom:20px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .team-tabs::-webkit-scrollbar { display:none; }
  .team-tab { flex-shrink:0; padding:8px 14px; border-radius:100px; border:1px solid rgba(255,255,255,0.08); cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35); transition:all 0.15s; white-space:nowrap; }
  .team-tab.active { background:rgba(34,197,94,0.15); color:#22c55e; border-color:rgba(34,197,94,0.3); }

  /* Player list */
  .player-list { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }
  .player-row { display:flex; align-items:center; gap:12px; padding:13px 16px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .player-row:last-child { border-bottom:none; }
  .player-num { font-family:'Bebas Neue',sans-serif; font-size:18px; color:rgba(255,255,255,0.2); min-width:28px; text-align:center; }
  .player-info { flex:1; min-width:0; }
  .player-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; letter-spacing:0.02em; }
  .player-pos { font-family:'Barlow',sans-serif; font-size:11px; color:rgba(255,255,255,0.3); margin-top:2px; }
  .row-actions { display:flex; gap:6px; }
  .edit-btn { background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.25); border-radius:6px; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; color:#60a5fa; cursor:pointer; letter-spacing:0.04em; }
  .del-btn  { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:6px; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; color:#f87171; cursor:pointer; letter-spacing:0.04em; }

  .empty { text-align:center; padding:40px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }

  /* Modal */
  .overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
  .modal { background:#111a11; border:1px solid rgba(255,255,255,0.1); border-radius:20px 20px 0 0; padding:24px 20px 40px; width:100%; max-width:600px; animation:slideUp 0.25s ease; }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:26px; color:#fff; letter-spacing:0.04em; margin-bottom:20px; }

  .field { margin-bottom:14px; }
  .field-label { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:6px; display:block; }
  .field-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:11px 14px; font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:600; color:#fff; outline:none; }
  .field-input:focus { border-color:#22c55e; }
  .field-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:11px 14px; font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:600; color:#fff; outline:none; cursor:pointer; }
  .field-select option { background:#111a11; }

  .modal-btns { display:flex; gap:8px; margin-top:20px; }
  .modal-cancel { flex:1; padding:13px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; }
  .modal-save   { flex:2; padding:13px; border-radius:10px; border:none; background:linear-gradient(135deg,#22c55e,#16a34a); font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:#fff; cursor:pointer; }
  .modal-save:disabled { opacity:0.4; cursor:not-allowed; }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px 0; gap:10px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(34,197,94,0.2); border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .loading-text { font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); }
`

export default function AdminPlayersPage() {
    const router = useRouter()
    const [teams, setTeams] = useState<Team[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
    const [name, setName] = useState('')
    const [position, setPosition] = useState('outfield')
    const [shirtNumber, setShirtNumber] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/admin/login')
    }

    const fetchData = async () => {
        const { data: teamsData } = await supabase.from('teams').select('id, name').order('name')
        const { data: playersData } = await supabase.from('players').select('id, name, team_id, position, shirt_number').order('name')
        if (teamsData) { setTeams(teamsData); setSelectedTeam(teamsData[0]?.id || '') }
        if (playersData) setPlayers(playersData)
        setLoading(false)
    }

    const openAdd = () => {
        setEditingPlayer(null)
        setName(''); setPosition('outfield'); setShirtNumber('')
        setShowModal(true)
    }

    const openEdit = (player: Player) => {
        setEditingPlayer(player)
        setName(player.name)
        setPosition(player.position || 'outfield')
        setShirtNumber(player.shirt_number?.toString() || '')
        setShowModal(true)
    }

    const closeModal = () => { setShowModal(false); setEditingPlayer(null) }

    const savePlayer = async () => {
        if (!name.trim()) return
        setSaving(true)

        if (editingPlayer) {
            await supabase.from('players').update({
                name: name.trim(),
                position,
                shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
            }).eq('id', editingPlayer.id)
        } else {
            await supabase.from('players').insert({
                name: name.trim(),
                team_id: selectedTeam,
                position,
                shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
            })
        }

        await fetchData()
        setSaving(false)
        closeModal()
    }

    const deletePlayer = async (id: string) => {
        if (!confirm('Delete this player? This cannot be undone.')) return
        await supabase.from('players').delete().eq('id', id)
        await fetchData()
    }

    const teamPlayers = players.filter(p => p.team_id === selectedTeam)
    const currentTeam = teams.find(t => t.id === selectedTeam)

    return (
        <>
            <style>{STYLES}</style>
            <div className="page">
                <div className="topbar">
                    <button className="back-btn" onClick={() => router.push('/admin/dashboard')}>← Back</button>
                    <div className="topbar-title">👤 Players</div>
                    <button className="add-btn" onClick={openAdd}>+ Add Player</button>
                </div>

                <div className="content">
                    {loading ? (
                        <div className="loading-wrap">
                            <div className="spinner" />
                            <span className="loading-text">Loading players...</span>
                        </div>
                    ) : (
                        <>
                            {/* Team tabs */}
                            <div className="team-tabs">
                                {teams.map(t => (
                                    <button key={t.id} className={`team-tab${selectedTeam === t.id ? ' active' : ''}`} onClick={() => setSelectedTeam(t.id)}>
                                        {t.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>

                            {/* Player list */}
                            <div className="player-list">
                                {teamPlayers.length === 0 ? (
                                    <div className="empty">No players for {currentTeam?.name}</div>
                                ) : (
                                    teamPlayers
                                        .sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99))
                                        .map(player => (
                                            <div key={player.id} className="player-row">
                                                <div className="player-num">{player.shirt_number || '—'}</div>
                                                <div className="player-info">
                                                    <div className="player-name">{player.name}</div>
                                                    <div className="player-pos">{player.position === 'GK' ? '🧤 Goalkeeper' : '⚽ Outfield'}</div>
                                                </div>
                                                <div className="row-actions">
                                                    <button className="edit-btn" onClick={() => openEdit(player)}>Edit</button>
                                                    <button className="del-btn" onClick={() => deletePlayer(player.id)}>Del</button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">{editingPlayer ? 'Edit Player' : `Add Player to ${currentTeam?.name.split(' ')[0]}`}</div>

                        <div className="field">
                            <label className="field-label">Player Name</label>
                            <input className="field-input" placeholder="e.g. Arji" value={name} onChange={e => setName(e.target.value)} autoFocus />
                        </div>

                        <div className="field">
                            <label className="field-label">Position</label>
                            <select className="field-select" value={position} onChange={e => setPosition(e.target.value)}>
                                <option value="outfield">⚽ Outfield</option>
                                <option value="GK">🧤 Goalkeeper</option>
                            </select>
                        </div>

                        <div className="field">
                            <label className="field-label">Shirt Number (optional)</label>
                            <input className="field-input" type="number" placeholder="e.g. 10" value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} />
                        </div>

                        <div className="modal-btns">
                            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                            <button className="modal-save" onClick={savePlayer} disabled={saving || !name.trim()}>
                                {saving ? 'Saving...' : editingPlayer ? 'Save Changes' : 'Add Player'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}