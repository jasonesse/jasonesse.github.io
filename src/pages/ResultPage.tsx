import { useNavigate } from "react-router-dom";
import { ScorePanel } from "../components/ScorePanel";
import { useRunStore } from "../state/useRunStore";
import { getEvents } from "../analytics/eventTracker";
import { clearRecentActivitiesForCity } from "../history/recentActivityHistory";

export function ResultPage() {
  const { run, keptIds, isRunCompleted, clearRun } = useRunStore();
  const nav = useNavigate();

  if (!run || !isRunCompleted) {
    return (
      <main className="result-page">
        <header className="result-page__header">
          <h2>No Result Data</h2>
          <p>Complete a run first and your recap will appear here.</p>
        </header>
        <button className="btn btn--primary" onClick={() => nav("/")}>
          Go Home
        </button>
      </main>
    );
  }

  const events = getEvents();
  const rerollCount = events.filter(
    (e) => e.type === "ACTIVITY_REROLLED" && e.data.city === run.city
  ).length;

  function handlePlayAgain() {
    clearRun();
    nav("/");
  }

  function handleStartOver() {
    if (run) {
      clearRecentActivitiesForCity(run.city);
    }
    clearRun();
    nav("/");
  }

  return (
    <main className="result-page result-page--celebrate">
      <header className="result-page__header">
        <h2>Run Complete</h2>
        <p>Your {run.city} plan is locked. Here is your final lineup.</p>
      </header>

      <ScorePanel
        city={run.city}
        chaosLevel={run.chaosLevel}
        keptCount={keptIds.size}
        totalCount={run.activities.length}
        rerollCount={rerollCount}
      />

      <ul className="result-page__activities">
        {run.activities.map((a) => (
          <li
            key={a.timeSlot}
            className={keptIds.has(a.id) ? "kept" : "skipped"}
          >
            <strong>{a.timeSlot}:</strong> {a.finalText}
          </li>
        ))}
      </ul>

      <div className="result-page__actions">
        <button className="btn btn--primary btn--large" onClick={handlePlayAgain}>
          Spin Another Day
        </button>
        <button className="btn btn--secondary btn--large" onClick={handleStartOver}>
          Reset History And Start Fresh
        </button>
      </div>
    </main>
  );
}
