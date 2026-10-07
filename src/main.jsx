import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { octoberBoard, spaceTypeLabels } from "./data/boards";
import {
  awardPoints,
  clampTeamCount,
  createGameState,
  createTeams,
  getActiveTeam,
  moveActiveTeam,
  resetGame,
  resolveSpace,
  rollDice,
  startGame,
  suggestTeamCount,
  TEAM_PIECES,
} from "./game/adventure";
import "./styles.css";

const boardNodeLabels = {
  finish: "Finish",
  village: "Identity",
  garden: "Care",
  bridge: "Make Room",
  crossroads: "Honesty",
  path: "Choices",
  prompting: "Prompting",
  story: "Story",
  temple: "Guidance",
  hope: "Hope",
  respect: "Trust",
  fork: "Choose",
  "lookout-path": "Gifts",
  dawn: "Keep Going",
  reflection: "Gratitude",
};

const spacesBetweenCircles = 6;
const narrowPathLayout = typeof window !== "undefined" && window.matchMedia("(max-width: 1050px)").matches;
const mobilePathLayout = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
const circleEdgeRadius = mobilePathLayout
  ? { x: 8, y: 4.6 }
  : narrowPathLayout
    ? { x: 3.5, y: 4 }
    : { x: 3.5, y: 5.25 };

const boardCirclePositions = [
  { x: 10, y: 82 },
  { x: 30, y: 88 },
  { x: 53, y: 84 },
  { x: 77, y: 88 },
  { x: 95, y: 74 },
  { x: 72, y: 62 },
  { x: 49, y: 66 },
  { x: 26, y: 62 },
  { x: 5, y: 48 },
  { x: 28, y: 38 },
  { x: 51, y: 43 },
  { x: 75, y: 38 },
  { x: 95, y: 23 },
  { x: 66, y: 14 },
  { x: 42, y: 19 },
  { x: 18, y: 13 },
];

