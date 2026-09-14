import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const cohorts = {
  "BTech / MTech / MSc": {
    students: 50,
    total: 672,
    avg: 67,
    readiness: 78,
    critical: 7,
    skills: [
      ["Python", 67], ["SQL", 52], ["React", 43], ["Cloud", 32],
    ],
    roster: [
      { id: "aarav-sen", name: "Aarav Sen", programme: "BTech CSE", readiness: 82, topSkill: "Python", gap: "Cloud", status: "Ready" },
      { id: "mira-das", name: "Mira Das", programme: "MTech AI", readiness: 76, topSkill: "Python", gap: "SQL", status: "On track" },
      { id: "rohan-mehta", name: "Rohan Mehta", programme: "BTech CSE", readiness: 69, topSkill: "React", gap: "Cloud", status: "On track" },
      { id: "sana-khan", name: "Sana Khan", programme: "MSc Data Science", readiness: 61, topSkill: "SQL", gap: "Python", status: "Needs support" },
      { id: "dev-patel", name: "Dev Patel", programme: "BTech IT", readiness: 58, topSkill: "React", gap: "SQL", status: "Needs support" },
      { id: "isha-roy", name: "Isha Roy", programme: "BTech CSE", readiness: 88, topSkill: "Python", gap: "Cloud", status: "Ready" },
    ],
  },
  "MBA / BBA": {
    students: 38,
    total: 311,
    avg: 72,
    readiness: 84,
    critical: 4,
    skills: [
      ["Analytics", 74], ["Communication", 63], ["Excel", 58], ["Strategy", 41],
    ],
    roster: [
      { id: "neha-gupta", name: "Neha Gupta", programme: "MBA Analytics", readiness: 86, topSkill: "Analytics", gap: "Strategy", status: "Ready" },
      { id: "kabir-jain", name: "Kabir Jain", programme: "BBA", readiness: 78, topSkill: "Communication", gap: "Excel", status: "On track" },
      { id: "tanya-bose", name: "Tanya Bose", programme: "MBA Strategy", readiness: 72, topSkill: "Strategy", gap: "Analytics", status: "On track" },
      { id: "arjun-nair", name: "Arjun Nair", programme: "BBA", readiness: 64, topSkill: "Excel", gap: "Communication", status: "Needs support" },
    ],
  },
};

