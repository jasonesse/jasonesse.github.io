import { useMemo, useState } from "react";
import {
  getIgnoredActivitiesByCity,
  getIgnoredCities,
  reactivateIgnoredActivity,
} from "../history/ignoredActivitiesCookie";

export function IgnoredActivitiesPage() {
  const cities = useMemo(() => getIgnoredCities(), []);
  const [selectedCity, setSelectedCity] = useState(cities[0] ?? "");
  const [version, setVersion] = useState(0);

  const ignored = useMemo(() => {
    if (!selectedCity) return [];
    return getIgnoredActivitiesByCity(selectedCity);
  }, [selectedCity, version]);

  function reactivate(id: string) {
    reactivateIgnoredActivity(selectedCity, id);
    setVersion((v) => v + 1);
  }

  return (
    <main className="ignored-page">
      <header className="ignored-page__header">
        <h2>Ignored Activities</h2>
        <p>
          These are saved locally in cookies and will be excluded from future runs
          for the selected city until you reactivate them here.
        </p>
      </header>

      {cities.length === 0 && (
        <p className="ignored-page__empty">No ignored activities saved yet.</p>
      )}

      {cities.length > 0 && (
        <>
          <section className="ignored-page__picker">
            <label htmlFor="ignored-city">City</label>
            <select
              id="ignored-city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </section>

          <section className="ignored-page__list">
            {ignored.length === 0 && (
              <p className="ignored-page__empty">
                No ignored activities for this city.
              </p>
            )}

            {ignored.map((item) => (
              <article key={item.id} className="ignored-card">
                <div>
                  <h3>{item.label}</h3>
                  {item.category && <p>{item.category}</p>}
                </div>
                <button className="btn btn--primary" onClick={() => reactivate(item.id)}>
                  Reactivate
                </button>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
