import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { octoberBoard, spaceTypeLabels } from './data/boards';
import {
  awardPoints,
  clampTeamCount,
  createGameState,
  createTeams,
  getActiveTeam,
  moveActiveTeam,
  resetGame,
  resolveSpace,
  rollDie,
  startGame,
  suggestTeamCount,
} from './game/adventure';
import './styles.css';

const journeyCards = [
  { color: 'coral', name: 'Whole Class', text: 'Every team gives a quick answer before the host reveals the space.' },
  { color: 'gold', name: 'Lightning Round', text: 'Teams have 20 seconds to agree, then show their answer together.' },
  { color: 'sky', name: 'Swap a Spark', text: 'The active team can ask another team for a helpful idea.' },
  { color: 'plum', name: 'Double Discussion', text: 'Take an extra minute to explain why the choice could help someone.' },
];

function App() {
  const [phase, setPhase] = useState('menu');
  const [participants, setParticipants] = useState(12);
  const [teamCount, setTeamCount] = useState(suggestTeamCount(12));
  const [game, setGame] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [journeyCard, setJourneyCard] = useState(null);
  const [pointTeamIds, setPointTeamIds] = useState([]);

  function updateParticipants(value) {
    const count = Math.max(0, Number(value) || 0);
    setParticipants(count);
    setTeamCount(suggestTeamCount(count));
  }

  function beginGame() {
    const safeCount = clampTeamCount(teamCount, participants);
    const teams = createTeams(safeCount);
    const nextGame = startGame(createGameState({ teams, board: octoberBoard }));
    setGame(nextGame);
    setPointTeamIds([teams[0]?.id].filter(Boolean));
    setSelectedChoice(null);
    setRevealed(false);
    setJourneyCard(null);
    setPhase('board');
  }

  function resetToMenu() {
    setGame(null);
    setPhase('menu');
    setSelectedChoice(null);
    setRevealed(false);
    setJourneyCard(null);
  }

  function rollAndMove() {
    setGame((currentGame) => moveActiveTeam(rollDie(currentGame)));
  }

  function resolveCurrentSpace(bonus = 0) {
    setGame((currentGame) => {
      const withPoints = awardPoints(currentGame, pointTeamIds);
      return resolveSpace(withPoints, { choiceIndex: selectedChoice, bonus });
    });
    setSelectedChoice(null);
    setRevealed(false);
    setJourneyCard(null);
    if (game && game.status === 'landed') {
      const activeTeam = getActiveTeam(game);
      const destination = game.board.spaces[Math.min(activeTeam.position + bonus, game.board.spaces.length - 1)];
      if (destination?.type === 'finish') setPhase('complete');
    }
    setTimeout(() => {
      setGame((currentGame) => {
        if (!currentGame || currentGame.status === 'complete') setPhase('complete');
        else setPointTeamIds([getActiveTeam(currentGame)?.id].filter(Boolean));
        return currentGame;
      });
    }, 0);
  }

  function choosePointTeam(teamId) {
    setPointTeamIds((ids) => ids.includes(teamId) ? ids.filter((id) => id !== teamId) : [...ids, teamId]);
  }

  if (phase === 'menu') return <MenuScreen onStart={() => setPhase('setup')} />;
  if (phase === 'setup') return <SetupScreen participants={participants} teamCount={teamCount} updateParticipants={updateParticipants} setTeamCount={setTeamCount} onBack={resetToMenu} onStart={beginGame} />;
  if (phase === 'complete') return <CompleteScreen game={game} onRestart={() => { setGame(resetGame(game)); setPhase('board'); }} onMenu={resetToMenu} />;

  return <BoardGameScreen game={game} selectedChoice={selectedChoice} setSelectedChoice={setSelectedChoice} revealed={revealed} setRevealed={setRevealed} journeyCard={journeyCard} drawCard={() => setJourneyCard(journeyCards[Math.floor(Math.random() * journeyCards.length)])} pointTeamIds={pointTeamIds} choosePointTeam={choosePointTeam} onRoll={rollAndMove} onResolve={resolveCurrentSpace} onReset={resetToMenu} />;
}

function Header({ onBack }) {
  return <header className="app-header"><button className="wordmark" onClick={onBack} type="button">FSY<span>Interactive</span></button><span className="header-context">October · Your Body Is Sacred</span></header>;
}

