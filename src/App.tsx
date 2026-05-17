import { useState, useEffect, useRef } from "react";
import "./App.css";
import AnalogClock from "./AnalogClock";
import { CityEntry, searchCities, localEntry } from "./timezones";

type View = "DIGITAL" | "ANALOG";

const MAX_CLOCKS = 4;

function formatTime(date: Date, tz?: string) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, ...(tz ? { timeZone: tz } : {}),
  };
  const parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    hours: parseInt(get("hour")),
    minutes: parseInt(get("minute")),
    seconds: parseInt(get("second")),
    h: get("hour"), m: get("minute"), s: get("second"),
    ampm: get("dayPeriod"),
  };
}

function formatDate(date: Date, tz?: string) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short", month: "short", day: "numeric",
    ...(tz ? { timeZone: tz } : {}),
  };
  return new Intl.DateTimeFormat("en-US", opts).format(date).toUpperCase();
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="4.5" stroke="#555" strokeWidth="1.5" />
      <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClockCell({ entry, now, view, onRemove }: {
  entry: CityEntry;
  now: Date;
  view: View;
  onRemove?: () => void;
}) {
  const tz = entry.tz || undefined;
  const time = formatTime(now, tz);
  const date = formatDate(now, tz);

  return (
    <div className="clock-cell">
      <div className="cell-header">
        <span className="cell-city">{entry.city.toUpperCase()}</span>
        {onRemove && (
          <button className="cell-remove" onClick={onRemove} title={`Remove ${entry.city}`} aria-label={`Remove ${entry.city}`}>
            <RemoveIcon />
          </button>
        )}
      </div>

      {view === "DIGITAL" ? (
        <div className="cell-digital">
          <div className="time-row">
            <span className="ghost-digits">~~:~~:~~</span>
            <span className="active-digits">{time.h}:{time.m}:{time.s}</span>
          </div>
          <div className="info-row">
            <span className="ampm">{time.ampm}</span>
            <span className="meta">{date}</span>
          </div>
        </div>
      ) : (
        <div className="cell-analog">
          <div className="analog-face">
            <AnalogClock hours={time.hours} minutes={time.minutes} seconds={time.seconds} />
          </div>
          <div className="analog-label">
            <span className="analog-time">{time.h}:{time.m} {time.ampm}</span>
            <span className="meta">{date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("DIGITAL");
  const [now, setNow] = useState(new Date());
  const [clocks, setClocks] = useState<CityEntry[]>(() => [localEntry()]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const canAdd = clocks.length < MAX_CLOCKS;
  const results = query.trim().length > 0 ? searchCities(query, 8) : [];

  function addClock(c: CityEntry) {
    if (!canAdd) return;
    if (clocks.some((existing) => existing.id === c.id)) {
      // Already in the list; just clear search.
      setQuery("");
      setShowResults(false);
      inputRef.current?.blur();
      return;
    }
    setClocks([...clocks, c]);
    setQuery("");
    setShowResults(false);
    inputRef.current?.blur();
  }

  function removeClock(id: string) {
    setClocks(clocks.filter((c) => c.id !== id));
  }

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="toggle">
          {(["DIGITAL", "ANALOG"] as View[]).map((v) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Clock grid — layout class drives 1 / 2 / 2x2 arrangement */}
      <div className={`grid grid-${Math.min(clocks.length, MAX_CLOCKS)}`}>
        {clocks.map((c, i) => (
          <ClockCell
            key={c.id}
            entry={c}
            now={now}
            view={view}
            onRemove={i === 0 ? undefined : () => removeClock(c.id)}
          />
        ))}
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            ref={inputRef}
            placeholder={canAdd ? "Search a city or region…" : "Maximum 4 clocks — remove one to add another"}
            value={query}
            disabled={!canAdd}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
          />
          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.map((c) => (
                <button key={c.id} onMouseDown={() => addClock(c)}>
                  <span className="city-name">{c.city}</span>
                  <span className="city-region"> — {c.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
