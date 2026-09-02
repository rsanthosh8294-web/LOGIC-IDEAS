import React, { useState } from "react";
import {
  User,
  Mic,
  FileText,
  Leaf,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  ChatMessage,
  ExtractedDocument,
  LanguageCode,
  PatientCase,
  RedFlagAlert,
  VitalSigns,
  AyushMarkers,
  SoapNote,
} from "../../types";
import { PatientDemographicsStep } from "./PatientDemographicsStep";
import { VoiceTouchChatStep } from "./VoiceTouchChatStep";
import { DocumentOcrStep } from "./DocumentOcrStep";
import { AyushLifestyleStep } from "./AyushLifestyleStep";
import { IntakeReviewModal } from "./IntakeReviewModal";

interface PatientIntakeWizardProps {
  selectedLang: LanguageCode;
  onLangChange: (lang: LanguageCode) => void;
  onCaseCreated: (newCase: PatientCase) => void;
  onGoToDoctorDashboard: (caseId?: string) => void;
}

export const PatientIntakeWizard: React.FC<PatientIntakeWizardProps> = ({
  selectedLang,
  onLangChange,
  onCaseCreated,
  onGoToDoctorDashboard,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Profile Form State
  const [profile, setProfile] = useState<{
    name: string;
    age: number | "";
    gender: "Male" | "Female" | "Other";
    phone: string;
    abhaId: string;
    occupation?: string;
    addressCity?: string;
    primaryConcern?: string;
  }>({
    name: "Rameshwar Prasad Gupta",
    age: 54,
    gender: "Male",
    phone: "+91 98765 43210",
    abhaId: "91-4921-8832-1029@abdm",
    occupation: "School Teacher",
    addressCity: "New Delhi",
    primaryConcern: "Chronic Right Knee Pain & Acidity",
  });

  const [vitals, setVitals] = useState<VitalSigns>({
    bpSystolic: 128,
    bpDiastolic: 84,
    pulse: 74,
    spo2: 98,
    bloodSugar: 115,
  });

  const [consentGiven, setConsentGiven] = useState(true);

  // Chat History & Symptoms State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [painScore, setPainScore] = useState<number>(6);
  const [painLocation, setPainLocation] = useState<string>("Right Knee Joint");
  const [redFlagsFound, setRedFlagsFound] = useState<RedFlagAlert[]>([]);

  // Documents & OCR State
  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);

  // Ayush Assessment State
  const [ayushMarkers, setAyushMarkers] = useState<AyushMarkers>({
    prakritiDosha: "Vata-Kapha",
    agni: "Manda (Sluggish/Low)",
    kostha: "Krura (Hard/Constipated)",
    nidra: "Khandita (Disturbed/Broken)",
    lifestyleFactors: [
      "Late night dinners (after 10 PM)",
      "Frequent tea / coffee (>3 cups/day)",
      "High mental stress / workload",
    ],
  });

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [completedCase, setCompletedCase] = useState<PatientCase | null>(null);

  const handleProfileChange = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleVitalsChange = (field: keyof VitalSigns, value: number | undefined) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDocument = (doc: ExtractedDocument) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleUpdateAyushMarkers = (field: keyof AyushMarkers, value: any) => {
    setAyushMarkers((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRedFlag = (alert: RedFlagAlert) => {
    setRedFlagsFound((prev) => {
      if (prev.some((r) => r.type === alert.type)) return prev;
      return [...prev, alert];
    });
  };

  // Generate Doctor SOAP Summary via Gemini AI
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);

    try {
      const response = await fetch("/api/intake/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfile: {
            name: profile.name,
            age: Number(profile.age) || 45,
            gender: profile.gender,
            phone: profile.phone,
            abhaId: profile.abhaId,
            occupation: profile.occupation,
            addressCity: profile.addressCity,
          },
          vitals,
          chatHistory: chatHistory.map((c) => ({
            role: c.sender === "ai" ? "assistant" : "user",
            content: c.text,
          })),
          documents,
          ayushMarkers: {
            ...ayushMarkers,
            painScore,
            painLocation,
          },
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const payload = resData.data;
        const generatedToken = `#OPD-${Math.floor(1000 + Math.random() * 9000)}`;

        const newCase: PatientCase = {
          id: `case-${Date.now()}`,
          tokenNumber: generatedToken,
          status: "Waiting for Doctor",
          createdAt: new Date().toISOString(),
          consentGiven: true,
          consentTimestamp: new Date().toISOString(),
          patientProfile: {
            id: `pt-${Date.now()}`,
            name: profile.name,
            age: Number(profile.age) || 45,
            gender: profile.gender,
            phone: profile.phone,
            abhaId: profile.abhaId,
            occupation: profile.occupation,
            addressCity: profile.addressCity,
            primaryConcern: profile.primaryConcern,
            consentGiven: true,
          },
          vitals,
          triageAcuity: payload.triageAcuity || "Moderate",
          redFlags: payload.redFlags || redFlagsFound,
          soapNote: payload.soapNote,
          ayushMarkers: {
            ...ayushMarkers,
            painScore,
            painLocation,
          },
          timeline: payload.timeline || [
            {
              period: "Current Episode (Feb 2026)",
              title: "Patient Intake Consultation at AIIA OPD",
              details: profile.primaryConcern || "Evaluated via MediSaarthi AI",
              type: "Symptom Onset",
            },
          ],
          documents,
          chatTranscript: chatHistory,
          estimatedHistoryTimeSavedMin: payload.estimatedHistoryTimeSavedMin || 16,
          doctorTalkingPoints: payload.doctorTalkingPoints || [
            "Assess joint mobility & rule out osteophyte progression",
            "Evaluate response to Guggulu & Telmisartan co-administration",
          ],
        };

        onCaseCreated(newCase);
        setCompletedCase(newCase);
      }
    } catch (err) {
      console.error("Error generating case summary:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const steps = [
    { num: 1, label: "Identity & Consent", icon: User },
    { num: 2, label: "Voice & Touch Chat", icon: Mic },
    { num: 3, label: "Prescriptions OCR", icon: FileText },
    { num: 4, label: "Ayush Lifestyle", icon: Leaf },
  ];

  return (
    <div className="space-y-6">
      {/* Step Progress Stepper Bar */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            const Icon = s.icon;

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num as any);
                }}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500"
                    : isCompleted
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-slate-50/50 border-slate-200/60 text-slate-400 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? "bg-emerald-600 text-white"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="hidden sm:block truncate">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Step {s.num}
                  </span>
                  <span className="text-xs font-bold truncate block">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Components */}
      {currentStep === 1 && (
        <PatientDemographicsStep
          profile={profile}
          onProfileChange={handleProfileChange}
          vitals={vitals}
          onVitalsChange={handleVitalsChange}
          consentGiven={consentGiven}
          onConsentChange={setConsentGiven}
          selectedLang={selectedLang}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <VoiceTouchChatStep
          patientName={profile.name}
          patientAge={Number(profile.age) || 45}
          patientGender={profile.gender}
          selectedLang={selectedLang}
          chatHistory={chatHistory}
          onUpdateChatHistory={setChatHistory}
          painScore={painScore}
          onPainScoreChange={setPainScore}
          painLocation={painLocation}
          onPainLocationChange={setPainLocation}
          onRedFlagFound={handleAddRedFlag}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <DocumentOcrStep
          documents={documents}
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <AyushLifestyleStep
          ayushMarkers={ayushMarkers}
          onUpdateMarkers={handleUpdateAyushMarkers}
          onGenerateSummary={handleGenerateSummary}
          onBack={() => setCurrentStep(3)}
          isGenerating={isGeneratingSummary}
        />
      )}

      {/* Intake Review Modal once case generated */}
      {completedCase && (
        <IntakeReviewModal
          caseData={completedCase}
          onClose={() => {
            setCompletedCase(null);
            setCurrentStep(1);
          }}
          onGoToDoctorDashboard={() => {
            setCompletedCase(null);
            onGoToDoctorDashboard(completedCase.id);
          }}
        />
      )}
    </div>
  );
};
