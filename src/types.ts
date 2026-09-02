export type LanguageCode =
  | "en"
  | "hi"
  | "sa"
  | "ta"
  | "te"
  | "mr"
  | "bn"
  | "gu"
  | "kn";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  voiceLangCode: string;
}

export type TriageAcuity = "Emergency" | "High" | "Moderate" | "Routine";

export interface VitalSigns {
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  spo2?: number;
  temp?: number;
  respiratoryRate?: number;
  bloodSugar?: number; // mg/dL
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface AyushMarkers {
  prakritiDosha?: "Vata" | "Pitta" | "Kapha" | "Vata-Pitta" | "Pitta-Kapha" | "Vata-Kapha" | "Kapha-Pitta" | "Tridoshic" | string;
  agni?: "Sama (Balanced)" | "Manda (Sluggish/Low)" | "Tikshna (Intense/Sharp)" | "Vishama (Variable/Erratic)" | string;
  kostha?: "Mridu (Soft/Frequent)" | "Madhyama (Regular)" | "Krura (Hard/Constipated)" | string;
  nidra?: "Samyak (Sound/Restful)" | "Khandita (Disturbed/Broken)" | "Anidra (Insomnia)" | "Atinidra (Excessive sleep)" | string;
  dietPreference?: "Vegetarian" | "Lacto-Vegetarian" | "Non-Vegetarian" | "Vegan" | "Sattvic" | string;
  lifestyleFactors?: string[];
  seasonalAggravation?: string;
  painScore?: number;
  painLocation?: string;
}

export interface ExtractedMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration?: string;
  category: "Ayurveda/Ayush" | "Allopathy" | "Homeopathy" | "Supplement" | "Other";
}

export interface ExtractedLabParam {
  testName: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
  clinicalNote?: string;
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  fileType: string;
  previewUrl?: string;
  classification: string;
  prescribedBy?: string;
  prescriptionDate?: string;
  extractedMedications: ExtractedMedication[];
  diagnosesFound: string[];
  labParameters: ExtractedLabParam[];
  allergiesOrWarnings: string[];
  summaryText: string;
  timestamp: string;
}

export interface RedFlagAlert {
  id: string;
  type: string;
  severity: "Critical" | "High" | "Moderate";
  description: string;
  recommendedAction: string;
  isResolved?: boolean;
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: string;
  rationale: string;
}

export interface SoapNote {
  subjective: {
    chiefComplaints: string[];
    historyOfPresentIllness: string;
    pastMedicalHistory: string[];
    medicationHistory: string[];
    allergies: string[];
    familyHistory: string;
    reviewOfSystems: string;
  };
  objective: {
    vitalsSummary: string;
    physicalExaminationFindings: string;
    diagnosticFindingsFromOCR: string[];
    ayushExamination: {
      nadi?: string;
      jihva?: string;
      agni?: string;
      kostha?: string;
      nidra?: string;
      sparsha?: string;
    };
  };
  assessment: {
    primaryProvisionalDiagnosis: string;
    ayushNidanaRoga?: string;
    differentialDiagnoses: DifferentialDiagnosis[];
    clinicalRiskStratification: string;
  };
  plan: {
    suggestedModernInterventions: string[];
    suggestedAyushFormulations: string[];
    pathyaApathyaDietLifestyle: {
      recommendedPathya: string[];
      avoidApathya: string[];
    };
    investigationsOrdered: string[];
    followUpInterval: string;
    doctorCustomNotes?: string;
  };
}

export interface TimelineEvent {
  period: string;
  title: string;
  details: string;
  type: "onset" | "medication" | "surgery" | "lab" | "consultation" | "lifestyle" | string;
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "patient" | "system";
  text: string;
  timestamp: string;
  extractedSymptoms?: string[];
  suggestedQuickReplies?: string[];
  isRedFlagAlert?: boolean;
  audioGeneratedUrl?: string;
}

export interface PatientCase {
  id: string;
  tokenNumber: string;
  createdAt: string;
  status: "In Queue" | "Waiting for Doctor" | "Under Review" | "Consultation Completed" | "Admitted / Referred" | string;
  consentGiven: boolean;
  consentTimestamp?: string;
  language?: LanguageCode;
  
  patientProfile: {
    id?: string;
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other" | string;
    phone: string;
    abhaId: string;
    occupation?: string;
    addressCity?: string;
    primaryConcern?: string;
    consentGiven?: boolean;
  };

  painScore?: number; // 0-10
  painLocation?: string;

  vitals: VitalSigns;
  ayushMarkers: AyushMarkers;
  documents: ExtractedDocument[];
  chatHistory?: ChatMessage[];
  chatTranscript?: ChatMessage[];
  
  triageAcuity: TriageAcuity;
  triageReason?: string;
  redFlags: RedFlagAlert[];
  
  soapNote: SoapNote;
  timeline: TimelineEvent[];
  doctorTalkingPoints: string[];
  estimatedHistoryTimeSavedMin: number;

  doctorEdits?: {
    verifiedByDoctor?: boolean;
    doctorName?: string;
    doctorRegNo?: string;
    approvedAt?: string;
    finalPrescription?: ExtractedMedication[];
    finalAdvice?: string;
    digitalSignature?: string;
  };
}
