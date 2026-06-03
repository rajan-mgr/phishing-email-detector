import { useState, useEffect } from "react";
import { getHistory } from "../services/api";
import EmailTable from "../components/EmailTable";

const TIME_FILTERS = [
  { label: "10 Days", days: 10 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "All Time", days: 0 },
];

export default function History() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEmails();
  }, [activeFilter]);

  async function loadEmails() {
    setLoading(true);
    try {
      const days = TIME_FILTERS[activeFilter].days;
      const res = await getHistory(days);
      setEmails(res.data.results || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmails = emails.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.subject || "").toLowerCase().includes(term) ||
      (e.sender || "").toLowerCase().includes(term) ||
      (e.verdict || "").toLowerCase().includes(term)
    );
  });

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
      <div className="glass-panel rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
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

        {/* Time Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant mr-2">
            Timeframe:
          </span>
          {TIME_FILTERS.map((filter, i) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(i)}
              className={`px-3 py-1.5 rounded-full text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] transition-colors ${
                i === activeFilter
                  ? "border border-primary text-primary bg-primary/10"
                  : "border border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
              }`}
            >
              {filter.label}
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
        ) : (
          <>
            <EmailTable emails={filteredEmails} />
            {/* Pagination footer */}
            {filteredEmails.length > 0 && (
              <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant bg-surface-container-lowest/30">
                <span className="text-[14px] leading-[1.5]">
                  Showing 1 to {filteredEmails.length} of {filteredEmails.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
