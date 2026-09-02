import React from "react";
import {
  User,
  Phone,
  Calendar,
  Shield,
  Activity,
  Heart,
  Thermometer,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { VitalSigns, LanguageCode } from "../../types";

interface DemographicsStepProps {
  profile: {
    name: string;
    age: number | "";
    gender: "Male" | "Female" | "Other";
    phone: string;
    abhaId: string;
    occupation?: string;
    addressCity?: string;
    primaryConcern?: string;
  };
  onProfileChange: (field: string, value: any) => void;
  vitals: VitalSigns;
  onVitalsChange: (field: keyof VitalSigns, value: number | undefined) => void;
  consentGiven: boolean;
  onConsentChange: (val: boolean) => void;
  onNext: () => void;
  selectedLang: LanguageCode;
}

export const PatientDemographicsStep: React.FC<DemographicsStepProps> = ({
  profile,
  onProfileChange,
  vitals,
  onVitalsChange,
  consentGiven,
  onConsentChange,
  onNext,
}) => {
  const generateRandomAbha = () => {
    const num1 = Math.floor(1000 + Math.random() * 9000);
    const num2 = Math.floor(1000 + Math.random() * 9000);
    const num3 = Math.floor(1000 + Math.random() * 9000);
    onProfileChange("abhaId", `91-${num1}-${num2}-${num3}@abdm`);
  };

  const isFormValid =
    profile.name.trim().length > 1 &&
    profile.age !== "" &&
    Number(profile.age) > 0 &&
    profile.phone.trim().length >= 6 &&
    consentGiven;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/80 rounded-2xl p-5 text-white border border-emerald-700/50 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Step 1: Patient Identity & Digital Consent
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Please enter basic details or link your Ayush / ABHA Health ID. MediSaarthi AI will organize your medical history for your doctor's consultation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Patient Demographics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="patient-name-input"
              placeholder="e.g. Rameshwar Prasad Gupta"
              value={profile.name}
              onChange={(e) => onProfileChange("name", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Age (Years) *
            </label>
            <input
              type="number"
              id="patient-age-input"
              placeholder="e.g. 54"
              min={1}
              max={120}
              value={profile.age}
              onChange={(e) =>
                onProfileChange("age", e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gender *
            </label>
            <select
              id="patient-gender-select"
              value={profile.gender}
              onChange={(e) => onProfileChange("gender", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                id="patient-phone-input"
                placeholder="+91 98765 43210"
                value={profile.phone}
                onChange={(e) => onProfileChange("phone", e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* ABHA / Ayush Health ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                ABHA / Ayush Health ID
              </label>
              <button
                type="button"
                onClick={generateRandomAbha}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold underline"
              >
                Generate Test ID
              </button>
            </div>
            <div className="relative">
              <Shield className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="patient-abha-input"
                placeholder="91-XXXX-XXXX-XXXX@abdm"
                value={profile.abhaId}
                onChange={(e) => onProfileChange("abhaId", e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-slate-50/50"
              />
            </div>
          </div>

          {/* City / State */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City / State
            </label>
            <input
              type="text"
              id="patient-city-input"
              placeholder="e.g. New Delhi / Varanasi"
              value={profile.addressCity || ""}
              onChange={(e) => onProfileChange("addressCity", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Occupation
            </label>
            <input
              type="text"
              id="patient-occupation-input"
              placeholder="e.g. Teacher / Farmer / IT / Homemaker"
              value={profile.occupation || ""}
              onChange={(e) => onProfileChange("occupation", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Optional Vitals Check-in (Kiosk or Self) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Current Vitals (If checked at Kiosk)</span>
            </h4>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Blood Pressure (mmHg)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Sys 120"
                  value={vitals.bpSystolic || ""}
                  onChange={(e) =>
                    onVitalsChange(
                      "bpSystolic",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-1/2 px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-400 text-xs">/</span>
                <input
                  type="number"
                  placeholder="Dia 80"
                  value={vitals.bpDiastolic || ""}
                  onChange={(e) =>
                    onVitalsChange(
                      "bpDiastolic",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-1/2 px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Pulse (bpm)
              </label>
              <input
                type="number"
                placeholder="72"
                value={vitals.pulse || ""}
                onChange={(e) =>
                  onVitalsChange(
                    "pulse",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                SpO2 (%)
              </label>
              <input
                type="number"
                placeholder="98"
                value={vitals.spo2 || ""}
                onChange={(e) =>
                  onVitalsChange(
                    "spo2",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Blood Sugar (mg/dL)
              </label>
              <input
                type="number"
                placeholder="110"
                value={vitals.bloodSugar || ""}
                onChange={(e) =>
                  onVitalsChange(
                    "bloodSugar",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Digital Consent Checkbox */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="patient-consent-checkbox"
              checked={consentGiven}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">
                Patient Data Consent & Confidentiality Agreement (ABDM Compliant)
              </span>
              <p className="text-slate-600 mt-0.5">
                I authorize MediSaarthi AI and the All India Institute of Ayurveda OPD to record my reported medical history, scan prior prescriptions, and synthesize a structured case sheet for my attending physician. The doctor retains complete final authority.
              </p>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            id="btn-proceed-to-chat"
            onClick={onNext}
            disabled={!isFormValid}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              isFormValid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-700/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Proceed to Voice & Touch Intake</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
