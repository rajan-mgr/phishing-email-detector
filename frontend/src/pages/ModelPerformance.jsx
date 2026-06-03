import { useState, useEffect } from "react";
import { getModelStatus, switchModel } from "../services/api";

const MODELS = [
  {
    key: "lr",
    name: "Logistic Regression",
    accuracy: 0.9348,
    precision: 0.9366,
    recall: 0.936,
    f1: 0.9363,
    confusion: { tn: 6944, fp: 495, fn: 500, tp: 7313 },
  },
  {
    key: "rf",
    name: "Random Forest",
    accuracy: 0.9826,
    precision: 0.9838,
    recall: 0.9821,
    f1: 0.983,
    confusion: { tn: 7313, fp: 126, fn: 140, tp: 7673 },
  },
];

function MetricBar({ label, value, color }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
          {label}
        </span>
        <span className="text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] text-on-surface">
          {(value * 100).toFixed(2)}%
        </span>
      </div>
      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ModelPerformance() {
  const [selectedModel, setSelectedModel] = useState("rf");
  const [activeModel, setActiveModel] = useState("rf");
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getModelStatus()
      .then((res) => setActiveModel(res.data.active))
      .catch(() => {});
  }, []);

  const model = MODELS.find((m) => m.key === selectedModel);
  const isActive = selectedModel === activeModel;

  async function handleSwitch() {
    setSwitching(true);
    setMessage(null);
    try {
      await switchModel(selectedModel);
      setActiveModel(selectedModel);
      setMessage(`Switched to ${model.name}`);
    } catch {
      setMessage("Failed to switch model");
    } finally {
      setSwitching(false);
    }
  }

  const barColor = selectedModel === "rf" ? "bg-gradient-to-r from-violet-500 to-purple-500" : "bg-gradient-to-r from-blue-500 to-indigo-500";

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-[24px] md:text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-on-surface">
          ML Model Performance
        </h2>
        <p className="text-[16px] leading-[1.5] text-on-surface-variant mt-1">
          Compare and switch between trained phishing detection models.
        </p>
      </div>

      {/* Info Bar */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
            Dataset
          </span>
          <span className="text-[14px] leading-[1.5] text-on-surface font-medium">
            76,259 emails
          </span>
        </div>
        <div className="w-px h-4 bg-outline-variant/50 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
            Train/Test Split
          </span>
          <span className="text-[14px] leading-[1.5] text-on-surface font-medium">
            61,007 / 15,252
          </span>
        </div>
        <div className="w-px h-4 bg-outline-variant/50 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">
            Active Model
          </span>
          <span className="text-[14px] leading-[1.5] text-primary font-medium">
            {MODELS.find((m) => m.key === activeModel)?.name}
          </span>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div className="flex gap-2 mb-6 border-b border-outline-variant/30">
        {MODELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedModel(m.key)}
            className={`px-5 py-3 text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] transition-all relative ${
              selectedModel === m.key
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              {m.name}
              {m.key === "rf" && (
                <span className="bg-primary/10 border border-primary/30 text-primary px-1.5 py-0.5 rounded text-[10px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono]">
                  Best
                </span>
              )}
              {m.key === activeModel && (
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono]">
                  Active
                </span>
              )}
            </div>
            {selectedModel === m.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary-container to-primary-container" />
            )}
          </button>
        ))}
      </div>

      {/* Switch Bar */}
      {!isActive && (
        <div className="glass-panel rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[14px] leading-[1.5] text-on-surface">
            Switch to <strong>{model.name}</strong>?
          </span>
          <button
            onClick={handleSwitch}
            disabled={switching}
            className="bg-gradient-to-r from-secondary-container to-primary-container text-on-primary-container text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] px-6 py-2 rounded-lg hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {switching ? "sync" : "swap_horiz"}
            </span>
            {switching ? "Switching..." : "Use This Model"}
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-lg mb-6 text-[14px]">
          {message}
        </div>
      )}

      {/* Metrics */}
      <div className="glass-panel rounded-xl p-6 mb-6">
        <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-6">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest/50 rounded-lg p-5 border border-outline-variant/20">
            <MetricBar label="Accuracy" value={model.accuracy} color={barColor} />
            <MetricBar label="Precision" value={model.precision} color={barColor} />
          </div>
          <div className="bg-surface-container-lowest/50 rounded-lg p-5 border border-outline-variant/20">
            <MetricBar label="Recall" value={model.recall} color={barColor} />
            <MetricBar label="F1 Score" value={model.f1} color={barColor} />
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="glass-panel rounded-xl p-6 mb-6">
        <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-6">
          Confusion Matrix
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="bg-surface-container-highest/50 rounded-lg p-4 text-center border border-outline-variant/20">
            <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant mb-2">
              True Negative
            </div>
            <div className="text-[32px] leading-[1.1] font-bold font-[Geist] text-on-surface">
              {model.confusion.tn.toLocaleString()}
            </div>
          </div>
          <div className="bg-amber-500/5 rounded-lg p-4 text-center border border-amber-500/20">
            <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-amber-400 mb-2">
              False Positive
            </div>
            <div className="text-[32px] leading-[1.1] font-bold font-[Geist] text-amber-400">
              {model.confusion.fp.toLocaleString()}
            </div>
          </div>
          <div className="bg-orange-500/5 rounded-lg p-4 text-center border border-orange-500/20">
            <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-orange-400 mb-2">
              False Negative
            </div>
            <div className="text-[32px] leading-[1.1] font-bold font-[Geist] text-orange-400">
              {model.confusion.fn.toLocaleString()}
            </div>
          </div>
          <div className="bg-emerald-500/5 rounded-lg p-4 text-center border border-emerald-500/20">
            <div className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-emerald-400 mb-2">
              True Positive
            </div>
            <div className="text-[32px] leading-[1.1] font-bold font-[Geist] text-emerald-400">
              {model.confusion.tp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30">
          <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface">
            Model Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container-low/50">
                <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Model</th>
                <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Accuracy</th>
                <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Precision</th>
                <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">Recall</th>
                <th className="p-4 text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant">F1 Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {MODELS.map((m) => (
                <tr
                  key={m.key}
                  className={`hover:bg-surface-variant/30 transition-colors ${
                    m.key === activeModel ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-4 text-[14px] leading-[1.5] text-on-surface font-medium">
                    <div className="flex items-center gap-2">
                      {m.name}
                      {m.key === activeModel && (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono]">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-[14px] leading-[1.5] text-on-surface font-[JetBrains_Mono]">
                    {(m.accuracy * 100).toFixed(2)}%
                  </td>
                  <td className="p-4 text-[14px] leading-[1.5] text-on-surface font-[JetBrains_Mono]">
                    {(m.precision * 100).toFixed(2)}%
                  </td>
                  <td className="p-4 text-[14px] leading-[1.5] text-on-surface font-[JetBrains_Mono]">
                    {(m.recall * 100).toFixed(2)}%
                  </td>
                  <td className="p-4 text-[14px] leading-[1.5] text-on-surface font-[JetBrains_Mono]">
                    {(m.f1 * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
