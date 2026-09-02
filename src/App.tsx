import React, { useState } from "react";
import { Header } from "./components/Header";
import { PatientIntakeWizard } from "./components/PatientIntake/PatientIntakeWizard";
import { DoctorQueueView } from "./components/DoctorDashboard/DoctorQueueView";
import { CaseDetailView } from "./components/DoctorDashboard/CaseDetailView";
import { DemoScenariosView } from "./components/DemoScenarios/DemoScenariosView";
import { INITIAL_SAMPLE_CASES } from "./data/sampleCases";
import { PatientCase, LanguageCode } from "./types";

export function App() {
  const [currentTab, setCurrentTab] = useState<"intake" | "doctor" | "demos">("intake");
  const [selectedLang, setSelectedLang] = useState<LanguageCode>("hi");
  const [cases, setCases] = useState<PatientCase[]>(INITIAL_SAMPLE_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Stats
  const criticalCount = cases.filter(
    (c) => c.triageAcuity === "Emergency" || c.triageAcuity === "High" || c.redFlags.length > 0
  ).length;

  const totalTimeSavedMin = cases.reduce(
    (acc, c) => acc + (c.estimatedHistoryTimeSavedMin || 15),
    0
  );

  const handleCaseCreated = (newCase: PatientCase) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
  };

  const handleUpdateCase = (updatedCase: PatientCase) => {
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
  };

  const handleLoadDemoScenario = (
    caseData: PatientCase,
    targetTab: "intake" | "doctor",
    lang?: LanguageCode
  ) => {
    if (lang) {
      setSelectedLang(lang);
    }

    // Check if case is already in cases list
    if (!cases.some((c) => c.id === caseData.id)) {
      setCases((prev) => [caseData, ...prev]);
    }

    setSelectedCaseId(caseData.id);
    setCurrentTab(targetTab);
  };

  const activeSelectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== "doctor") {
            setSelectedCaseId(null);
          }
        }}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        queueCount={cases.filter((c) => c.status !== "Consultation Completed").length}
        criticalCount={criticalCount}
        totalTimeSavedMin={totalTimeSavedMin}
        onOpenNewIntake={() => {
          setSelectedCaseId(null);
          setCurrentTab("intake");
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Patient Intake Wizard */}
        {currentTab === "intake" && (
          <PatientIntakeWizard
            selectedLang={selectedLang}
            onLangChange={setSelectedLang}
            onCaseCreated={handleCaseCreated}
            onGoToDoctorDashboard={(caseId) => {
              if (caseId) setSelectedCaseId(caseId);
              setCurrentTab("doctor");
            }}
          />
        )}

        {/* Tab 2: Doctor Clinical OPD Hub */}
        {currentTab === "doctor" && (
          <>
            {activeSelectedCase ? (
              <CaseDetailView
                patientCase={activeSelectedCase}
                onUpdateCase={handleUpdateCase}
                onBack={() => setSelectedCaseId(null)}
              />
            ) : (
              <DoctorQueueView
                cases={cases}
                onSelectCase={(caseItem) => setSelectedCaseId(caseItem.id)}
                onOpenNewIntake={() => setCurrentTab("intake")}
              />
            )}
          </>
        )}

        {/* Tab 3: SIH 2026 Live Demo Scenarios */}
        {currentTab === "demos" && (
          <DemoScenariosView onLoadScenario={handleLoadDemoScenario} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>MediSaarthi AI</strong> • Smart India Hackathon 2026 (PS #SIH26047) • Ministry of Ayush & AIIA
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Powered by Gemini 3.7 Flash</span>
            <span>•</span>
            <span>ABDM / FHIR R4 Ready</span>
            <span>•</span>
            <span>Ashtavidha Pariksha Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
