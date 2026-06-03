import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scanEmails, getStats, getHistory } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MetricCard from "../components/MetricCard";

const TIME_FILTERS = [
  { label: "10 Days", days: 10 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "All Time", days: 0 },
];

export default function Dashboard() {
  const { autoScan } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(3);

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  useEffect(() => {
    if (autoScan && recentEmails.length === 0) {
      handleScan();
    }
  }, []);

  async function loadData() {
    try {
      const days = TIME_FILTERS[activeFilter].days;
      const [statsRes, historyRes] = await Promise.all([
        getStats(days).catch(() => ({ data: null })),
        getHistory(days).catch(() => ({ data: { results: [] } })),
      ]);
      setStats(statsRes.data);
      setRecentEmails(historyRes.data.results?.slice(0, 10) || []);
    } catch {
      setError("Failed to load data");
    }
  }

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await scanEmails();
      setStats((prev) => ({
        ...prev,
        total_scanned: (prev?.total_scanned || 0) + res.data.total_scanned,
        phishing_count: (prev?.phishing_count || 0) + res.data.phishing_count,
        legitimate_count: (prev?.legitimate_count || 0) + res.data.legitimate_count,
      }));
      setRecentEmails((prev) => [...res.data.emails, ...prev].slice(0, 10));
    } catch {
      setError("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  const phishingRate = stats?.total_scanned
    ? ((stats.phishing_count / stats.total_scanned) * 100).toFixed(1)
    : "0";

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
          <span className="material-symbols-outlined text-sm">
            {scanning ? "sync" : "radar"}
          </span>
          {scanning ? "Scanning..." : "Scan Inbox"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-6 text-[14px]">
          {error}
        </div>
      )}

      {/* Time Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TIME_FILTERS.map((filter, i) => (
          <button
            key={filter.label}
            onClick={() => setActiveFilter(i)}
            className={`px-4 py-1.5 rounded-full text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] transition-colors ${
              i === activeFilter
                ? "border border-primary text-primary bg-primary/10"
                : "border border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

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
          icon="shield_alert"
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
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface">
            Recent Scans
          </h2>
          <span className="bg-surface-container-high border border-outline-variant/50 text-on-surface-variant text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] px-2 py-1 rounded-full">
            {recentEmails.length} emails
          </span>
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
                  <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {recentEmails.map((email) => (
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] ${
                        email.verdict === "phishing"
                          ? "bg-error/10 border border-error/50 text-error pulse-threat"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {email.verdict === "phishing" ? "warning" : "check_circle"}
                        </span>
                        {email.verdict === "phishing" ? "Phishing" : "Safe"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] ${
                          email.verdict === "phishing" ? "text-error" : "text-emerald-400"
                        }`}>
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
