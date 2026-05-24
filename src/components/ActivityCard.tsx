import type { GeneratedActivity } from "../types";
import { useState } from "react";

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
  const [sponsorsExpanded, setSponsorsExpanded] = useState(false);
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

      <p className="activity-card__text">{activity.shortText}</p>

      {(hasLongDetails || hasSponsored) && (
        <div className="activity-card__details">
          {hasLongDetails && (
            <>
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
                  <p className="activity-card__long-text">{activity.finalText}</p>
                </div>
              )}
            </>
          )}

          {hasSponsored && (
            <>
              <button
                type="button"
                className="activity-card__expand activity-card__expand--sponsors"
                onClick={() => setSponsorsExpanded((v) => !v)}
                aria-expanded={sponsorsExpanded}
              >
                <span className={`activity-card__expand-arrow ${sponsorsExpanded ? "is-open" : ""}`}>
                  ▾
                </span>
                {sponsorsExpanded ? "Hide sponsors" : "Sponsors"}
              </button>

              {sponsorsExpanded && (
                <div className="activity-card__detail-body">
                  {sponsors.map((sponsor, sponsorIndex) => {
                    const hasPromos = Array.isArray(sponsor.promos) && sponsor.promos.length > 0;
                    return (
                      <div className="activity-card__sponsored" key={`${activity.id}-sponsor-${sponsorIndex}`}>
                        <p className="activity-card__sponsored-title">Sponsor {sponsorIndex + 1}</p>
                        {sponsor.name && <p>{sponsor.name}</p>}
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
            </>
          )}
        </div>
      )}

      <div className="activity-card__actions">
        <button
          type="button"
          className={`btn btn--keep ${isKept ? "btn--active" : ""}`}
          onClick={onKeep}
          aria-pressed={isKept}
          title={isKept ? "Return this activity to unkept" : "Keep this activity"}
        >
          {isKept ? "Return" : "Keep"}
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
