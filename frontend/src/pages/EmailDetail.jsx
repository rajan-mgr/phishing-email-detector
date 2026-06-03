import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getHistory } from "../services/api";

export default function EmailDetail() {
  const { id } = useParams();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((res) => {
        const found = res.data.results.find((r) => r.id === parseInt(id));
        setEmail(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
        Loading...
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-outline">error</span>
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2 font-[Geist]">Email Not Found</h2>
        <p className="text-on-surface-variant text-sm mb-6">The email you're looking for doesn't exist.</p>
        <Link
          to="/history"
          className="text-primary hover:text-primary-fixed transition-colors text-sm font-medium no-underline"
        >
          Back to History
        </Link>
      </div>
    );
  }

  const isPhishing = email.verdict === "phishing";

  return (
    <div>
      {/* Back link */}
      <Link
        to="/history"
        className="inline-flex items-center gap-1 text-primary hover:text-primary-fixed transition-colors text-sm font-medium no-underline mb-6"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to History
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface font-[Geist] truncate">
            {email.subject || "(no subject)"}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            From: {email.sender || "Unknown"}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-[JetBrains_Mono] ${
            isPhishing
              ? "bg-error/10 border-2 border-error/50 text-error pulse-threat"
              : "bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400"
          }`}
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPhishing ? "shield_alert" : "verified_user"}
          </span>
          {isPhishing ? "PHISHING" : "SAFE"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Email Info */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2 font-[Geist]">
            <span className="material-symbols-outlined text-primary text-xl">mail</span>
            Email Info
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Sender</span>
              <span className="text-sm text-on-surface truncate ml-4">{email.sender}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Domain</span>
              <span className="text-sm text-on-surface">{email.sender_domain}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Scanned</span>
              <span className="text-sm text-on-surface">
                {new Date(email.scanned_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Detection Results */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2 font-[Geist]">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            Detection Results
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Confidence</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold font-[JetBrains_Mono] ${isPhishing ? "text-error" : "text-emerald-400"}`}>
                  {(email.confidence * 100).toFixed(1)}%
                </span>
                <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPhishing ? "bg-error" : "bg-emerald-400"}`}
                    style={{ width: `${email.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Risk Level</span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase font-[JetBrains_Mono] ${
                  email.risk_level === "high" || email.risk_level === "critical"
                    ? "bg-error/10 border border-error/30 text-error"
                    : email.risk_level === "medium"
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {email.risk_level}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">URLs Found</span>
              <span className="text-sm text-on-surface">{email.urls_found || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-[JetBrains_Mono] font-medium">Attachments</span>
              <span className="text-sm text-on-surface">{email.has_attachments ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suspicious Signals */}
      {email.flags && email.flags.length > 0 && (
        <div className="glass-panel rounded-xl p-6 mb-6 border-l-4 border-l-error">
          <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2 font-[Geist]">
            <span className="material-symbols-outlined text-error text-xl">warning</span>
            Suspicious Signals
          </h3>
          <div className="space-y-2">
            {email.flags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-error/5 border border-error/10"
              >
                <span className="material-symbols-outlined text-error text-sm mt-0.5">flag</span>
                <span className="text-sm text-on-surface">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Preview */}
      {email.body_preview && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2 font-[Geist]">
            <span className="material-symbols-outlined text-primary text-xl">preview</span>
            Email Preview
          </h3>
          <pre className="bg-surface-container-lowest/50 rounded-lg p-4 text-sm text-on-surface-variant overflow-auto max-h-[300px] font-[JetBrains_Mono] whitespace-pre-wrap border border-outline-variant/20">
            {email.body_preview}
          </pre>
        </div>
      )}
    </div>
  );
}