export default function TPOPortal() {
  const [degree, setDegree] = useState("BTech / MTech / MSc");
  const [stream, setStream] = useState("Computer Science");
  const [batch, setBatch] = useState("2026");
  const [view, setView] = useState("absolute");
  const [landscape, setLandscape] = useState("capability");
  const [selectedSkill, setSelectedSkill] = useState("Python");
  const [selectedStudentId, setSelectedStudentId] = useState("aarav-sen");
  const cohort = cohorts[degree];
  const selected = cohort.skills.find(([name]) => name === selectedSkill) || cohort.skills[0];
  const selectedStudent = cohort.roster.find((student) => student.id === selectedStudentId) || cohort.roster[0];
  const landscapeRows = useMemo(() => cohort.skills.slice(0, 3).map(([name, value], index) => ({
    name,
    demand: [92, 78, 65][index],
    capability: value,
  })), [cohort]);

  return (
    <div className="analytics-page">
      <div className="analytics-shell">
        <header className="wire-header">
          <Link to="/portal/professional" className="wire-back">← Account</Link>
          <div><span className="wire-kicker">TPO</span><strong>University of Calcutta</strong></div>
          <span className="wire-year">AY {batch} - {Number(batch) + 1}</span>
        </header>

        <section className="wire-toolbar">
          <span className="toolbar-label">Cohort selector</span>
          <select value={degree} onChange={(event) => { setDegree(event.target.value); setSelectedSkill(cohorts[event.target.value].skills[0][0]); setSelectedStudentId(cohorts[event.target.value].roster[0].id); }}>
            {Object.keys(cohorts).map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={stream} onChange={(event) => setStream(event.target.value)}><option>Computer Science</option><option>Information Systems</option><option>Business Analytics</option></select>
          <select value={batch} onChange={(event) => setBatch(event.target.value)}><option>2026</option><option>2027</option><option>2028</option></select>
        </section>
        <p className="selection-note"><strong>{cohort.students} students selected</strong> out of {cohort.total}</p>

        <WireSectionTitle label="Cohort at a glance" />
        <div className="metric-grid">
          <Metric label="Cohort count" value={cohort.students} />
          <Metric label="Avg skill score" value={cohort.avg} />
          <Metric label="Placement readiness" value={`${cohort.readiness}%`} accent="cyan" />
          <Metric label="Critical count" value={cohort.critical} accent="orange" />
        </div>

        <WireSectionTitle label="Skill landscape" action={<ToggleGroup value={view} onChange={setView} options={[["absolute", "Absolute values"], ["percentage", "Percentage"]]} />} />
        <div className="landscape-grid">
          <div className="wire-panel skill-list-panel">
            <span className="panel-label">Top skills</span>
            <small>% of students equipped with the skill</small>
            {cohort.skills.map(([name, value]) => <button className={`skill-row ${selectedSkill === name ? "selected" : ""}`} key={name} onClick={() => setSelectedSkill(name)}><span>{name}</span><strong>{view === "percentage" ? `${Math.round(value / 100 * cohort.students)}%` : value}<i>›</i></strong></button>)}
            <Link className="small-ghost" to={`/skill/${selected[0].toLowerCase()}`}>View all</Link>
          </div>
          <div className="wire-panel radar-panel">
            <div className="radar-copy"><span>Academics</span><strong>50</strong></div>
            <div className="radar-chart"><span /></div>
            <div className="radar-copy right"><span>Training</span><strong>39</strong></div>
            <div className="radar-copy bottom"><span>Application</span><strong>21</strong></div>
            <div className="radar-copy bottom right"><span>Industry exp.</span><strong>3</strong></div>
          </div>
        </div>

        <WireSectionTitle label="Demand vs capability" action={<ToggleGroup value={landscape} onChange={setLandscape} options={[["demand", "Demand"], ["capability", "Capability"], ["gap", "Gap"]]} />} />
        <div className="wire-panel demand-panel">
          {landscapeRows.map((row) => {
            const value = landscape === "demand" ? row.demand : landscape === "gap" ? row.demand - row.capability : row.capability;
            return <button className="demand-row" key={row.name} onClick={() => setSelectedSkill(row.name)}><span><strong>{row.name}</strong><small>GAP · {row.demand - row.capability}</small></span><i><b style={{ width: `${row.demand}%` }} /><em style={{ width: `${Math.max(value, 8)}%` }} /></i><strong>{value}</strong><span className={row.demand - row.capability > 25 ? "signal bad" : "signal good"}>{row.demand - row.capability > 25 ? "!" : "✓"}</span></button>;
          })}
          <button className="small-ghost view-all">View all</button>
        </div>

        <WireSectionTitle label="Recommendations for TPO" />
        <div className="recommendation-grid">{["Launch a Python readiness sprint", "Prioritise industry projects", "Invite mentors for critical gaps", "Publish a targeted placement clinic"].map((text, index) => <div className="recommendation" key={text}><strong>{index + 1}</strong><p>{text}. Use the selected cohort signals to improve readiness before placement season.</p></div>)}</div>

        <WireSectionTitle label="Student results" />
        <div className="student-results-layout">
          <div className="wire-panel student-results-panel">
            <div className="student-results-heading"><span>Selected cohort students</span><small>Results from verified skill records</small></div>
            <div className="student-results-list">
              {cohort.roster.map((student) => (
                <button className={`student-result-row ${selectedStudent.id === student.id ? "selected" : ""}`} key={student.id} onClick={() => setSelectedStudentId(student.id)}>
                  <span><strong>{student.name}</strong><small>{student.programme}</small></span>
                  <b>{student.readiness}%</b>
                  <em className={`student-status ${student.status.toLowerCase().replace(" ", "-")}`}>{student.status}</em>
                </button>
              ))}
            </div>
          </div>
          <div className="wire-panel student-result-detail">
            <span className="panel-label">Student result</span>
            <h3>{selectedStudent.name}</h3>
            <p>{selectedStudent.programme}</p>
            <strong>{selectedStudent.readiness}%</strong>
            <span>placement readiness</span>
            <div><b>Strongest skill</b><span>{selectedStudent.topSkill}</span></div>
            <div><b>Priority gap</b><span>{selectedStudent.gap}</span></div>
            <em className={`student-status ${selectedStudent.status.toLowerCase().replace(" ", "-")}`}>{selectedStudent.status}</em>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }) { return <div className={`metric ${accent || ""}`}><span>{label}</span><strong>{value}</strong><small>Live demo cohort signal</small></div>; }
function WireSectionTitle({ label, action }) { return <div className="wire-section-title"><h2>{label}</h2>{action}</div>; }
function ToggleGroup({ value, onChange, options }) { return <div className="toggle-group">{options.map(([key, label]) => <button className={value === key ? "active" : ""} key={key} onClick={() => onChange(key)}>{label}</button>)}</div>; }
