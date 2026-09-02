import React from "react";
import {
  Flame,
  Moon,
  Utensils,
  Leaf,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AyushMarkers } from "../../types";

interface AyushLifestyleStepProps {
  ayushMarkers: AyushMarkers;
  onUpdateMarkers: (field: keyof AyushMarkers, value: any) => void;
  onGenerateSummary: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export const AyushLifestyleStep: React.FC<AyushLifestyleStepProps> = ({
  ayushMarkers,
  onUpdateMarkers,
  onGenerateSummary,
  onBack,
  isGenerating,
}) => {
  const agniOptions: Array<{
    value: AyushMarkers["agni"];
    title: string;
    description: string;
    iconColor: string;
  }> = [
    {
      value: "Sama (Balanced)",
      title: "Sama Agni (Balanced Fire)",
      description: "Appetite is normal and on time; food digests smoothly without heaviness.",
      iconColor: "text-emerald-600",
    },
    {
      value: "Manda (Sluggish/Low)",
      title: "Manda Agni (Sluggish Fire)",
      description: "Low appetite; feeling full/heavy for hours; burping or coated tongue (Ama).",
      iconColor: "text-blue-600",
    },
    {
      value: "Tikshna (Intense/Sharp)",
      title: "Tikshna Agni (Hyperactive Fire)",
      description: "Excessive burning hunger; acid reflux; irritability if meals are delayed.",
      iconColor: "text-rose-600",
    },
    {
      value: "Vishama (Variable/Erratic)",
      title: "Vishama Agni (Erratic Fire)",
      description: "Appetite fluctuates wildly day to day; frequent bloating and gas (Vataja).",
      iconColor: "text-amber-600",
    },
  ];

  const kosthaOptions: Array<{
    value: AyushMarkers["kostha"];
    title: string;
    description: string;
  }> = [
    {
      value: "Mridu (Soft/Frequent)",
      title: "Mridu Kostha (Soft / Rapid)",
      description: "Tendency towards loose stools; easily purged even by milk or warm water (Pitta).",
    },
    {
      value: "Madhyama (Regular)",
      title: "Madhyama Kostha (Regular)",
      description: "Regular comfortable daily bowel movement without straining.",
    },
    {
      value: "Krura (Hard/Constipated)",
      title: "Krura Kostha (Hard / Dry)",
      description: "Frequent constipation, hard dry stools, requires purgative support (Vata).",
    },
  ];

  const nidraOptions: Array<{
    value: AyushMarkers["nidra"];
    title: string;
    description: string;
  }> = [
    {
      value: "Samyak (Sound/Restful)",
      title: "Samyak Nidra (Sound Sleep)",
      description: "Deep, uninterrupted 7-8 hours; wake up feeling refreshed.",
    },
    {
      value: "Khandita (Disturbed/Broken)",
      title: "Khandita Nidra (Fragmented)",
      description: "Waking up multiple times due to pain, urge to urinate, or light sleep.",
    },
    {
      value: "Anidra (Insomnia)",
      title: "Anidra (Difficulty Falling Asleep)",
      description: "Tossing and turning for hours due to racing thoughts or anxiety.",
    },
    {
      value: "Atinidra (Excessive sleep)",
      title: "Atinidra (Daytime Somnolence)",
      description: "Excessive drowsiness, grogginess, heavy feeling throughout the day.",
    },
  ];

  const lifestyleTriggers = [
    "High mental stress / workload",
    "Late night dinners (after 10 PM)",
    "Frequent tea / coffee (>3 cups/day)",
    "Sedentary / Prolonged sitting",
    "Habit of daytime sleep (Divaswapna)",
    "Irregular meal timings",
    "Excessive cold refrigerated food",
  ];

  const handleToggleLifestyle = (factor: string) => {
    const current = ayushMarkers.lifestyleFactors || [];
    if (current.includes(factor)) {
      onUpdateMarkers(
        "lifestyleFactors",
        current.filter((f) => f !== factor)
      );
    } else {
      onUpdateMarkers("lifestyleFactors", [...current, factor]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-emerald-950/90 rounded-2xl p-5 text-white border border-emerald-800/60 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">
                Step 4: Ayush & Lifestyle Assessment (Ahara, Vihara & Agni)
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-600/40">
                Ministry of Ayush / AIIA
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              Ayurvedic case-taking evaluates digestive fire (Agni), bowel patterns (Kostha), and sleep (Nidra) alongside modern symptoms to provide an integrative diagnosis and personalized Pathya-Apathya regimen.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Agni Assessment */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>1. Digestive Fire & Hunger Pattern (Agni Pariksha)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agniOptions.map((opt) => {
              const isSelected = ayushMarkers.agni === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onUpdateMarkers("agni", opt.value)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-600 shadow-sm ring-1 ring-emerald-500"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Kostha & Bowel Patterns */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>2. Bowel Evacuation Pattern (Kostha Pariksha)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {kosthaOptions.map((opt) => {
              const isSelected = ayushMarkers.kostha === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onUpdateMarkers("kostha", opt.value)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? "bg-teal-50 border-teal-600 shadow-sm ring-1 ring-teal-500"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Sleep (Nidra) Pattern */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>3. Sleep Quality (Nidra Pariksha)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nidraOptions.map((opt) => {
              const isSelected = ayushMarkers.nidra === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onUpdateMarkers("nidra", opt.value)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-600 shadow-sm ring-1 ring-indigo-500"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Lifestyle & Habitual Triggers (Ahara & Vihara) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>4. Dietary & Daily Routine Factors (Ahara - Vihara)</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {lifestyleTriggers.map((factor) => {
              const isChecked = (ayushMarkers.lifestyleFactors || []).includes(factor);
              return (
                <button
                  key={factor}
                  type="button"
                  onClick={() => handleToggleLifestyle(factor)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isChecked
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {isChecked ? "✓ " : "+ "}
                  {factor}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation & Synthesize Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
          >
            ← Back to Prescriptions
          </button>

          <button
            type="button"
            id="btn-synthesize-doctor-summary"
            onClick={onGenerateSummary}
            disabled={isGenerating}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-800/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Synthesizing Doctor-Ready Summary (Gemini 3.7 Flash)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate Doctor Summary & Submit to OPD Queue</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
