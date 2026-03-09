"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PALETTE = ["#e85d4a","#f4a228","#3ec9a7","#5b8def","#c975e8","#f06292","#26c6da","#a3d977"];

function getColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

export default function CalendarApp() {
  const now = new Date();
  const [view, setView] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selDay, setSelDay] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", place: "", time: "", description: "" });
  const [formErrors, setFormErrors] = useState({});

  // ── Load events from Supabase ──
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });
    if (err) {
      setError("Could not load events. Check your Supabase connection.");
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Real-time updates: calendar auto-refreshes when anyone submits ──
  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        fetchEvents();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchEvents]);

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  });

  const dayEvents = (day) =>
    monthEvents.filter((e) => new Date(e.date + "T00:00:00").getDate() === day);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.date) e.date = "Required";
    if (!form.place.trim()) e.place = "Required";
    if (!form.time) e.time = "Required";
    if (!form.description.trim()) e.description = "Required";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    setError(null);
    const { error: insertErr } = await supabase.from("events").insert([{
      name: form.name.trim(),
      date: form.date,
      place: form.place.trim(),
      time: form.time,
      description: form.description.trim(),
    }]);
    setSaving(false);
    if (insertErr) {
      setError("Could not save event. Please try again.");
      return;
    }
    const d = new Date(form.date + "T00:00:00");
    setSelMonth(d.getMonth());
    setSelYear(d.getFullYear());
    setForm({ name: "", date: "", place: "", time: "", description: "" });
    setFormErrors({});
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setView("calendar"); }, 2200);
  };

  const prevMonth = () => {
    if (selMonth === 0) { setSelMonth(11); setSelYear((y) => y - 1); }
    else setSelMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selMonth === 11) { setSelMonth(0); setSelYear((y) => y + 1); }
    else setSelMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(selYear, selMonth);
  const firstDay = getFirstDay(selYear, selMonth);
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i);

  // Shared style objects
  const nb = { background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#f0ede8", width: 38, height: 38, borderRadius: 8, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const ss = { background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#f0ede8", padding: "8px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer", outline: "none" };
  const ls = { display: "block", color: "#8b8baa", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 };
  const is = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#12122a", color: "#f0ede8", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "Georgia, serif", color: "#f0ede8", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", borderBottom: "1px solid #2a2a4a", padding: "28px 24px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 26 }}>📅</span>
          <h1 style={{ margin: 0, fontSize: "clamp(22px,5vw,36px)", fontWeight: 400, letterSpacing: "0.04em", color: "#f0ede8", textShadow: "0 2px 20px rgba(94,154,255,0.3)" }}>
            Community Calendar
          </h1>
        </div>
        <p style={{ margin: "0 0 18px", color: "#8b8baa", fontSize: 12, letterSpacing: "0.1em" }}>SUBMIT · BROWSE · DISCOVER</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {["calendar", "form"].map((v) => (
            <button key={v} onClick={() => { setView(v); setSelDay(null); }} style={{ padding: "8px 20px", borderRadius: 24, border: "1px solid", borderColor: view === v ? "#5e9aff" : "#3a3a5c", background: view === v ? "rgba(94,154,255,0.15)" : "transparent", color: view === v ? "#5e9aff" : "#8b8baa", cursor: "pointer", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {v === "calendar" ? "📆 View Calendar" : "✏️ Add Event"}
            </button>
          ))}
        </div>
      </div>

      {/* Global error banner */}
      {error && (
        <div style={{ background: "rgba(232,93,74,0.12)", border: "1px solid #e85d4a", borderRadius: 10, padding: "12px 20px", margin: "20px auto", maxWidth: 600, color: "#e85d4a", fontSize: 13, textAlign: "center" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 14px" }}>

        {/* ── CALENDAR VIEW ── */}
        {view === "calendar" && (
          <div style={{ paddingTop: 28 }}>
            {/* Nav row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <button onClick={prevMonth} style={nb}>‹</button>
              <select value={selMonth} onChange={(e) => setSelMonth(+e.target.value)} style={ss}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selYear} onChange={(e) => setSelYear(+e.target.value)} style={ss}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={nextMonth} style={nb}>›</button>
            </div>

            {/* Calendar grid */}
            <div style={{ background: "#1a1a2e", borderRadius: 14, border: "1px solid #2a2a4a", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#12122a" }}>
                {DAYS.map((d) => (
                  <div key={d} style={{ padding: "12px 4px", textAlign: "center", fontSize: 11, letterSpacing: "0.08em", color: "#5e6a8a" }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} style={{ minHeight: 80, borderRight: "1px solid #1e1e38", borderBottom: "1px solid #1e1e38", background: "#13132a" }} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const devs = dayEvents(day);
                  const isToday = day === now.getDate() && selMonth === now.getMonth() && selYear === now.getFullYear();
                  return (
                    <div key={day}
                      onClick={() => { if (devs.length) { setSelDay(day); setView("day"); } }}
                      style={{ minHeight: 80, borderRight: "1px solid #1e1e38", borderBottom: "1px solid #1e1e38", padding: "6px 5px", background: devs.length ? "rgba(94,154,255,0.04)" : "transparent", cursor: devs.length ? "pointer" : "default", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { if (devs.length) e.currentTarget.style.background = "rgba(94,154,255,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = devs.length ? "rgba(94,154,255,0.04)" : "transparent"; }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "#5e9aff" : "transparent", color: isToday ? "#0f0f13" : "#c8c4d8", fontSize: 13, fontWeight: isToday ? 700 : 400, marginBottom: 3 }}>{day}</div>
                      {devs.slice(0, 2).map((ev) => (
                        <div key={ev.id} style={{ fontSize: 10, padding: "2px 5px", borderRadius: 3, background: `${getColor(ev.name)}22`, borderLeft: `2px solid ${getColor(ev.name)}`, color: "#d4d0e8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.name}
                        </div>
                      ))}
                      {devs.length > 2 && <div style={{ fontSize: 9, color: "#5e6a8a" }}>+{devs.length - 2} more</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event list below calendar */}
            {loading && <p style={{ textAlign: "center", color: "#5e6a8a", marginTop: 40 }}>Loading events…</p>}
            {!loading && monthEvents.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ color: "#8b8baa", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontWeight: 400 }}>
                  {MONTHS[selMonth]} {selYear} — {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""}
                </h3>
                {[...monthEvents].sort((a, b) => new Date(a.date) - new Date(b.date)).map((ev) => (
                  <div key={ev.id} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderLeft: `3px solid ${getColor(ev.name)}`, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ minWidth: 44, textAlign: "center", background: "rgba(94,154,255,0.1)", borderRadius: 8, padding: "6px" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#5e9aff", lineHeight: 1 }}>{new Date(ev.date + "T00:00:00").getDate()}</div>
                      <div style={{ fontSize: 9, color: "#5e6a8a", letterSpacing: "0.06em" }}>{MONTHS[new Date(ev.date + "T00:00:00").getMonth()].slice(0, 3).toUpperCase()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#f0ede8", fontSize: 15, marginBottom: 3 }}>{ev.name}</div>
                      <div style={{ color: "#8b8baa", fontSize: 12, marginBottom: 5 }}>🕐 {ev.time} &nbsp;·&nbsp; 📍 {ev.place}</div>
                      <div style={{ color: "#b0adc4", fontSize: 13, lineHeight: 1.5 }}>{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && monthEvents.length === 0 && !error && (
              <div style={{ textAlign: "center", marginTop: 48, color: "#5e6a8a" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🌙</div>
                <p style={{ fontSize: 14 }}>
                  No events in {MONTHS[selMonth]}.<br />
                  <span style={{ color: "#5e9aff", cursor: "pointer", textDecoration: "underline" }} onClick={() => setView("form")}>
                    Add the first one →
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {view === "day" && selDay !== null && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => { setView("calendar"); setSelDay(null); }} style={{ background: "none", border: "none", color: "#5e9aff", cursor: "pointer", fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
              ← Back to {MONTHS[selMonth]}
            </button>
            <h2 style={{ color: "#f0ede8", fontWeight: 400, marginBottom: 20, fontSize: 22 }}>
              {MONTHS[selMonth]} {selDay}, {selYear}
            </h2>
            {dayEvents(selDay).map((ev) => (
              <div key={ev.id} style={{ background: "#1a1a2e", border: `1px solid ${getColor(ev.name)}44`, borderLeft: `4px solid ${getColor(ev.name)}`, borderRadius: 12, padding: "20px 24px", marginBottom: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#f0ede8", marginBottom: 8 }}>{ev.name}</div>
                <div style={{ color: "#8b8baa", fontSize: 13, marginBottom: 10 }}>🕐 {ev.time} &nbsp;&nbsp; 📍 {ev.place}</div>
                <div style={{ color: "#c4c0d8", fontSize: 14, lineHeight: 1.7 }}>{ev.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── FORM VIEW ── */}
        {view === "form" && (
          <div style={{ paddingTop: 36, maxWidth: 520, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontWeight: 400, fontSize: 24, color: "#f0ede8", marginBottom: 6, letterSpacing: "0.02em" }}>Submit an Event</h2>
            <p style={{ textAlign: "center", color: "#5e6a8a", fontSize: 13, marginBottom: 28 }}>
              Fill out the form below to add your event to the community calendar.
            </p>

            {submitted && (
              <div style={{ background: "rgba(62,201,167,0.12)", border: "1px solid #3ec9a7", borderRadius: 12, padding: "14px 20px", textAlign: "center", color: "#3ec9a7", fontSize: 15, marginBottom: 22 }}>
                ✅ Event added! Heading to calendar…
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { k: "name", l: "Event Name", t: "text", p: "e.g. Annual Fundraiser Gala" },
                { k: "date", l: "Date", t: "date" },
                { k: "place", l: "Location / Place", t: "text", p: "e.g. City Hall, Main Hall" },
                { k: "time", l: "Time", t: "time" },
              ].map((f) => (
                <div key={f.k}>
                  <label style={ls}>{f.l}</label>
                  <input type={f.t} placeholder={f.p || ""} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} style={{ ...is, borderColor: formErrors[f.k] ? "#e85d4a" : "#2a2a4a" }} />
                  {formErrors[f.k] && <span style={{ color: "#e85d4a", fontSize: 11 }}>{formErrors[f.k]}</span>}
                </div>
              ))}
              <div>
                <label style={ls}>Event Description</label>
                <textarea placeholder="Describe the event — what it is, who it's for, what to bring…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} style={{ ...is, resize: "vertical", minHeight: 96, borderColor: formErrors.description ? "#e85d4a" : "#2a2a4a" }} />
                {formErrors.description && <span style={{ color: "#e85d4a", fontSize: 11 }}>{formErrors.description}</span>}
              </div>
              <button onClick={handleSubmit} disabled={saving} style={{ marginTop: 6, padding: "14px 0", borderRadius: 12, background: saving ? "#2a2a4a" : "linear-gradient(135deg,#5e9aff,#3ec9a7)", border: "none", color: saving ? "#8b8baa" : "#0f0f13", fontSize: 15, fontWeight: 700, letterSpacing: "0.05em", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 20px rgba(94,154,255,0.3)" }}>
                {saving ? "SAVING…" : "SUBMIT EVENT →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
