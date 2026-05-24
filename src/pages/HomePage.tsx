import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitySelector } from "../components/CitySelector";
import { ChaosSlider } from "../components/ChaosSlider";
import { CityImage } from "../components/CityImage";
import { loadCity } from "../engine/cityLoader";
import { generateDay } from "../engine/generateDay";
import { useRunStore } from "../state/useRunStore";
import { useUserStore } from "../state/useUserStore";
import { trackEvent } from "../analytics/eventTracker";
import type { GroupDetails } from "../types";
import { getIgnoredActivityIdsByCity } from "../history/ignoredActivitiesCookie";
import { getRecentActivityIdsByCity } from "../history/recentActivityHistory";

export function HomePage() {
  const city = useUserStore((s) => s.preferredCity);
  const setPreferredCity = useUserStore((s) => s.setPreferredCity);
  const [chaos, setChaos] = useState(20);
  const [groupDetails, setGroupDetails] = useState<GroupDetails>({
    adults: 2,
    teenagers: 0,
    kids: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setRun = useRunStore((s) => s.setRun);
  const nav = useNavigate();

  function setGroupCount(key: keyof GroupDetails, value: string) {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    setGroupDetails((prev) => ({ ...prev, [key]: safe }));
  }

  function adjustGroupCount(key: keyof GroupDetails, delta: number) {
    setGroupDetails((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta);
      return { ...prev, [key]: next };
    });
  }

  async function startRun() {
    setLoading(true);
    setError(null);
    if (groupDetails.adults + groupDetails.teenagers + groupDetails.kids === 0) {
      setLoading(false);
      setError("Add at least one person to your group.");
      return;
    }
    try {
      const deck = await loadCity(city);
      const ignoredIds = getIgnoredActivityIdsByCity(city);
      const recentIds = getRecentActivityIdsByCity(city, 30);
      const day = generateDay(deck, chaos, groupDetails, ignoredIds, recentIds);
      if (day.activities.length === 0) {
        setError("No matching activities for this group setup. Try different counts.");
        setLoading(false);
        return;
      }
      setRun(day);
      trackEvent("RUN_GENERATED", { city, chaosLevel: chaos });
      nav("/run");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load city data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home-page">
      <header className="home-page__header">
        <h1>Plan Your Day</h1>
        <p>Generate a perfect day in your chosen city.</p>
      </header>

      <CityImage
        city={city}
        className="home-page__city-image"
        alt={`${city} city preview`}
      />

      <section className="home-page__controls">
        <CitySelector value={city} onChange={setPreferredCity} />
        <ChaosSlider value={chaos} onChange={setChaos} />
        <div className="group-details">
          <p className="group-details__title">Group Details</p>
          <div className="group-details__grid">
            <label>
              Adults
              <div className="group-spinner">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={groupDetails.adults}
                  onChange={(e) => setGroupCount("adults", e.target.value)}
                />
                <div className="group-spinner__controls">
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("adults", 1)}
                    aria-label="Increase adults"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("adults", -1)}
                    aria-label="Decrease adults"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </label>
            <label>
              Teenagers
              <div className="group-spinner">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={groupDetails.teenagers}
                  onChange={(e) => setGroupCount("teenagers", e.target.value)}
                />
                <div className="group-spinner__controls">
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("teenagers", 1)}
                    aria-label="Increase teenagers"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("teenagers", -1)}
                    aria-label="Decrease teenagers"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </label>
            <label>
              Kids
              <div className="group-spinner">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={groupDetails.kids}
                  onChange={(e) => setGroupCount("kids", e.target.value)}
                />
                <div className="group-spinner__controls">
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("kids", 1)}
                    aria-label="Increase kids"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="group-spinner__btn"
                    onClick={() => adjustGroupCount("kids", -1)}
                    aria-label="Decrease kids"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </label>
          </div>
        </div>
      </section>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn--primary btn--large"
        onClick={startRun}
        disabled={loading}
      >
        {loading ? "Generating…" : "Generate Day"}
      </button>
    </main>
  );
}
