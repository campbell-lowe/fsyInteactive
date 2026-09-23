export function suggestTeamCount(participantCount) {
  if (participantCount <= 0) return 0;
  return Math.max(1, Math.ceil(participantCount / 4));
}

export function clampTeamCount(teamCount, participantCount) {
  if (participantCount <= 0) return 0;
  return Math.min(participantCount, Math.max(1, teamCount));
}

export function createTeams(teamCount) {
  return Array.from({ length: teamCount }, (_, index) => ({
    id: index + 1,
    label: `Team ${index + 1}`,
    points: 0,
  }));
}

export function awardParticipation(teams, points = 1) {
  return teams.map((team) => ({ ...team, points: team.points + points }));
}

export function getAdventureProgress(currentLocation, totalLocations) {
  return Math.min(100, Math.round((currentLocation / totalLocations) * 100));
}
