import { useState } from "react";
import { quickScan } from "../services/api";

export default function QuickScan() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sender, setSender] = useState("");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  async function handleScan() {
    if (!body.trim()) {
      setError("Please paste email content");
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await quickScan(subject, body, sender);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  function handleClear() {
    setSubject("");
    setBody("");
    setSender("");
    setResult(null);
    setError(null);
  }

  const isPhishing = result?.verdict === "phishing";

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-[24px] md:text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-on-surface">
          Quick Email Scan
        </h2>
        <p className="text-[16px] leading-[1.5] text-on-surface-variant mt-1">
          Paste an email to check if it's phishing or legitimate
        </p>
      </div>

      {/* Scan Form */}
      <div className="glass-panel rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant mb-2">
              Sender (optional)
            </label>
            <input
              type="text"
              placeholder="sender@example.com"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-2.5 text-[14px] leading-[1.5] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
          <div>
            <label className="block text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant mb-2">
              Subject (optional)
            </label>
            <input
              type="text"
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-2.5 text-[14px] leading-[1.5] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant mb-2">
            Email Content
          </label>
          <textarea
            placeholder="Paste the full email content here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-[14px] leading-[1.5] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50 resize-y font-[JetBrains_Mono]"
          />
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-4 text-[14px]">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={scanning || !body.trim()}
            className="bg-gradient-to-r from-secondary-container to-primary-container text-on-primary-container text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] px-6 py-2.5 rounded-lg hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              {scanning ? "sync" : "search"}
            </span>
            {scanning ? "Scanning..." : "Scan Email"}
          </button>
          <button
            onClick={handleClear}
            className="border border-outline-variant/50 text-on-surface-variant text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] px-6 py-2.5 rounded-lg hover:bg-surface-variant/30 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-panel rounded-xl p-6">
          {/* Verdict Badge */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[18px] leading-[1.2] tracking-[0.02em] font-bold font-[Geist] ${
              isPhishing
                ? "bg-error/10 border-2 border-error/50 text-error pulse-threat"
                : "bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400"
            }`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPhishing ? "shield_alert" : "verified_user"}
              </span>
              {isPhishing ? "PHISHING DETECTED" : "SAFE"}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-container-lowest/50 rounded-lg p-4 text-center border border-outline-variant/20">
              <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase mb-2">
                Confidence
              </div>
              <div className={`text-[32px] leading-[1.1] font-bold font-[Geist] ${isPhishing ? "text-error" : "text-emerald-400"}`}>
                {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-surface-container-lowest/50 rounded-lg p-4 text-center border border-outline-variant/20">
              <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase mb-2">
                Risk Level
              </div>
              <span className={`inline-flex px-3 py-1 rounded-md text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] ${
                result.risk_level === "critical" || result.risk_level === "high"
                  ? "bg-error/10 border border-error/30 text-error"
                  : result.risk_level === "medium"
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              }`}>
                {result.risk_level}
              </span>
            </div>
            <div className="bg-surface-container-lowest/50 rounded-lg p-4 text-center border border-outline-variant/20">
              <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase mb-2">
                Model Used
              </div>
              <div className="text-[16px] leading-[1.5] text-on-surface">
                {result.model_used === "rf" ? "Random Forest" : "Logistic Regression"}
              </div>
            </div>
          </div>

          {/* Suspicious Signals */}
          {result.flags?.length > 0 && (
            <div>
              <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">warning</span>
                Suspicious Signals
              </h3>
              <div className="space-y-2">
                {result.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-error/5 border border-error/20"
                  >
                    <span className="material-symbols-outlined text-error text-lg mt-0.5">
                      flag
                    </span>
                    <span className="text-[14px] leading-[1.5] text-on-surface">
                      {flag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
