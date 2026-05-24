import type { GeneratedActivity } from "../types";

type Props = {
  activity: GeneratedActivity;
  isKept: boolean;
  onKeep: () => void;
  onReroll: () => void;
  onExplore: () => void;
  onIgnore: () => void;
};

const SLOT_EMOJI: Record<string, string> = {
  morning: "🌅",
  midday: "☀️",
  lunch: "🍽️",
  afternoon: "🏙️",
  evening: "🌆",
};

export function ActivityCard({
  activity,
  isKept,
  onKeep,
  onReroll,
  onExplore,
  onIgnore,
}: Props) {
  return (
    <div className={`activity-card ${isKept ? "activity-card--kept" : ""}`}>
      <div className="activity-card__header">
        <div className="activity-card__header-main">
          <span className="activity-card__slot">
            {SLOT_EMOJI[activity.timeSlot] ?? "📍"} {""}
            {activity.timeSlot.charAt(0).toUpperCase() +
              activity.timeSlot.slice(1)}
          </span>
          <span className="activity-card__category">{activity.category}</span>
        </div>

        <button
          type="button"
          className="activity-card__ignore-icon"
          onClick={onIgnore}
          disabled={isKept}
          aria-label="Ignore this activity for future runs"
          title={
            isKept
              ? "Already kept in this run"
              : "Ignore this activity for future runs"
          }
        >
          🗑️
        </button>
      </div>

      <p className="activity-card__text">{activity.finalText}</p>

      <div className="activity-card__actions">
        <button
          type="button"
          className={`btn btn--keep ${isKept ? "btn--active" : ""}`}
          onClick={onKeep}
          disabled={isKept}
          aria-pressed={isKept}
          title={isKept ? "Already kept in this run" : "Keep this activity"}
        >
          {isKept ? "✓ Kept" : "Keep"}
        </button>
        <button
          type="button"
          className="btn btn--reroll"
          onClick={onReroll}
          disabled={isKept}
          title={
            isKept
              ? "Already kept in this run"
              : "Try a different option for this time slot"
          }
        >
          Reroll
        </button>
        <button
          type="button"
          className="btn btn--explore"
          onClick={onExplore}
          title="Search the web for this activity and city"
        >
          Explore
        </button>
      </div>
    </div>
  );
}
