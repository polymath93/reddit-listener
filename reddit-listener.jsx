import { useState, useEffect, useRef } from "react";

const REDDIT_ORANGE = "#FF4500";
const BG = "#0a0a0f";
const SURFACE = "#12121a";
const BORDER = "#1e1e2e";
const TEXT = "#e2e2f0";
const MUTED = "#6b6b8a";
const ACCENT = "#7c3aed";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: ${BG};
    color: ${TEXT};
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
  }
  
  .app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 40px;
  }

  .logo {
    width: 40px;
    height: 40px;
    background: ${REDDIT_ORANGE};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .header-text h1 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .header-text p {
    color: ${MUTED};
    font-size: 13px;
    margin-top: 3px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s infinite;
    margin-left: auto;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .status-label {
    font-size: 12px;
    color: #22c55e;
    font-family: 'JetBrains Mono', monospace;
  }

  .grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    align-items: start;
  }

  .panel {
    background: ${SURFACE};
    border: 1px solid ${BORDER};
    border-radius: 16px;
    padding: 20px;
  }

  .panel-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${MUTED};
    margin-bottom: 16px;
  }

  .chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    min-height: 28px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .chip-include {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.3);
    color: #4ade80;
  }

  .chip-exclude {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.25);
    color: #f87171;
  }

  .chip-sub {
    background: rgba(255, 69, 0, 0.1);
    border-color: rgba(255, 69, 0, 0.25);
    color: #fb923c;
  }

  .chip:hover {
    opacity: 0.7;
  }

  .chip-remove {
    font-size: 15px;
    line-height: 1;
    font-weight: 600;
    color: inherit;
    opacity: 0.6;
  }

  .add-input {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  input[type="text"] {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid ${BORDER};
    border-radius: 8px;
    padding: 8px 12px;
    color: ${TEXT};
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="text"]:focus {
    border-color: ${ACCENT};
  }

  input[type="text"]::placeholder {
    color: ${MUTED};
  }

  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add-include {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  .btn-add-include:hover {
    background: rgba(34, 197, 94, 0.35);
  }

  .btn-add-exclude {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .btn-add-exclude:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .btn-run {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: ${REDDIT_ORANGE};
    color: white;
    font-size: 15px;
    font-weight: 800;
    margin-top: 20px;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.5px;
  }

  .btn-run:hover {
    background: #e03d00;
    transform: translateY(-1px);
  }

  .btn-run:active {
    transform: translateY(0);
  }

  .btn-run.loading {
    opacity: 0.7;
    cursor: default;
    transform: none;
  }

  .divider {
    height: 1px;
    background: ${BORDER};
    margin: 18px 0;
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .count-badge {
    background: rgba(124, 58, 237, 0.2);
    color: #a78bfa;
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  .post-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid ${BORDER};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    transition: border-color 0.15s;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .post-card:hover {
    border-color: rgba(124, 58, 237, 0.4);
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 12px;
    color: ${MUTED};
    font-family: 'JetBrains Mono', monospace;
    flex-wrap: wrap;
  }

  .sub-tag {
    color: ${REDDIT_ORANGE};
    font-weight: 600;
  }

  .score-tag {
    color: #a78bfa;
  }

  .post-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 8px;
    color: ${TEXT};
  }

  .post-title a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s;
  }

  .post-title a:hover {
    color: #a78bfa;
  }

  .post-snippet {
    font-size: 13px;
    color: ${MUTED};
    line-height: 1.5;
    margin-bottom: 10px;
    font-family: 'JetBrains Mono', monospace;
  }

  .match-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .match-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(34, 197, 94, 0.1);
    color: #4ade80;
    font-family: 'JetBrains Mono', monospace;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: ${MUTED};
  }

  .empty-state .icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 14px;
    line-height: 1.6;
  }

  .loading-bar {
    height: 2px;
    background: linear-gradient(90deg, transparent, ${REDDIT_ORANGE}, transparent);
    background-size: 200%;
    animation: scan 1.2s linear infinite;
    border-radius: 2px;
    margin-bottom: 20px;
  }

  @keyframes scan {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: ${MUTED};
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .section-title span {
    font-size: 16px;
  }

  .note {
    font-size: 11px;
    color: ${MUTED};
    font-family: 'JetBrains Mono', monospace;
    padding: 8px 10px;
    background: rgba(255,255,255,0.02);
    border-radius: 6px;
    margin-top: 8px;
    border-left: 2px solid ${ACCENT};
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .grid { grid-template-columns: 1fr; }
  }
`;

const MOCK_POSTS = [
  {
    id: "1",
    subreddit: "r/dataengineering",
    title: "How do you handle data quality checks in your pipelines?",
    snippet: "We've been struggling with inconsistent data quality across our ETL pipelines. Looking for recommendations on frameworks that can automate...",
    score: 284,
    comments: 67,
    url: "https://reddit.com",
    matches: ["data quality", "data pipeline"],
    age: "2h"
  },
  {
    id: "2",
    subreddit: "r/MachineLearning",
    title: "Data quality issues are killing our model performance — lessons learned",
    snippet: "After 6 months of debugging, 80% of our model degradation came from upstream data quality problems. Here's what we found...",
    score: 1203,
    comments: 143,
    url: "https://reddit.com",
    matches: ["data quality"],
    age: "5h"
  },
  {
    id: "3",
    subreddit: "r/dataanalysis",
    title: "Best tools for automated data quality monitoring in 2025?",
    snippet: "I'm evaluating Great Expectations vs dbt tests vs Monte Carlo for our data quality monitoring stack. Would love to hear from people who've...",
    score: 89,
    comments: 31,
    url: "https://reddit.com",
    matches: ["data quality", "data monitoring"],
    age: "8h"
  },
  {
    id: "4",
    subreddit: "r/BusinessIntelligence",
    title: "Our stakeholders don't trust our data anymore — data quality crisis",
    snippet: "We've had three major incidents where dashboards showed wrong numbers. The business is losing confidence in the data team...",
    score: 456,
    comments: 98,
    url: "https://reddit.com",
    matches: ["data quality"],
    age: "12h"
  },
];

export default function RedditListener() {
  const [includes, setIncludes] = useState(["data quality", "data pipeline", "data monitoring"]);
  const [excludes, setExcludes] = useState(["cellular", "mobile data", "LTE", "4G", "5G"]);
  const [subreddits, setSubreddits] = useState(["r/dataengineering", "r/MachineLearning", "r/dataanalysis", "r/BusinessIntelligence"]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const addChip = (list, setList, input, setInput) => {
    const val = input.trim();
    if (val && !list.includes(val)) {
      setList([...list, val]);
    }
    setInput("");
  };

  const removeChip = (list, setList, item) => {
    setList(list.filter(i => i !== item));
  };

  const runSearch = () => {
    setLoading(true);
    setHasRun(true);
    setTimeout(() => {
      setResults(MOCK_POSTS);
      setLoading(false);
    }, 1800);
  };

  const handleKeyDown = (e, list, setList, input, setInput) => {
    if (e.key === "Enter") addChip(list, setList, input, setInput);
  };

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <div className="header">
          <div className="logo">👾</div>
          <div className="header-text">
            <h1>Reddit Listener</h1>
            <p>Keyword signal tracker — filters noise, surfaces intent</p>
          </div>
          {hasRun && !loading && (
            <>
              <div className="status-dot" />
              <span className="status-label">LIVE</span>
            </>
          )}
        </div>

        <div className="grid">
          {/* LEFT PANEL */}
          <div>
            <div className="panel">
              <div className="panel-label">Configuration</div>

              <div className="section-title"><span>✅</span> Include keywords</div>
              <div className="chip-group">
                {includes.map(k => (
                  <span key={k} className="chip chip-include" onClick={() => removeChip(includes, setIncludes, k)}>
                    {k} <span className="chip-remove">×</span>
                  </span>
                ))}
              </div>
              <div className="add-input">
                <input
                  type="text"
                  placeholder="add keyword..."
                  value={includeInput}
                  onChange={e => setIncludeInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, includes, setIncludes, includeInput, setIncludeInput)}
                />
                <button className="btn btn-add-include" onClick={() => addChip(includes, setIncludes, includeInput, setIncludeInput)}>+</button>
              </div>

              <div className="divider" />

              <div className="section-title"><span>🚫</span> Exclude keywords</div>
              <div className="chip-group">
                {excludes.map(k => (
                  <span key={k} className="chip chip-exclude" onClick={() => removeChip(excludes, setExcludes, k)}>
                    {k} <span className="chip-remove">×</span>
                  </span>
                ))}
              </div>
              <div className="add-input">
                <input
                  type="text"
                  placeholder="add exclusion..."
                  value={excludeInput}
                  onChange={e => setExcludeInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, excludes, setExcludes, excludeInput, setExcludeInput)}
                />
                <button className="btn btn-add-exclude" onClick={() => addChip(excludes, setExcludes, excludeInput, setExcludeInput)}>+</button>
              </div>

              <div className="divider" />

              <div className="section-title"><span>📡</span> Subreddits</div>
              <div className="chip-group">
                {subreddits.map(k => (
                  <span key={k} className="chip chip-sub" onClick={() => removeChip(subreddits, setSubreddits, k)}>
                    {k} <span className="chip-remove">×</span>
                  </span>
                ))}
              </div>
              <div className="add-input">
                <input
                  type="text"
                  placeholder="r/subreddit"
                  value={subInput}
                  onChange={e => setSubInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, subreddits, setSubreddits, subInput, setSubInput)}
                />
                <button className="btn btn-add-include" onClick={() => addChip(subreddits, setSubreddits, subInput, setSubInput)}>+</button>
              </div>

              <div className="note">
                💡 Click any chip to remove it. Press Enter or + to add. Results use Reddit's public JSON API — no auth needed.
              </div>

              <button
                className={`btn btn-run ${loading ? "loading" : ""}`}
                onClick={runSearch}
                disabled={loading}
              >
                {loading ? "Scanning Reddit..." : "▶ Run Search"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="panel">
            <div className="results-header">
              <div className="panel-label" style={{marginBottom: 0}}>Results</div>
              {results.length > 0 && (
                <span className="count-badge">{results.length} matches</span>
              )}
            </div>

            {loading && <div className="loading-bar" />}

            {!hasRun && !loading && (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <p>Configure your keywords and<br/>hit Run Search to start listening.</p>
              </div>
            )}

            {hasRun && !loading && results.length === 0 && (
              <div className="empty-state">
                <div className="icon">🌐</div>
                <p>No matches found.<br/>Try broadening your keywords.</p>
              </div>
            )}

            {results.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-meta">
                  <span className="sub-tag">{post.subreddit}</span>
                  <span>·</span>
                  <span className="score-tag">▲ {post.score.toLocaleString()}</span>
                  <span>·</span>
                  <span>{post.comments} comments</span>
                  <span>·</span>
                  <span>{post.age} ago</span>
                </div>
                <div className="post-title">
                  <a href={post.url} target="_blank" rel="noopener noreferrer">{post.title}</a>
                </div>
                <div className="post-snippet">{post.snippet}</div>
                <div className="match-chips">
                  {post.matches.map(m => (
                    <span key={m} className="match-chip">✓ {m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
