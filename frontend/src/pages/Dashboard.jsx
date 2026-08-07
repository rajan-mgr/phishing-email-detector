import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { scanEmails, getStats, getHistory } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MetricCard from "../components/MetricCard";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Phishing First", value: "phishing" },
  { label: "Safe First", value: "safe" },
];

const SCAN_STEPS = [
  "Connecting to inbox...",
  "Fetching emails...",
  "Running ML analysis...",
  "Checking URLs...",
  "Finalizing results...",
];

function sortEmails(emails, sortBy) {
  const sorted = [...emails];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at));
    case "oldest":
      return sorted.sort((a, b) => new Date(a.scanned_at) - new Date(b.scanned_at));
    case "phishing":
      return sorted.sort((a) => (a.verdict === "phishing" ? -1 : 1));
    case "safe":
      return sorted.sort((a) => (a.verdict === "legitimate" ? -1 : 1));
    default:
      return sorted;
  }
}

export default function Dashboard() {
  const { autoScan } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [error, setError] = useState(null);
  const [activeSort, setActiveSort] = useState("newest");
  const progressInterval = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoScan && recentEmails.length === 0) {
      handleScan();
    }
  }, []);

  async function loadData() {
    try {
      const [statsRes, historyRes] = await Promise.all([
        getStats(0).catch(() => ({ data: null })),
        getHistory(0).catch(() => ({ data: { results: [] } })),
      ]);
      setStats(statsRes.data);
      setRecentEmails(historyRes.data.results?.slice(0, 50) || []);
    } catch {
      setError("Failed to load data");
    }
  }

  function startProgressSimulation() {
    setScanProgress(0);
    setScanStep(SCAN_STEPS[0]);
    let step = 0;
    let progress = 0;

    progressInterval.current = setInterval(() => {
      progress += Math.random() * 6 + 2;

      const stepIndex = Math.min(
        Math.floor((progress / 100) * SCAN_STEPS.length),
        SCAN_STEPS.length - 1
      );
      if (stepIndex !== step) {
        step = stepIndex;
        setScanStep(SCAN_STEPS[step]);
      }

      if (progress >= 90) {
        clearInterval(progressInterval.current);
        setScanProgress(90);
        return;
      }
      setScanProgress(Math.min(progress, 90));
    }, 400);
  }

  function finishProgress() {
    clearInterval(progressInterval.current);
    setScanStep("Done!");
    setScanProgress(100);
    setTimeout(() => {
      setScanning(false);
      setScanProgress(0);
      setScanStep("");
    }, 800);
  }

  async function handleScan() {
    setScanning(true);
    setError(null);
    startProgressSimulation();

    try {
      const res = await scanEmails();
      setStats((prev) => ({
        ...prev,
        total_scanned: (prev?.total_scanned || 0) + res.data.total_scanned,
        phishing_count: (prev?.phishing_count || 0) + res.data.phishing_count,
        legitimate_count: (prev?.legitimate_count || 0) + res.data.legitimate_count,
      }));
      setRecentEmails((prev) =>
        [...(res.data.results || res.data.emails || []), ...prev].slice(0, 50)
      );
      finishProgress();
    } catch {
      clearInterval(progressInterval.current);
      setScanning(false);
      setScanProgress(0);
      setScanStep("");
      setError("Scan failed. Please try again.");
    }
  }

  const phishingRate = stats?.total_scanned
    ? ((stats.phishing_count / stats.total_scanned) * 100).toFixed(1)
    : "0";

  const displayedEmails = sortEmails(recentEmails, activeSort);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="text-[24px] md:text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-on-surface flex items-center gap-3">
            Dashboard
          </h2>
          <p className="text-[16px] leading-[1.5] text-on-surface-variant mt-1">
            Monitor your inbox security and scan results.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="bg-gradient-to-r from-secondary-container to-primary-container text-on-primary-container text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] px-6 py-2 rounded-lg hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-sm ${scanning ? "animate-spin" : ""}`}>
            {scanning ? "sync" : "radar"}
          </span>
          {scanning ? "Scanning..." : "Scan Inbox"}
        </button>
      </div>

      {/* Scan Progress Bar */}
      {scanning && (
        <div className="glass-panel rounded-xl p-4 mb-6 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-primary">
              {scanStep}
            </span>
            <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
              {Math.round(scanProgress)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary-container to-primary-container transition-all duration-500 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-6 text-[14px]">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Scanned"
          value={stats?.total_scanned || 0}
          icon="mail"
          type="default"
        />
        <MetricCard
          title="Phishing Detected"
          value={stats?.phishing_count || 0}
          icon="gpp_bad"
          type="danger"
        />
        <MetricCard
          title="Legitimate"
          value={stats?.legitimate_count || 0}
          icon="verified_user"
          type="success"
        />
        <MetricCard
          title="Phishing Rate"
          value={`${phishingRate}%`}
          icon="percent"
          type="warning"
        />
      </div>

      {/* Top Phishing Domains */}
      {stats?.top_phishing_domains?.length > 0 && (
        <div className="glass-panel rounded-xl p-6 mb-8">
          <h2 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-4">
            Top Phishing Domains
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.top_phishing_domains.map(({ domain, count }, i) => (
              <div
                key={domain}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant w-6">
                    #{i + 1}
                  </span>
                  <span className="text-[14px] leading-[1.5] text-on-surface truncate max-w-[180px]">
                    {domain}
                  </span>
                </div>
                <span className="bg-error/10 border border-error/30 text-error px-2 py-0.5 rounded text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface">
              Recent Scans
            </h2>
            <span className="bg-surface-container-high border border-outline-variant/50 text-on-surface-variant text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] px-2 py-1 rounded-full">
              {recentEmails.length} emails
            </span>
          </div>

          {/* Sort Controls */}
          {recentEmails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveSort(opt.value)}
                  className={`px-3 py-1 rounded-full text-[11px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] transition-colors ${
                    activeSort === opt.value
                      ? "border border-primary text-primary bg-primary/10"
                      : "border border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {recentEmails.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-outline">
                inbox
              </span>
            </div>
            <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-2">
              No emails scanned yet
            </h3>
            <p className="text-[16px] leading-[1.5] text-on-surface-variant max-w-md">
              Click "Scan Inbox" to scan your emails for phishing threats.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container-low/50">
                  <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Subject</th>
                  <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Sender</th>
                  <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Verdict</th>
                  <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Confidence</th>
                  <th
                    className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant text-right cursor-pointer hover:text-on-surface select-none"
                    onClick={() => setActiveSort(activeSort === "newest" ? "oldest" : "newest")}
                  >
                    Date
                    <span className="ml-1 text-[10px]">
                      {activeSort === "oldest" ? "↑" : "↓"}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {displayedEmails.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() => navigate(`/email/${email.id}`)}
                    className="hover:bg-surface-variant/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-[14px] leading-[1.5] text-on-surface truncate max-w-[250px]">
                      {email.subject || "(no subject)"}
                    </td>
                    <td className="p-4 text-[14px] leading-[1.5] text-on-surface">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs">
                          {(email.sender?.[0] || "U").toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px]">{email.sender}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] ${
                          email.verdict === "phishing"
                            ? "bg-error/10 border border-error/50 text-error pulse-threat"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {email.verdict === "phishing" ? "warning" : "check_circle"}
                        </span>
                        {email.verdict === "phishing" ? "Phishing" : "Safe"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] ${
                            email.verdict === "phishing" ? "text-error" : "text-emerald-400"
                          }`}
                        >
                          {(email.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${email.verdict === "phishing" ? "bg-error" : "bg-emerald-400"}`}
                            style={{ width: `${email.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[14px] leading-[1.5] text-on-surface-variant text-right whitespace-nowrap">
                      {new Date(email.scanned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}