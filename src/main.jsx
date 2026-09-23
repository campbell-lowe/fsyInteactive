import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { additionalSources, octoberLesson, scriptureSources } from './data/lessons';
import {
  awardParticipation,
  clampTeamCount,
  createTeams,
  getAdventureProgress,
  suggestTeamCount,
} from './game/adventure';
import './styles.css';

function App() {
  const [phase, setPhase] = useState('setup');
  const [participantCount, setParticipantCount] = useState(12);
  const [teamCount, setTeamCount] = useState(suggestTeamCount(12));
  const [teams, setTeams] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completedLocations, setCompletedLocations] = useState([]);
  const [reflection, setReflection] = useState('');

  const location = octoberLesson.locations[currentLocation];
  const progress = getAdventureProgress(currentLocation, octoberLesson.locations.length);

  function updateParticipants(value) {
    const nextCount = Math.max(0, Number(value) || 0);
    setParticipantCount(nextCount);
    setTeamCount(suggestTeamCount(nextCount));
  }

  function startAdventure() {
    const safeTeamCount = clampTeamCount(teamCount, participantCount);
    setTeamCount(safeTeamCount);
    setTeams(createTeams(safeTeamCount));
    setCurrentLocation(0);
    setCompletedLocations([]);
    setRevealed(false);
    setPhase('adventure');
  }

  function resetAdventure() {
    setPhase('setup');
    setTeams([]);
    setCurrentLocation(0);
    setCompletedLocations([]);
    setRevealed(false);
    setReflection('');
  }

  function awardAndAdvance() {
    setTeams((currentTeams) => awardParticipation(currentTeams));
    setCompletedLocations((locations) => [...new Set([...locations, location.id])]);
    if (currentLocation === octoberLesson.locations.length - 1) {
      setPhase('complete');
      return;
    }
    setCurrentLocation((index) => index + 1);
    setRevealed(false);
  }

  function skipLocation() {
    if (currentLocation === octoberLesson.locations.length - 1) {
      setPhase('complete');
      return;
    }
    setCurrentLocation((index) => index + 1);
    setRevealed(false);
  }

  function restartCurrentLocation() {
    setRevealed(false);
  }

  if (phase === 'setup') {
    return <SetupScreen participantCount={participantCount} teamCount={teamCount} updateParticipants={updateParticipants} setTeamCount={setTeamCount} startAdventure={startAdventure} />;
  }

  if (phase === 'complete') {
    return <CompletionScreen teams={teams} reflection={reflection} setReflection={setReflection} resetAdventure={resetAdventure} />;
  }

  return (
    <AdventureScreen
      lesson={octoberLesson}
      teams={teams}
      location={location}
      currentLocation={currentLocation}
      progress={progress}
      revealed={revealed}
      completedLocations={completedLocations}
      setRevealed={setRevealed}
      awardAndAdvance={awardAndAdvance}
      skipLocation={skipLocation}
      restartCurrentLocation={restartCurrentLocation}
      resetAdventure={resetAdventure}
    />
  );
}

function BrandBar({ phase, resetAdventure }) {
  return (
    <header className="game-topbar">
      <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); resetAdventure(); }}>FSY<span>Interactive</span></a>
      <div className="game-topbar-meta"><span>October · Module 10</span><span className="teacher-badge">Teacher view</span></div>
    </header>
  );
}

function SetupScreen({ participantCount, teamCount, updateParticipants, setTeamCount, startAdventure }) {
  return (
    <main className="game-shell setup-shell" id="top">
      <BrandBar resetAdventure={() => {}} />
      <section className="setup-layout">
        <div className="setup-intro">
          <p className="eyebrow">Team Adventure · October</p>
          <h1>Your body is <em>sacred.</em></h1>
          <p className="setup-description">A 25-minute, teacher-led adventure through identity, care, respect, choices, and light. Teams talk together; nobody needs a phone or login.</p>
          <div className="timing-strip"><span>03 min</span><span>02 min</span><span>10 min</span><span>06 min</span><span>04 min</span></div>
          <div className="timing-labels"><span>intro</span><span>setup</span><span>adventure</span><span>connect</span><span>reflect</span></div>
        </div>
        <section className="setup-panel" aria-labelledby="setup-heading">
          <p className="eyebrow">Before you begin</p>
          <h2 id="setup-heading">Set up the <em>room.</em></h2>
          <label htmlFor="participants">Number of participants</label>
          <input id="participants" className="number-input" type="number" min="1" max="100" value={participantCount || ''} onChange={(event) => updateParticipants(event.target.value)} />
          <div className="team-setting">
            <div><span className="setting-label">Suggested teams</span><strong>{Math.max(1, teamCount)}</strong><small>about {participantCount && teamCount ? Math.ceil(participantCount / teamCount) : 0} per team</small></div>
            <div className="stepper" aria-label="Adjust number of teams">
              <button type="button" aria-label="Fewer teams" disabled={teamCount <= 1} onClick={() => setTeamCount((count) => Math.max(1, count - 1))}>−</button>
              <span>{teamCount}</span>
              <button type="button" aria-label="More teams" disabled={teamCount >= Math.max(1, participantCount)} onClick={() => setTeamCount((count) => Math.min(Math.max(1, participantCount), count + 1))}>+</button>
            </div>
          </div>
          <p className="setup-note">Teams will be temporary labels only. No names or answers are collected.</p>
          <button className="primary-button wide-button" disabled={participantCount < 1} onClick={startAdventure} type="button">Start Team Adventure <span aria-hidden="true">→</span></button>
        </section>
      </section>
      <SourceShelf />
    </main>
  );
}

