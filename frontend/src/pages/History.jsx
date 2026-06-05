import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";
import EmailTable from "../components/EmailTable";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Phishing First", value: "phishing" },
  { label: "Safe First", value: "safe" },
  { label: "High Confidence", value: "confidence" },
];

const VERDICT_FILTERS = [
  { label: "All", value: "all" },
  { label: "Phishing", value: "phishing" },
  { label: "Safe", value: "legitimate" },
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
    case "confidence":
      return sorted.sort((a, b) => b.confidence - a.confidence);
    default:
      return sorted;
  }
}

export default function History() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSort, setActiveSort] = useState("newest");
  const [verdictFilter, setVerdictFilter] = useState("all");

  useEffect(() => {
    loadEmails();
  }, []);

  async function loadEmails() {
    setLoading(true);
    try {
      const res = await getHistory(0);
      setEmails(res.data.results || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmails = sortEmails(
    emails.filter((e) => {
      const matchesSearch = !searchTerm || (() => {
        const term = searchTerm.toLowerCase();
        return (
          (e.subject || "").toLowerCase().includes(term) ||
          (e.sender || "").toLowerCase().includes(term) ||
          (e.verdict || "").toLowerCase().includes(term)
        );
      })();
      const matchesVerdict = verdictFilter === "all" || e.verdict === verdictFilter;
      return matchesSearch && matchesVerdict;
    }),
    activeSort
  );

  const phishingCount = emails.filter((e) => e.verdict === "phishing").length;
  const safeCount = emails.filter((e) => e.verdict === "legitimate").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="text-[24px] md:text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-on-surface flex items-center gap-3">
            Email History
            <span className="bg-surface-container-high border border-outline-variant/50 text-on-surface-variant text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] px-2 py-1 rounded-full">
              {filteredEmails.length} Scanned
            </span>
          </h2>
          <p className="text-[16px] leading-[1.5] text-on-surface-variant mt-1">
            Review recent email verdicts and threat confidence levels.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex flex-col gap-4">
        {/* Row 1: Search + Verdict filter */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:w-1/3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search subject, sender, or verdict..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg pl-10 pr-4 py-2 text-[14px] leading-[1.5] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Verdict Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
              Show:
            </span>
            {VERDICT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setVerdictFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] transition-colors ${
                  verdictFilter === f.value
                    ? f.value === "phishing"
                      ? "border border-error text-error bg-error/10"
                      : f.value === "legitimate"
                      ? "border border-emerald-500 text-emerald-400 bg-emerald-500/10"
                      : "border border-primary text-primary bg-primary/10"
                    : "border border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
                }`}
              >
                {f.label}
                {f.value === "phishing" && (
                  <span className="ml-1 opacity-70">{phishingCount}</span>
                )}
                {f.value === "legitimate" && (
                  <span className="ml-1 opacity-70">{safeCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
            Sort:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveSort(opt.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] transition-colors ${
                activeSort === opt.value
                  ? "border border-primary text-primary bg-primary/10"
                  : "border border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin mb-4">
              sync
            </span>
            <p className="text-[16px] leading-[1.5] text-on-surface-variant">Loading emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">inbox</span>
            <p className="text-[16px] leading-[1.5] text-on-surface-variant">No emails match your filters.</p>
          </div>
        ) : (
          <>
            <EmailTable emails={filteredEmails} />
            <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant bg-surface-container-lowest/30">
              <span className="text-[14px] leading-[1.5]">
                Showing {filteredEmails.length} of {emails.length} emails
              </span>
              <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
                Sorted by: {SORT_OPTIONS.find((o) => o.value === activeSort)?.label}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}