import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";

const CATEGORIES = {
  health: { label: "Health", color: "#22C55E", glow: "rgba(34,197,94,0.35)" },
  fitness: { label: "Fitness", color: "#8B5CF6", glow: "rgba(139,92,246,0.35)" },
  learning: { label: "Learning", color: "#06B6D4", glow: "rgba(6,182,212,0.35)" },
  productivity: { label: "Productivity", color: "#6366F1", glow: "rgba(99,102,241,0.35)" },
  mindfulness: { label: "Mindfulness", color: "#F472B6", glow: "rgba(244,114,182,0.35)" },
  custom: { label: "Custom", color: "#FBBF24", glow: "rgba(251,191,36,0.35)" },
};

const ICONS = {
  health: "+",
  fitness: "↑",
  learning: "□",
  productivity: "✓",
  mindfulness: "○",
  custom: "*",
};

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isToday(d) { const t = new Date(); return dateKey(d) === dateKey(t); }
function startOfMonth(year, month) { return new Date(year, month, 1); }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

function seedHistory(probability, months = 4) {
  const map = {};
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - months);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (Math.random() < probability) map[dateKey(d)] = true;
  }
  return map;
}

const INITIAL_HABITS = [
  { id: "h1", name: "Morning workout", category: "fitness", createdAt: new Date(2026, 1, 3), completions: seedHistory(0.55) },
  { id: "h2", name: "Read 20 pages", category: "learning", createdAt: new Date(2026, 1, 10), completions: seedHistory(0.7) },
  { id: "h3", name: "Meditate", category: "mindfulness", createdAt: new Date(2026, 2, 1), completions: seedHistory(0.4) },
  { id: "h4", name: "Drink 2L water", category: "health", createdAt: new Date(2026, 0, 20), completions: seedHistory(0.65) },
];

function calcStreaks(completions) {
  const dates = Object.keys(completions).filter((k) => completions[k]).sort();
  if (dates.length === 0) return { current: 0, longest: 0, total: 0 };

  const set = new Set(dates);
  let longest = 0, run = 0, prev = null;
  for (const ds of dates) {
    const d = new Date(ds);
    if (prev && (d - prev) / 86400000 === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  let current = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest, total: dates.length };
}

function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, durationMs]);
  return value;
}

