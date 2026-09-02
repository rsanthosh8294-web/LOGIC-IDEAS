import React from "react";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Printer,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PatientCase } from "../../types";

interface IntakeReviewModalProps {
  caseData: PatientCase;
  onClose: () => void;
  onGoToDoctorDashboard: () => void;
}

export const IntakeReviewModal: React.FC<IntakeReviewModalProps> = ({
  caseData,
  onClose,
  onGoToDoctorDashboard,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Intake Completed Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Your medical case history has been synthesized and transmitted directly to the All India Institute of Ayurveda OPD Doctor Station.
          </p>
        </div>

        {/* Token Number Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white text-center space-y-2 border border-slate-700 shadow-md">
          <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
            OPD Triage Token Number
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
            {caseData.tokenNumber}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 text-xs border-t border-slate-700/80 text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Status: <strong>{caseData.status}</strong></span>
            </span>
            <span>•</span>
            <span>Triage Acuity: <strong className="text-emerald-300">{caseData.triageAcuity}</strong></span>
          </div>
        </div>

        {/* Key Extracted Overview */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
            <span>Patient: {caseData.patientProfile.name} ({caseData.patientProfile.age} / {caseData.patientProfile.gender})</span>
            <span className="font-mono text-emerald-700 font-semibold">{caseData.patientProfile.abhaId}</span>
          </div>

          <div className="space-y-1.5 text-slate-700">
            <div>
              <strong>Chief Complaints Recorded: </strong>
              {caseData.soapNote.subjective.chiefComplaints.join(", ")}
            </div>
            <div>
              <strong>Ayush Agni / Prakriti: </strong>
              {caseData.ayushMarkers.agni || "Evaluated"} • {caseData.ayushMarkers.prakritiDosha || "Vata-Kapha Tendency"}
            </div>
            {caseData.redFlags.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Red-Flag Alert Sent to Doctor: </strong> {caseData.redFlags[0].type}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onGoToDoctorDashboard}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Doctor OPD Workspace to Review Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
          >
            Start Another Patient Intake
          </button>
        </div>
      </div>
    </div>
  );
};
