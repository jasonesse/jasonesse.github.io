import { useEffect, useRef, useState } from "react";
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
import { getFallbackCityByKey, loadCityCatalog } from "../cities/cityCatalog";

export function HomePage() {
  const city = useUserStore((s) => s.preferredCity);
  const setPreferredCity = useUserStore((s) => s.setPreferredCity);
  const [cities, setCities] = useState(() => {
    const fallback = getFallbackCityByKey(city);
    return fallback ? [{ key: fallback.key, label: fallback.label }] : [];
  });
  const [chaos, setChaos] = useState(20);
  const [groupDetails, setGroupDetails] = useState<GroupDetails>({
    adults: 2,
    teenagers: 0,
    kids: 0,
  });
  const [loading, setLoading] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const step2Ref = useRef<HTMLElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const setRun = useRunStore((s) => s.setRun);
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;

    loadCityCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setCities(catalog.map((entry) => ({ key: entry.key, label: entry.label })));

        if (catalog.length > 0 && !catalog.some((entry) => entry.key === city)) {
          setPreferredCity(catalog[0].key);
        }
      })
      .catch(() => {
        // Keep fallback catalog only.
      });

    return () => {
      cancelled = true;
    };
  }, [city, setPreferredCity]);

  useEffect(() => {
    const target =
      setupStep >= 3 ? step3Ref.current : setupStep >= 2 ? step2Ref.current : null;
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [setupStep]);

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
      setError("Add at least one traveler to unlock your route.");
      return;
    }
    try {
      const deck = await loadCity(city);
      const ignoredIds = getIgnoredActivityIdsByCity(city);
      const recentIds = getRecentActivityIdsByCity(city, 30);
      const day = generateDay(deck, chaos, groupDetails, ignoredIds, recentIds);
      if (day.activities.length === 0) {
        setError("No matches yet. Try changing chaos or your group mix.");
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
        <h1>Build Your City Run</h1>
        <p>Set your city, tune the vibe, and launch a day that feels tailored.</p>
      </header>

      <CityImage
        city={city}
        className="home-page__city-image"
        alt={`${city} city preview`}
      />

      <section className="home-page__controls">
        <section className="home-step is-visible">
          <p className="home-step__title">Step 1: Pick a city</p>
          <p className="home-step__hint">Choose where today starts.</p>
          <CitySelector
            value={city}
            cities={cities}
            onChange={(nextCity) => {
              setPreferredCity(nextCity);
              setSetupStep((s) => Math.max(s, 2));
            }}
          />
          {setupStep < 2 && (
            <div className="home-step__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSetupStep(2)}
              >
                Next: Set The Vibe
              </button>
            </div>
          )}
        </section>

        {setupStep >= 2 && (
          <section ref={step2Ref} className="home-step is-visible">
            <p className="home-step__title">Step 2: Tune chaos</p>
            <p className="home-step__hint">Low is smooth. High is unpredictable.</p>
            <ChaosSlider value={chaos} onChange={setChaos} />
            {setupStep < 3 && (
              <div className="home-step__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSetupStep(3)}
                >
                  Next: Set Your Group
                </button>
              </div>
            )}
          </section>
        )}

        {setupStep >= 3 && (
          <div ref={step3Ref} className="group-details home-step is-visible">
            <p className="home-step__title">Step 3: Group setup</p>
            <p className="home-step__hint">We filter activities for your crew.</p>
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
        )}
      </section>

      {error && <p className="error-message">{error}</p>}

      {setupStep >= 3 && (
        <button
          className="btn btn--primary btn--large"
          onClick={startRun}
          disabled={loading}
        >
          {loading ? "Crafting Your Route..." : "Generate My Day"}
        </button>
      )}
    </main>
  );
}
