import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Edit3,
  Mic,
  MicOff,
  Sparkles,
  Plus,
  Trash2,
  Heart,
  Pill,
  Leaf,
  Share2,
  Copy,
} from "lucide-react";
import { PatientCase, SoapNote, TimelineEvent } from "../../types";
import { PrintConsultationModal } from "./PrintConsultationModal";
import { SpeechService } from "../../utils/speechUtils";

interface CaseDetailViewProps {
  patientCase: PatientCase;
  onUpdateCase: (updatedCase: PatientCase) => void;
  onBack: () => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  patientCase,
  onUpdateCase,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"soap" | "timeline" | "documents" | "ayush">("soap");
  const [isEditingSoap, setIsEditingSoap] = useState(false);
  const [editedSoap, setEditedSoap] = useState<SoapNote>(patientCase.soapNote);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictatedText, setDictatedText] = useState("");
  const [isEnhancingScribe, setIsEnhancingScribe] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Synchronize state if patientCase changes
  React.useEffect(() => {
    setEditedSoap(patientCase.soapNote);
  }, [patientCase]);

  const handleSaveSoapEdits = () => {
    onUpdateCase({
      ...patientCase,
      soapNote: editedSoap,
      status: "Under Review",
    });
    setIsEditingSoap(false);
  };

  const handleSignAndApprove = () => {
    const updated: PatientCase = {
      ...patientCase,
      status: "Consultation Completed",
      doctorEdits: {
        verifiedByDoctor: true,
        doctorName: "Dr. K. N. Mishra (MD Ayur, Senior Physician)",
        doctorRegNo: "AIIA-DEL-2026-9081",
        approvedAt: new Date().toISOString(),
        digitalSignature: `DIGITAL_SIGN_AIIA_${patientCase.tokenNumber.replace(/[^0-9]/g, "")}_OK`,
      },
    };
    onUpdateCase(updated);
  };

  // Doctor Voice Scribe Dictation
  const toggleDoctorDictation = () => {
    if (isDictating) {
      SpeechService.stopListening();
      setIsDictating(false);
    } else {
      setIsDictating(true);
      SpeechService.startListening(
        "en-IN",
        (transcript, isFinal) => {
          setDictatedText(transcript);
        },
        (err) => {
          console.warn("Doctor scribe error:", err);
          setIsDictating(false);
        },
        () => {
          setIsDictating(false);
        }
      );
    }
  };

  const handleEnhanceDoctorNotes = async () => {
    if (!dictatedText.trim() || isEnhancingScribe) return;
    setIsEnhancingScribe(true);

    try {
      const response = await fetch("/api/doctor/dictate-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roughDoctorNotes: dictatedText,
          currentSoapNote: editedSoap,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const enhanced = resData.data.enhancedNotes;
        setEditedSoap((prev) => ({
          ...prev,
          plan: {
            ...prev.plan,
            doctorCustomNotes: prev.plan.doctorCustomNotes
              ? `${prev.plan.doctorCustomNotes}\n\n• ${enhanced}`
              : `• ${enhanced}`,
          },
        }));
        setDictatedText("");
      }
    } catch (err) {
      console.error("Failed to enhance doctor notes:", err);
    } finally {
      setIsEnhancingScribe(false);
    }
  };

  const copySoapToClipboard = () => {
    const text = `
PATIENT CASE SHEET: ${patientCase.patientProfile.name} (${patientCase.tokenNumber})
ABHA ID: ${patientCase.patientProfile.abhaId}
TRIAGE: ${patientCase.triageAcuity} | TIME SAVED: ~${patientCase.estimatedHistoryTimeSavedMin} min

[SUBJECTIVE]
Chief Complaints: ${patientCase.soapNote.subjective.chiefComplaints.join("; ")}
HPI: ${patientCase.soapNote.subjective.historyOfPresentIllness}
Allergies: ${patientCase.soapNote.subjective.allergies.join(", ")}

[OBJECTIVE]
Vitals: ${patientCase.soapNote.objective.vitalsSummary}
Ayush Examination: Nadi: ${patientCase.soapNote.objective.ayushExamination.nadi || "N/A"}, Agni: ${patientCase.soapNote.objective.ayushExamination.agni || "N/A"}, Kostha: ${patientCase.soapNote.objective.ayushExamination.kostha || "N/A"}

[ASSESSMENT]
Primary Diagnosis: ${patientCase.soapNote.assessment.primaryProvisionalDiagnosis}
Ayush Nidana: ${patientCase.soapNote.assessment.ayushNidanaRoga || "N/A"}

[PLAN]
Modern Interventions: ${patientCase.soapNote.plan.suggestedModernInterventions.join("; ")}
Ayush Formulations: ${patientCase.soapNote.plan.suggestedAyushFormulations.join("; ")}
Follow Up: ${patientCase.soapNote.plan.followUpInterval}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const exportAbdmJson = () => {
    const fhirBundle = {
      resourceType: "Bundle",
      type: "document",
      id: patientCase.id,
      timestamp: new Date().toISOString(),
      meta: {
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"],
        source: "MediSaarthi-AI-SIH26047",
      },
      identifier: {
        system: "https://healthid.ndhm.gov.in",
        value: patientCase.patientProfile.abhaId,
      },
      patient: {
        name: patientCase.patientProfile.name,
        age: patientCase.patientProfile.age,
        gender: patientCase.patientProfile.gender,
        contact: patientCase.patientProfile.phone,
      },
      clinicalStatus: patientCase.status,
      triageAcuity: patientCase.triageAcuity,
      redFlags: patientCase.redFlags,
      soapNote: patientCase.soapNote,
      ayushMarkers: patientCase.ayushMarkers,
      timeline: patientCase.timeline,
      doctorSignature: patientCase.doctorEdits || null,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirBundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ABDM_Case_${patientCase.tokenNumber.replace("#", "")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Back, Patient Banner & Actions */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 font-mono text-emerald-400 font-bold border border-slate-700">
                  {patientCase.tokenNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    patientCase.triageAcuity === "Emergency"
                      ? "bg-rose-600 text-white animate-pulse"
                      : patientCase.triageAcuity === "High"
                      ? "bg-orange-500 text-white"
                      : patientCase.triageAcuity === "Moderate"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  Triage: {patientCase.triageAcuity}
                </span>
                {patientCase.doctorEdits?.verifiedByDoctor && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Signed & Verified</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
                <span>{patientCase.patientProfile.name}</span>
                <span className="text-sm font-normal text-slate-400">
                  ({patientCase.patientProfile.age} Y / {patientCase.patientProfile.gender})
                </span>
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copySoapToClipboard}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copySuccess ? "Copied!" : "Copy SOAP"}</span>
            </button>

            <button
              onClick={exportAbdmJson}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ABDM JSON</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Prescription</span>
            </button>

            {!patientCase.doctorEdits?.verifiedByDoctor && (
              <button
                onClick={handleSignAndApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-800/40 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Doctor Sign-Off & Approve</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Key Demographics & Vitals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">ABHA ID</span>
            <span className="font-mono text-emerald-400 font-semibold truncate block">
              {patientCase.patientProfile.abhaId}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
            <span className="font-bold text-white">
              {patientCase.vitals.bpSystolic ? `${patientCase.vitals.bpSystolic}/${patientCase.vitals.bpDiastolic} mmHg` : "Not recorded"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Heart Rate / SpO2</span>
            <span className="font-bold text-white">
              {patientCase.vitals.pulse || 72} bpm • {patientCase.vitals.spo2 || 98}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">Ayush Prakriti / Agni</span>
            <span className="font-bold text-amber-300 truncate block">
              {patientCase.ayushMarkers.prakritiDosha || "Vata-Kapha"} • {patientCase.ayushMarkers.agni || "Manda"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">History Time Saved</span>
            <span className="font-bold text-emerald-300">
              ⚡ ~{patientCase.estimatedHistoryTimeSavedMin} Minutes
            </span>
          </div>
        </div>
      </div>

      {/* Red-Flag Alerts Banner if present */}
      {patientCase.redFlags.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
            <span>AI Clinical Red-Flag Warnings ({patientCase.redFlags.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patientCase.redFlags.map((rf) => (
              <div key={rf.id} className="p-3.5 rounded-xl bg-white border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-950 font-bold">{rf.type}</strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    {rf.severity} Priority
                  </span>
                </div>
                <p className="text-slate-700">{rf.description}</p>
                <div className="text-rose-700 font-semibold pt-1 border-t border-rose-100 flex items-center gap-1">
                  <span>Action:</span>
                  <span>{rf.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Fast Talking Points */}
      {patientCase.doctorTalkingPoints && patientCase.doctorTalkingPoints.length > 0 && (
        <div className="bg-gradient-to-r from-teal-900/90 to-emerald-900/90 rounded-2xl p-4 text-white border border-teal-700/60 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Clinical Highlights for Quick Consultation (30-Sec Doctor Briefing)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
            {patientCase.doctorTalkingPoints.map((point, pIdx) => (
              <div key={pIdx} className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl">
                <span className="text-teal-400 font-bold">•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("soap")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "soap"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          SOAP Notes & Clinical Plan
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "timeline"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Medical History Timeline ({patientCase.timeline.length})
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "documents"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Prescription & Lab OCR ({patientCase.documents.length})
        </button>

        <button
          onClick={() => setActiveTab("ayush")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "ayush"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Ayush Ashtavidha Pariksha
        </button>
      </div>

      {/* TAB 1: Structured SOAP Notes & Doctor Plan */}
      {activeTab === "soap" && (
        <div className="space-y-6">
          {/* Scribe / Dictation Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Doctor AI Voice Scribe (Dictate Clinical Observations)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDoctorDictation}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isDictating
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {isDictating ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isDictating ? "Stop Dictation" : "Dictate Doctor Note"}</span>
                </button>

                {dictatedText && (
                  <button
                    type="button"
                    onClick={handleEnhanceDoctorNotes}
                    disabled={isEnhancingScribe}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isEnhancingScribe ? "Formatting..." : "AI Format & Append to Plan"}</span>
                  </button>
                )}
              </div>
            </div>

            {dictatedText && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dictated Speech:</span>
                <p className="mt-0.5 italic">"{dictatedText}"</p>
              </div>
            )}
          </div>

          {/* SOAP Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SUBJECTIVE (S) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
                    S
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Subjective (Patient Reported)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingSoap(!isEditingSoap)}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingSoap ? "Done Editing" : "Edit Field"}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                    Chief Complaints:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {editedSoap.subjective.chiefComplaints.map((cc, i) => (
                      <li key={i} className="font-medium">{cc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                    History of Present Illness (HPI):
                  </strong>
                  {isEditingSoap ? (
                    <textarea
                      rows={3}
                      value={editedSoap.subjective.historyOfPresentIllness}
                      onChange={(e) =>
                        setEditedSoap({
                          ...editedSoap,
                          subjective: {
                            ...editedSoap.subjective,
                            historyOfPresentIllness: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {editedSoap.subjective.historyOfPresentIllness}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <strong className="text-slate-800 block text-[10px] uppercase">Past Medical History:</strong>
                    <ul className="text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                      {editedSoap.subjective.pastMedicalHistory.map((pmh, i) => (
                        <li key={i}>{pmh}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-slate-800 block text-[10px] uppercase text-rose-700">Allergies:</strong>
                    <ul className="text-rose-700 list-disc list-inside mt-0.5 space-y-0.5 font-semibold">
                      {editedSoap.subjective.allergies.map((all, i) => (
                        <li key={i}>{all}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* OBJECTIVE (O) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm flex items-center justify-center">
                  O
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Objective (Clinical Findings & Lab OCR)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-800 block text-[11px] uppercase mb-0.5">
                    Vitals Overview:
                  </strong>
                  <p className="text-slate-700 font-medium">
                    {editedSoap.objective.vitalsSummary}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                    Physical Examination Findings:
                  </strong>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {editedSoap.objective.physicalExaminationFindings}
                  </p>
                </div>

                {editedSoap.objective.diagnosticFindingsFromOCR.length > 0 && (
                  <div>
                    <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                      OCR Diagnostic Lab & Imaging Reports:
                    </strong>
                    <div className="space-y-1">
                      {editedSoap.objective.diagnosticFindingsFromOCR.map((df, i) => (
                        <div key={i} className="p-2 rounded-lg bg-teal-50/70 border border-teal-200 text-teal-950 font-medium">
                          {df}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ASSESSMENT (A) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-sm flex items-center justify-center">
                  A
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Assessment (Integrative Diagnoses)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                    Primary Provisional Diagnosis:
                  </span>
                  <strong className="text-xs text-emerald-950">
                    {editedSoap.assessment.primaryProvisionalDiagnosis}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">
                    Ayush Nidana & Dosha Prakopa:
                  </span>
                  <strong className="text-xs text-amber-950">
                    {editedSoap.assessment.ayushNidanaRoga || "Sandhigata Vata with Ama Dhatukshaya"}
                  </strong>
                </div>

                <div>
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1.5">
                    Differential Diagnoses & AI Probability:
                  </strong>
                  <div className="space-y-1.5">
                    {editedSoap.assessment.differentialDiagnoses.map((diff, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{diff.condition}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{diff.rationale}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 shrink-0">
                          {diff.probability}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PLAN (P) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-extrabold text-sm flex items-center justify-center">
                  P
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Plan (Therapeutics, Formulations & Pathya)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Ayush Formulations */}
                <div>
                  <strong className="text-emerald-900 block text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prescribed Ayush Formulations:</span>
                  </strong>
                  <div className="space-y-1">
                    {editedSoap.plan.suggestedAyushFormulations.map((form, i) => (
                      <div key={i} className="p-2 rounded-lg bg-emerald-50 text-emerald-950 font-medium border border-emerald-200/80">
                        {form}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modern Interventions */}
                <div>
                  <strong className="text-blue-900 block text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>Modern Medical / Physiotherapy Plan:</span>
                  </strong>
                  <div className="space-y-1">
                    {editedSoap.plan.suggestedModernInterventions.map((mod, i) => (
                      <div key={i} className="p-2 rounded-lg bg-blue-50 text-blue-950 font-medium border border-blue-200/80">
                        {mod}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctor Custom Dictated Notes */}
                {editedSoap.plan.doctorCustomNotes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <strong className="text-[11px] text-amber-900 uppercase tracking-wider block">
                      Doctor Direct Observations & Instructions:
                    </strong>
                    <p className="text-slate-800 whitespace-pre-wrap font-medium">
                      {editedSoap.plan.doctorCustomNotes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-600">
                  <span>Follow Up Interval: <strong>{editedSoap.plan.followUpInterval}</strong></span>
                  <button
                    type="button"
                    onClick={handleSaveSoapEdits}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Save Changes to Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Medical History Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Chronological Patient Medical Journey</span>
            </h3>
            <span className="text-xs text-slate-500">
              Auto-constructed from patient dialogue and scanned records
            </span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
            {patientCase.timeline.map((event, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-white shadow-sm"></div>
                <div className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 transition space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      {event.period}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {event.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Documents & OCR Results */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {patientCase.documents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No physical prescriptions or lab reports were uploaded during this intake.</p>
            </div>
          ) : (
            patientCase.documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800">
                      {doc.classification}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{doc.fileName}</h4>
                  </div>
                  <div className="text-xs text-slate-500">
                    Prescribed by: <strong>{doc.prescribedBy || "OPD Doctor"}</strong> • Date: {doc.prescriptionDate}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong>Extraction Summary: </strong>{doc.summaryText}
                </div>

                {/* Medications Extracted */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Reconciled Medications</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {doc.extractedMedications.map((med, mIdx) => (
                      <div key={mIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900">{med.medicineName}</div>
                        <div className="text-slate-600">{med.dosage} • {med.frequency}</div>
                        <div className="text-[11px] text-slate-500">{med.timing}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Ayush Ashtavidha & Rogi-Roga Pariksha */}
      {activeTab === "ayush" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Ministry of Ayush / AIIA Framework
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Ayush Rogi-Roga Pariksha & Prakriti Analysis
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">1. Nadi (Pulse Characteristics)</span>
              <strong className="text-xs text-slate-900 block">
                {patientCase.soapNote.objective.ayushExamination.nadi || "Vata-Kapha Gati"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">2. Jihva (Tongue Examination / Ama)</span>
              <strong className="text-xs text-slate-900 block">
                {patientCase.soapNote.objective.ayushExamination.jihva || "Sama (Mild white coating)"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">3. Agni (Digestive Fire)</span>
              <strong className="text-xs text-slate-900 block">
                {patientCase.ayushMarkers.agni || "Manda Agni"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">4. Kostha (Bowel Tendency)</span>
              <strong className="text-xs text-slate-900 block">
                {patientCase.ayushMarkers.kostha || "Krura Kostha"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">5. Nidra (Sleep Quality)</span>
              <strong className="text-xs text-slate-900 block">
                {patientCase.ayushMarkers.nidra || "Khandita Nidra"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">6. Dominant Dosha Prakriti</span>
              <strong className="text-xs text-emerald-800 block">
                {patientCase.ayushMarkers.prakritiDosha || "Vata-Kapha Prakopa"}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Print Consultation Modal */}
      {showPrintModal && (
        <PrintConsultationModal
          caseData={patientCase}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