function getCircleSegmentPoint(circleIndex, progress) {
  const start = boardCirclePositions[circleIndex];
  const end = boardCirclePositions[circleIndex + 1];
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

function findCircleEdgeProgress(circleIndex, fromStart) {
  const circleCenter = boardCirclePositions[circleIndex + (fromStart ? 0 : 1)];
  const steps = 1000;

  for (let step = 1; step < steps; step += 1) {
    const progress = fromStart ? step / steps : (steps - step) / steps;
    const point = getCircleSegmentPoint(circleIndex, progress);
    const horizontalDistance = (point.x - circleCenter.x) / circleEdgeRadius.x;
    const verticalDistance = (point.y - circleCenter.y) / circleEdgeRadius.y;

    if (horizontalDistance ** 2 + verticalDistance ** 2 >= 1) {
      return progress;
    }
  }

  return fromStart ? 0.2 : 0.8;
}

function createRoutePoints() {
  const routePoints = [];

  for (
    let circleIndex = 0;
    circleIndex < boardCirclePositions.length - 1;
    circleIndex += 1
  ) {
    const edgeStart = findCircleEdgeProgress(circleIndex, true);
    const edgeEnd = findCircleEdgeProgress(circleIndex, false);

    for (let step = circleIndex === 0 ? 0 : 1; step <= 7; step += 1) {
      const pathProgress =
        step === 0 || step === 7
          ? step / 7
          : edgeStart + (step / 7) * (edgeEnd - edgeStart);
      routePoints.push(getCircleSegmentPoint(circleIndex, pathProgress));
    }
  }

  return routePoints;
}

const boardRoutePoints = createRoutePoints();
const boardTrackPath = boardCirclePositions.slice(0, -1).map((_, gapIndex) => {
  const firstPathPosition = gapIndex * (spacesBetweenCircles + 1) + 1;
  const lastPathPosition = firstPathPosition + spacesBetweenCircles - 1;
  const edgeStart = findCircleEdgeProgress(gapIndex, true);
  const edgeEnd = findCircleEdgeProgress(gapIndex, false);
  const pathPoints = [
    getCircleSegmentPoint(gapIndex, edgeStart),
    ...boardRoutePoints.slice(firstPathPosition, lastPathPosition + 1),
    getCircleSegmentPoint(gapIndex, edgeEnd),
  ];
  return `M${pathPoints.map(({ x, y }) => `${x * 10},${y * 6.2}`).join(" L")}`;
}).join(" ");

function App() {
  const [phase, setPhase] = useState("menu");
  const [participants, setParticipants] = useState(12);
  const [teamCount, setTeamCount] = useState(suggestTeamCount(12));
  const [teamPieceIds, setTeamPieceIds] = useState(() => createTeams(4).map((team) => team.color));
  const [game, setGame] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [pointTeamIds, setPointTeamIds] = useState([]);

  function updateParticipants(value) {
    const count = Math.max(0, Number(value) || 0);
    setParticipants(count);
    setTeamCount(suggestTeamCount(count));
  }

  function beginGame() {
    const safeCount = clampTeamCount(teamCount, participants);
    const teams = createTeams(safeCount, teamPieceIds);
    const nextGame = startGame(createGameState({ teams, board: octoberBoard }));
    setGame(nextGame);
    setPointTeamIds([teams[0]?.id].filter(Boolean));
    setSelectedChoice(null);
    setRevealed(false);
    setPhase("board");
  }

  function selectTeamPiece(teamIndex, pieceId) {
    setTeamPieceIds((currentIds) => {
      const nextIds = [...currentIds];
      const previousPiece = nextIds[teamIndex];
      const currentOwner = nextIds.indexOf(pieceId);
      nextIds[teamIndex] = pieceId;
      if (currentOwner >= 0 && currentOwner !== teamIndex) {
        nextIds[currentOwner] = previousPiece;
      }
      return nextIds;
    });
  }

  function resetToMenu() {
    setGame(null);
    setPhase("menu");
    setSelectedChoice(null);
    setRevealed(false);
  }

  function rollDiceForTurn() {
    setDiceRolling(true);
    setGame((currentGame) => rollDice(currentGame));
    setTimeout(() => setDiceRolling(false), 700);
  }

  function moveAfterRoll() {
    setGame((currentGame) => moveActiveTeam(currentGame));
  }

  function resolveCurrentSpace(bonus = 0) {
    setGame((currentGame) => {
      const activeTeam = getActiveTeam(currentGame);
      const currentQuestion = currentGame?.pendingQuestion;
      const choseCorrectAnswer =
        currentQuestion?.answerIndex !== undefined &&
        selectedChoice === currentQuestion.answerIndex;
      const withCorrectAnswer =
        choseCorrectAnswer && activeTeam
          ? awardPoints(currentGame, [activeTeam.id], 15)
          : currentGame;
      const hasScoredChoices =
        Array.isArray(currentQuestion?.options) &&
        typeof currentQuestion.answerIndex === "number";
      const withPoints = currentQuestion && !hasScoredChoices
        ? awardPoints(withCorrectAnswer, pointTeamIds, 15)
        : withCorrectAnswer;
      return resolveSpace(withPoints, { choiceIndex: selectedChoice, bonus });
    });
    setSelectedChoice(null);
    setRevealed(false);
    setTimeout(() => {
      setGame((currentGame) => {
        if (!currentGame || currentGame.status === "complete")
          setPhase("complete");
        else setPointTeamIds([getActiveTeam(currentGame)?.id].filter(Boolean));
        return currentGame;
      });
    }, 0);
  }

  function choosePointTeam(teamId) {
    setPointTeamIds((ids) =>
      ids.includes(teamId)
        ? ids.filter((id) => id !== teamId)
        : [...ids, teamId],
    );
  }

  if (phase === "menu") return <MenuScreen onStart={() => setPhase("setup")} />;
  if (phase === "setup")
    return (
      <SetupScreen
        participants={participants}
        teamCount={teamCount}
        teamPieceIds={teamPieceIds}
        updateParticipants={updateParticipants}
        setTeamCount={setTeamCount}
        selectTeamPiece={selectTeamPiece}
        onBack={resetToMenu}
        onStart={beginGame}
      />
    );
  if (phase === "complete")
    return (
      <CompleteScreen
        game={game}
        onRestart={() => {
          setGame(resetGame(game));
          setPhase("board");
        }}
        onMenu={resetToMenu}
      />
    );

  return (
    <BoardGameScreen
      game={game}
      selectedChoice={selectedChoice}
      setSelectedChoice={setSelectedChoice}
      revealed={revealed}
      setRevealed={setRevealed}
        diceRolling={diceRolling}
      pointTeamIds={pointTeamIds}
      choosePointTeam={choosePointTeam}
        onRoll={rollDiceForTurn}
        onMove={moveAfterRoll}
      onResolve={resolveCurrentSpace}
      onReset={resetToMenu}
    />
  );
}

function Header({ onBack }) {
  return (
    <header className="app-header">
      <button className="wordmark" onClick={onBack} type="button">
        FSY<span>Interactive</span>
      </button>
      <span className="header-context">October · Your Body Is Sacred</span>
    </header>
  );
}

function MenuScreen({ onStart }) {
  return (
    <main className="app-shell menu-screen">
      <Header onBack={() => {}} />
      <section className="menu-hero">
        <div>
          <p className="eyebrow">A shared tabletop experience</p>
          <h1>
            Gather around the <em>board.</em>
          </h1>
          <p>
            One screen. Temporary team pieces. A journey through the October FSY
            topic through questions, team choices, bridges, and slides.
          </p>
        </div>
        <div className="menu-die" aria-hidden="true">
          6
        </div>
      </section>
      <section className="mode-section">
        <p className="eyebrow">Choose a way in</p>
        <div className="mode-grid">
          <button
            className="mode-card selected"
            onClick={onStart}
            type="button"
          >
            <span>01 · Ready to play</span>
            <strong>Sacred Journey</strong>
            <p>
              Roll both dice, answer questions at the circles, and cross bridges or slides on the way to The Lookout.
            </p>
            <b>Play board game →</b>
          </button>
          <div className="mode-card muted">
            <span>02 · Coming next</span>
            <strong>Sacred Puzzle</strong>
                  : 0.25 + ((step - 1) / 5) * 0.5;
          </div>
          <div className="mode-card muted">
            <span>03 · Explore anytime</span>
            <strong>Lesson Guide</strong>
            <p>Deep-dive into the October lesson and its resources.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function SetupScreen({
  participants,
  teamCount,
  teamPieceIds,
  updateParticipants,
  setTeamCount,
  selectTeamPiece,
  onBack,
  onStart,
}) {
  const [pieceTeamIndex, setPieceTeamIndex] = useState(0);
  const activeTeamIndex = Math.min(pieceTeamIndex, Math.max(0, teamCount - 1));

  return (
    <main className="app-shell setup-screen">
      <Header onBack={onBack} />
      <section className="setup-layout">
        <div>
          <button className="text-button" onClick={onBack} type="button">
            ← Game menu
          </button>
          <p className="eyebrow">Sacred Journey · October</p>
          <h1>
            Set the <em>table.</em>
          </h1>
          <p className="setup-copy">
            Choose the number of players and teams. Everyone plays from one
            shared screen; no names, phones, or accounts are needed.
          </p>
        </div>
        <section className="setup-card">
          <label htmlFor="participants">Players in the room</label>
          <input
            id="participants"
            type="number"
            min="1"
            max="100"
            value={participants || ""}
            onChange={(event) => updateParticipants(event.target.value)}
          />
          <div className="team-control">
            <div>
              <span>Team pieces</span>
              <strong>{teamCount}</strong>
              <small>maximum 4 teams</small>
            </div>
            <div className="stepper">
              <button
                aria-label="Fewer teams"
                disabled={teamCount <= 1}
                onClick={() => setTeamCount((count) => Math.max(1, count - 1))}
                type="button"
              >
                −
              </button>
              <span>{teamCount}</span>
              <button
                aria-label="More teams"
                disabled={teamCount >= Math.min(4, Math.max(1, participants))}
                onClick={() =>
                  setTeamCount((count) =>
                    Math.min(4, Math.max(1, participants), count + 1),
                  )
                }
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <div className="piece-picker">
            <span className="piece-picker-label">Choose each team’s game piece</span>
            <div className="piece-team-tabs" aria-label="Select team">
              {Array.from({ length: teamCount }, (_, teamIndex) => (
                <button
                  aria-pressed={activeTeamIndex === teamIndex}
                  className={activeTeamIndex === teamIndex ? "selected" : ""}
                  key={teamIndex}
                  onClick={() => setPieceTeamIndex(teamIndex)}
                  type="button"
                >
                  <i className={`team-token ${teamPieceIds[teamIndex]}`}>{teamIndex + 1}</i>
                  Team {teamIndex + 1}
                </button>
              ))}
            </div>
            <div className="piece-swatches" aria-label={`Game pieces for Team ${activeTeamIndex + 1}`}>
              {TEAM_PIECES.map((piece) => {
                const isSelected = teamPieceIds[activeTeamIndex] === piece.id;
                return (
                  <button
                    aria-label={`${piece.name}${isSelected ? ", selected" : ""}`}
                    aria-pressed={isSelected}
                    className={`piece-swatch ${isSelected ? "selected" : ""}`}
                    key={piece.id}
                    onClick={() => selectTeamPiece(activeTeamIndex, piece.id)}
                    style={{ "--piece-color": piece.hex }}
                    title={piece.name}
                    type="button"
                  >
                    {isSelected && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
            <small>{TEAM_PIECES.find((piece) => piece.id === teamPieceIds[activeTeamIndex])?.name} piece selected for Team {activeTeamIndex + 1}</small>
          </div>
          <button
            className="primary-button wide"
            disabled={participants < 1}
            onClick={onStart}
            type="button"
          >
            Set the pieces on the board →
          </button>
        </section>
      </section>
    </main>
  );
}

function BoardGameScreen({
  game,
  selectedChoice,
  setSelectedChoice,
  revealed,
  setRevealed,
  diceRolling,
  pointTeamIds,
  choosePointTeam,
  onRoll,
  onMove,
  onResolve,
  onReset,
}) {
  const activeTeam = getActiveTeam(game);
  const landedSpace = game.pendingSpace && {
    ...game.pendingSpace,
    ...(game.pendingQuestion
      ? {
          prompt: game.pendingQuestion.prompt,
          creativePrompt: game.pendingQuestion.creativePrompt,
          options: game.pendingQuestion.options,
          answerIndex: game.pendingQuestion.answerIndex,
          resource: game.pendingQuestion.resource,
          magazineArticle: game.pendingQuestion.magazineArticle,
          questionCardTitle: game.pendingQuestion.label,
        }
      : game.questionPoolExhausted
        ? {
            prompt: null,
            creativePrompt: null,
            options: null,
            answerIndex: null,
            resource: null,
            magazineArticle: null,
          }
        : {}),
    questionPoolExhausted: game.questionPoolExhausted,
  };
  const questionCircles = game.board.spaces.filter(
    (space) => space.type === "question",
  );
  const routeLinks = game.board.spaces.filter((space) => space.transport);

  return (
    <main className="app-shell board-screen">
      <Header onBack={onReset} />
      <div className="board-heading">
        <div>
          <p className="eyebrow">Sacred Journey · Turn {game.turn}</p>
          <h1>{game.board.title}</h1>
        </div>
        <div className="turn-display">
          <span className={`team-token ${activeTeam?.color}`}>
            {activeTeam?.id}
          </span>
          <div>
            <small>Now playing</small>
            <strong>{activeTeam?.label}</strong>
          </div>
        </div>
      </div>
      <section className="tabletop">
        <div className="board-meta">
          <span>{questionCircles.length} question circles</span>
          <span>6 path spaces between circles</span>
          <span>One gain and one loss in every gap</span>
        </div>
        <div className="board-path">
          <svg
            className="board-track"
            viewBox="0 0 1000 620"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="track-outline" d={boardTrackPath} />
            <path className="track-ribbon" d={boardTrackPath} />
            {routeLinks.map((space) => {
              const start = boardRoutePoints[space.position];
              const end = boardRoutePoints[space.transport.destination];
              return (
                <g key={space.id}>
                  <line
                    className={`route-link ${space.transport.type}`}
                    x1={start.x * 10}
                    y1={start.y * 6.2}
                    x2={end.x * 10}
                    y2={end.y * 6.2}
                  />
                  <rect
                    className={`route-landing ${space.transport.type}`}
                    x={end.x * 10 - 6}
                    y={end.y * 6.2 - 6}
                    width="12"
                    height="12"
                    rx={space.transport.type === "bridge" ? "1" : "0"}
                    transform={space.transport.type === "slide" ? `rotate(45 ${end.x * 10} ${end.y * 6.2})` : undefined}
                  />
                </g>
              );
            })}
          </svg>
          {game.board.spaces.map((space) => (
            space.type === "path" || space.type === "event" ? (
              <PathSpaceMarker
                key={space.id}
                space={space}
                position={boardRoutePoints[space.position]}
                teams={game.teams}
              />
            ) : (
              <BoardSpace
                key={space.id}
                space={space}
                teams={game.teams}
                position={boardRoutePoints[space.position]}
                isPending={landedSpace?.id === space.id}
              />
            )
          ))}
        </div>
        <div className="board-deck-row">
          <div className="route-key">
            <span><i className="bridge-key">B</i> Bridge</span>
            <span><i className="slide-key">S</i> Slide</span>
            <span><i className="event-key">±</i> Event</span>
            <small>Events resolve during movement; circles pause for questions.</small>
          </div>
          <div className="team-score-strip">
            {game.teams.map((team) => (
              <div
                className={team.id === activeTeam?.id ? "active" : ""}
                key={team.id}
              >
                <i className={`team-token ${team.color}`}>{team.id}</i>
                <span>{team.label}</span>
                <strong>{team.points}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="turn-panel">
        <div className="turn-panel-top">
          <span className="space-type">
            {landedSpace ? spaceTypeLabels[landedSpace.type] : "Your turn"}
          </span>
          <span>
            Team {activeTeam?.id} · {activeTeam?.name}
          </span>
        </div>
        {!landedSpace && (
          <>
            <h2>{game.status === "rolled" ? `Total: ${game.roll}` : `Roll for ${activeTeam?.label}.`}</h2>
            <p>Roll both dice, add them together, then move that many spaces.</p>
            <div className={`dice-pair ${diceRolling ? "rolling" : ""}`} aria-label={game.dice ? `Dice show ${game.dice[0]} and ${game.dice[1]}` : "Two dice ready to roll"}>
              {(game.dice || [null, null]).map((value, index) => (
                <span className="die-face" key={index}>{value ?? "?"}</span>
              ))}
            </div>
            <button
              className="dice-button"
              onClick={game.status === "rolled" ? onMove : onRoll}
              disabled={diceRolling}
              type="button"
            >
              <span className="die-total">{game.status === "rolled" ? game.roll : "2–12"}</span>
              <strong>{game.status === "rolled" ? "Move piece" : "Roll two dice"}</strong>
              <small>{game.status === "rolled" ? "Total spaces" : "Two six-sided dice"}</small>
            </button>
          </>
        )}
        {landedSpace && (
          <LandedSpace
            space={landedSpace}
            remainingMove={game.remainingMove}
            selectedChoice={selectedChoice}
            setSelectedChoice={setSelectedChoice}
            revealed={revealed}
            setRevealed={setRevealed}
            pointTeamIds={pointTeamIds}
            choosePointTeam={choosePointTeam}
            onResolve={onResolve}
          />
        )}
      </section>
    </main>
  );
}

function BoardSpace({ space, teams, position, isPending }) {
  const pieces = teams.filter((team) => team.position === space.position);
  const label = boardNodeLabels[space.id] || space.label;
  const shouldAlignLeft = space.id === "prompting" || label.split(/\s+/).some((word) => word.length >= 8);
  return (
    <div
      className={`board-cell type-${space.type} ${pieces.length ? "has-pieces" : ""} ${isPending ? "pending" : ""}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      <span className="space-type-label">{spaceTypeLabels[space.type]}</span>
      <strong className={shouldAlignLeft ? "align-left" : ""}>{label}</strong>
      {pieces.length > 0 && (
        <div className="pieces">
          {pieces.map((team) => (
            <span className={`team-token ${team.color}`} key={team.id}>
              {team.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PathSpaceMarker({ space, position, teams }) {
  const pieces = teams.filter((team) => team.position === space.position);
  const gapStep = space.position % (spacesBetweenCircles + 1);
  const hasMarker = space.transport || space.event || pieces.length > 0;
  const before = boardRoutePoints[space.position - 1];
  const after = boardRoutePoints[space.position + 1];
  const angle = before && after
    ? Math.atan2((after.y - before.y) * 6.2, (after.x - before.x) * 10) * 180 / Math.PI
    : 0;

  return (
    <div
      className={`path-space-marker ${space.transport?.type || ""} ${space.event ? "event-marker" : ""} ${space.event?.points < 0 ? "negative" : "positive"} ${pieces.length ? "occupied" : ""}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, "--path-angle": `${angle}deg` }}
      aria-hidden={!hasMarker}
      aria-label={space.event ? `${space.event.title}, ${space.event.points > 0 ? "gain" : "lose"} ${Math.abs(space.event.points)} points` : space.transport ? `${space.transport.type} entrance at space ${space.position}` : pieces.length ? `Team marker at gap step ${gapStep}` : undefined}
    >
      <span className={`path-space-block ${gapStep % 2 ? "odd" : "even"}`} aria-hidden="true" />
      {pieces.length > 0 && <span className="path-step-badge">{gapStep}</span>}
      {space.event && <span className={`event-symbol ${space.event.points < 0 ? "negative" : "positive"}`}>{space.event.points < 0 ? "−" : "+"}</span>}
      {space.transport && (
        <span className={`route-symbol ${space.transport.type}`}>
          {space.transport.type === "bridge" ? "B" : "S"}
        </span>
      )}
      {pieces.map((team) => (
        <i className={`team-token ${team.color}`} key={team.id}>{team.id}</i>
      ))}
    </div>
  );
}

function LandedSpace({
  space,
  remainingMove,
  selectedChoice,
  setSelectedChoice,
  revealed,
  setRevealed,
  pointTeamIds,
  choosePointTeam,
  onResolve,
}) {
  const selectedText =
    typeof selectedChoice === "number" && space.options
      ? space.options[selectedChoice]
      : null;
  const correctAnswer =
    typeof space.answerIndex === "number" && space.options
      ? space.options[space.answerIndex]
      : null;
  const gotItRight =
    typeof selectedChoice === "number" &&
    typeof space.answerIndex === "number" &&
    selectedChoice === space.answerIndex;
  const isQuestionCircle = space.type === "question";
  const isEventSpace = space.type === "event";
  const isPathSpace = space.type === "path" || isEventSpace;
  const hasCreativePrompt = Boolean(space.creativePrompt);
  const revealDisabled = Boolean(isQuestionCircle && space.options && selectedChoice === null);

  return (
    <div className="landed-space">
      <h2>{isEventSpace ? space.event.title : isPathSpace ? (space.transport ? `${space.transport.type === "bridge" ? "Bridge" : "Slide"}!` : `Space ${space.position}`) : space.label}</h2>
      {space.questionCardTitle && space.questionCardTitle !== space.label && (
        <p className="fresh-question-label">
          Fresh question · {space.questionCardTitle}
        </p>
      )}
      {isPathSpace && (
        <p className="landing-prompt">
          {isEventSpace
            ? space.event.text
            : space.transport
            ? `${space.transport.type === "bridge" ? "Cross the bridge" : "Take the slide"} to space ${space.transport.destination}.`
            : "No question on this space. End your move here."}
        </p>
      )}
      {isEventSpace && (
        <p className={`event-outcome-note ${space.event.points < 0 ? "negative" : "positive"}`}>
          {space.event.points > 0 ? "+" : ""}{space.event.points} points
          {remainingMove > 0 ? ` · ${remainingMove} spaces left after event` : ""}
        </p>
      )}
      {space.type === "finish" && (
        <p className="landing-prompt">The Lookout is reached. Resolve the finish to end the journey.</p>
      )}
      {isQuestionCircle && !space.questionPoolExhausted && (
        <p className="landing-prompt">
          {space.prompt}
        </p>
      )}
      {isQuestionCircle && !space.questionPoolExhausted && (
        <p className="circle-score-note">
          Circle landing +10 points{remainingMove > 0 ? ` · ${remainingMove} spaces left after answering` : ""}
        </p>
      )}
      {space.type === "finish" && (
        <p className="circle-score-note">
          Finish-round bonus: 20 points for the first finisher and any team that finishes this round.
        </p>
      )}
      {space.magazineArticle && (
        <p className="magazine-citation">
          <span>{space.magazineArticle.issue}</span>
          <a href={space.magazineArticle.url} target="_blank" rel="noreferrer">
            {space.magazineArticle.title} ↗
          </a>
        </p>
      )}
      {space.questionPoolExhausted && (
        <p className="question-pool-note">
          All fresh questions have been used this game. Resolve this space
          without repeating one.
        </p>
      )}
      {isQuestionCircle && space.options && !revealed && (
        <div className="choice-list">
          {space.options.map((option, index) => (
            <button
              className={selectedChoice === index ? "selected" : ""}
              key={option}
              onClick={() => setSelectedChoice(index)}
              type="button"
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>
      )}
      {isQuestionCircle && hasCreativePrompt && !revealed && (
        <div className="creative-prompt team-huddle">
          <span>Team huddle</span>
          <p>{space.creativePrompt}</p>
        </div>
      )}
      {isQuestionCircle && revealed && !space.questionPoolExhausted && (
        <div className={`result-card ${space.options && !gotItRight ? "incorrect" : ""}`}>
          <span>
            {space.options
              ? gotItRight
                ? "Correct · +15 answer points"
                : "Incorrect · +0 answer points"
              : "Space resolved"}
          </span>
          <p>{space.options ? (gotItRight ? "Your team identified the strongest response." : "That choice is not correct. Compare it with the correct answer below.") : "Your team discussed the question."}</p>
          {space.options && (
            <p className="answer-breakdown">
              <strong>Correct answer:</strong> {correctAnswer}
            </p>
          )}
          {selectedText && (
            <p className="answer-breakdown">
              <strong>Your answer:</strong> {selectedText}
            </p>
          )}
          {space.resource && (
            <a href={space.resource.url} target="_blank" rel="noreferrer">
              Open {space.resource.label} ↗
            </a>
          )}
        </div>
      )}
      {isQuestionCircle && !revealed && !space.options && !hasCreativePrompt && !space.questionPoolExhausted && (
          <p className="verbal-note">
            Discuss the question as a team, then reveal the answer.
          </p>
        )}
      {isQuestionCircle && revealed && !space.questionPoolExhausted && !space.options && (
        <div className="points-row">
              <span>Judge the response: +15 for a strong answer</span>
          {pointTeamIds.map((teamId) => (
            <button
              key={teamId}
              onClick={() => choosePointTeam(teamId)}
              type="button"
            >
              Team {teamId} +15
            </button>
          ))}
        </div>
      )}
      {isPathSpace && (
        <button className="primary-button" onClick={() => onResolve(0)} type="button">
          {isEventSpace
            ? remainingMove > 0 ? `Continue movement · ${remainingMove} left` : "End turn"
            : space.transport ? "Continue from link" : "End turn"}
        </button>
      )}
      {space.type === "finish" && (
        <button className="primary-button" onClick={() => onResolve(0)} type="button">
          Finish journey
        </button>
      )}
      {isQuestionCircle && space.questionPoolExhausted && (
        <button className="primary-button" onClick={() => onResolve(0)} type="button">
          Continue without repeating
        </button>
      )}
      {isQuestionCircle && !revealed && !space.questionPoolExhausted && (
        <button
          className="primary-button"
          disabled={revealDisabled}
          onClick={() => setRevealed(true)}
          type="button"
        >
          Reveal space →
        </button>
      )}
      {isQuestionCircle && revealed && (
        <div className="resolve-actions">
          <button
            className="primary-button"
            onClick={() => onResolve(0)}
            type="button"
          >
            {remainingMove > 0 ? `Continue movement · ${remainingMove} left` : "End turn"}
          </button>
        </div>
      )}
    </div>
  );
}

function CompleteScreen({ game, onRestart, onMenu }) {
  return (
    <main className="app-shell complete-screen">
      <Header onBack={onMenu} />
      <section className="complete-card">
        <p className="eyebrow">The board has a winner</p>
        <h1>
          {game.winner?.label} reached <em>The Lookout.</em>
        </h1>
        <p>
          The class played through the journey together. Celebrate the choices,
          stories, and conversations that got every team to the table.
        </p>
        <div className="final-scores">
          {game.teams.map((team) => (
            <div key={team.id}>
              <i className={`team-token ${team.color}`}>{team.id}</i>
              <span>{team.label}</span>
              <strong>{team.points}</strong>
            </div>
          ))}
        </div>
        <div className="complete-actions">
          <button className="primary-button" onClick={onRestart} type="button">
            Play again
          </button>
          <button className="text-button" onClick={onMenu} type="button">
            Choose another game
          </button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
