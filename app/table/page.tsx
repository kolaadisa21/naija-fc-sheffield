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

    useEffect(() => {
        fetchLeagueTable()
    }, [])

    const fetchLeagueTable = async () => {
        // Fetch teams
        const { data: teamsData } = await supabase.from('teams').select('*')
        if (!teamsData) return

        // Initialize table stats
        const stats: TeamStats[] = teamsData.map(team => ({
            id: team.id,
            name: team.name,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0,
        }))

        // Fetch all match events
        const { data: matchesData } = await supabase.from('matches').select(`
      id, home_team_id, away_team_id, status,
      match_events!inner(type, team_id)
    `)

        if (!matchesData) return

        // Compute table
        matchesData.forEach((match: any) => {
            if (match.status !== 'finished') return

            // Count goals
            let homeGoals = match.match_events.filter((e: any) => e.team_id === match.home_team_id && e.type === 'goal').length
            let awayGoals = match.match_events.filter((e: any) => e.team_id === match.away_team_id && e.type === 'goal').length

            const home = stats.find(t => t.id === match.home_team_id)
            const away = stats.find(t => t.id === match.away_team_id)

            if (!home || !away) return

            home.played += 1
            away.played += 1

            home.goals_for += homeGoals
            home.goals_against += awayGoals
            home.goal_difference = home.goals_for - home.goals_against

            away.goals_for += awayGoals
            away.goals_against += homeGoals
            away.goal_difference = away.goals_for - away.goals_against

            if (homeGoals > awayGoals) {
                home.wins += 1
                home.points += 3
                away.losses += 1
            } else if (homeGoals < awayGoals) {
                away.wins += 1
                away.points += 3
                home.losses += 1
            } else {
                home.draws += 1
                home.points += 1
                away.draws += 1
                away.points += 1
            }
        })

        // Sort table: points → GD → goals for
        stats.sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for)

        setTeams(stats)
    }

    return (
        <div className="p-6 bg-green-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-6">Naija FC Sheffield League Table</h1>
            <table className="w-full table-auto border-collapse border border-white text-center">
                <thead>
                    <tr className="bg-green-800">
                        <th className="border border-white p-2">#</th>
                        <th className="border border-white p-2">Team</th>
                        <th className="border border-white p-2">P</th>
                        <th className="border border-white p-2">W</th>
                        <th className="border border-white p-2">D</th>
                        <th className="border border-white p-2">L</th>
                        <th className="border border-white p-2">GF</th>
                        <th className="border border-white p-2">GA</th>
                        <th className="border border-white p-2">GD</th>
                        <th className="border border-white p-2">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.id} className={index < 1 ? 'bg-yellow-500 text-black' : ''}>
                            <td className="border border-white p-2">{index + 1}</td>
                            <td className="border border-white p-2">{team.name}</td>
                            <td className="border border-white p-2">{team.played}</td>
                            <td className="border border-white p-2">{team.wins}</td>
                            <td className="border border-white p-2">{team.draws}</td>
                            <td className="border border-white p-2">{team.losses}</td>
                            <td className="border border-white p-2">{team.goals_for}</td>
                            <td className="border border-white p-2">{team.goals_against}</td>
                            <td className="border border-white p-2">{team.goal_difference}</td>
                            <td className="border border-white p-2">{team.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}