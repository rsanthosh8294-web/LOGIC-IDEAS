import React from "react";
import {
  Sparkles,
  AlertTriangle,
  Flame,
  Pill,
  Heart,
  Baby,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { PatientCase, LanguageCode } from "../../types";
import { INITIAL_SAMPLE_CASES } from "../../data/sampleCases";

interface DemoScenariosViewProps {
  onLoadScenario: (caseData: PatientCase, targetTab: "intake" | "doctor", lang?: LanguageCode) => void;
}

export const DemoScenariosView: React.FC<DemoScenariosViewProps> = ({
  onLoadScenario,
}) => {
  const scenarios = [
    {
      id: "scenario-1",
      title: "1. Integrative Ayush & Allopathy: Sandhigata Vata & Hypertension",
      sampleIndex: 0,
      badge: "Integrative OPD (Ayush + Allopathy)",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "54-year-old teacher reporting severe right knee crepitus and stiffness. Takes modern antihypertensive (Telmisartan 40mg). MediSaarthi AI reconciles both streams without drug clashes, diagnoses Sandhigata Vata with Manda Agni, and recommends Janu Basti & Pathya.",
      features: [
        "Hindi / Multilingual Voice Intake with Ayurvedic terms",
        "Multimodal Prescription OCR reconciliation (Yogaraj Guggulu + Telmisartan)",
        "Agni (Digestive Fire) & Kostha Pariksha integration",
        "Personalized Pathya-Apathya dietary chart",
      ],
      defaultLang: "hi" as LanguageCode,
    },
    {
      id: "scenario-2",
      title: "2. Emergency Clinical Red-Flag Triage: Amlapitta vs Acute Coronary Syndrome",
      sampleIndex: 1,
      badge: "Emergency Red-Flag Triage",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      description:
        "48-year-old executive reporting severe retrosternal burning thought to be 'Amlapitta/Gas', but also presenting with diaphoresis, left shoulder radiation, and high BP (155/95). MediSaarthi AI immediately triggers an Emergency Triage alert for urgent ECG to rule out Acute Myocardial Infarction.",
      features: [
        "Instant Clinical Red-Flag Alert generation",
        "Emergency Triage queue prioritization",
        "Differentiation of functional indigestion from cardiac ischemia",
        "Emergency protocol notification for attending doctor",
      ],
      defaultLang: "en" as LanguageCode,
    },
    {
      id: "scenario-3",
      title: "3. Chronic Metabolic Syndrome: Prameha (T2D) with Renal Risk",
      sampleIndex: 2,
      badge: "Chronic Metabolic & Lab OCR",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      description:
        "61-year-old patient with uncontrolled diabetes (HbA1c 8.9%) and early microalbuminuria. MediSaarthi AI analyzes scanned lab panels, classifies Vishama Agni and Pitta-Kaphaja Prameha, and formulates a kidney-protective Ayush + Allopathy protocol.",
      features: [
        "Automated OCR extraction of abnormal HbA1c & Creatinine values",
        "Ayush Prameha Dhatukshaya staging",
        "Chronological medical history timeline synthesis",
        "Doctor AI Voice Scribe dictation support",
      ],
      defaultLang: "en" as LanguageCode,
    },
    {
      id: "scenario-4",
      title: "4. Pediatric Respiratory: Kaphaja Kasa with Drug Allergy Alert",
      sampleIndex: 3,
      badge: "Pediatric & Drug Allergy Safety",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      description:
        "7-year-old child with recurrent nocturnal barking cough and past history of severe Penicillin-induced urticaria. MediSaarthi AI flags the antibiotic allergy, recommends Sitopaladi & Talisadi formulations, and sets gentle pediatric follow-up.",
      features: [
        "Prominent Drug Allergy Warning flag",
        "Childhood Kaphaja Kasa Ayush Nidana",
        "Safe herbal formulation recommendations (Sitopaladi)",
        "ABDM / ABHA Ready JSON generation",
      ],
      defaultLang: "en" as LanguageCode,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-800/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Smart India Hackathon 2026 • Live Demonstration Suite</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Evaluate Key Clinical AI Capabilities in 1-Click
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Select any verified clinical scenario below to test MediSaarthi AI's multilingual speech intake, vision-based prescription OCR, Ayush Agni Pariksha, and automated doctor SOAP note generation.
        </p>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((sc) => {
          const sampleCase = INITIAL_SAMPLE_CASES[sc.sampleIndex] || INITIAL_SAMPLE_CASES[0];

          return (
            <div
              key={sc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold border ${sc.badgeColor}`}
                  >
                    {sc.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {sampleCase.tokenNumber}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {sc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {sc.description}
                </p>

                {/* Key Features Bullet Points */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Capabilities Demonstrated:
                  </span>
                  {sc.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onLoadScenario(sampleCase, "intake", sc.defaultLang)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Test Patient Intake Flow</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadScenario(sampleCase, "doctor", sc.defaultLang)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-800/20 cursor-pointer"
                >
                  <span>View in Doctor OPD</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
