import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { octoberBoard, spaceTypeLabels } from "./data/boards";
import { additionalSources, octoberLesson, octoberMagazineIssue, octoberWeeklyGuides, scriptureSources } from "./data/lessons";
import {
  awardPoints,
  clampTeamCount,
  createGameState,
  createTeams,
  getActiveTeam,
  moveActiveTeam,
  resetGame,
  resolveSpace,
  rollRandomDie,
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
const slideColors = ["#dc5b5b", "#3687b8", "#cf4f8b", "#43936b", "#8764a8"];

function createConnectorPath(space) {
  const start = boardRoutePoints[space.position];
  const end = boardRoutePoints[space.transport.destination];
  const [controlOne, controlTwo] = space.transport.controls;
  const startPoint = { x: start.x * 10, y: start.y * 6.2 };
  const endPoint = { x: end.x * 10, y: end.y * 6.2 };

  if (space.transport.type === "bridge") {
    return `M${startPoint.x},${startPoint.y} C${controlOne[0]},${controlOne[1]} ${controlTwo[0]},${controlTwo[1]} ${endPoint.x},${endPoint.y}`;
  }

  const loopCenter = {
    x: 0.125 * startPoint.x + 0.375 * controlOne[0] + 0.375 * controlTwo[0] + 0.125 * endPoint.x,
    y: 0.125 * startPoint.y + 0.375 * controlOne[1] + 0.375 * controlTwo[1] + 0.125 * endPoint.y,
  };
  const tangent = {
    x: 0.75 * (controlOne[0] - startPoint.x) + 1.5 * (controlTwo[0] - controlOne[0]) + 0.75 * (endPoint.x - controlTwo[0]),
    y: 0.75 * (controlOne[1] - startPoint.y) + 1.5 * (controlTwo[1] - controlOne[1]) + 0.75 * (endPoint.y - controlTwo[1]),
  };
  const tangentLength = Math.hypot(tangent.x, tangent.y) || 1;
  const direction = { x: tangent.x / tangentLength, y: tangent.y / tangentLength };
  const normal = { x: -direction.y, y: direction.x };
  const loopRadius = 18;
  const loopEntry = { x: loopCenter.x + normal.x * loopRadius, y: loopCenter.y + normal.y * loopRadius };
  const loopOpposite = { x: loopCenter.x - normal.x * loopRadius, y: loopCenter.y - normal.y * loopRadius };
  const approachControlOne = { x: (startPoint.x + controlOne[0]) / 2, y: (startPoint.y + controlOne[1]) / 2 };
  const approachControlTwo = { x: loopEntry.x - direction.x * loopRadius, y: loopEntry.y - direction.y * loopRadius };
  const departureControlOne = { x: loopEntry.x - direction.x * loopRadius, y: loopEntry.y - direction.y * loopRadius };
  const departureControlTwo = { x: (controlTwo[0] + endPoint.x) / 2, y: (controlTwo[1] + endPoint.y) / 2 };

  return `M${startPoint.x},${startPoint.y} C${approachControlOne.x},${approachControlOne.y} ${approachControlTwo.x},${approachControlTwo.y} ${loopEntry.x},${loopEntry.y} A${loopRadius},${loopRadius} 0 0 0 ${loopOpposite.x},${loopOpposite.y} A${loopRadius},${loopRadius} 0 0 0 ${loopEntry.x},${loopEntry.y} C${departureControlOne.x},${departureControlOne.y} ${departureControlTwo.x},${departureControlTwo.y} ${endPoint.x},${endPoint.y}`;
}

function App() {
  const [phase, setPhase] = useState("menu");
  const [selectedWeeklyGuide, setSelectedWeeklyGuide] = useState(null);
  const [weeklyJournalEntries, setWeeklyJournalEntries] = useState({});
  const [participants, setParticipants] = useState(12);
  const [teamCount, setTeamCount] = useState(suggestTeamCount(12));
  const [teamPieceIds, setTeamPieceIds] = useState(() => createTeams(4).map((team) => team.color));
  const [game, setGame] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceSettling, setDiceSettling] = useState(false);
  const [rollingDice, setRollingDice] = useState(null);
  const [previewDice, setPreviewDice] = useState(() => [
    rollRandomDie(),
    rollRandomDie(),
  ]);
  const [pointTeamIds, setPointTeamIds] = useState([]);

  function updateParticipants(value) {
    const count = Math.max(0, Number(value) || 0);
    setParticipants(count);
    setTeamCount(suggestTeamCount(count));
  }

  function openWeeklyDive(guide) {
    setSelectedWeeklyGuide(guide);
    setPhase("weeklyDive");
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
    setRollingDice([1, 1]);
    setGame((currentGame) => rollDice(currentGame));
    const diceInterval = setInterval(() => {
      setRollingDice([
        rollRandomDie(),
        rollRandomDie(),
      ]);
    }, 85);
    setTimeout(() => {
      clearInterval(diceInterval);
      setRollingDice(null);
      setDiceRolling(false);
      setDiceSettling(true);
      setTimeout(() => {
        setGame((currentGame) => moveActiveTeam(currentGame));
        setDiceSettling(false);
        setPreviewDice([rollRandomDie(), rollRandomDie()]);
      }, 500);
    }, 850);
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

  if (phase === "menu") return <MenuScreen onStart={() => setPhase("setup")} onLesson={() => setPhase("lesson")} onWeekly={() => setPhase("weekly")} />;
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
  if (phase === "lesson") return <LessonGuideScreen onBack={() => setPhase("menu")} />;
  if (phase === "weekly") return <WeeklyLessonGuideScreen onBack={() => setPhase("menu")} onDive={openWeeklyDive} />;
  if (phase === "weeklyDive" && selectedWeeklyGuide) {
    return (
      <WeeklyLessonDiveScreen
        guide={selectedWeeklyGuide}
        journalEntries={weeklyJournalEntries}
        setJournalEntries={setWeeklyJournalEntries}
        onBack={() => setPhase("weekly")}
      />
    );
  }
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
      diceSettling={diceSettling}
      rollingDice={rollingDice}
      previewDice={previewDice}
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

const octoberSundayLessons = [
  {
    guideId: "fastSunday",
    week: "FAST SUNDAY",
    title: "1. Study the chapter from the FSY guide",
    description: "Study helps for the first Sunday in October.",
    url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/01-fast-sunday?lang=eng",
  },
  {
    guideId: "secondSunday",
    week: "SECOND SUNDAY",
    title: "2. Learn more about the Word of Wisdom",
    description: "Study helps for the second Sunday in October.",
    url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/02-second-sunday?lang=eng",
  },
  {
    guideId: "thirdSunday",
    week: "THIRD SUNDAY",
    title: "3. Learn more about the law of chastity",
    description: "Study helps for the third Sunday in October.",
    url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/03-third-sunday?lang=eng",
  },
  {
    guideId: "fourthSundayYoungWomen",
    week: "LAST SUNDAY · YOUNG WOMEN",
    title: "4. Becoming a covenant daughter of God",
    description: "Study helps for Young Women classes on the fourth Sunday in October.",
    url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/04a-fourth-sunday?lang=eng",
  },
  {
    guideId: "fourthSundayAaronicQuorums",
    week: "LAST SUNDAY · AARONIC PRIESTHOOD QUORUMS",
    title: "4. Becoming a covenant son of God",
    description: "Study helps for Aaronic Priesthood quorums on the fourth Sunday in October.",
    url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/04b-fourth-sunday?lang=eng",
  },
];

function MenuScreen({ onStart, onLesson, onWeekly }) {
  return (
    <main className="app-shell menu-screen">
      <Header onBack={() => {}} />
      <section className="menu-hero">
        <div>
          <p className="eyebrow">A shared tabletop experience</p>
          <h1>
            Your Body Is <em>Sacred.</em>
          </h1>
          <p>
            Explore identity, care, respect, and wise choices through a team
            adventure based on this month’s For the Strength of Youth lesson.
          </p>
          <figure className="menu-quote">
            <blockquote>“Your body is an amazing gift from your Heavenly Father.”</blockquote>
            <figcaption>
              <a href="https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/10-your-body-is-sacred?lang=eng" target="_blank" rel="noreferrer">
                For the Strength of Youth · Your Body Is Sacred ↗
              </a>
            </figcaption>
          </figure>
        </div>
        <div className="menu-die" aria-hidden="true">
          10
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
            <strong>Sacred Body Quest</strong>
            <p>
              Roll both dice, answer questions at the circles, and cross bridges or slides on the way to The Lookout.
            </p>
            <b>Play board game →</b>
          </button>
          <button
            className="mode-card weekly-entry"
            onClick={onWeekly}
            type="button"
          >
            <span>02 · Prepare for Sunday</span>
            <strong>Weekly Lesson Guide</strong>
            <p>Find October’s official Sunday lessons and class-specific guidance.</p>
            <b>View weekly lessons →</b>
          </button>
          <button
            className="mode-card lesson-entry"
            onClick={onLesson}
            type="button"
          >
            <span>03 · Study together</span>
            <strong>Diving Into the Lesson</strong>
            <p>Follow the lesson’s ideas, read scripture, and pause for discussion.</p>
            <b>Begin lesson →</b>
          </button>
        </div>
      </section>
    </main>
  );
}

function WeeklyLessonGuideScreen({ onBack, onDive }) {
  return (
    <main className="app-shell weekly-screen">
      <Header onBack={onBack} />
      <section className="weekly-guide">
        <button className="text-button" onClick={onBack} type="button">← Back to home</button>
        <section className="weekly-hero">
          <div>
            <p className="eyebrow">FOR THE STRENGTH OF YOUTH · OCTOBER 2026</p>
            <h1>Weekly Lesson <em>Guidance.</em></h1>
            <p>October’s theme is <strong>Your Body Is Sacred.</strong> Choose the Sunday lesson that matches your class.</p>
          </div>
          <img
            src="https://www.churchofjesuschrist.org/imgs/2fcmyh64970uaj37yqbs4nui4wsbm7x4xn27ib85/full/%21500%2C/0/default"
            alt="Your Body Is Sacred, October youth lesson artwork"
          />
        </section>
        <article className="weekly-overview">
          <div>
            <p className="eyebrow">OCTOBER INTRODUCTION</p>
            <h2>Your Body Is Sacred</h2>
            <p>Introduction to the youth lessons for October 2026.</p>
          </div>
          <div className="weekly-actions">
            <a href={octoberWeeklyGuides.introduction.url} target="_blank" rel="noreferrer">Open lesson ↗</a>
            <button className="weekly-dive-button" onClick={() => onDive(octoberWeeklyGuides.introduction)} type="button">Dive deeper</button>
          </div>
        </article>
        <section className="weekly-schedule" aria-label="October Sunday lessons">
          <p className="eyebrow">SUNDAY LESSONS</p>
          {octoberSundayLessons.map((lesson) => (
            <article className="weekly-lesson-row" key={lesson.url}>
              <p className="weekly-lesson-week">{lesson.week}</p>
              <div>
                <h2>{lesson.title}</h2>
                <p>{lesson.description}</p>
              </div>
              <div className="weekly-actions">
                <a href={lesson.url} target="_blank" rel="noreferrer">Open lesson ↗</a>
                <button className="weekly-dive-button" onClick={() => onDive(octoberWeeklyGuides[lesson.guideId])} type="button">Dive deeper</button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function WeeklyLessonDiveScreen({ guide, journalEntries, setJournalEntries, onBack }) {
  return (
    <main className="app-shell weekly-screen">
      <Header onBack={onBack} />
      <section className="weekly-dive-guide">
        <button className="text-button" onClick={onBack} type="button">← Back to October lessons</button>
        <p className="eyebrow">{guide.week} · FOR THE STRENGTH OF YOUTH</p>
        <h1>{guide.title}</h1>
        <p className="weekly-dive-intro">{guide.summary}</p>
        <figure className="weekly-dive-quote">
          <blockquote>“{guide.quote}”</blockquote>
          <figcaption>{guide.quoteSource}</figcaption>
        </figure>
        <section className="weekly-dive-scriptures">
          <p className="eyebrow">READ THE SCRIPTURES</p>
          {guide.scriptures.map((scripture) => (
            <a href={scripture.url} key={scripture.reference} target="_blank" rel="noreferrer">
              <strong>{scripture.reference}</strong><span>{scripture.title} ↗</span>
            </a>
          ))}
        </section>
        <section className="weekly-dive-journal">
          <p className="eyebrow">YOUR JOURNAL</p>
          <h2>What stands out to you?</h2>
          {guide.questions.map((question, index) => {
            const entryId = `${guide.id}-${index}`;
            return (
              <div className="weekly-dive-question" key={question}>
                <label htmlFor={`weekly-entry-${entryId}`}>{question}</label>
                <textarea
                  id={`weekly-entry-${entryId}`}
                  maxLength="1000"
                  onChange={(event) => setJournalEntries((entries) => ({ ...entries, [entryId]: event.target.value }))}
                  placeholder="A thought, a question, or something you want to remember..."
                  rows="3"
                  value={journalEntries[entryId] || ""}
                />
              </div>
            );
          })}
          <p className="lesson-journal-note">Your writing stays in this tab and clears when you leave the guide.</p>
        </section>
        <a className="weekly-official-link" href={guide.url} target="_blank" rel="noreferrer">Open the official lesson ↗</a>
      </section>
    </main>
  );
}

function LessonGuideScreen({ onBack }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [journalEntries, setJournalEntries] = useState({});
  const locations = octoberLesson.locations;
  const activeLocation = locations[stepIndex];
  const lessonHeadings = {
    identity: "Your worth is more than appearance.",
    care: "Care beats criticism.",
    respect: "Every body deserves respect.",
    choices: "Choose what strengthens you.",
    light: "Start with one small choice.",
  };
  const lessonQuestions = {
    identity: {
      discussion: "What messages make it easy to compare our bodies or our lives?",
      journal: "How could remembering you are a child of God change how you respond?",
    },
    care: {
      discussion: "What does caring for your body look like on a busy day?",
      journal: "Which small habit could help you feel more cared for this week?",
    },
    respect: {
      discussion: "What does respect for your own and someone else’s body look like online?",
      journal: "What could you say or do when someone’s body becomes the punchline?",
    },
    choices: {
      discussion: "What can make it hard to choose what is good for you when there is pressure?",
      journal: "Who could help you think it through before you decide?",
    },
    light: {
      discussion: "What is one thing your body lets you do that you are grateful for?",
      journal: "What is one kind, realistic way to care for yourself this week?",
    },
  };
  const magazineStories = {
      identity: {
        title: "God Knows and Loves You",
        byline: "Elder Ulisses Soares",
        summary: "Elder Soares reflects on how his testimony of God’s love deepened over time and invites youth to consider how personally God knows them.",
        excerpt: "Your Heavenly Father has always known you. He loves you.",
        url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/02-god-knows-and-loves-you?lang=eng",
      },
      care: {
        title: "Earning Belts and Trusting God",
        byline: "Jessica Zoey Strong · Church Magazines",
        summary: "Evangeline, a 17-year-old tae kwon do student, shares how prayer and family support helped her through a knee operation.",
        excerpt: "I could feel the love of Heavenly Father and that I wasn’t alone.",
        url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/10-earning-belts-and-trusting-god?lang=eng",
      },
      choices: {
        title: "Prompting at the Pool",
        byline: "James S. · Youth Voices",
        summary: "A 19-year-old lifeguard describes asking a supervisor to check on someone in trouble, and learning to trust a prompting instead of dismissing it.",
        excerpt: "We need to stop doubting ourselves and start trusting in our abilities.",
        url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/05-prompting-at-the-pool?lang=eng",
      },
      light: {
        title: "Becoming Your Best You",
        byline: "Elder John D. Amos and Sister Michelle Amos",
        summary: "Sister Amos shares how exploring school subjects helped her discover engineering, a path that later took her to NASA.",
        excerpt: "The best thing you can do is learn all you can now.",
        url: "https://www.churchofjesuschrist.org/study/ftsoy/2026/10/07-becoming-your-best-you?lang=eng",
      },
  };
    const optionalTopics = [
      {
        id: "chastity",
        title: "Chastity and personal boundaries",
        summary: "The FSY lesson describes sexual feelings as sacred and chastity as part of God’s plan. It teaches respect for your own body and other people’s boundaries, and encourages seeking trusted support when questions or pressure come up.",
        question: "What does respecting a boundary—your own or someone else’s—look like? Who could you ask if a question feels hard to talk about?",
        scripture: "1 Corinthians 6:18–20",
        scriptureUrl: "https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/6?lang=eng&id=p18-p20#p18",
        lessonUrl: "https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/10-your-body-is-sacred?lang=eng",
      },
      {
        id: "substances",
        title: "Substances and getting support",
        summary: "The lesson encourages choices that strengthen the body and cautions against substances that can harm the body or spirit. It also reminds readers to use even helpful medication correctly.",
        question: "If you or a friend felt pressured to try something harmful, what could help you find support?",
        scripture: "Doctrine and Covenants 89",
        scriptureUrl: "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/89?lang=eng",
        lessonUrl: "https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/10-your-body-is-sacred?lang=eng",
      },
    ];
  const scriptureReference = {
    identity: 'Genesis 1:27',
    care: '1 Corinthians 6:19–20',
    respect: '1 Corinthians 6:19–20',
    choices: '1 Corinthians 6:19–20',
    light: 'Doctrine and Covenants 88:15–16',
  }[activeLocation?.id];
  const activeScripture = scriptureSources.find((source) => source.reference === scriptureReference);
  const activeStory = magazineStories[activeLocation?.id];
  const isComplete = !activeLocation;

  return (
    <main className="app-shell lesson-screen">
      <Header onBack={onBack} />
      <section className="lesson-guide">
        <button className="text-button" onClick={onBack} type="button">← Back to home</button>
        <p className="eyebrow">{octoberLesson.month} {octoberLesson.moduleNumber} · For the Strength of Youth</p>
        <h1>Diving Into <em>the Lesson.</em></h1>
        <p className="lesson-intro">What does it mean to treat your body as a sacred gift? Read a scripture, explore one idea, and talk it through.</p>
        <figure className="lesson-quote">
          <blockquote>“Your body is an amazing gift from your Heavenly Father.”</blockquote>
          <figcaption>
            <a href="https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/10-your-body-is-sacred?lang=eng" target="_blank" rel="noreferrer">
              {octoberLesson.title} · Official lesson ↗
            </a>
          </figcaption>
        </figure>
        <div className="lesson-progress">
          <span>{isComplete ? "LESSON COMPLETE" : `TOPIC ${activeLocation.number} OF ${locations.length}`}</span>
          <div
            className="lesson-progress-track"
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuemin="0"
            aria-valuemax={locations.length}
            aria-valuenow={isComplete ? locations.length : stepIndex + 1}
          >
            <span style={{ width: `${(isComplete ? locations.length : stepIndex + 1) / locations.length * 100}%` }} />
          </div>
          {!isComplete && <span>{lessonHeadings[activeLocation.id]}</span>}
        </div>
        {activeLocation ? (
          <article className="lesson-step" aria-live="polite">
            <header className="lesson-step-heading">
              <span className="lesson-step-number">{activeLocation.number}</span>
              <div>
                <p className="eyebrow">THE BIG IDEA</p>
                <h2>{lessonHeadings[activeLocation.id]}</h2>
              </div>
            </header>
            <p className="lesson-teaching-point">{activeLocation.reveal}</p>
            {activeScripture && (
              <section className="lesson-reading">
                <p className="eyebrow">READ TOGETHER</p>
                <a href={activeScripture.url} target="_blank" rel="noreferrer">
                  {activeScripture.reference} · {activeScripture.title} ↗
                </a>
                <p>{activeScripture.note}</p>
              </section>
            )}
            {activeStory && (
              <aside className="magazine-story">
                <p className="eyebrow">A STORY FROM THE OCTOBER ISSUE</p>
                <h3>{activeStory.title}</h3>
                <p>{activeStory.summary}</p>
                <blockquote>“{activeStory.excerpt}”</blockquote>
                <p className="magazine-story-source">
                  {activeStory.byline} · <a href={activeStory.url} target="_blank" rel="noreferrer">Read the story ↗</a>
                </p>
              </aside>
            )}
            <section className="lesson-discussion">
              <h3>Talk about it</h3>
              <p>{lessonQuestions[activeLocation.id].discussion}</p>
            </section>
            <section className="lesson-journal">
              <div className="lesson-journal-heading">
                <div>
                  <span>YOUR JOURNAL</span>
                  <label htmlFor={`journal-${activeLocation.id}`}>{lessonQuestions[activeLocation.id].journal}</label>
                </div>
                <span className="lesson-journal-optional">OPTIONAL</span>
              </div>
              <textarea
                id={`journal-${activeLocation.id}`}
                maxLength="1000"
                onChange={(event) => setJournalEntries((entries) => ({ ...entries, [activeLocation.id]: event.target.value }))}
                placeholder="A few words, a question, or one step you might try..."
                rows="4"
                value={journalEntries[activeLocation.id] || ""}
              />
              <p className="lesson-journal-note" id={`journal-note-${activeLocation.id}`}>
                Your writing stays in this tab and clears when you leave the guide.
              </p>
            </section>
            {activeLocation.resource.label !== activeScripture?.reference && (
              <a className="lesson-scripture" href={activeLocation.resource.url} target="_blank" rel="noreferrer">
                Related lesson resource: {activeLocation.resource.label} ↗
              </a>
            )}
          </article>
        ) : (
          <section className="lesson-completion" aria-live="polite">
            <p className="eyebrow">LESSON COMPLETE</p>
            <h2>What will you carry with you?</h2>
            <p>Choose one idea from today to remember the sacred nature of your body and the way you care for yourself and others.</p>
            <section className="lesson-more-topics">
              <p className="eyebrow">OPTIONAL · READ AND REFLECT</p>
              <h2>More topics to explore</h2>
              <p>These sensitive topics come from the official FSY lesson. Read quietly, write only what feels useful, or skip a prompt.</p>
              {optionalTopics.map((topic) => (
                <details className="lesson-sensitive-topic" key={topic.id}>
                  <summary>{topic.title}</summary>
                  <div className="lesson-sensitive-content">
                    <p>{topic.summary}</p>
                    <a href={topic.scriptureUrl} target="_blank" rel="noreferrer">Read {topic.scripture} ↗</a>
                    <a href={topic.lessonUrl} target="_blank" rel="noreferrer">Read “Your Body Is Sacred” ↗</a>
                    <div className="lesson-journal">
                      <div className="lesson-journal-heading">
                        <div>
                          <span>OPTIONAL REFLECTION</span>
                          <label htmlFor={`journal-${topic.id}`}>{topic.question}</label>
                        </div>
                      </div>
                      <textarea
                        id={`journal-${topic.id}`}
                        maxLength="1000"
                        onChange={(event) => setJournalEntries((entries) => ({ ...entries, [topic.id]: event.target.value }))}
                        placeholder="A thought, a question, or someone you could talk to..."
                        rows="4"
                        value={journalEntries[topic.id] || ""}
                      />
                      <p className="lesson-journal-note">Your writing stays in this tab and clears when you leave the guide.</p>
                    </div>
                  </div>
                </details>
              ))}
            </section>
            <h3>Scriptures to revisit</h3>
            <div className="lesson-finish-sources">
              {scriptureSources.map((source) => (
                <a key={source.reference} href={source.url} target="_blank" rel="noreferrer">
                  <strong>{source.reference}</strong><span>{source.title} ↗</span>
                </a>
              ))}
              <a href={octoberMagazineIssue.url} target="_blank" rel="noreferrer">
                <strong>{octoberMagazineIssue.title}</strong><span>Browse the issue ↗</span>
              </a>
              {additionalSources.map((source) => (
                <a key={source.title} href={source.url} target="_blank" rel="noreferrer">
                  <strong>{source.title}</strong><span>{source.author} · {source.type} ↗</span>
                </a>
              ))}
            </div>
          </section>
        )}
        <nav className="lesson-controls" aria-label="Lesson navigation">
          <button className="text-button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))} type="button">
            ← Previous
          </button>
          {isComplete ? (
            <button className="primary-button" onClick={() => setStepIndex(0)} type="button">Review lesson</button>
          ) : (
            <button className="primary-button" onClick={() => setStepIndex((current) => current + 1)} type="button">
              {stepIndex === locations.length - 1 ? "Finish lesson" : "Next topic →"}
            </button>
          )}
        </nav>
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
          <p className="eyebrow">Sacred Body Quest · October</p>
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
  diceSettling,
  rollingDice,
  previewDice,
  pointTeamIds,
  choosePointTeam,
  onRoll,
  onMove,
  onResolve,
  onReset,
}) {
  const [openedQuestionKey, setOpenedQuestionKey] = useState(null);
  const [slideAnimation, setSlideAnimation] = useState(null);
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
  const routeLinks = game.board.spaces.filter((space) => space.transport);
  const isQuestionLanding = landedSpace?.type === "question";
  const isSpecialLanding = Boolean(landedSpace?.transport || landedSpace?.type === "event");
  const questionKey = isQuestionLanding ? `${game.turn}:${landedSpace.id}` : null;
  const questionIsOpen = questionKey !== null && openedQuestionKey === questionKey;

  useEffect(() => {
    if (!slideAnimation) return undefined;
    const timeout = window.setTimeout(() => setSlideAnimation(null), 1550);
    return () => window.clearTimeout(timeout);
  }, [slideAnimation]);

  function resolveSpecialLanding() {
    if (landedSpace?.transport?.type === "slide" && activeTeam) {
      setSlideAnimation({ spaceId: landedSpace.id, teamId: activeTeam.id, color: activeTeam.color });
    }
    onResolve(0);
  }

  function proceedToQuestion() {
    setOpenedQuestionKey(questionKey);
    setTimeout(() => {
      const turnBox = document.querySelector(".turn-box");
      if (!turnBox) return;
      const top = turnBox.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - 16));
    }, 80);
  }

  return (
    <main className="app-shell board-screen">
      <Header onBack={onReset} />
      <div className="board-toolbar">
        <button
          className="roll-corner-control"
          onClick={game.status === "rolled" ? onMove : onRoll}
          disabled={diceRolling || diceSettling || game.status === "landed"}
          type="button"
        >
          <span className="roll-team-identity">
            <i className={`team-token ${activeTeam?.color}`}>{activeTeam?.id}</i>
            <span><small>NOW PLAYING</small><strong>{activeTeam?.label}</strong></span>
          </span>
          <span className="roll-action-copy">
            <strong>{game.status === "landed" ? `Team ${activeTeam?.id} · stopped` : game.status === "rolled" ? diceSettling ? `Rolled ${game.roll}` : `Move Team ${activeTeam?.id}` : "Roll dice"}</strong>
            <small>{game.status === "rolled" ? `${game.roll} spaces` : game.status === "landed" ? "Team turn in progress" : activeTeam?.name}</small>
          </span>
          <span className="corner-dice" aria-hidden="true">
            {(diceRolling ? rollingDice : game.dice || previewDice).map((value, index) => (
              <i key={index}>{value}</i>
            ))}
          </span>
        </button>
      </div>
      <section className="tabletop">
        <div className="board-path">
          <svg
            className="board-track"
            viewBox="0 0 1000 620"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="track-outline" d={boardTrackPath} />
            <path className="track-ribbon" d={boardTrackPath} />
            {routeLinks.map((space, routeIndex) => {
              const start = boardRoutePoints[space.position];
              const end = boardRoutePoints[space.transport.destination];
              const [controlOne, controlTwo] = space.transport.controls;
              const startPoint = { x: start.x * 10, y: start.y * 6.2 };
              const endPoint = { x: end.x * 10, y: end.y * 6.2 };
              const routePath = createConnectorPath(space);
              const slideIndex = routeLinks.slice(0, routeIndex).filter((route) => route.transport.type === "slide").length;
              const bridgePlanks = [0.16, 0.32, 0.48, 0.64, 0.8].map((progress) => {
                const inverse = 1 - progress;
                const point = {
                  x: inverse ** 3 * startPoint.x + 3 * inverse ** 2 * progress * controlOne[0] + 3 * inverse * progress ** 2 * controlTwo[0] + progress ** 3 * endPoint.x,
                  y: inverse ** 3 * startPoint.y + 3 * inverse ** 2 * progress * controlOne[1] + 3 * inverse * progress ** 2 * controlTwo[1] + progress ** 3 * endPoint.y,
                };
                const tangent = {
                  x: 3 * inverse ** 2 * (controlOne[0] - startPoint.x) + 6 * inverse * progress * (controlTwo[0] - controlOne[0]) + 3 * progress ** 2 * (endPoint.x - controlTwo[0]),
                  y: 3 * inverse ** 2 * (controlOne[1] - startPoint.y) + 6 * inverse * progress * (controlTwo[1] - controlOne[1]) + 3 * progress ** 2 * (endPoint.y - controlTwo[1]),
                };
                const length = Math.hypot(tangent.x, tangent.y) || 1;
                const normal = { x: -tangent.y / length * 7, y: tangent.x / length * 7 };
                return { x1: point.x - normal.x, y1: point.y - normal.y, x2: point.x + normal.x, y2: point.y + normal.y };
              });

              return (
                <g key={space.id}>
                  {space.transport.type === "bridge" ? (
                    <>
                      <path className="bridge-shadow" d={routePath} />
                      <path className="bridge-deck" d={routePath} />
                      {bridgePlanks.map((plank, index) => <line className="bridge-plank" key={index} {...plank} />)}
                    </>
                  ) : (
                    <>
                      <path className="slide-outline" d={routePath} />
                      <path className="slide-bed" d={routePath} style={{ stroke: slideColors[slideIndex] }} />
                    </>
                  )}
                  <rect
                    className={`route-landing ${space.transport.type}`}
                    x={endPoint.x - 6}
                    y={endPoint.y - 6}
                    width="12"
                    height="12"
                    rx={space.transport.type === "bridge" ? "1" : "0"}
                    transform={space.transport.type === "slide" ? `rotate(45 ${endPoint.x} ${endPoint.y})` : undefined}
                  />
                </g>
              );
            })}
          </svg>
          {game.status === "rolled" && (
            <div className={`board-dice-overlay ${diceRolling ? "rolling" : ""}`} aria-label={`Dice show ${game.dice?.[0]} and ${game.dice?.[1]}, total ${game.roll}`}>
              <span className="dice-overlay-title">{diceRolling ? "ROLLING" : "ROLL TOTAL"}</span>
              <div className={`dice-pair ${diceRolling ? "rolling" : ""}`}>
                {(diceRolling ? rollingDice || game.dice : game.dice).map((value, index) => <span className="die-face" key={index}>{value}</span>)}
              </div>
              <strong>{game.roll}</strong>
            </div>
          )}
          {isSpecialLanding && (
            <div className="board-dice-overlay landing-result-overlay">
              <span className="dice-overlay-title">{landedSpace.type === "event" ? "PATH EVENT" : "PATH LINK"}</span>
              <strong>{landedSpace.type === "event" ? landedSpace.event.title : `${landedSpace.transport.type === "bridge" ? "Bridge" : "Slide"}!`}</strong>
              <p>{landedSpace.type === "event" ? landedSpace.event.text : `${landedSpace.transport.type === "bridge" ? "Cross the bridge" : "Take the slide"} to space ${landedSpace.transport.destination}.`}</p>
              {landedSpace.type === "event" && <span className={`event-outcome-note ${landedSpace.event.points < 0 ? "negative" : "positive"}`}>{landedSpace.event.points > 0 ? "+" : ""}{landedSpace.event.points} points</span>}
              <button className="primary-button" onClick={resolveSpecialLanding} type="button">End turn</button>
            </div>
          )}
          {isQuestionLanding && !questionIsOpen && (
            <div className="board-dice-overlay question-intro-overlay">
              <span className="dice-overlay-title">QUESTION CIRCLE · +10 POINTS</span>
              <strong>{landedSpace.label}</strong>
              <button className="primary-button" onClick={proceedToQuestion} type="button">Proceed to question</button>
            </div>
          )}
          {game.board.spaces.map((space) => (
            space.type === "path" || space.type === "event" ? (
              <PathSpaceMarker
                key={space.id}
                space={space}
                position={boardRoutePoints[space.position]}
                teams={game.teams}
                hiddenTeamId={slideAnimation?.teamId}
              />
            ) : (
              <BoardSpace
                key={space.id}
                space={space}
                teams={game.teams}
                position={boardRoutePoints[space.position]}
                isPending={landedSpace?.id === space.id}
                hiddenTeamId={slideAnimation?.teamId}
              />
            )
          ))}
          {slideAnimation && (() => {
            const slideSpace = routeLinks.find((space) => space.id === slideAnimation.spaceId);
            if (!slideSpace) return null;
            return (
              <svg className="slide-animation-layer" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
                <g>
                  <foreignObject x="-18" y="-21" width="36" height="42">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="slide-rider">
                      <i className={`team-token slide-rider-token ${slideAnimation.color}`}>{slideAnimation.teamId}</i>
                    </div>
                  </foreignObject>
                  <animateMotion dur="1450ms" path={createConnectorPath(slideSpace)} fill="freeze" />
                </g>
              </svg>
            );
          })()}
        </div>
        <div className="board-deck-row">
          <aside className="point-key" aria-label="Scoring rules">
            <span className="point-key-heading">POINTS</span>
            <div><strong>+10</strong><span>Land on circle</span></div>
            <div><strong>+15</strong><span>Correct answer</span></div>
            <div><strong>+5 / +10</strong><span>Good event</span></div>
            <div><strong>−5 / −10</strong><span>Bad event</span></div>
            <div className="winning-points"><strong>+30</strong><span>Finish first / same round</span></div>
          </aside>
          <section className={`turn-panel turn-box ${questionIsOpen ? "question-open" : ""}`}>
            <div className="turn-panel-top">
              <span className="space-type">{landedSpace ? spaceTypeLabels[landedSpace.type] : `Turn ${game.turn}`}</span>
              <span>Team {activeTeam?.id} · {activeTeam?.name}</span>
            </div>
            {!landedSpace && <p className="turn-summary">{game.status === "rolled" ? `Dice total ${game.roll}. Move your piece from the top-right control.` : `Roll both dice for ${activeTeam?.label}.`}</p>}
            {isQuestionLanding && !questionIsOpen && <p className="turn-summary">Your team reached a question circle. Choose Proceed to question on the board.</p>}
            {landedSpace && !isSpecialLanding && (!isQuestionLanding || questionIsOpen) && (
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
          <div className="team-score-strip">
            {game.teams.map((team) => (
              <div
                className={team.id === activeTeam?.id ? "active" : ""}
                key={team.id}
              >
                <span className="team-score-identity">
                  <i className={`team-token ${team.color}`}>{team.id}</i>
                  <span>{team.label}</span>
                </span>
                <span className="team-points"><strong>{team.points}</strong><small>PTS</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function BoardSpace({ space, teams, position, isPending, hiddenTeamId }) {
  const pieces = teams.filter((team) => team.position === space.position && team.id !== hiddenTeamId);
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

function PathSpaceMarker({ space, position, teams, hiddenTeamId }) {
  const pieces = teams.filter((team) => team.position === space.position && team.id !== hiddenTeamId);
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
          Finish bonus +30 for the first finisher and any team that finishes this round.
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
  const standings = [...game.teams].sort((teamA, teamB) => teamB.points - teamA.points || teamA.id - teamB.id);
  const confettiColors = ["#d44e38", "#145846", "#4d9daa", "#f0c94e", "#866571"];

  return (
    <main className="app-shell complete-screen">
      <Header onBack={onMenu} />
      <div className="celebration-confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i
            key={index}
            style={{
              "--confetti-x": `${(index * 37) % 100}%`,
              "--confetti-delay": `${(index % 6) * 90}ms`,
              "--confetti-color": confettiColors[index % confettiColors.length],
              "--confetti-drift": `${((index % 3) - 1) * 38}px`,
            }}
          />
        ))}
      </div>
      <section className="complete-card">
        <p className="eyebrow">Round {game.finishRound} complete · First to The Lookout wins</p>
        <h1>
          {game.winner?.label} <em>wins.</em>
        </h1>
        <p>
          The round is complete. Final team scores are ranked below.
        </p>
        <div className="final-scores" role="list" aria-label="Final team scores">
          {standings.map((team, index) => (
            <div
              className={team.id === game.winner?.id ? "winner-score" : ""}
              key={team.id}
              role="listitem"
              style={{ "--score-index": index }}
            >
              <span className="score-rank">{String(index + 1).padStart(2, "0")}</span>
              <i className={`team-token ${team.color}`}>{team.id}</i>
              <span className="score-team-name">
                {team.label}
                {team.id === game.winner?.id && <small>First to finish</small>}
              </span>
              <strong>{team.points}<small> pts</small></strong>
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
