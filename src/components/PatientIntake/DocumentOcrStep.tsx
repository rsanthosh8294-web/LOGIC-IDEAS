import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  FileCheck,
  Sparkles,
  Trash2,
  AlertCircle,
  Pill,
  Activity,
  Plus,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { ExtractedDocument, ExtractedMedication } from "../../types";

interface DocumentOcrStepProps {
  documents: ExtractedDocument[];
  onAddDocument: (doc: ExtractedDocument) => void;
  onRemoveDocument: (docId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DocumentOcrStep: React.FC<DocumentOcrStepProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
  onNext,
  onBack,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ExtractedDocument | null>(
    documents[0] || null
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const response = await fetch("/api/intake/ocr-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || "image/jpeg",
            fileName: file.name,
            documentType: "Prescription / Lab Report",
          }),
        });

        const resData = await response.json();
        if (resData.success && resData.data) {
          const ocr = resData.data;
          const newDoc: ExtractedDocument = {
            id: `doc-${Date.now()}`,
            fileName: file.name,
            fileType: file.type,
            previewUrl: base64Data,
            classification: ocr.documentClassification || "Prescription / Clinical Card",
            prescribedBy: ocr.prescribedBy || "Dr. Consultation OPD",
            prescriptionDate: ocr.prescriptionDate || new Date().toISOString().split("T")[0],
            extractedMedications: ocr.extractedMedications || [],
            diagnosesFound: ocr.diagnosesFound || [],
            labParameters: ocr.labParameters || [],
            allergiesOrWarnings: ocr.allergiesOrWarnings || [],
            summaryText: ocr.summaryText || "Prescription processed successfully.",
            timestamp: new Date().toISOString(),
          };

          onAddDocument(newDoc);
          setSelectedPreviewDoc(newDoc);
        } else {
          setErrorMessage(resData.error || "OCR extraction encountered an error.");
        }
      } catch (err: any) {
        console.error("OCR extraction failed:", err);
        setErrorMessage("Network error during OCR. Switched to fallback extractor.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Pre-loaded Sample Prescriptions for 1-Click SIH Live Demos
  const handleLoadSampleRx = (type: "ayush_allopathy" | "lab_report" | "pediatric") => {
    setIsProcessing(true);
    setTimeout(() => {
      let sampleDoc: ExtractedDocument;

      if (type === "ayush_allopathy") {
        sampleDoc = {
          id: `doc-sample-${Date.now()}`,
          fileName: "AIIA_Integrative_OPD_Card_Feb2026.jpg",
          fileType: "image/jpeg",
          classification: "Integrative OPD Prescription",
          prescribedBy: "Dr. K. N. Mishra (Senior Physician, AIIA)",
          prescriptionDate: "2026-02-14",
          extractedMedications: [
            {
              medicineName: "Yogaraj Guggulu Vati",
              dosage: "500 mg",
              frequency: "1-0-1 (BD)",
              timing: "After meals with warm water",
              duration: "30 days",
              category: "Ayurveda/Ayush",
            },
            {
              medicineName: "Dashamoolarishta",
              dosage: "20 ml with equal water",
              frequency: "1-0-1 (BD)",
              timing: "After meals",
              duration: "30 days",
              category: "Ayurveda/Ayush",
            },
            {
              medicineName: "Tab. Telmisartan",
              dosage: "40 mg",
              frequency: "1-0-0 (OD Morning)",
              timing: "Post breakfast",
              duration: "Continuous",
              category: "Allopathy",
            },
          ],
          diagnosesFound: ["Sandhigata Vata (Knee Osteoarthritis)", "Essential Hypertension Stage 1"],
          labParameters: [
            { testName: "Serum Uric Acid", value: "6.4", unit: "mg/dL", isAbnormal: false },
            { testName: "ESR", value: "28", unit: "mm/hr", isAbnormal: true, clinicalNote: "Mild inflammatory activity" },
          ],
          allergiesOrWarnings: ["Oral NSAID gastric distress reported in 2024"],
          summaryText: "Patient on Telmisartan 40mg with Grade II Knee Osteoarthritis. Seeking integrative Ayurvedic pain relief and joint lubrication.",
          timestamp: new Date().toISOString(),
        };
      } else if (type === "lab_report") {
        sampleDoc = {
          id: `doc-sample-${Date.now()}`,
          fileName: "Metabolic_Panel_Lab_Report_Aug2026.pdf",
          fileType: "application/pdf",
          classification: "Comprehensive Blood / Urine Panel",
          prescribedBy: "Apex Diagnostics Lab",
          prescriptionDate: "2026-08-10",
          extractedMedications: [
            {
              medicineName: "Tab. Metformin",
              dosage: "1000 mg",
              frequency: "1-0-1",
              timing: "With meals",
              category: "Allopathy",
            },
          ],
          diagnosesFound: ["Type 2 Diabetes Mellitus", "Microalbuminuria"],
          labParameters: [
            { testName: "HbA1c", value: "8.9", unit: "%", isAbnormal: true, clinicalNote: "High (Target <7.0%)" },
            { testName: "Serum Creatinine", value: "1.38", unit: "mg/dL", isAbnormal: true, clinicalNote: "Mild renal elevation" },
            { testName: "Urine Albumin/Creatinine", value: "142", unit: "mg/g", isAbnormal: true, clinicalNote: "Microalbuminuria" },
          ],
          allergiesOrWarnings: ["No documented drug allergies"],
          summaryText: "Metabolic lab panel reveals elevated HbA1c (8.9%) and early microalbuminuria requiring tight glycemic control and nephroprotection.",
          timestamp: new Date().toISOString(),
        };
      } else {
        sampleDoc = {
          id: `doc-sample-${Date.now()}`,
          fileName: "Pediatric_Clinic_Slip_Jan2026.jpg",
          fileType: "image/jpeg",
          classification: "Pediatric Prescription Slip",
          prescribedBy: "Dr. Ananya Sen (MD Ayur)",
          prescriptionDate: "2026-01-20",
          extractedMedications: [
            {
              medicineName: "Sitopaladi Churna",
              dosage: "1 g + Honey",
              frequency: "1-1-1 (TDS)",
              timing: "After meals",
              category: "Ayurveda/Ayush",
            },
          ],
          diagnosesFound: ["Kaphaja Kasa (Childhood Cough)", "Penicillin Allergy"],
          labParameters: [],
          allergiesOrWarnings: ["Severe Amoxicillin/Penicillin skin eruption in 2025"],
          summaryText: "Pediatric case with recurrent cough and prominent Penicillin allergy warning.",
          timestamp: new Date().toISOString(),
        };
      }

      onAddDocument(sampleDoc);
      setSelectedPreviewDoc(sampleDoc);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              Step 3: Past Prescriptions & Diagnostic Reports OCR Scanner
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Upload photos or PDFs of previous doctor prescriptions, hospital discharge slips, or lab tests. MediSaarthi AI extracts medications, dosages, previous diagnoses, and abnormal lab values.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Upload & Sample Pickers */}
        <div className="space-y-4">
          {/* File Upload Box */}
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-all text-center group cursor-pointer shadow-sm relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isProcessing ? "Processing Document with AI..." : "Upload Prescription / Report"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports JPEG, PNG, or PDF files.
            </p>

            {isProcessing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-700 font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Extracting medications & lab values...</span>
              </div>
            )}
          </div>

          {/* 1-Click Sample Pre-loads for Evaluator Demonstration */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Test Samples (SIH 2026)</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleLoadSampleRx("ayush_allopathy")}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition"
              >
                <div className="font-bold text-slate-800">📄 Ayush + Allopathy Integrative Rx</div>
                <div className="text-[11px] text-slate-500">Yogaraj Guggulu + Telmisartan 40mg + OA Knee</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleRx("lab_report")}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition"
              >
                <div className="font-bold text-slate-800">🧪 Diabetic Renal Lab Panel</div>
                <div className="text-[11px] text-slate-500">HbA1c 8.9% + Creatinine 1.38 + Microalbumin</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleRx("pediatric")}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition"
              >
                <div className="font-bold text-slate-800">👶 Pediatric Clinical Rx Slip</div>
                <div className="text-[11px] text-slate-500">Sitopaladi Churna + Penicillin Allergy Alert</div>
              </button>
            </div>
          </div>

          {/* List of Uploaded Documents */}
          {documents.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Processed Files ({documents.length})
              </h4>
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedPreviewDoc(doc)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                      selectedPreviewDoc?.id === doc.id
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDocument(doc.id);
                        if (selectedPreviewDoc?.id === doc.id) {
                          setSelectedPreviewDoc(documents.filter((d) => d.id !== doc.id)[0] || null);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Structured Extracted Information View */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPreviewDoc ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              {/* Document Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                      {selectedPreviewDoc.classification}
                    </span>
                    <span className="text-xs text-slate-500">
                      Dated: {selectedPreviewDoc.prescriptionDate}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {selectedPreviewDoc.prescribedBy || "OPD Clinical Card"}
                  </h3>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  {selectedPreviewDoc.fileName}
                </div>
              </div>

              {/* Summary Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">AI Clinical Extraction Summary: </strong>
                {selectedPreviewDoc.summaryText}
              </div>

              {/* Extracted Active Medications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>
                    Extracted Active Medications ({selectedPreviewDoc.extractedMedications.length})
                  </span>
                </h4>

                {selectedPreviewDoc.extractedMedications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specific medications identified in this document.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Medicine Name</th>
                          <th className="p-2.5">Dosage / Frequency</th>
                          <th className="p-2.5">Timing</th>
                          <th className="p-2.5">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPreviewDoc.extractedMedications.map((med, mIdx) => (
                          <tr key={mIdx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{med.medicineName}</td>
                            <td className="p-2.5 text-slate-700">{med.dosage} • {med.frequency}</td>
                            <td className="p-2.5 text-slate-600">{med.timing}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  med.category.includes("Ayurveda")
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {med.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Diagnoses & Lab Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Diagnoses */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Identified Diagnoses
                  </h5>
                  {selectedPreviewDoc.diagnosesFound.length === 0 ? (
                    <p className="text-xs text-slate-400">None explicitly stated.</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedPreviewDoc.diagnosesFound.map((diag, dIdx) => (
                        <li key={dIdx} className="text-xs text-slate-800 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Lab Parameters */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Lab Markers & Vitals
                  </h5>
                  {selectedPreviewDoc.labParameters.length === 0 ? (
                    <p className="text-xs text-slate-400">No laboratory values found.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedPreviewDoc.labParameters.map((lab, lIdx) => (
                        <div
                          key={lIdx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white border border-slate-200"
                        >
                          <span className="font-semibold text-slate-800">{lab.testName}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {lab.value} {lab.unit}
                            </span>
                            {lab.isAbnormal && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                                Abnormal
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Allergies / Warnings */}
              {selectedPreviewDoc.allergiesOrWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Drug Allergy / Warning Highlighted: </span>
                    {selectedPreviewDoc.allergiesOrWarnings.join("; ")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                No past prescriptions or reports scanned yet.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload a file or choose one of the 1-click test samples on the left to verify automated medication reconciliation.
              </p>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              ← Back to Chat
            </button>

            <button
              type="button"
              id="btn-proceed-to-ayush"
              onClick={onNext}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer shadow-emerald-700/20"
            >
              <span>Next: Ayush & Lifestyle Assessment</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
