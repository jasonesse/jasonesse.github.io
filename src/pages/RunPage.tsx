import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayTimeline } from "../components/DayTimeline";
import { ControlBar } from "../components/ControlBar";
import { CityImage } from "../components/CityImage";
import { remapActivity } from "../engine/activityMapper";
import { loadCity } from "../engine/cityLoader";
import { useRunStore } from "../state/useRunStore";
import { trackEvent } from "../analytics/eventTracker";
import { saveKeptRunForToday } from "../history/cookieHistory";
import {
  getIgnoredActivityIdsByCity,
  ignoreActivityForCity,
} from "../history/ignoredActivitiesCookie";
import type { GeneratedActivity } from "../types";

export function RunPage() {
  const {
    run,
    keptIds,
    recentActivityIds,
    rerollActivity,
    removeActivityBySlot,
    keepActivity,
    clearRun,
  } = useRunStore();
  const nav = useNavigate();
  const [_rerollCount, setRerollCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!run) {
    return (
      <main className="run-page">
        <header className="run-page__header">
          <h2>No Run Data</h2>
          <p>Generate a day first, then come back here.</p>
        </header>
        <button className="btn btn--primary" onClick={() => nav("/")}>
          Go Home
        </button>
      </main>
    );
  }

  async function handleReroll(activity: GeneratedActivity) {
    if (!run) return;
    try {
      const deck = await loadCity(run.city);
      const ignoredIds = getIgnoredActivityIdsByCity(run.city);
      // Exclude every activity currently in the run so the reroll never
      // produces a duplicate ID (which would break the "keep" highlight).
      const usedIds = Array.from(
        new Set([...run.activities.map((a) => a.id), ...recentActivityIds])
      );
      const updated = remapActivity(
        deck.activityDeck,
        activity.timeSlot,
        usedIds,
        run.chaosLevel,
        run.groupDetails,
        ignoredIds,
        true
      );
      if (updated) {
        rerollActivity(updated);
        setRerollCount((c) => c + 1);
        trackEvent("ACTIVITY_REROLLED", {
          city: run.city,
          chaosLevel: run.chaosLevel,
          activityId: activity.id,
          timeSlot: activity.timeSlot,
        });
      }
    } catch {
      // silently ignore network errors during reroll
    }
  }

  function handleKeep(id: string) {
    keepActivity(id);
    const activity = run?.activities.find((a) => a.id === id);
    if (activity) {
      trackEvent("ACTIVITY_KEPT", {
        city: run?.city,
        chaosLevel: run?.chaosLevel,
        activityId: id,
        timeSlot: activity.timeSlot,
      });
    }
  }

  function handleExplore(activity: GeneratedActivity) {
    trackEvent("ACTIVITY_EXPLORED", {
      city: run?.city,
      activityId: activity.id,
      timeSlot: activity.timeSlot,
    });
    const query = encodeURIComponent(`${activity.finalText} ${run?.city ?? ""}`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  }

  function handleRegenerate() {
    clearRun();
    nav("/");
  }

  async function handleIgnore(activity: GeneratedActivity) {
    if (!run) return;

    ignoreActivityForCity(run.city, {
      id: activity.id,
      label: activity.finalText,
      category: activity.category,
    });
    setToast("Ignored");

    try {
      const deck = await loadCity(run.city);
      const usedIds = run.activities
        .map((a) => a.id)
        .filter((id) => id !== activity.id);
      const excludedIds = Array.from(new Set([...usedIds, ...recentActivityIds]));
      const ignoredIds = getIgnoredActivityIdsByCity(run.city);

      const updated = remapActivity(
        deck.activityDeck,
        activity.timeSlot,
        excludedIds,
        run.chaosLevel,
        run.groupDetails,
        ignoredIds,
        true
      );

      if (updated) {
        rerollActivity(updated);
      } else {
        removeActivityBySlot(activity.timeSlot);
      }
    } catch {
      // Ignore action is already persisted in cookie even if reroll fails.
    }
  }

  function handleComplete() {
    if (run) {
      saveKeptRunForToday(run, keptIds);
    }
    trackEvent("RUN_COMPLETED", {
      city: run?.city,
      chaosLevel: run?.chaosLevel,
    });
    nav("/result");
  }

  return (
    <main className="run-page">
      <h2 className="run-page__title">{run.city} Run</h2>
      <CityImage city={run.city} className="run-page__city-image" alt={`${run.city} city preview`} />

      <DayTimeline
        activities={run.activities}
        keptIds={keptIds}
        onKeep={handleKeep}
        onReroll={handleReroll}
        onExplore={handleExplore}
        onIgnore={handleIgnore}
      />

      <ControlBar
        keptCount={keptIds.size}
        totalCount={run.activities.length}
        onRegenerate={handleRegenerate}
        onComplete={handleComplete}
      />

      {toast && (
        <div className="app-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
