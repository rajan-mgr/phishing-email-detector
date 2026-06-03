export default function MetricCard({ title, value, subtitle, icon, type = "default" }) {
  const borderColors = {
    default: "border-l-primary",
    danger: "border-l-error",
    success: "border-l-emerald-500",
    warning: "border-l-amber-500",
  };

  const iconBgColors = {
    default: "bg-primary/10 text-primary",
    danger: "bg-error/10 text-error",
    success: "bg-emerald-500/10 text-emerald-400",
    warning: "bg-amber-500/10 text-amber-400",
  };

  const valueColors = {
    default: "text-on-surface",
    danger: "text-error",
    success: "text-emerald-400",
    warning: "text-amber-400",
  };

  return (
    <div className={`glass-panel rounded-xl p-5 border-l-4 ${borderColors[type]} hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgColors[type]}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
      <div className={`text-[32px] leading-[1.1] font-bold font-[Geist] ${valueColors[type]} mb-1`}>
        {value}
      </div>
      <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase">
        {title}
      </div>
      {subtitle && (
        <div className="text-[14px] leading-[1.5] text-on-surface-variant mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
