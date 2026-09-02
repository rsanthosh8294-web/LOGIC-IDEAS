import React from "react";
import {
  Activity,
  Stethoscope,
  UserCheck,
  Globe2,
  Sparkles,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { LanguageCode } from "../types";
import { SUPPORTED_LANGUAGES } from "../data/multilingualPrompts";

interface HeaderProps {
  currentTab: "intake" | "doctor" | "demos";
  onTabChange: (tab: "intake" | "doctor" | "demos") => void;
  selectedLang: LanguageCode;
  onLangChange: (lang: LanguageCode) => void;
  queueCount: number;
  criticalCount: number;
  totalTimeSavedMin: number;
  onOpenNewIntake?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedLang,
  onLangChange,
  queueCount,
  criticalCount,
  totalTimeSavedMin,
  onOpenNewIntake,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      {/* Top Ministry & SIH 2026 Banner */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 px-4 py-1.5 text-xs text-emerald-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-800/80 font-bold text-emerald-100 uppercase tracking-wider text-[10px]">
            SIH 2026 • PS #SIH26047
          </span>
          <span className="hidden sm:inline font-medium text-slate-300">
            Ministry of Ayush • All India Institute of Ayurveda (AIIA)
          </span>
          <span className="sm:hidden font-medium text-slate-300">
            Ministry of Ayush
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consultation Time Saved: <strong className="text-white font-bold">{totalTimeSavedMin} mins</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ABDM / ABHA Ready</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange("intake")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/40 border border-emerald-400/30">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  MediSaarthi <span className="text-emerald-400 font-mono text-sm px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30">AI</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden lg:inline">
                  Ayush & Allopathy Intake
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multilingual Clinical Case-Taking & Triage Engine
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/70">
            <button
              id="nav-tab-intake"
              onClick={() => onTabChange("intake")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === "intake"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Patient Intake</span>
            </button>

            <button
              id="nav-tab-doctor"
              onClick={() => onTabChange("doctor")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
                currentTab === "doctor"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor OPD</span>
              {queueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-teal-300 border border-teal-500/40 font-bold">
                  {queueCount}
                </span>
              )}
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </button>

            <button
              id="nav-tab-demos"
              onClick={() => onTabChange("demos")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === "demos"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Demo Scenarios</span>
              <span className="sm:hidden">Demos</span>
            </button>
          </nav>

          {/* Right Tools & Language Picker */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <label htmlFor="lang-select" className="sr-only">Select Language</label>
              <div className="relative">
                <Globe2 className="w-4 h-4 text-emerald-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="lang-select"
                  value={selectedLang}
                  onChange={(e) => onLangChange(e.target.value as LanguageCode)}
                  className="pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-750"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeLabel} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick New Intake Button if on Doctor tab */}
            {currentTab === "doctor" && onOpenNewIntake && (
              <button
                onClick={onOpenNewIntake}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
              >
                <span>+ New Patient Intake</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
