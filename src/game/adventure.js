const TEAM_COLORS = ['coral', 'gold', 'sky', 'plum'];
const TEAM_NAMES = ['The Seekers', 'The Builders', 'The Guardians', 'The Lightbringers'];

export function suggestTeamCount(participantCount) {
  if (participantCount <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil(participantCount / 4)));
}

export function clampTeamCount(teamCount, participantCount) {
  if (participantCount <= 0) return 0;
  return Math.min(4, participantCount, Math.max(1, Math.floor(teamCount)));
}

export function createTeams(teamCount) {
  const safeCount = Math.max(0, Math.min(4, Math.floor(teamCount)));
  return Array.from({ length: safeCount }, (_, index) => ({
    id: index + 1,
    name: TEAM_NAMES[index],
    label: `Team ${index + 1}`,
    color: TEAM_COLORS[index],
    position: 0,
    points: 0,
  }));
}

export function createGameState({ teams = [], board }) {
  return {
    status: 'ready',
    board,
    teams,
    activeTeamIndex: 0,
    turn: 1,
    roll: null,
    pendingSpace: null,
    selectedChoice: null,
    winner: null,
    eventLog: [],
  };
}

export function getActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function getCurrentSpace(state) {
  const activeTeam = getActiveTeam(state);
  return activeTeam ? state.board.spaces[activeTeam.position] : null;
}

export function startGame(state) {
  return { ...state, status: 'playing', eventLog: [...state.eventLog, { type: 'game_started' }] };
}

export function rollDie(state, random = Math.random()) {
  if (state.status !== 'playing' || state.pendingSpace) return state;
  const roll = Math.floor(random * 6) + 1;
  return { ...state, roll, status: 'rolled', eventLog: [...state.eventLog, { type: 'die_rolled', teamId: getActiveTeam(state)?.id, roll }] };
}

export function moveActiveTeam(state) {
  if (state.status !== 'rolled' || !state.roll) return state;
  const activeTeam = getActiveTeam(state);
  const destination = Math.min(activeTeam.position + state.roll, state.board.spaces.length - 1);
  const pendingSpace = state.board.spaces[destination];
  return {
    ...state,
    status: 'landed',
    pendingSpace,
    teams: state.teams.map((team) => team.id === activeTeam.id ? { ...team, position: destination } : team),
    eventLog: [...state.eventLog, { type: 'team_moved', teamId: activeTeam.id, from: activeTeam.position, to: destination }],
  };
}

export function awardPoints(state, teamIds, points = 1) {
  return { ...state, teams: state.teams.map((team) => teamIds.includes(team.id) ? { ...team, points: team.points + points } : team) };
}

export function resolveSpace(state, { choiceIndex = null, bonus = 0 } = {}) {
  if (state.status !== 'landed' || !state.pendingSpace) return state;
  const activeTeam = getActiveTeam(state);
  const space = state.pendingSpace;
  let destination = activeTeam.position + bonus;

  if (space.type === 'event') destination += space.effect || 0;
  if (space.type === 'shortcut') destination = state.board.spaces.findIndex((item) => item.id === space.destination);
  destination = Math.max(0, Math.min(destination, state.board.spaces.length - 1));

  const winner = state.board.spaces[destination].type === 'finish' ? activeTeam : null;
  const updatedState = {
    ...state,
    status: winner ? 'complete' : 'turn_ready',
    winner,
    pendingSpace: null,
    selectedChoice: choiceIndex,
    roll: null,
    teams: state.teams.map((team) => team.id === activeTeam.id ? { ...team, position: destination } : team),
    eventLog: [...state.eventLog, { type: 'space_resolved', teamId: activeTeam.id, spaceId: space.id, choiceIndex, bonus, destination }],
  };

  if (winner) return updatedState;
  return {
    ...updatedState,
    activeTeamIndex: (state.activeTeamIndex + 1) % state.teams.length,
    turn: state.turn + 1,
  };
}

export function resetGame(state) {
  return createGameState({ board: state.board, teams: state.teams.map((team) => ({ ...team, position: 0, points: 0 })) });
}
