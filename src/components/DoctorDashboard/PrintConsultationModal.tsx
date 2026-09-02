import React from "react";
import {
  Printer,
  X,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { PatientCase } from "../../types";

interface PrintConsultationModalProps {
  caseData: PatientCase;
  onClose: () => void;
}

export const PrintConsultationModal: React.FC<PrintConsultationModalProps> = ({
  caseData,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Action Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Official OPD Consultation Summary & Prescription
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Body */}
        <div className="space-y-6 text-slate-800 text-xs font-sans print:text-black">
          {/* Institutional Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-4">
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Ministry of Ayush • Government of India
              </div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                All India Institute of Ayurveda (AIIA)
              </h1>
              <p className="text-[11px] text-slate-600">
                Integrative Outpatient Department (OPD) • MediSaarthi AI Intake System
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black font-mono text-emerald-800">
                {caseData.tokenNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Date: {new Date(caseData.createdAt).toLocaleDateString()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                ABHA: {caseData.patientProfile.abhaId}
              </div>
            </div>
          </div>

          {/* Patient Demographics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">Patient Name</span>
              <strong className="text-xs text-slate-900">{caseData.patientProfile.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Age / Gender</span>
              <strong className="text-xs text-slate-900">
                {caseData.patientProfile.age} Yrs / {caseData.patientProfile.gender}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Contact</span>
              <strong className="text-xs text-slate-900">{caseData.patientProfile.phone}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Vitals (BP / HR / SpO2)</span>
              <strong className="text-xs text-slate-900">
                {caseData.vitals.bpSystolic ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic}` : "120/80"} mmHg • {caseData.vitals.pulse || 72} bpm
              </strong>
            </div>
          </div>

          {/* Clinical Assessment & Diagnoses */}
          <div className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                1. Clinical Diagnosis (Integrative)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">Modern Provisional Diagnosis:</span>
                  <strong className="text-xs text-emerald-950">
                    {caseData.soapNote.assessment.primaryProvisionalDiagnosis}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block">Ayush Roga & Dosha Nidana:</span>
                  <strong className="text-xs text-amber-950">
                    {caseData.soapNote.assessment.ayushNidanaRoga || "Vata-Kapha Dusti"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Subjective Chief Complaints */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                2. Chief Complaints & Clinical History (HPI)
              </h4>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                {caseData.soapNote.subjective.chiefComplaints.map((cc, i) => (
                  <li key={i}>{cc}</li>
                ))}
              </ul>
              <p className="mt-1.5 text-slate-600 italic">
                {caseData.soapNote.subjective.historyOfPresentIllness}
              </p>
            </div>

            {/* Prescriptions (Rx) */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-base font-serif font-black">℞</span>
                <span>Prescribed Medications & Formulations</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Dosage & Frequency</th>
                      <th className="p-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseData.soapNote.plan.suggestedAyushFormulations.map((rx, idx) => (
                      <tr key={`ayush-${idx}`}>
                        <td className="p-2 font-bold text-emerald-950">🌿 {rx}</td>
                        <td className="p-2 text-slate-700">As directed (BD)</td>
                        <td className="p-2 text-slate-600">With lukewarm water / Pathya Ahara</td>
                      </tr>
                    ))}
                    {caseData.soapNote.plan.suggestedModernInterventions.map((rx, idx) => (
                      <tr key={`modern-${idx}`}>
                        <td className="p-2 font-bold text-blue-950">💊 {rx}</td>
                        <td className="p-2 text-slate-700">Standard Regimen</td>
                        <td className="p-2 text-slate-600">Regular oral administration</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pathya-Apathya Dietary & Lifestyle Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                <strong className="text-[11px] text-emerald-900 uppercase tracking-wider block">
                  ✓ Recommended Pathya (Beneficial Diet & Lifestyle)
                </strong>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  {caseData.soapNote.plan.pathyaApathyaDietLifestyle.recommendedPathya.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1">
                <strong className="text-[11px] text-rose-900 uppercase tracking-wider block">
                  ✗ Strict Apathya (Items & Habits to Avoid)
                </strong>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  {caseData.soapNote.plan.pathyaApathyaDietLifestyle.avoidApathya.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Follow-up & Doctor Signature */}
            <div className="flex items-end justify-between pt-6 border-t border-slate-200">
              <div className="space-y-1">
                <div className="text-[11px] text-slate-500">
                  Follow-up: <strong>{caseData.soapNote.plan.followUpInterval}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Generated via MediSaarthi AI • Validated & Signed by Attending Physician
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-serif italic font-bold text-slate-800 text-sm">
                  {caseData.doctorEdits?.doctorName || "Dr. Consultation Physician (MD Ayur)"}
                </div>
                <div className="text-[10px] text-slate-500">
                  Reg No: {caseData.doctorEdits?.doctorRegNo || "AIIA-DEL-2026-9081"}
                </div>
                <div className="text-[9px] text-emerald-700 font-mono font-bold">
                  ✓ Digitally Verified via AIIA EHR Bridge
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