function SourceShelf() {
  return (
    <section className="source-shelf" aria-labelledby="source-shelf-heading">
      <div><p className="eyebrow">Teacher source shelf</p><h2 id="source-shelf-heading">Ground the adventure in <em>good resources.</em></h2></div>
      <div className="shelf-links">
        {[...scriptureSources.slice(0, 2), additionalSources[0]].map((source) => <a key={source.title || source.reference} href={source.url} target="_blank" rel="noreferrer"><span>{source.reference || source.type}</span><strong>{source.title}</strong><span aria-hidden="true">↗</span></a>)}
      </div>
    </section>
  );
}

function AdventureScreen({ lesson, teams, location, currentLocation, progress, revealed, completedLocations, setRevealed, awardAndAdvance, skipLocation, restartCurrentLocation, resetAdventure }) {
  return (
    <main className="game-shell adventure-shell" id="top">
      <BrandBar resetAdventure={resetAdventure} />
      <div className="adventure-header">
        <div><p className="eyebrow">Team Adventure</p><h1>{lesson.title}</h1></div>
        <div className="progress-stat"><strong>{currentLocation + 1} <span>/ {lesson.locations.length}</span></strong><small>locations explored</small></div>
      </div>
      <div className="adventure-progress"><span style={{ width: `${Math.max(8, progress)}%` }} /></div>
      <div className="adventure-layout">
        <aside className="map-panel" aria-label="Adventure map">
          <div className="map-heading"><span>Adventure map</span><small>{progress}% complete</small></div>
          <div className="map-list">
            {lesson.locations.map((mapLocation, index) => <div className={`map-location ${index === currentLocation ? 'current' : ''} ${completedLocations.includes(mapLocation.id) ? 'completed' : ''}`} key={mapLocation.id}><span>{mapLocation.number}</span><div><strong>{mapLocation.name}</strong><small>{mapLocation.objective}</small></div>{completedLocations.includes(mapLocation.id) && <b aria-label="complete">✓</b>}</div>)}
          </div>
          <div className="map-legend"><span><i className="legend-dot current-dot" />current</span><span><i className="legend-dot complete-dot" />complete</span></div>
        </aside>
        <section className="challenge-panel" aria-labelledby="location-heading">
          <div className="challenge-kicker"><span>Location {location.number}</span><span>All teams together</span></div>
          <h2 id="location-heading">{location.name}</h2>
          <p className="objective">Learning objective: <strong>{location.objective}</strong></p>
          <p className="scene-copy">{location.scene}</p>
          <div className="challenge-card"><span className="challenge-label">Team challenge</span><p>{location.prompt}</p><span className="answer-mode">Talk it out · answer with cards or a raised hand</span></div>
          {revealed && <RevealPanel location={location} />}
          <div className="teacher-controls">
            <div className="control-caption"><span className="control-dot" />Teacher controls</div>
            <div className="control-actions">
              {!revealed ? <button className="primary-button" onClick={() => setRevealed(true)} type="button">Reveal principle <span aria-hidden="true">↓</span></button> : <button className="primary-button" onClick={awardAndAdvance} type="button">{currentLocation === lesson.locations.length - 1 ? 'Complete adventure' : 'Award participation & continue'} <span aria-hidden="true">→</span></button>}
              <button className="quiet-button" onClick={skipLocation} type="button">Skip location</button>
              {revealed && <button className="quiet-button" onClick={restartCurrentLocation} type="button">Hide reveal</button>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function RevealPanel({ location }) {
  return <div className="reveal-panel"><div><span className="reveal-label">Principle revealed</span><p>{location.reveal}</p></div><div><span className="reveal-label">Discuss</span><p>{location.discussion}</p></div><a href={location.resource.url} target="_blank" rel="noreferrer">Open {location.resource.label} <span aria-hidden="true">↗</span></a></div>;
}

function CompletionScreen({ teams, reflection, setReflection, resetAdventure }) {
  return (
    <main className="game-shell completion-shell" id="top">
      <BrandBar resetAdventure={resetAdventure} />
      <section className="completion-layout">
        <div className="completion-intro"><p className="eyebrow">Adventure complete</p><h1>The light moves <em>with you.</em></h1><p>You explored five app-created locations and made space for scripture, discussion, and thoughtful choices.</p><div className="team-results">{teams.map((team) => <div key={team.id}><span>{team.label}</span><strong>{team.points}</strong><small>participation</small></div>)}</div></div>
        <div className="closing-panel"><span className="closing-number">05</span><p className="eyebrow">Private reflection</p><h2>One thing I will <em>carry forward.</em></h2><textarea aria-label="Closing reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I will..." rows="4" /><small>Nothing is saved. This reflection is only for the teacher or student at this moment.</small><button className="primary-button wide-button" onClick={resetAdventure} type="button">Return to setup</button></div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
