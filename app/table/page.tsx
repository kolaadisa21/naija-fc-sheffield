'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

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

export default function LeagueTablePage() {
    const [teams, setTeams] = useState<TeamStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeagueTable()
    }, [])

    const fetchLeagueTable = async () => {
        const { data, error } = await supabase
            .from('league_table')
            .select('*')

        if (error) {
            console.error('Error fetching league table:', error)
            return
        }

        setTeams(data || [])
        setLoading(false)
    }

    const getRowStyle = (index: number) => {
        if (index === 0) return 'champion-row'
        if (index <= 2) return 'top-row'
        return 'normal-row'
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #080f08; }

        .page-wrapper {
          min-height: 100vh;
          background: #080f08;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 80, 16, 0.4) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px);
          padding: 48px 16px 80px;
          font-family: 'Barlow', sans-serif;
        }

        .container { max-width: 900px; margin: 0 auto; }

        .header { margin-bottom: 40px; }

        .league-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          padding: 6px 16px 6px 6px;
          margin-bottom: 20px;
        }

        .badge-dot {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }

        .badge-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }

        .title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(48px, 10vw, 88px);
          line-height: 0.9; color: #fff; letter-spacing: 0.02em;
        }

        .title span { color: #22c55e; }

        .subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); margin-top: 8px;
        }

        .season-tag {
          display: inline-block;
          background: linear-gradient(135deg, #22c55e20, #16a34a10);
          border: 1px solid #22c55e40;
          border-radius: 6px; padding: 4px 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #22c55e; margin-top: 16px;
        }

        .table-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden;
        }

        .col-headers {
          display: grid;
          grid-template-columns: 36px 1fr 40px 40px 40px 40px 40px 40px 40px 52px;
          padding: 14px 20px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .col-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.25); text-align: center;
        }

        .col-header.team-col { text-align: left; }

        .team-row {
          display: grid;
          grid-template-columns: 36px 1fr 40px 40px 40px 40px 40px 40px 40px 52px;
          padding: 0 20px; align-items: center; height: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s ease;
          position: relative;
          animation: fadeSlideIn 0.4s ease both;
        }

        .team-row:last-child { border-bottom: none; }
        .team-row:hover { background: rgba(255,255,255,0.04); }

        .champion-row {
          background: linear-gradient(90deg, rgba(250,204,21,0.08) 0%, transparent 60%);
        }
        .champion-row:hover {
          background: linear-gradient(90deg, rgba(250,204,21,0.12) 0%, transparent 60%);
        }
        .champion-row::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: linear-gradient(180deg, #fbbf24, #f59e0b);
          border-radius: 0 2px 2px 0;
        }

        .top-row {
          background: linear-gradient(90deg, rgba(34,197,94,0.06) 0%, transparent 60%);
        }
        .top-row::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: linear-gradient(180deg, #22c55e, #16a34a);
          border-radius: 0 2px 2px 0;
        }

        .position {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px; font-weight: 700;
          color: rgba(255,255,255,0.2); text-align: center;
        }
        .position.champion { color: #fbbf24; }

        .team-name-cell {
          display: flex; align-items: center; gap: 10px; padding-right: 8px;
        }

        .team-avatar {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 13px; flex-shrink: 0;
        }

        .team-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px; font-weight: 700; color: #fff;
          letter-spacing: 0.02em; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        .stat {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.5); text-align: center;
        }
        .stat.highlight { color: rgba(255,255,255,0.8); }

        .points-cell { text-align: center; }

        .points-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 28px; border-radius: 6px;
          font-family: 'Bebas Neue', sans-serif; font-size: 18px;
        }
        .points-champion {
          background: rgba(251,191,36,0.15); color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .points-top {
          background: rgba(34,197,94,0.1); color: #22c55e;
          border: 1px solid rgba(34,197,94,0.2);
        }
        .points-normal {
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .gd-positive { color: #22c55e; }
        .gd-negative { color: #f87171; }
        .gd-zero { color: rgba(255,255,255,0.3); }

        .legend {
          display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;
        }
        .legend-item {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Barlow', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.3);
        }
        .legend-dot { width: 10px; height: 10px; border-radius: 2px; }

        .loading-wrap {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 0; gap: 16px;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(34,197,94,0.2);
          border-top-color: #22c55e; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.2);
        }

        .color-0 { background: rgba(239,68,68,0.15); color: #f87171; }
        .color-1 { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .color-2 { background: rgba(168,85,247,0.15); color: #c084fc; }
        .color-3 { background: rgba(234,179,8,0.15); color: #facc15; }
        .color-4 { background: rgba(20,184,166,0.15); color: #2dd4bf; }
        .color-5 { background: rgba(249,115,22,0.15); color: #fb923c; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .col-headers {
            grid-template-columns: 28px 1fr 32px 32px 32px 32px 32px 32px 32px 44px;
            padding: 12px;
          }
          .team-row {
            grid-template-columns: 28px 1fr 32px 32px 32px 32px 32px 32px 32px 44px;
            padding: 0 12px; height: 54px;
          }
          .team-avatar { display: none; }
          .team-name { font-size: 13px; }
          .stat { font-size: 12px; }
          .col-header { font-size: 10px; }
        }
      `}</style>

            <div className="page-wrapper">
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

                    <div className="table-card">
                        <div className="col-headers">
                            <div className="col-header">#</div>
                            <div className="col-header team-col">Team</div>
                            <div className="col-header">P</div>
                            <div className="col-header">W</div>
                            <div className="col-header">D</div>
                            <div className="col-header">L</div>
                            <div className="col-header">GF</div>
                            <div className="col-header">GA</div>
                            <div className="col-header">GD</div>
                            <div className="col-header">Pts</div>
                        </div>

                        {loading ? (
                            <div className="loading-wrap">
                                <div className="spinner" />
                                <span className="loading-text">Loading table...</span>
                            </div>
                        ) : (
                            teams.map((team, index) => {
                                const initials = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 3)
                                const gdDisplay = team.goal_difference > 0 ? `+${team.goal_difference}` : `${team.goal_difference}`
                                const gdClass = team.goal_difference > 0 ? 'gd-positive' : team.goal_difference < 0 ? 'gd-negative' : 'gd-zero'
                                const pointsClass = index === 0 ? 'points-champion' : index <= 2 ? 'points-top' : 'points-normal'

                                return (
                                    <div
                                        key={team.id}
                                        className={`team-row ${getRowStyle(index)}`}
                                        style={{ animationDelay: `${index * 60}ms` }}
                                    >
                                        <div className={`position ${index === 0 ? 'champion' : ''}`}>
                                            {index === 0 ? '👑' : index + 1}
                                        </div>
                                        <div className="team-name-cell">
                                            <div className={`team-avatar color-${index % 6}`}>{initials}</div>
                                            <span className="team-name">{team.name}</span>
                                        </div>
                                        <div className="stat highlight">{team.played}</div>
                                        <div className="stat highlight">{team.wins}</div>
                                        <div className="stat">{team.draws}</div>
                                        <div className="stat">{team.losses}</div>
                                        <div className="stat">{team.goals_for}</div>
                                        <div className="stat">{team.goals_against}</div>
                                        <div className={`stat ${gdClass}`}>{gdDisplay}</div>
                                        <div className="points-cell">
                                            <span className={`points-badge ${pointsClass}`}>{team.points}</span>
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
                    </div>
                </div>
            </div>
        </>
    )
}