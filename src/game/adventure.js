export const TEAM_PIECES = [
  { id: 'red', name: 'Red', hex: '#ef3340' },
  { id: 'purple', name: 'Purple', hex: '#9b32b5' },
  { id: 'blue', name: 'Blue', hex: '#2251c5' },
  { id: 'cyan', name: 'Cyan', hex: '#0099c8' },
  { id: 'teal', name: 'Teal', hex: '#0ab89b' },
  { id: 'green', name: 'Green', hex: '#078b3a' },
  { id: 'lavender', name: 'Lavender', hex: '#b960ca' },
  { id: 'magenta', name: 'Magenta', hex: '#dc37a4' },
  { id: 'pink', name: 'Pink', hex: '#f16b83' },
  { id: 'black', name: 'Black', hex: '#202020' },
  { id: 'white', name: 'White', hex: '#ffffff' },
];
const TEAM_NAMES = ['The Seekers', 'The Builders', 'The Guardians', 'The Lightbringers'];

export function suggestTeamCount(participantCount) {
  if (participantCount <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil(participantCount / 4)));
}

export function clampTeamCount(teamCount, participantCount) {
  if (participantCount <= 0) return 0;
  return Math.min(4, participantCount, Math.max(1, Math.floor(teamCount)));
}

export function createTeams(teamCount, selectedPieceIds = []) {
  const safeCount = Math.max(0, Math.min(4, Math.floor(teamCount)));
  return Array.from({ length: safeCount }, (_, index) => ({
    id: index + 1,
    name: TEAM_NAMES[index],
    label: `Team ${index + 1}`,
    color: selectedPieceIds[index] ?? TEAM_PIECES[index].id,
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
    dice: null,
    roll: null,
    movementTarget: null,
    remainingMove: 0,
    pendingSpace: null,
    pendingQuestion: null,
    questionPoolExhausted: false,
    usedQuestionIds: [],
    selectedChoice: null,
    winner: null,
    finishRound: null,
    finishers: [],
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

export function rollRandomDie() {
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) return Math.floor(Math.random() * 6) + 1;

  const range = 0x100000000;
  const limit = range - range % 6;
  const value = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % 6 + 1;
}

export function rollDice(state, random = null) {
  if ((state.status !== 'playing' && state.status !== 'turn_ready') || state.pendingSpace) return state;
  const dice = random
    ? [Math.floor(random() * 6) + 1, Math.floor(random() * 6) + 1]
    : [rollRandomDie(), rollRandomDie()];
  const roll = dice[0] + dice[1];
  return { ...state, dice, roll, status: 'rolled', eventLog: [...state.eventLog, { type: 'dice_rolled', teamId: getActiveTeam(state)?.id, dice, roll }] };
}

export function moveActiveTeam(state) {
  if (state.status !== 'rolled' || !state.roll) return state;
  const activeTeam = getActiveTeam(state);
  const movementTarget = Math.min(activeTeam.position + state.roll, state.board.spaces.length - 1);
  return advanceMovement({ ...state, movementTarget });
}

function advanceMovement(state) {
  const activeTeam = getActiveTeam(state);
  const from = activeTeam.position;
  const questionSpaces = state.board.spaces.filter((space) => space.type === 'question');
  const nextQuestion = questionSpaces.find((space) => space.position === state.movementTarget);
  const nextEvent = state.board.spaces.find((space) => space.type === 'event' && space.position === state.movementTarget);
  const usedQuestionIds = new Set(state.usedQuestionIds);
  const pendingQuestion = nextQuestion
    ? questionSpaces.find((space) => space.id === nextQuestion.id && !usedQuestionIds.has(space.id))
      ?? questionSpaces.find((space) => !usedQuestionIds.has(space.id))
      ?? null
    : null;

  if (nextEvent && (!nextQuestion || nextEvent.position < nextQuestion.position)) {
    const withEventPoints = adjustPoints(state, [activeTeam.id], nextEvent.event.points);
    return {
      ...withEventPoints,
      status: 'landed',
      pendingSpace: nextEvent,
      pendingQuestion: null,
      questionPoolExhausted: false,
      remainingMove: state.movementTarget - nextEvent.position,
      teams: withEventPoints.teams.map((team) => team.id === activeTeam.id ? { ...team, position: nextEvent.position } : team),
      eventLog: [...state.eventLog, { type: 'path_event_reached', teamId: activeTeam.id, eventId: nextEvent.id, points: nextEvent.event.points, position: nextEvent.position }],
    };
  }

  if (nextQuestion) {
    const withLandingPoints = awardPoints(state, [activeTeam.id], 10);
    return {
      ...withLandingPoints,
      status: 'landed',
      pendingSpace: nextQuestion,
      pendingQuestion,
      questionPoolExhausted: !pendingQuestion,
      remainingMove: state.movementTarget - nextQuestion.position,
      teams: withLandingPoints.teams.map((team) => team.id === activeTeam.id ? { ...team, position: nextQuestion.position } : team),
      eventLog: [...state.eventLog, { type: 'question_circle_reached', teamId: activeTeam.id, from, to: nextQuestion.position, points: 10 }],
    };
  }

  const destination = state.board.spaces[state.movementTarget];
  const arrivedState = {
    ...state,
    remainingMove: 0,
    teams: state.teams.map((team) => team.id === activeTeam.id ? { ...team, position: state.movementTarget } : team),
    eventLog: [...state.eventLog, { type: 'team_moved', teamId: activeTeam.id, from, to: state.movementTarget }],
  };

  if (destination.transport || destination.type === 'finish') {
    return {
      ...arrivedState,
      status: 'landed',
      pendingSpace: destination,
      pendingQuestion: null,
      questionPoolExhausted: false,
    };
  }

  return finishTurn({ ...arrivedState, pendingSpace: null, pendingQuestion: null, questionPoolExhausted: false });
}

function finishTurn(state) {
  const round = Math.ceil(state.turn / state.teams.length);
  const lastTeamInRound = state.activeTeamIndex === state.teams.length - 1;
  const gameComplete = state.finishRound === round && lastTeamInRound;

  return {
    ...state,
    status: gameComplete ? 'complete' : 'playing',
    activeTeamIndex: (state.activeTeamIndex + 1) % state.teams.length,
    turn: state.turn + 1,
    dice: null,
    roll: null,
    movementTarget: null,
    remainingMove: 0,
  };
}

export function awardPoints(state, teamIds, points = 1) {
  return adjustPoints(state, teamIds, points);
}

export function adjustPoints(state, teamIds, points) {
  return { ...state, teams: state.teams.map((team) => teamIds.includes(team.id) ? { ...team, points: team.points + points } : team) };
}

export function resolveSpace(state, { choiceIndex = null, bonus = 0 } = {}) {
  if (state.status !== 'landed' || !state.pendingSpace) return state;
  const activeTeam = getActiveTeam(state);
  const space = state.pendingSpace;
  const usedQuestionIds = state.pendingQuestion && !state.usedQuestionIds.includes(state.pendingQuestion.id)
    ? [...state.usedQuestionIds, state.pendingQuestion.id]
    : state.usedQuestionIds;
  const clearedState = {
    ...state,
    pendingSpace: null,
    pendingQuestion: null,
    questionPoolExhausted: false,
    usedQuestionIds,
    selectedChoice: choiceIndex,
    eventLog: [...state.eventLog, { type: 'space_resolved', teamId: activeTeam.id, spaceId: space.id, choiceIndex, bonus }],
  };

  if (space.type === 'question') {
    return state.remainingMove > 0
      ? advanceMovement({ ...clearedState, status: 'rolled' })
      : finishTurn(clearedState);
  }

  if (space.type === 'event') {
    return state.remainingMove > 0
      ? advanceMovement({ ...clearedState, status: 'rolled' })
      : finishTurn(clearedState);
  }

  if (space.transport) {
    const destination = Math.max(0, Math.min(space.transport.destination, state.board.spaces.length - 1));
    return finishTurn({
      ...clearedState,
      teams: state.teams.map((team) => team.id === activeTeam.id ? { ...team, position: destination } : team),
      eventLog: [...clearedState.eventLog, { type: 'transport_used', teamId: activeTeam.id, spaceId: space.id, destination }],
    });
  }

  if (space.type === 'finish') {
    const round = Math.ceil(state.turn / state.teams.length);
    const finishRound = state.finishRound ?? round;
    const qualifiesForFinishPoints = round === finishRound && !state.finishers.includes(activeTeam.id);
    const finishers = qualifiesForFinishPoints ? [...state.finishers, activeTeam.id] : state.finishers;
    const scoredState = qualifiesForFinishPoints
      ? awardPoints(clearedState, [activeTeam.id], 30)
      : clearedState;
    return finishTurn({
      ...scoredState,
      winner: state.winner ?? activeTeam,
      finishRound,
      finishers,
    });
  }

  return finishTurn(clearedState);
}

export function resetGame(state) {
  return createGameState({ board: state.board, teams: state.teams.map((team) => ({ ...team, position: 0, points: 0 })) });
}
