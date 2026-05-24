import type { GeneratedActivity } from "../types";
import { useEffect, useRef, useState } from "react";

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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [justKept, setJustKept] = useState(false);
  const previousKept = useRef(isKept);
  const hasLongDetails = activity.finalText.trim() !== activity.shortText.trim();
  const sponsors = activity.sponsors?.length
    ? activity.sponsors
    : activity.sponsored
    ? [activity.sponsored]
    : [];
  const hasSponsored = sponsors.length > 0;

  function formatPromo(promo: unknown): string {
    if (typeof promo === "string") return promo;
    if (promo && typeof promo === "object") {
      const entries = Object.entries(promo as Record<string, unknown>)
        .filter(([, value]) => value != null && `${value}`.trim().length > 0)
        .map(([key, value]) => `${key}: ${String(value)}`);
      return entries.join(" | ");
    }
    return String(promo);
  }

  useEffect(() => {
    let timeout: number | undefined;
    if (!previousKept.current && isKept) {
      setJustKept(true);
      timeout = window.setTimeout(() => setJustKept(false), 720);
    }
    previousKept.current = isKept;
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isKept]);

  return (
    <div className={`activity-card ${isKept ? "activity-card--kept" : ""} ${justKept ? "activity-card--kept-burst" : ""}`}>
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

      <p className="activity-card__text">{activity.shortText}</p>

      {(hasLongDetails || hasSponsored) && (
        <div className="activity-card__details">
          <button
            type="button"
            className="activity-card__expand"
            onClick={() => setDetailsExpanded((v) => !v)}
            aria-expanded={detailsExpanded}
          >
            <span className={`activity-card__expand-arrow ${detailsExpanded ? "is-open" : ""}`}>
              ▾
            </span>
            {detailsExpanded ? "Hide more" : "More"}
          </button>

          {detailsExpanded && (
            <div className="activity-card__detail-body">
              {hasLongDetails && (
                <p className="activity-card__long-text">{activity.finalText}</p>
              )}

              {hasSponsored && (
                <div className="activity-card__sponsors-section">
                  <p className="activity-card__sponsors-heading">Sponsors</p>
                  {sponsors.map((sponsor, sponsorIndex) => {
                    const hasPromos = Array.isArray(sponsor.promos) && sponsor.promos.length > 0;
                    return (
                      <div className="activity-card__sponsored" key={`${activity.id}-sponsor-${sponsorIndex}`}>
                        {sponsor.name && <p className="activity-card__sponsored-name">{sponsor.name}</p>}
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {sponsor.website}
                          </a>
                        )}
                        {hasPromos && (
                          <ul>
                            {sponsor.promos!.map((promo, idx) => (
                              <li key={`${activity.id}-sponsor-${sponsorIndex}-promo-${idx}`}>
                                {formatPromo(promo)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className="btn btn--explore activity-card__explore-inline"
                onClick={onExplore}
                title="Search the web for this activity and city"
              >
                Explore →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="activity-card__actions">
        <button
          type="button"
          className={`btn btn--keep ${isKept ? "btn--active" : ""} ${justKept ? "btn--celebrate" : ""}`}
          onClick={onKeep}
          aria-pressed={isKept}
          title={isKept ? "Undo keeping this activity" : "Keep this activity"}
        >
          {isKept ? "Undo" : "Keep"}
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
      </div>
    </div>
  );
}
