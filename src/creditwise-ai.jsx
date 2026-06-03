import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────
const LOANS = [
  { type: "Personal Loan", icon: "💳", rate: "10.5%", max: "₹5,00,000", color: "#00C2FF" },
  { type: "Home Loan", icon: "🏠", rate: "8.2%", max: "₹75,00,000", color: "#00D26A" },
  { type: "Vehicle Loan", icon: "🚗", rate: "9.0%", max: "₹15,00,000", color: "#FFB020" },
  { type: "Education Loan", icon: "🎓", rate: "7.5%", max: "₹25,00,000", color: "#9B6FFF" },
  { type: "Business Loan", icon: "🏢", rate: "12.0%", max: "₹50,00,000", color: "#FF6B6B" },
];
const ACHIEVEMENTS = [
  { id: 1, icon: "🏆", title: "Perfect Payer", desc: "12 months on-time payments", unlocked: true },
  { id: 2, icon: "💰", title: "Debt-Free Month", desc: "Zero dues cleared", unlocked: true },
  { id: 3, icon: "⭐", title: "Score Climber", desc: "Score improved 50+ pts", unlocked: false },
  { id: 4, icon: "🛡️", title: "Fraud Shield", desc: "No suspicious activity", unlocked: true },
];
const FRAUD_ALERTS = [
  { id: 1, type: "Multiple Loan Requests", severity: "high", time: "2 min ago" },
  { id: 2, type: "Unusual Transaction", severity: "medium", time: "15 min ago" },
  { id: 3, type: "Location Mismatch", severity: "low", time: "1 hr ago" },
];
const RECOMMENDATIONS = [
  { icon: "📉", text: "Reduce credit utilization below 30%", impact: "+25 pts" },
  { icon: "📅", text: "Pay loan EMI on time every month", impact: "+15 pts" },
  { icon: "💵", text: "Increase savings balance by ₹10,000", impact: "+10 pts" },
  { icon: "🚫", text: "Avoid multiple loan applications", impact: "+20 pts" },
];
const paymentHistory = [
  { month: "Jan", score: 680 }, { month: "Feb", score: 695 },
  { month: "Mar", score: 710 }, { month: "Apr", score: 705 },
  { month: "May", score: 728 }, { month: "Jun", score: 742 },
];
const radarData = [
  { subject: "Payment History", A: 85 }, { subject: "Credit Mix", A: 70 },
  { subject: "Utilization", A: 60 }, { subject: "New Credit", A: 75 },
  { subject: "History Length", A: 80 },
];
const pieData = [
  { name: "Housing", value: 35, color: "#00C2FF" },
  { name: "EMIs", value: 25, color: "#FFB020" },
  { name: "Savings", value: 20, color: "#00D26A" },
  { name: "Others", value: 20, color: "#9B6FFF" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function scoreCategory(s) {
  if (s >= 750) return { label: "Excellent", color: "#00D26A", level: 4 };
  if (s >= 650) return { label: "Good", color: "#00C2FF", level: 3 };
  if (s >= 550) return { label: "Fair", color: "#FFB020", level: 2 };
  return { label: "Poor", color: "#FF4D4F", level: 1 };
}
function loanApproval(score, type) {
  const base = { "Personal Loan": 0.7, "Home Loan": 0.6, "Vehicle Loan": 0.75, "Education Loan": 0.8, "Business Loan": 0.55 };
  const factor = ((score - 300) / 600) * (base[type] || 0.65);
  return Math.min(98, Math.round(factor * 100));
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function GaugeMeter({ score }) {
  const cat = scoreCategory(score);
  const pct = ((score - 300) / 600);
  const angle = -130 + pct * 260;
  const r = 90; const cx = 110; const cy = 110;
  const arc = (a) => {
    const rad = (a * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (start, end, color) => {
    const s = arc(start); const e = arc(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const segments = [
    { start: -130 + 0, end: -130 + 65, color: "#FF4D4F" },
    { start: -130 + 65, end: -130 + 130, color: "#FFB020" },
    { start: -130 + 130, end: -130 + 195, color: "#00C2FF" },
    { start: -130 + 195, end: -130 + 260, color: "#00D26A" },
  ];
  const needleX = cx + (r - 15) * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + (r - 15) * Math.sin((angle * Math.PI) / 180);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="220" height="150" viewBox="0 0 220 150">
        {segments.map((seg, i) => (
          <path key={i} d={describeArc(seg.start, seg.end, seg.color)}
            stroke={seg.color} strokeWidth="12" fill="none" strokeLinecap="round" />
        ))}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="7" fill={cat.color} />
        <text x={cx} y={cy + 30} textAnchor="middle" fill={cat.color}
          style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace" }}>{score}</text>
        <text x={cx} y={cy + 50} textAnchor="middle" fill="#888"
          style={{ fontSize: 13 }}>{cat.label}</text>
      </svg>
    </div>
  );
}

function AnimCounter({ target, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── PAGE: LANDING ────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  const features = [
    { icon: "🧠", title: "AI Score Prediction", desc: "ML-powered credit assessment using 50+ factors" },
    { icon: "📊", title: "Risk Analysis", desc: "Real-time risk heatmaps and probability models" },
    { icon: "🔒", title: "Fraud Detection", desc: "Behavioral analytics and anomaly detection" },
    { icon: "💡", title: "Smart Recommendations", desc: "Personalized AI-driven financial advice" },
    { icon: "🏦", title: "Loan Eligibility", desc: "Instant multi-product loan approval checks" },
    { icon: "🎮", title: "Gamification", desc: "Credit health journey with rewards & milestones" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #001233 0%, #002366 50%, #003399 100%)", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #003399, #00C2FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💳</div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>CreditWise <span style={{ color: "#00C2FF" }}>AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onEnter} style={{ background: "transparent", border: "1px solid rgba(0,194,255,0.5)", color: "#00C2FF", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Login</button>
          <button onClick={onEnter} style={{ background: "linear-gradient(135deg, #003399, #00C2FF)", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Get Started →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "4rem 2rem 2rem" }}>
        <div style={{ display: "inline-block", background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#00C2FF", marginBottom: 20 }}>
          🚀 AI-Powered Banking Intelligence
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, margin: "0 0 1rem", lineHeight: 1.2 }}>
          Next-Gen Credit Scoring<br />
          <span style={{ background: "linear-gradient(90deg, #00C2FF, #00D26A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Powered by AI
          </span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, maxWidth: 600, margin: "0 auto 2.5rem" }}>
          Assess creditworthiness in seconds. Make smarter lending decisions with real-time AI analytics, fraud detection, and personalized insights.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onEnter} style={{ background: "linear-gradient(135deg, #003399, #00C2FF)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,194,255,0.3)" }}>
            Check Credit Score →
          </button>
          <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontSize: 16 }}>
            Watch Demo ▶
          </button>
        </div>

        {/* GAUGE PREVIEW */}
        <div style={{ margin: "3rem auto", maxWidth: 300, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "1.5rem", backdropFilter: "blur(10px)" }}>
          <GaugeMeter score={742} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            {[["300-549", "Poor", "#FF4D4F"], ["550-649", "Fair", "#FFB020"], ["650-749", "Good", "#00C2FF"], ["750-900", "Excellent", "#00D26A"]].map(([r, l, c]) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 10px", borderLeft: `3px solid ${c}` }}>
                <div style={{ fontSize: 11, color: c, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{r}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, maxWidth: 700, margin: "0 auto 4rem", textAlign: "center" }}>
          {[["2,50,000+", "Customers Analyzed"], ["1,20,000+", "Loans Approved"], ["748", "Avg Credit Score"], ["87%", "Default Risk Reduced"]].map(([v, l]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.2rem" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00C2FF" }}>{v}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>Everything You Need</h2>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>Comprehensive tools for modern credit assessment</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.4rem", transition: "border-color 0.2s", cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,194,255,0.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "3rem 2rem" }}>
        <button onClick={onEnter} style={{ background: "linear-gradient(135deg, #003399, #00C2FF)", border: "none", color: "#fff", padding: "16px 40px", borderRadius: 12, cursor: "pointer", fontSize: 18, fontWeight: 700 }}>
          Launch Dashboard →
        </button>
      </div>
    </div>
  );
}

// ─── PAGE: AUTH ───────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", income: "", age: "", occupation: "", gender: "Male", employment: "Salaried" });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff", fontSize: 14, boxSizing: "border-box", outline: "none",
  };
  const btnStyle = {
    width: "100%", padding: "12px", borderRadius: 8, border: "none",
    background: "linear-gradient(135deg, #003399, #00C2FF)", color: "#fff",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #001233, #002366)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>CreditWise <span style={{ color: "#00C2FF" }}>AI</span></h1>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2rem", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setStep(1); }}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "rgba(0,194,255,0.2)" : "transparent", color: tab === t ? "#00C2FF" : "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ textAlign: "center", fontSize: 32, marginBottom: 8 }}>🔐</div>
              <input style={inputStyle} placeholder="Email Address" value={form.email} onChange={e => set("email", e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Password" value={form.password} onChange={e => set("password", e.target.value)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <label style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}><input type="checkbox" style={{ marginRight: 6 }} />Remember me</label>
                <span style={{ color: "#00C2FF", cursor: "pointer" }}>Forgot Password?</span>
              </div>
              <button style={btnStyle} onClick={onAuth}>Login to Dashboard →</button>
              <div style={{ textAlign: "center" }}>
                <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  🪪 Face ID Login
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step indicator */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "1.2rem" }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step >= s ? "linear-gradient(135deg, #003399, #00C2FF)" : "rgba(255,255,255,0.1)", color: "#fff" }}>{s}</div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {step === 1 && <>
                  <input style={inputStyle} placeholder="Full Name" value={form.name} onChange={e => set("name", e.target.value)} />
                  <input style={inputStyle} placeholder="Email" value={form.email} onChange={e => set("email", e.target.value)} />
                  <input style={inputStyle} type="password" placeholder="Password" value={form.password} onChange={e => set("password", e.target.value)} />
                  <button style={btnStyle} onClick={() => setStep(2)}>Next →</button>
                </>}
                {step === 2 && <>
                  <input style={inputStyle} placeholder="Age" value={form.age} onChange={e => set("age", e.target.value)} />
                  <select style={inputStyle} value={form.gender} onChange={e => set("gender", e.target.value)}>
                    {["Male", "Female", "Other"].map(g => <option key={g} style={{ background: "#001233" }}>{g}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Occupation" value={form.occupation} onChange={e => set("occupation", e.target.value)} />
                  <button style={btnStyle} onClick={() => setStep(3)}>Next →</button>
                </>}
                {step === 3 && <>
                  <input style={inputStyle} placeholder="Monthly Income (₹)" value={form.income} onChange={e => set("income", e.target.value)} />
                  <select style={inputStyle} value={form.employment} onChange={e => set("employment", e.target.value)}>
                    {["Salaried", "Self-Employed", "Business", "Freelancer"].map(e => <option key={e} style={{ background: "#001233" }}>{e}</option>)}
                  </select>
                  <button style={btnStyle} onClick={onAuth}>Create Account →</button>
                </>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [activeTab, setActiveTab] = useState("overview");
  const [score, setScore] = useState(742);
  const [darkMode] = useState(true);
  const [calcInputs, setCalcInputs] = useState({ income: 75000, debt: 15000, loans: 2, utilization: 35, paymentHistory: 92, stability: 4, historyLength: 5, savings: 50000 });
  const [calcScore, setCalcScore] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const bg = "#001233"; const cardBg = "rgba(255,255,255,0.05)"; const border = "rgba(255,255,255,0.1)";
  const text = "#fff"; const muted = "rgba(255,255,255,0.5)";

  const cat = scoreCategory(score);

  const calcCredit = () => {
    const { income, debt, loans, utilization, paymentHistory, stability, historyLength, savings } = calcInputs;
    const dti = (debt / income) * 100;
    let s = 300;
    s += (paymentHistory / 100) * 200;
    s += Math.max(0, (1 - dti / 60)) * 150;
    s += Math.max(0, (1 - utilization / 100)) * 100;
    s += Math.min(loans, 5) * 10;
    s += (stability / 5) * 80;
    s += Math.min(historyLength / 10, 1) * 70;
    s += Math.min(savings / 200000, 1) * 100;
    setCalcScore(Math.min(900, Math.round(s)));
    setScore(Math.min(900, Math.round(s)));
  };

  const setCI = (k, v) => setCalcInputs(p => ({ ...p, [k]: v }));

  const NAV_TABS = [
    ["overview", "📊", "Overview"],
    ["calculator", "🧮", "AI Calculator"],
    ["loans", "🏦", "Loan Eligibility"],
    ["risk", "⚠️", "Risk Analysis"],
    ["fraud", "🔒", "Fraud Detection"],
    ["recommendations", "💡", "AI Advice"],
    ["gamification", "🎮", "Achievements"],
    ["admin", "👨‍💼", "Admin"],
  ];

  if (page === "landing") return <LandingPage onEnter={() => setPage("auth")} />;
  if (page === "auth") return <AuthPage onAuth={() => setPage("dashboard")} />;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Segoe UI', sans-serif", display: "flex" }}>
      {/* SIDEBAR */}
      <div style={{ width: 220, background: "rgba(0,0,0,0.3)", borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", padding: "1rem 0", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "0 1rem 1.5rem", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #003399, #00C2FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💳</div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>CreditWise <span style={{ color: "#00C2FF" }}>AI</span></span>
          </div>
        </div>
        <div style={{ padding: "1rem 0.5rem", flex: 1 }}>
          {NAV_TABS.map(([id, icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === id ? 600 : 400, background: activeTab === id ? "rgba(0,194,255,0.15)" : "transparent", color: activeTab === id ? "#00C2FF" : muted, marginBottom: 2, textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
        <div style={{ padding: "1rem", borderTop: `1px solid ${border}` }}>
          <button onClick={() => setPage("landing")} style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)", color: "#FF4D4F", width: "100%", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            ← Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Welcome back, Arjun 👋</h1>
              <p style={{ color: muted, margin: "4px 0 0", fontSize: 14 }}>Here's your financial health snapshot</p>
            </div>

            {/* TOP CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
              {[["Credit Score", score, cat.color], ["Income/mo", "₹75K", "#00D26A"], ["Active Loans", "2", "#FFB020"], ["Credit Age", "5 yrs", "#9B6FFF"]].map(([l, v, c]) => (
                <div key={l} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: muted, marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
              {/* GAUGE */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 600 }}>Credit Score</h3>
                <GaugeMeter score={score} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "1rem" }}>
                  {[["Payment History", "92%", "#00D26A"], ["Utilization", "35%", "#00C2FF"], ["Credit Mix", "Good", "#FFB020"], ["Inquiries", "2", "#9B6FFF"]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: muted }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROFILE CARD */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 600 }}>Customer Profile</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.2rem" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #003399, #00C2FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>AK</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Arjun Kumar</div>
                    <div style={{ fontSize: 12, color: "#00C2FF" }}>CW-2024-00742</div>
                  </div>
                </div>
                {[["Employment", "Salaried – IT Sector"], ["Monthly Income", "₹75,000"], ["Existing Loans", "2 Active"], ["Credit History", "5 Years"], ["Credit Cards", "2 Active"], ["Savings Balance", "₹2,50,000"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.05)`, fontSize: 13 }}>
                    <span style={{ color: muted }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {/* Score trend */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.2rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600 }}>Score Trend</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={paymentHistory}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00C2FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[650, 780]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ background: "#001233", border: "1px solid #00C2FF", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="#00C2FF" fill="url(#scoreGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Radar */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.2rem" }}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: 14, fontWeight: 600 }}>Credit Factors</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                    <Radar dataKey="A" stroke="#00C2FF" fill="#00C2FF" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.2rem" }}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: 14, fontWeight: 600 }}>Expense Split</h3>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#001233", border: `1px solid ${border}`, color: "#fff", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pieData.map(d => (
                    <span key={d.name} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                      <span style={{ color: muted }}>{d.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI CALCULATOR */}
        {activeTab === "calculator" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>🧮 AI Credit Score Calculator</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Input your financial details for an AI-powered credit assessment</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1.2rem", fontSize: 15, fontWeight: 600 }}>Financial Inputs</h3>
                {[
                  ["Monthly Income (₹)", "income", 10000, 500000, 5000],
                  ["Existing Debt (₹/mo)", "debt", 0, 200000, 1000],
                  ["Number of Loans", "loans", 0, 10, 1],
                  ["Credit Utilization (%)", "utilization", 0, 100, 1],
                  ["Payment History (%)", "paymentHistory", 0, 100, 1],
                  ["Employment Stability (1-5)", "stability", 1, 5, 1],
                  ["Credit History (years)", "historyLength", 0, 30, 1],
                  ["Savings Balance (₹)", "savings", 0, 1000000, 5000],
                ].map(([label, key, min, max, step]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: muted }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "#00C2FF" }}>{calcInputs[key].toLocaleString()}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={calcInputs[key]}
                      onChange={e => setCI(key, Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00C2FF" }} />
                  </div>
                ))}
                <button onClick={calcCredit} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #003399, #00C2FF)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
                  Calculate Credit Score →
                </button>
              </div>

              {/* RESULT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.5rem", flex: 1 }}>
                  <h3 style={{ margin: "0 0 1.2rem", fontSize: 15, fontWeight: 600 }}>AI Assessment Result</h3>
                  {calcScore ? (
                    <>
                      <GaugeMeter score={calcScore} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                        {[
                          ["Risk Category", scoreCategory(calcScore).label, scoreCategory(calcScore).color],
                          ["Loan Approval", `${Math.round(((calcScore - 300) / 600) * 100)}%`, "#00D26A"],
                          ["Credit Limit", `₹${Math.round(calcInputs.income * 3).toLocaleString()}`, "#00C2FF"],
                          ["EMI Capacity", `₹${Math.round(calcInputs.income * 0.4).toLocaleString()}/mo`, "#FFB020"],
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px" }}>
                            <div style={{ fontSize: 11, color: muted }}>{l}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 13, color: muted, marginBottom: 8 }}>Score breakdown factors</div>
                        {[["Payment History", calcInputs.paymentHistory], ["Low Debt Ratio", Math.max(0, 100 - (calcInputs.debt / calcInputs.income) * 100)], ["Low Utilization", Math.max(0, 100 - calcInputs.utilization)], ["Credit History", (calcInputs.historyLength / 30) * 100]].map(([l, v]) => (
                          <div key={l} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                              <span style={{ color: muted }}>{l}</span>
                              <span>{Math.round(v)}%</span>
                            </div>
                            <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                              <div style={{ height: "100%", width: `${Math.min(100, Math.round(v))}%`, background: "linear-gradient(90deg, #003399, #00C2FF)", borderRadius: 3, transition: "width 1s" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: muted }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                      <div>Adjust the sliders and click Calculate to get your AI credit score assessment</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOAN ELIGIBILITY */}
        {activeTab === "loans" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>🏦 Loan Eligibility</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Based on your credit score of <strong style={{ color: cat.color }}>{score}</strong> — here's your loan eligibility</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {LOANS.map(loan => {
                const approval = loanApproval(score, loan.type);
                return (
                  <div key={loan.type} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                      <span style={{ fontSize: 28 }}>{loan.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{loan.type}</div>
                        <div style={{ fontSize: 12, color: muted }}>Interest: {loan.rate}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: muted }}>Approval Chance</span>
                        <span style={{ color: approval > 70 ? "#00D26A" : approval > 40 ? "#FFB020" : "#FF4D4F", fontWeight: 700 }}>{approval}%</span>
                      </div>
                      <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${approval}%`, background: `linear-gradient(90deg, ${loan.color}, ${loan.color}aa)`, borderRadius: 4, transition: "width 1.2s ease" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: muted }}>Max Eligible</span>
                      <span style={{ fontWeight: 600, color: loan.color }}>{loan.max}</span>
                    </div>
                    <button style={{ width: "100%", marginTop: 12, padding: "9px", borderRadius: 8, border: `1px solid ${loan.color}44`, background: `${loan.color}11`, color: loan.color, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Apply Now →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RISK ANALYSIS */}
        {activeTab === "risk" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>⚠️ Risk Analysis Center</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>AI-powered risk assessment and behavioral analytics</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Overall Risk", "LOW", "#00D26A", "🟢"], ["Default Probability", "3.2%", "#00C2FF", "📊"], ["Risk Score", "87/100", "#00D26A", "✅"]].map(([l, v, c, ic]) => (
                <div key={l} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "1.2rem", textAlign: "center" }}>
                  <div style={{ fontSize: 24 }}>{ic}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c, margin: "6px 0 2px" }}>{v}</div>
                  <div style={{ fontSize: 12, color: muted }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Risk heat map grid */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>Risk Heat Map</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                  {Array.from({ length: 36 }, (_, i) => {
                    const intensity = Math.random();
                    const color = intensity < 0.3 ? "#00D26A" : intensity < 0.6 ? "#FFB020" : "#FF4D4F";
                    return <div key={i} style={{ height: 28, borderRadius: 4, background: color, opacity: 0.3 + intensity * 0.7 }} />;
                  })}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11 }}>
                  {[["Low", "#00D26A"], ["Medium", "#FFB020"], ["High", "#FF4D4F"]].map(([l, c]) => (
                    <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: c, borderRadius: 2, display: "inline-block" }} />
                      <span style={{ color: muted }}>{l}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Distribution chart */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>Risk Categories</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[{ cat: "Low Risk", count: 68 }, { cat: "Med Risk", count: 22 }, { cat: "High Risk", count: 10 }]}>
                    <XAxis dataKey="cat" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#001233", border: `1px solid ${border}`, color: "#fff", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[{ fill: "#00D26A" }, { fill: "#FFB020" }, { fill: "#FF4D4F" }].map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk factors */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>Risk Factor Breakdown</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {[["Debt-to-Income Ratio", 20, "#00D26A"], ["Credit Utilization", 35, "#00C2FF"], ["Payment Consistency", 92, "#00D26A"], ["Loan Concentration", 40, "#FFB020"], ["Employment Stability", 85, "#00D26A"], ["Savings Buffer", 70, "#00C2FF"]].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: muted }}>{l}</span><span style={{ color: c, fontWeight: 600 }}>{v}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${v}%`, background: c, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FRAUD DETECTION */}
        {activeTab === "fraud" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>🔒 Fraud Detection System</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Real-time monitoring for suspicious activities</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Alerts Today", "3", "#FFB020"], ["Blocked Txns", "0", "#00D26A"], ["Risk Score", "Low", "#00D26A"], ["Last Scan", "2 min ago", "#00C2FF"]].map(([l, v, c]) => (
                <div key={l} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: muted }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Alert feed */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>🚨 Live Alert Feed</h3>
                {FRAUD_ALERTS.map(a => (
                  <div key={a.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${a.severity === "high" ? "rgba(255,77,79,0.3)" : a.severity === "medium" ? "rgba(255,176,32,0.3)" : "rgba(0,194,255,0.2)"}`, borderRadius: 10, padding: "12px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{a.type}</span>
                      <span style={{ fontSize: 11, background: a.severity === "high" ? "rgba(255,77,79,0.15)" : a.severity === "medium" ? "rgba(255,176,32,0.15)" : "rgba(0,194,255,0.15)", color: a.severity === "high" ? "#FF4D4F" : a.severity === "medium" ? "#FFB020" : "#00C2FF", padding: "3px 8px", borderRadius: 12, fontWeight: 600, textTransform: "uppercase" }}>{a.severity}</span>
                    </div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{a.time}</div>
                  </div>
                ))}
              </div>

              {/* Monitoring panel */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>Monitoring Status</h3>
                {[["Transaction Monitoring", true], ["Identity Verification", true], ["Multiple Request Detection", true], ["Location Analytics", true], ["Behavioral Analysis", true], ["Dark Web Monitoring", false]].map(([l, active]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 14 }}>{l}</span>
                    <span style={{ fontSize: 12, background: active ? "rgba(0,210,106,0.15)" : "rgba(255,77,79,0.15)", color: active ? "#00D26A" : "#FF4D4F", padding: "3px 10px", borderRadius: 12 }}>{active ? "Active" : "Inactive"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>💡 AI Recommendation Engine</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Personalized insights to improve your credit score</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
              {RECOMMENDATIONS.map((r, i) => (
                <div key={i} style={{ background: cardBg, border: "1px solid rgba(0,194,255,0.2)", borderRadius: 14, padding: "1.4rem", cursor: "default" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{r.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{r.text}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: muted }}>Potential impact:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#00D26A" }}>{r.impact}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Chatbot */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 600 }}>🤖 AI Financial Advisor Chat</h3>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "1rem", minHeight: 120, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #003399, #00C2FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                  <div style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: 13, lineHeight: 1.5 }}>
                    Hello Arjun! Based on your profile, I recommend reducing your credit card utilization from 35% to below 30%. This single change could boost your score by 25 points within 60 days.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Ask me about your credit..." style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none" }} />
                <button style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #003399, #00C2FF)", color: "#fff", cursor: "pointer", fontSize: 16 }}>→</button>
              </div>
            </div>
          </div>
        )}

        {/* GAMIFICATION */}
        {activeTab === "gamification" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>🎮 Credit Health Journey</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Level up your financial health and earn rewards</p>

            {/* LEVEL */}
            <div style={{ background: "linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,51,153,0.2))", border: "1px solid rgba(0,194,255,0.3)", borderRadius: 20, padding: "1.8rem", marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🥇</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00C2FF" }}>Gold Level</div>
              <div style={{ color: muted, fontSize: 14, margin: "6px 0 16px" }}>750 XP • Next: Platinum at 1000 XP</div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 5, maxWidth: 300, margin: "0 auto" }}>
                <div style={{ height: "100%", width: "75%", background: "linear-gradient(90deg, #FFB020, #00C2FF)", borderRadius: 5 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
                {["🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Platinum", "💠 Diamond"].map((l, i) => (
                  <div key={l} style={{ fontSize: 11, color: i <= 2 ? "#00C2FF" : muted, fontWeight: i <= 2 ? 600 : 400 }}>{l}</div>
                ))}
              </div>
            </div>

            {/* ACHIEVEMENTS */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Achievements</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.id} style={{ background: cardBg, border: `1px solid ${a.unlocked ? "rgba(0,194,255,0.3)" : border}`, borderRadius: 14, padding: "1.2rem", opacity: a.unlocked ? 1 : 0.5 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{a.desc}</div>
                  {a.unlocked && <div style={{ fontSize: 11, color: "#00D26A", marginTop: 8, fontWeight: 600 }}>✅ Unlocked</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN */}
        {activeTab === "admin" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: "0.4rem" }}>👨‍💼 Admin Dashboard</h1>
            <p style={{ color: muted, marginBottom: "1.5rem", fontSize: 14 }}>Manage customers, loans, and system analytics</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[["Total Customers", "2,50,419", "#00C2FF"], ["Pending Loans", "342", "#FFB020"], ["Approved Today", "128", "#00D26A"], ["Fraud Alerts", "7", "#FF4D4F"]].map(([l, v, c]) => (
                <div key={l} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: 11, color: muted }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Customer table */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "1.4rem", overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Applications</h3>
                <input placeholder="Search customers..." style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none", width: 200 }} />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Customer", "Score", "Loan Type", "Amount", "Status", "Risk"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: muted, fontWeight: 500, borderBottom: `1px solid ${border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Priya Sharma", 782, "Home Loan", "₹45L", "Approved", "Low"],
                    ["Rahul Mehta", 621, "Personal", "₹3L", "Pending", "Medium"],
                    ["Sneha Patel", 540, "Vehicle", "₹8L", "Review", "High"],
                    ["Vikram Singh", 755, "Business", "₹25L", "Approved", "Low"],
                    ["Kavya Nair", 695, "Education", "₹15L", "Approved", "Low"],
                  ].map(([name, score, type, amt, status, risk]) => (
                    <tr key={name} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <td style={{ padding: "10px 12px" }}>{name}</td>
                      <td style={{ padding: "10px 12px", color: scoreCategory(score).color, fontWeight: 600 }}>{score}</td>
                      <td style={{ padding: "10px 12px", color: muted }}>{type}</td>
                      <td style={{ padding: "10px 12px" }}>{amt}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: status === "Approved" ? "rgba(0,210,106,0.15)" : status === "Pending" ? "rgba(255,176,32,0.15)" : "rgba(255,77,79,0.15)", color: status === "Approved" ? "#00D26A" : status === "Pending" ? "#FFB020" : "#FF4D4F", fontWeight: 600 }}>{status}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, color: risk === "Low" ? "#00D26A" : risk === "Medium" ? "#FFB020" : "#FF4D4F" }}>{risk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