function MenuScreen({ onStart }) {
  return <main className="app-shell menu-screen"><Header onBack={() => {}} /><section className="menu-hero"><div><p className="eyebrow">A shared tabletop experience</p><h1>Gather around the <em>board.</em></h1><p>One screen. Temporary team pieces. A journey through the October FSY topic with choices, surprises, and conversation.</p></div><div className="menu-die" aria-hidden="true">6</div></section><section className="mode-section"><p className="eyebrow">Choose a way in</p><div className="mode-grid"><button className="mode-card selected" onClick={onStart} type="button"><span>01 · Ready to play</span><strong>Sacred Journey</strong><p>Roll, move, draw surprise cards, and help your team reach The Lookout.</p><b>Play board game →</b></button><div className="mode-card muted"><span>02 · Coming next</span><strong>Sacred Puzzle</strong><p>Connect scriptures, principles, and real-life scenarios.</p></div><div className="mode-card muted"><span>03 · Explore anytime</span><strong>Lesson Guide</strong><p>Deep-dive into the October lesson and its resources.</p></div></div></section></main>;
}

function SetupScreen({ participants, teamCount, updateParticipants, setTeamCount, onBack, onStart }) {
  return <main className="app-shell setup-screen"><Header onBack={onBack} /><section className="setup-layout"><div><button className="text-button" onClick={onBack} type="button">← Game menu</button><p className="eyebrow">Sacred Journey · October</p><h1>Set the <em>table.</em></h1><p className="setup-copy">Choose the number of players and teams. Everyone plays from one shared screen; no names, phones, or accounts are needed.</p></div><section className="setup-card"><label htmlFor="participants">Players in the room</label><input id="participants" type="number" min="1" max="100" value={participants || ''} onChange={(event) => updateParticipants(event.target.value)} /><div className="team-control"><div><span>Team pieces</span><strong>{teamCount}</strong><small>maximum 4 teams</small></div><div className="stepper"><button aria-label="Fewer teams" disabled={teamCount <= 1} onClick={() => setTeamCount((count) => Math.max(1, count - 1))} type="button">−</button><span>{teamCount}</span><button aria-label="More teams" disabled={teamCount >= Math.min(4, Math.max(1, participants))} onClick={() => setTeamCount((count) => Math.min(4, Math.max(1, participants), count + 1))} type="button">+</button></div></div><button className="primary-button wide" disabled={participants < 1} onClick={onStart} type="button">Set the pieces on the board →</button></section></section></main>;
}

function BoardGameScreen({ game, selectedChoice, setSelectedChoice, revealed, setRevealed, journeyCard, drawCard, pointTeamIds, choosePointTeam, onRoll, onResolve, onReset }) {
  const activeTeam = getActiveTeam(game);
  const landedSpace = game.pendingSpace;
  const canChoose = landedSpace?.options && !revealed;

  return <main className="app-shell board-screen"><Header onBack={onReset} /><div className="board-heading"><div><p className="eyebrow">Sacred Journey · Turn {game.turn}</p><h1>{game.board.title}</h1></div><div className="turn-display"><span className={`team-token ${activeTeam?.color}`}>{activeTeam?.id}</span><div><small>Now playing</small><strong>{activeTeam?.label}</strong></div></div></div><section className="tabletop"><div className="board-meta"><span>Roll the die, then resolve the space</span><span>{game.board.spaces.length - 1} spaces to The Lookout</span></div><div className="board-path">{game.board.spaces.map((space, index) => <BoardSpace key={space.id} space={space} index={index} teams={game.teams} isPending={landedSpace?.id === space.id} />)}</div><div className="board-deck-row">{journeyCard ? <div className={`journey-card ${journeyCard.color}`}><span>Card drawn</span><strong>{journeyCard.name}</strong><p>{journeyCard.text}</p></div> : <button className="draw-card" onClick={drawCard} type="button"><span className="card-icon">✦</span><span><strong>Draw a journey card</strong><small>Add a surprise rule to this turn</small></span><b>→</b></button>}<div className="team-score-strip">{game.teams.map((team) => <div className={team.id === activeTeam?.id ? 'active' : ''} key={team.id}><i className={`team-token ${team.color}`}>{team.id}</i><span>{team.label}</span><strong>{team.points}</strong></div>)}</div></div></section><section className="turn-panel"><div className="turn-panel-top"><span className="space-type">{landedSpace ? spaceTypeLabels[landedSpace.type] : 'Your turn'}</span><span>Team {activeTeam?.id} · {activeTeam?.name}</span></div>{!landedSpace && <><h2>Roll for {activeTeam?.label}.</h2><p>Say the number out loud, move the team piece that many spaces, and see what the board gives you.</p><button className="dice-button" onClick={onRoll} type="button"><span className="die-face">{game.roll || '?'}</span><strong>{game.roll ? 'Move piece' : 'Roll the die'}</strong><small>{game.roll ? `Rolled a ${game.roll}` : '1–6 spaces'}</small></button></>}{landedSpace && <LandedSpace space={landedSpace} selectedChoice={selectedChoice} setSelectedChoice={setSelectedChoice} revealed={revealed} setRevealed={setRevealed} pointTeamIds={pointTeamIds} choosePointTeam={choosePointTeam} onResolve={onResolve} />}</section></main>;
}

