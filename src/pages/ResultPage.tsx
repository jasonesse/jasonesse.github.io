import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearRecentActivitiesForCity } from "../history/recentActivityHistory";
import {
  deleteHistoryByDate,
  deleteHistoryRecordByIndex,
  getHistoryByDate,
  getHistoryDateKeys,
} from "../history/cookieHistory";
import { useRunStore } from "../state/useRunStore";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function buildCalendarCells(monthDate: Date): Date[] {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const startOffset = start.getDay();
  const totalDays = end.getDate();

  const cells: Date[] = [];

  for (let i = startOffset; i > 0; i--) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 - i));
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (startOffset + totalDays) + 1;
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, nextDay));
  }

  return cells;
}

export function ResultPage() {
  const { run, clearRun } = useRunStore();
  const nav = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const dateKeysWithHistory = useMemo(() => new Set(getHistoryDateKeys()), [refreshKey]);
  const records = useMemo(() => getHistoryByDate(selectedDate), [selectedDate, refreshKey]);
  const cells = useMemo(() => buildCalendarCells(monthDate), [monthDate]);
  const monthLabel = useMemo(
    () => monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [monthDate]
  );

  function toggleItem(recordIndex: number, itemIndex: number) {
    const key = `${selectedDate}-${recordIndex}-${itemIndex}`;
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function goToPreviousMonth() {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleDeleteRecord(index: number) {
    deleteHistoryRecordByIndex(selectedDate, index);
    setRefreshKey((v) => v + 1);
  }

  function handleDeleteDate() {
    deleteHistoryByDate(selectedDate);
    setRefreshKey((v) => v + 1);
  }

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
        <h2>Results And Calendar</h2>
        <p>Pick a highlighted date to see saved scores and kept activities.</p>
      </header>

      <section className="result-calendar">
        <div className="result-calendar__header">
          <button type="button" className="btn btn--secondary" onClick={goToPreviousMonth}>
            Prev
          </button>
          <h3>{monthLabel}</h3>
          <button type="button" className="btn btn--secondary" onClick={goToNextMonth}>
            Next
          </button>
        </div>

        <div className="result-calendar__weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="result-calendar__grid">
          {cells.map((cellDate) => {
            const key = dayKey(cellDate);
            const inMonth = isSameMonth(cellDate, monthDate);
            const isSelected = key === selectedDate;
            const hasData = dateKeysWithHistory.has(key);

            return (
              <button
                key={key}
                type="button"
                className={`result-calendar__day ${inMonth ? "" : "is-outside"} ${isSelected ? "is-selected" : ""} ${hasData ? "has-data" : ""}`}
                onClick={() => setSelectedDate(key)}
                title={hasData ? "Has saved results" : "No saved results"}
              >
                {cellDate.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      <section className="result-page__date-head">
        <h3>{selectedDate}</h3>
        {records.length > 0 && (
          <button className="btn btn--ignore" onClick={handleDeleteDate}>
            Delete All For Date
          </button>
        )}
      </section>

      {records.length === 0 && (
        <p className="result-page__empty">
          No completed runs saved for this date yet.
        </p>
      )}

      {records.map((record, recordIndex) => {
        const total = record.totalActivities ?? record.keptItems.length;
        const kept = record.keptItems.length;

        return (
          <article key={`${record.city}-${record.date}-${recordIndex}`} className="result-record">
            <div className="result-record__head">
              <h3>{record.city}</h3>
              <button
                className="btn btn--ignore"
                onClick={() => handleDeleteRecord(recordIndex)}
              >
                Delete
              </button>
            </div>

            <ul className="result-record__stats">
              <li>
                Mode: <strong>{record.chaosLevel ?? 20}</strong>
              </li>
              <li>
                Activities kept: <strong>{kept}/{total}</strong>
              </li>
            </ul>

            <ul className="result-record__activities">
              {record.keptItems.map((item, itemIndex) => {
                const itemKey = `${selectedDate}-${recordIndex}-${itemIndex}`;
                const shortText = item.shortText?.trim() || item.finalText;
                const hasMore = item.finalText.trim() !== shortText.trim();
                const isOpen = Boolean(expandedItems[itemKey]);

                return (
                  <li key={`${item.id}-${item.timeSlot}-${itemIndex}`}>
                    <p>
                      <strong>{item.timeSlot}:</strong> {shortText}
                    </p>
                    {hasMore && (
                      <div className="result-record__more">
                        <button
                          type="button"
                          className="activity-card__expand"
                          onClick={() => toggleItem(recordIndex, itemIndex)}
                          aria-expanded={isOpen}
                        >
                          <span className={`activity-card__expand-arrow ${isOpen ? "is-open" : ""}`}>
                            ▾
                          </span>
                          {isOpen ? "Hide more" : "More"}
                        </button>
                        {isOpen && <p className="activity-card__long-text">{item.finalText}</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}

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
