import { useNavigate } from "react-router-dom";

export default function EmailTable({ emails }) {
  const navigate = useNavigate();

  if (!emails || emails.length === 0) {
    return (
      <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-outline" style={{ fontVariationSettings: "'FILL' 0" }}>
            inbox_customize
          </span>
        </div>
        <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-2">
          No emails found
        </h3>
        <p className="text-[16px] leading-[1.5] text-on-surface-variant max-w-md">
          No email records match your current filter criteria. Try adjusting your search or timeframe.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant/50 bg-surface-container-low/50">
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Date &amp; Time</th>
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Sender</th>
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Subject</th>
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Verdict</th>
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Confidence</th>
            <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {emails.map((email) => (
            <tr
              key={email.id}
              onClick={() => navigate(`/email/${email.id}`)}
              className="hover:bg-surface-variant/30 transition-colors cursor-pointer group"
            >
              <td className="p-4 text-[14px] leading-[1.5] text-on-surface whitespace-nowrap">
                {new Date(email.scanned_at).toLocaleString()}
              </td>
              <td className="p-4 text-[14px] leading-[1.5] text-on-surface">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs">
                    {(email.sender?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="truncate max-w-[150px]">{email.sender}</span>
                </div>
              </td>
              <td className="p-4 text-[14px] leading-[1.5] text-on-surface truncate max-w-[250px]">
                {email.subject || "(no subject)"}
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
              <td className="p-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/email/${email.id}`);
                  }}
                  className="text-primary hover:text-primary-fixed transition-colors text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono]"
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