function BoardSpace({ space, index, teams, isPending }) {
  const pieces = teams.filter((team) => team.position === index);
  return <div className={`board-cell type-${space.type} ${isPending ? 'pending' : ''}`} style={{ gridRow: space.row, gridColumn: space.column }}><span className="space-number">{index}</span><span className="space-type-label">{spaceTypeLabels[space.type]}</span><strong>{space.label}</strong>{pieces.length > 0 && <div className="pieces">{pieces.map((team) => <span className={`team-token ${team.color}`} key={team.id}>{team.id}</span>)}</div>}</div>;
}

function LandedSpace({ space, selectedChoice, setSelectedChoice, revealed, setRevealed, pointTeamIds, choosePointTeam, onResolve }) {
  return <div className="landed-space"><h2>{space.label}</h2>{space.type !== 'finish' && <p className="landing-prompt">{space.prompt || space.event || 'The team has reached the finish!'}</p>}{space.options && !revealed && <div className="choice-list">{space.options.map((option, index) => <button className={selectedChoice === index ? 'selected' : ''} key={option} onClick={() => setSelectedChoice(index)} type="button"><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>}{revealed && <div className="result-card"><span>Space resolved</span><p>{space.type === 'event' ? space.event : space.type === 'shortcut' ? 'A shortcut opens. Move ahead to the next branch.' : 'The team made room for discussion and a thoughtful choice.'}</p>{space.resource && <a href={space.resource.url} target="_blank" rel="noreferrer">Open {space.resource.label} ↗</a>}</div>}{!revealed && !space.options && <p className="verbal-note">Read this space aloud, let the group respond, then reveal the result.</p>}{revealed && <div className="points-row"><span>Optional point for contribution</span>{pointTeamIds.map((teamId) => <button key={teamId} onClick={() => choosePointTeam(teamId)} type="button">Team {teamId} +1</button>)}</div>}{!revealed ? <button className="primary-button" disabled={Boolean(space.options && selectedChoice === null)} onClick={() => setRevealed(true)} type="button">Reveal space →</button> : <div className="resolve-actions"><button className="primary-button" onClick={() => onResolve(0)} type="button">End turn</button>{['challenge', 'group'].includes(space.type) && <button className="bonus-button" onClick={() => onResolve(1)} type="button">Reward +1 move</button>}</div>}</div>;
}

function CompleteScreen({ game, onRestart, onMenu }) {
  return <main className="app-shell complete-screen"><Header onBack={onMenu} /><section className="complete-card"><p className="eyebrow">The board has a winner</p><h1>{game.winner?.label} reached <em>The Lookout.</em></h1><p>The class played through the journey together. Celebrate the choices, stories, and conversations that got every team to the table.</p><div className="final-scores">{game.teams.map((team) => <div key={team.id}><i className={`team-token ${team.color}`}>{team.id}</i><span>{team.label}</span><strong>{team.points}</strong></div>)}</div><div className="complete-actions"><button className="primary-button" onClick={onRestart} type="button">Play again</button><button className="text-button" onClick={onMenu} type="button">Choose another game</button></div></section></main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
