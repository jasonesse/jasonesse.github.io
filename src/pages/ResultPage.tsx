import { useNavigate } from "react-router-dom";
import { ScorePanel } from "../components/ScorePanel";
import { useRunStore } from "../state/useRunStore";
import { getEvents } from "../analytics/eventTracker";
import { clearRecentActivitiesForCity } from "../history/recentActivityHistory";

export function ResultPage() {
  const { run, keptIds, clearRun } = useRunStore();
  const nav = useNavigate();

  if (!run) {
    nav("/");
    return null;
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
    <main className="result-page">
      <header className="result-page__header">
        <h2>Run Complete!</h2>
        <p>Here's how your day looked in {run.city}.</p>
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
          Play Again
        </button>
        <button className="btn btn--secondary btn--large" onClick={handleStartOver}>
          Start Over (Clear Cache)
        </button>
      </div>
    </main>
  );
}