function StatCard({ icon, label, value, suffix = "", color, decimals = 0, delay = 0 }) {
  const animated = useCountUp(value);
  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${delay}ms`, "--accent": color }}
    >
      <div className="stat-icon" style={{ background: color + "1f", color }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">
          {animated.toFixed(decimals)}{suffix}
        </div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-glow" style={{ background: color }} />
    </div>
  );
}

function RingProgress({ percent, size = 96, stroke = 8, color = "#8B5CF6" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const animated = useCountUp(percent, 1200);
  const offset = c - (animated / 100) * c;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-stroke"
        />
      </svg>
      <div className="ring-label">{Math.round(animated)}%</div>
    </div>
  );
}

function Confetti({ onDone }) {
  const pieces = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 250,
    rotate: Math.random() * 360,
    color: ["#8B5CF6", "#6366F1", "#22C55E", "#06B6D4", "#FBBF24"][i % 5],
    drift: (Math.random() - 0.5) * 140,
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            "--drift": `${p.drift}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Tooltip({ data, position }) {
  if (!data) return null;
  return (
    <div className="cell-tooltip" style={{ left: position.x, top: position.y }}>
      <div className="tooltip-date">{data.dateLabel}</div>
      <div className="tooltip-habit">{data.habitName}</div>
      <div className={`tooltip-status ${data.done ? "done" : "pending"}`}>
        {data.done ? "Completed" : "Not done"}
      </div>
    </div>
  );
}

function Heatmap({ habit, monthCursor, onToggle, onMilestone }) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const totalDays = daysInMonth(year, month);
  const first = startOfMonth(year, month);
  const leadingBlanks = first.getDay();

  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const catColor = CATEGORIES[habit.category]?.color || "#8B5CF6";

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) cells.push(new Date(year, month, day));

  const monthlyCount = useMemo(() => {
    let n = 0;
    for (let day = 1; day <= totalDays; day++) {
      if (habit.completions[dateKey(new Date(year, month, day))]) n++;
    }
    return n;
  }, [habit.completions, year, month, totalDays]);

  function levelFor(done, density) {
    if (!done) return 0;
    if (density > 0.85) return 4;
    if (density > 0.6) return 3;
    if (density > 0.3) return 2;
    return 1;
  }

  const density = monthlyCount / totalDays;

  function handleClick(d, e) {
    if (!d) return;
    const key = dateKey(d);
    const wasDone = !!habit.completions[key];
    onToggle(habit.id, key);
    if (!wasDone) {
      const { current } = calcStreaks({ ...habit.completions, [key]: true });
      if ([7, 30, 100].includes(current)) onMilestone();
    }
  }

  function handleEnter(d, e) {
    if (!d) return;
    const key = dateKey(d);
    const rect = e.target.getBoundingClientRect();
    const parentRect = e.target.closest(".heatmap-grid").getBoundingClientRect();
    setTooltipPos({ x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top - 10 });
    setTooltip({
      dateLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      habitName: habit.name,
      done: !!habit.completions[key],
    });
  }

  return (
    <div className="heatmap-card">
      <div className="heatmap-card-header">
        <div className="heatmap-card-title">
          <span className="cat-dot" style={{ background: catColor }} />
          <span>{habit.name}</span>
        </div>
        <span className="heatmap-card-count">{monthlyCount}/{totalDays} days</span>
      </div>
      <div className="heatmap-grid" style={{ position: "relative" }}>
        <div className="weekday-row">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="weekday-label">{d}</span>
          ))}
        </div>
        <div className="cells-grid">
          {cells.map((d, idx) => {
            const key = d ? dateKey(d) : `blank-${idx}`;
            const done = d ? !!habit.completions[dateKey(d)] : false;
            const level = levelFor(done, density || 1);
            return (
              <button
                key={key}
                type="button"
                disabled={!d}
                onClick={(e) => handleClick(d, e)}
                onMouseEnter={(e) => handleEnter(d, e)}
                onMouseLeave={() => setTooltip(null)}
                className={`heat-cell level-${level} ${d && isToday(d) ? "is-today" : ""} ${!d ? "blank" : ""}`}
                style={{
                  animationDelay: `${idx * 8}ms`,
                  "--cell-color": catColor,
                }}
                aria-label={d ? `${dateKey(d)} ${done ? "completed" : "not completed"}` : undefined}
              >
                {d ? d.getDate() : ""}
              </button>
            );
          })}
        </div>
        <Tooltip data={tooltip} position={tooltipPos} />
      </div>
      <div className="legend-row">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`legend-swatch level-${l}`} style={{ "--cell-color": catColor }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function ProgressCard({ habit, streaks, percent, onDelete }) {
  const cat = CATEGORIES[habit.category] || CATEGORIES.custom;
  return (
    <div className="progress-card" style={{ "--cat-color": cat.color, "--cat-glow": cat.glow }}>
      <div className="progress-card-beam" />
      <div className="progress-card-top">
        <div className="progress-card-icon" style={{ background: cat.color + "22", color: cat.color }}>
          {ICONS[habit.category] || "*"}
        </div>
        <button className="card-delete" onClick={() => onDelete(habit.id)} aria-label={`Delete ${habit.name}`}>
          ×
        </button>
      </div>
      <div className="progress-card-name">{habit.name}</div>
      <span className="progress-card-badge" style={{ color: cat.color, borderColor: cat.color + "55", background: cat.color + "14" }}>
        {cat.label}
      </span>
      <div className="progress-card-bottom">
        <RingProgress percent={percent} size={72} stroke={6} color={cat.color} />
        <div className="progress-card-stats">
          <div><span className="num">{streaks.current}</span> day streak</div>
          <div className="muted"><span className="num">{streaks.longest}</span> best</div>
        </div>
      </div>
    </div>
  );
}

function CreateHabitPanel({ onCreate }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("health");
  const [open, setOpen] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), category });
    setName("");
    setOpen(false);
  }

  return (
    <div className="create-panel">
      {!open ? (
        <button className="create-trigger" onClick={() => setOpen(true)}>
          <span className="plus">+</span> Add a new habit
        </button>
      ) : (
        <form className="create-form" onSubmit={submit}>
          <input
            autoFocus
            className="create-input"
            placeholder="Habit name, e.g. Drink water"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="cat-picker">
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                type="button"
                key={key}
                className={`cat-chip ${category === key ? "active" : ""}`}
                style={{ "--chip-color": c.color }}
                onClick={() => setCategory(key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="create-actions">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create habit</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function HabitTracker() {
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState(null);

  const triggerConfetti = useCallback(() => {
    setConfetti(true);
    setToast("Milestone reached. Streak unlocked.");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function toggleCompletion(habitId, key) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const completions = { ...h.completions };
        if (completions[key]) delete completions[key];
        else completions[key] = true;
        return { ...h, completions };
      })
    );
  }

  function createHabit({ name, category }) {
    setHabits((prev) => [
      ...prev,
      { id: `h${Date.now()}`, name, category, createdAt: new Date(), completions: {} },
    ]);
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function shiftMonth(delta) {
    setMonthCursor((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  const filtered = useMemo(
    () => (activeCategory === "all" ? habits : habits.filter((h) => h.category === activeCategory)),
    [habits, activeCategory]
  );

  const allStats = useMemo(() => {
    let totalCompletions = 0;
    let bestStreak = 0;
    let currentStreakSum = 0;
    habits.forEach((h) => {
      const s = calcStreaks(h.completions);
      totalCompletions += s.total;
      bestStreak = Math.max(bestStreak, s.longest);
      currentStreakSum += s.current;
    });
    const avgCompletionRate = habits.length
      ? Math.round(
        habits.reduce((acc, h) => {
          const days = Math.max(1, Math.round((new Date() - h.createdAt) / 86400000) + 1);
          return acc + Math.min(1, calcStreaks(h.completions).total / days);
        }, 0) / habits.length * 100
      )
      : 0;
    return { totalHabits: habits.length, totalCompletions, bestStreak, currentStreakSum, avgCompletionRate };
  }, [habits]);

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      <div className="bg-noise" />

      <nav className="navbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span>Streakly</span>
        </div>
        <div className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#progress">Progress</a>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Habit streak heatmap</p>
          <h1 className="hero-title">
            Track habits.<br />
            Build consistency.<br />
            <span className="hero-gradient-text">Become better every day.</span>
          </h1>
          <p className="hero-tagline">Build consistency one day at a time.</p>
          <div className="hero-actions">
            <a href="#dashboard" className="btn-primary btn-lg">Start tracking</a>
            <a href="#progress" className="btn-ghost btn-lg">View progress</a>
          </div>
        </div>
      </header>

      <main className="dashboard" id="dashboard">
        <section className="stats-grid">
          <StatCard icon="🔥" label="Current streak" value={allStats.currentStreakSum} color="#8B5CF6" delay={0} />
          <StatCard icon="🏆" label="Best streak" value={allStats.bestStreak} suffix=" days" color="#22C55E" delay={80} />
          <StatCard icon="✓" label="Total completions" value={allStats.totalCompletions} color="#06B6D4" delay={160} />
          <StatCard icon="◐" label="Completion rate" value={allStats.avgCompletionRate} suffix="%" color="#6366F1" delay={240} />
        </section>

        <section className="panel-row">
          <CreateHabitPanel onCreate={createHabit} />
          <div className="category-filters">
            <button
              className={`filter-chip ${activeCategory === "all" ? "active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                className={`filter-chip ${activeCategory === key ? "active" : ""}`}
                style={{ "--chip-color": c.color }}
                onClick={() => setActiveCategory(key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="heatmap-section">
          <div className="section-header">
            <h2>Monthly heatmap</h2>
            <div className="month-nav">
              <button onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
              <span>{monthLabel}</span>
              <button onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">○</div>
              <p>No habits in this category yet.</p>
              <p className="empty-sub">Add one above to start building a streak.</p>
            </div>
          ) : (
            <div className="heatmap-list">
              {filtered.map((h) => (
                <Heatmap
                  key={h.id}
                  habit={h}
                  monthCursor={monthCursor}
                  onToggle={toggleCompletion}
                  onMilestone={triggerConfetti}
                />
              ))}
            </div>
          )}
        </section>

        <section className="progress-section" id="progress">
          <div className="section-header">
            <h2>Progress cards</h2>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <p>Nothing to show here yet.</p>
            </div>
          ) : (
            <div className="progress-grid">
              {filtered.map((h) => {
                const streaks = calcStreaks(h.completions);
                const days = Math.max(1, Math.round((new Date() - h.createdAt) / 86400000) + 1);
                const percent = Math.min(100, Math.round((streaks.total / days) * 100));
                return (
                  <ProgressCard
                    key={h.id}
                    habit={h}
                    streaks={streaks}
                    percent={percent}
                    onDelete={deleteHabit}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Streakly · build consistency one day at a time</span>
      </footer>

      {confetti && <Confetti onDone={() => setConfetti(false)} />}
      {toast && <div className="toast">{toast}</div>}

      <style>{`
        * { box-sizing: border-box; }
        :root {
          --bg: #0B0F19;
          --card: rgba(255,255,255,0.05);
          --border: rgba(255,255,255,0.08);
          --primary: #8B5CF6;
          --primary-2: #6366F1;
          --success: #22C55E;
          --accent: #06B6D4;
          --text: #FFFFFF;
          --text-muted: #A1A1AA;
        }
        .app-shell {
          position: relative;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
          isolation: isolate;
        }
        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          z-index: 0;
          pointer-events: none;
          animation: float 18s ease-in-out infinite;
        }
        .orb-1 { width: 480px; height: 480px; background: radial-gradient(circle, var(--primary), transparent 70%); top: -120px; left: -80px; }
        .orb-2 { width: 420px; height: 420px; background: radial-gradient(circle, var(--accent), transparent 70%); top: 30%; right: -120px; animation-delay: -6s; }
        .orb-3 { width: 380px; height: 380px; background: radial-gradient(circle, var(--primary-2), transparent 70%); bottom: -100px; left: 30%; animation-delay: -12s; }
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,-40px) scale(1.08); }
        }
        .bg-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04), transparent 60%);
        }

        .navbar {
          position: relative; z-index: 5;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 48px;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
        .brand-mark { color: var(--primary); font-size: 16px; }
        .nav-links { display: flex; gap: 28px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; transition: color 0.2s ease; }
        .nav-links a:hover { color: var(--text); }

        .hero {
          position: relative; z-index: 2;
          padding: 96px 48px 64px;
          text-align: center;
          max-width: 880px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-block;
          font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--accent);
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.25);
          padding: 6px 16px; border-radius: 999px;
          margin-bottom: 28px;
          animation: fadeSlideUp 0.6s ease both;
        }
        .hero-title {
          font-size: clamp(2.2rem, 5vw, 3.6rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
          animation: fadeSlideUp 0.6s ease 0.08s both;
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, var(--primary), var(--primary-2), var(--accent));
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: gradientShift 6s ease infinite;
        }
        @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .hero-tagline { color: var(--text-muted); font-size: 17px; margin-bottom: 36px; animation: fadeSlideUp 0.6s ease 0.16s both; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; animation: fadeSlideUp 0.6s ease 0.24s both; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .btn-primary, .btn-ghost {
          border-radius: 14px; padding: 12px 24px; font-size: 14px; font-weight: 600;
          cursor: pointer; border: none; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease;
          text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          color: white;
          box-shadow: 0 8px 24px -8px rgba(139,92,246,0.6);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -8px rgba(139,92,246,0.75); }
        .btn-ghost { background: var(--card); border: 1px solid var(--border); color: var(--text); }
        .btn-ghost:hover { background: rgba(255,255,255,0.09); transform: translateY(-2px); }
        .btn-lg { padding: 14px 28px; font-size: 15px; }

        .dashboard { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 0 32px 80px; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 40px; }
        .stat-card {
          position: relative; overflow: hidden;
          background: var(--card); border: 1px solid var(--border); border-radius: 20px;
          padding: 20px; display: flex; align-items: center; gap: 14px;
          backdrop-filter: blur(10px);
          animation: fadeSlideUp 0.5s ease both;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .stat-card:hover { transform: translateY(-4px); border-color: var(--accent); }
        .stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .stat-label { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
        .stat-glow { position: absolute; width: 80px; height: 80px; right: -30px; top: -30px; border-radius: 50%; filter: blur(40px); opacity: 0.25; }

        .panel-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; margin-bottom: 44px; }
        .create-panel { flex-shrink: 0; }
        .create-trigger {
          background: var(--card); border: 1px dashed var(--border); color: var(--text);
          border-radius: 16px; padding: 14px 22px; font-size: 14px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .create-trigger:hover { border-color: var(--primary); background: rgba(139,92,246,0.08); }
        .plus { color: var(--primary); font-size: 16px; }
        .create-form {
          background: var(--card); border: 1px solid var(--border); border-radius: 18px;
          padding: 18px; display: flex; flex-direction: column; gap: 14px; min-width: 320px;
          animation: fadeSlideUp 0.3s ease both;
        }
        .create-input {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text);
          border-radius: 12px; padding: 11px 14px; font-size: 14px; outline: none;
          transition: border-color 0.2s ease;
        }
        .create-input:focus { border-color: var(--primary); }
        .cat-picker { display: flex; flex-wrap: wrap; gap: 8px; }
        .cat-chip {
          border: 1px solid var(--border); background: transparent; color: var(--text-muted);
          border-radius: 999px; padding: 6px 13px; font-size: 12.5px; cursor: pointer;
          transition: all 0.18s ease;
        }
        .cat-chip.active { background: color-mix(in srgb, var(--chip-color) 22%, transparent); border-color: var(--chip-color); color: var(--chip-color); }
        .create-actions { display: flex; gap: 10px; justify-content: flex-end; }

        .category-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; flex: 1; }
        .filter-chip {
          border: 1px solid var(--border); background: var(--card); color: var(--text-muted);
          border-radius: 999px; padding: 9px 16px; font-size: 13px; cursor: pointer;
          transition: all 0.18s ease;
        }
        .filter-chip:hover { color: var(--text); }
        .filter-chip.active { background: color-mix(in srgb, var(--chip-color, var(--primary)) 20%, transparent); border-color: var(--chip-color, var(--primary)); color: var(--chip-color, var(--primary)); }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-header h2 { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
        .month-nav { display: flex; align-items: center; gap: 14px; font-size: 13.5px; color: var(--text-muted); }
        .month-nav button {
          background: var(--card); border: 1px solid var(--border); color: var(--text);
          width: 30px; height: 30px; border-radius: 8px; cursor: pointer; font-size: 16px;
          transition: background 0.18s ease;
        }
        .month-nav button:hover { background: rgba(255,255,255,0.1); }

        .heatmap-section { margin-bottom: 48px; }
        .heatmap-list { display: flex; flex-direction: column; gap: 16px; }
        .heatmap-card {
          background: var(--card); border: 1px solid var(--border); border-radius: 20px;
          padding: 20px 22px; backdrop-filter: blur(10px);
        }
        .heatmap-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .heatmap-card-title { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 14.5px; }
        .cat-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .heatmap-card-count { font-size: 12.5px; color: var(--text-muted); font-family: 'SF Mono', 'Roboto Mono', monospace; }

        .weekday-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
        .weekday-label { font-size: 10.5px; color: var(--text-muted); text-align: center; }
        .cells-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
        .heat-cell {
          aspect-ratio: 1; border-radius: 7px; border: 1px solid var(--border);
          background: rgba(255,255,255,0.03);
          font-size: 10px; color: rgba(255,255,255,0.4);
          cursor: pointer; position: relative;
          display: flex; align-items: flex-end; justify-content: flex-end; padding: 3px;
          transition: transform 0.15s ease, border-color 0.2s ease;
          animation: cellPop 0.4s ease both;
        }
        @keyframes cellPop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        .heat-cell.blank { visibility: hidden; cursor: default; }
        .heat-cell:not(.blank):hover { transform: scale(1.15); border-color: var(--cell-color); z-index: 2; }
        .heat-cell:active:not(.blank) { transform: scale(0.92); }
        .heat-cell.is-today { box-shadow: 0 0 0 1.5px var(--cell-color); }
        .heat-cell.level-1 { background: color-mix(in srgb, var(--cell-color) 22%, #0B0F19); color: rgba(255,255,255,0.6); }
        .heat-cell.level-2 { background: color-mix(in srgb, var(--cell-color) 45%, #0B0F19); color: rgba(255,255,255,0.8); }
        .heat-cell.level-3 { background: color-mix(in srgb, var(--cell-color) 70%, #0B0F19); color: white; }
        .heat-cell.level-4 { background: var(--cell-color); color: white; box-shadow: 0 0 14px -2px var(--cell-color); }

        .cell-tooltip {
          position: absolute; transform: translate(-50%, -100%);
          background: #15192A; border: 1px solid var(--border); border-radius: 10px;
          padding: 8px 12px; font-size: 11.5px; white-space: nowrap; pointer-events: none;
          z-index: 10; box-shadow: 0 8px 20px -6px rgba(0,0,0,0.5);
          animation: fadeSlideUp 0.15s ease both;
        }
        .tooltip-date { color: var(--text-muted); font-family: 'SF Mono', 'Roboto Mono', monospace; font-size: 10.5px; }
        .tooltip-habit { font-weight: 600; margin: 2px 0; }
        .tooltip-status.done { color: var(--success); }
        .tooltip-status.pending { color: var(--text-muted); }

        .legend-row { display: flex; align-items: center; gap: 6px; justify-content: flex-end; margin-top: 14px; font-size: 11px; color: var(--text-muted); }
        .legend-swatch { width: 12px; height: 12px; border-radius: 4px; border: 1px solid var(--border); }
        .legend-swatch.level-0 { background: rgba(255,255,255,0.03); }
        .legend-swatch.level-1 { background: color-mix(in srgb, var(--cell-color) 22%, #0B0F19); }
        .legend-swatch.level-2 { background: color-mix(in srgb, var(--cell-color) 45%, #0B0F19); }
        .legend-swatch.level-3 { background: color-mix(in srgb, var(--cell-color) 70%, #0B0F19); }
        .legend-swatch.level-4 { background: var(--cell-color); }

        .progress-section { margin-bottom: 24px; }
        .progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
        .progress-card {
          position: relative; overflow: hidden;
          background: var(--card); border: 1px solid var(--border); border-radius: 20px;
          padding: 20px; backdrop-filter: blur(10px);
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .progress-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--cat-color) 50%, var(--border));
          box-shadow: 0 16px 36px -16px var(--cat-glow);
        }
        .progress-card-beam {
          position: absolute; inset: -1px; border-radius: 20px; padding: 1px;
          background: linear-gradient(120deg, transparent 30%, var(--cat-color), transparent 70%);
          opacity: 0; transition: opacity 0.3s ease;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none;
        }
        .progress-card:hover .progress-card-beam { opacity: 1; }
        .progress-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .progress-card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .card-delete {
          background: transparent; border: none; color: var(--text-muted); font-size: 18px;
          cursor: pointer; line-height: 1; padding: 2px 6px; border-radius: 6px;
          transition: color 0.18s ease, background 0.18s ease;
        }
        .card-delete:hover { color: #F87171; background: rgba(248,113,113,0.1); }
        .progress-card-name { font-weight: 700; font-size: 15.5px; margin-bottom: 8px; }
        .progress-card-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; border: 1px solid; display: inline-block; margin-bottom: 18px; }
        .progress-card-bottom { display: flex; align-items: center; gap: 16px; }
        .ring-wrap { position: relative; flex-shrink: 0; }
        .ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
        .ring-stroke { transition: stroke-dashoffset 0.3s ease; }
        .progress-card-stats { font-size: 13px; }
        .progress-card-stats .num { font-weight: 700; font-size: 15px; }
        .progress-card-stats .muted { color: var(--text-muted); margin-top: 4px; }

        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
        .empty-icon { font-size: 30px; margin-bottom: 12px; color: var(--primary); }
        .empty-sub { font-size: 13px; margin-top: 4px; }

        .footer { position: relative; z-index: 2; text-align: center; padding: 28px; color: var(--text-muted); font-size: 12.5px; border-top: 1px solid var(--border); }

        .confetti-layer { position: fixed; inset: 0; z-index: 50; pointer-events: none; overflow: hidden; }
        .confetti-piece {
          position: absolute; top: -10px; width: 8px; height: 14px; opacity: 0.9;
          animation: confettiFall 1.6s cubic-bezier(.2,.6,.3,1) forwards;
        }
        @keyframes confettiFall {
          to { top: 100%; transform: translateX(var(--drift)) rotate(540deg); opacity: 0; }
        }

        .toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          background: #15192A; border: 1px solid var(--border); color: var(--text);
          padding: 13px 22px; border-radius: 14px; font-size: 13.5px; z-index: 60;
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.6);
          animation: toastIn 0.35s ease both;
        }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }

        @media (max-width: 860px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .navbar { padding: 18px 22px; }
          .hero { padding: 64px 22px 44px; }
          .dashboard { padding: 0 18px 60px; }
          .panel-row { flex-direction: column; }
          .progress-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
          .cells-grid { gap: 4px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .hero-actions { flex-direction: column; }
          .heatmap-card { padding: 16px 14px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
