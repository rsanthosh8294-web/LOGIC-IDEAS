import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy GoogleGenAI client
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIInstance && process.env.GEMINI_API_KEY) {
    genAIInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIInstance;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// 1. Multilingual Conversational Intake API
app.post("/api/intake/chat", async (req, res) => {
  try {
    const {
      conversationHistory,
      patientProfile,
      currentInput,
      language = "English",
      ayushMode = true,
    } = req.body;

    const ai = getGenAI();

    if (ai) {
      const systemInstruction = `You are "MediSaarthi AI", an empathetic, highly skilled multilingual clinical intake assistant designed for outpatient departments (OPD) in India under the Ministry of Ayush and modern healthcare settings.
Your goal is to conduct a structured, compassionate, and precise pre-consultation medical history intake with the patient.

Target Language for response: ${language}.
Patient Details:
- Name: ${patientProfile?.name || "Patient"}
- Age: ${patientProfile?.age || "Unknown"}
- Gender: ${patientProfile?.gender || "Unknown"}
- Chief Complaint so far: ${patientProfile?.chiefComplaint || "Under exploration"}

Guidelines:
1. Speak warmly, respectfully, and clearly in the requested language (${language}).
2. Ask ONE focused, adaptive follow-up question at a time to uncover onset, duration, location, severity, aggravating/relieving factors, associated symptoms, or relevant diet/lifestyle factors (Ahara/Vihara).
3. If the patient mentions any RED FLAG symptoms (e.g., crushing chest pain radiating to left arm/jaw, sudden slurred speech/facial droop, acute breathlessness, sudden loss of vision, severe allergic anaphylaxis, vomiting blood), immediately identify it in the 'redFlagDetected' field with triage level 'EMERGENCY'.
4. If Ayush mode is active, gently explore relevant digestion (Agni), appetite, bowel habits (Kostha), or sleep (Nidra) in simple patient-friendly terms.
5. Provide 3-4 quick-tap suggested response options suitable for the question in ${language} so the patient can tap or speak.

Return JSON strictly conforming to schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            text: `Conversation History:\n${JSON.stringify(conversationHistory || [])}\n\nPatient Just Said: "${currentInput}"\n\nGenerate the next empathetic intake response in ${language}.`,
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: {
                type: Type.STRING,
                description: `The empathetic AI assistant's spoken/text response in ${language}`,
              },
              extractedSymptoms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of newly identified symptoms or clinical facts from this turn",
              },
              suggestedQuickReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 concise quick-tap buttons in the target language",
              },
              redFlagDetected: {
                type: Type.BOOLEAN,
                description: "True if red flag or urgent warning is detected",
              },
              redFlagDetails: {
                type: Type.STRING,
                description: "Clinical explanation of red flag if detected, else empty",
              },
              triagePriority: {
                type: Type.STRING,
                description: "Emergency, High, Moderate, or Routine",
              },
              ayushObservations: {
                type: Type.OBJECT,
                properties: {
                  doshaSuspected: { type: Type.STRING },
                  agniStatus: { type: Type.STRING },
                  dietLifestyleTriggers: { type: Type.STRING },
                },
              },
              nextPhaseSuggested: {
                type: Type.STRING,
                description: "e.g. chief_complaint, hpi, past_history, lifestyle, documents, review",
              },
            },
            required: ["replyText", "suggestedQuickReplies", "triagePriority"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    }

    // Fallback rule-based conversational responses when API key is pending
    const fallbackText = language.toLowerCase().includes("hindi")
      ? `नमस्ते ${patientProfile?.name || ""} जी। मुझे आपकी समस्या समझ आई। क्या यह दर्द या तकलीफ कितने दिनों से हो रही है, और क्या यह किसी खास समय (जैसे भोजन के बाद या सुबह) बढ़ती है?`
      : `Thank you for sharing that. To help the doctor prepare best: How long have you been experiencing this, and does anything specifically make it better or worse?`;

    const quickReplies = language.toLowerCase().includes("hindi")
      ? ["1-2 दिनों से", "लगभग 1 हफ़्ते से", "1 महीने से अधिक", "खाना खाने के बाद बढ़ता है"]
      : ["Past 1-2 days", "About a week", "More than a month", "Worse after meals"];

    return res.json({
      success: true,
      data: {
        replyText: fallbackText,
        extractedSymptoms: [currentInput],
        suggestedQuickReplies: quickReplies,
        redFlagDetected: currentInput.toLowerCase().includes("chest pain") || currentInput.toLowerCase().includes("breathless"),
        redFlagDetails: currentInput.toLowerCase().includes("chest pain") ? "Possible cardiac/acute respiratory etiology" : "",
        triagePriority: currentInput.toLowerCase().includes("chest pain") ? "Emergency" : "Moderate",
        ayushObservations: {
          doshaSuspected: "Vata-Pitta Prakopa",
          agniStatus: "Manda Agni (sluggish digestion)",
          dietLifestyleTriggers: "Irregular meal timing, spicy ahara",
        },
        nextPhaseSuggested: "hpi",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/intake/chat:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to process chat" });
  }
});

// 2. OCR & Multimodal Document / Prescription Extraction API
app.post("/api/intake/ocr-extract", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", fileName, documentType } = req.body;

    const ai = getGenAI();

    if (ai && imageBase64) {
      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

      const prompt = `Analyze this medical document (${documentType || "Prescription / Lab Report / Discharge Summary"}).
Extract all clinical information accurately into structured JSON:
1. Prescribed Medications: Drug name, strength, formulation (Tablet/Syrup/Kashayam/Churna), dosage, frequency (e.g. 1-0-1, OD, BD), before/after food, and duration.
2. Diagnoses & Clinical Findings: Previous medical conditions, doctor impressions, Ayush diagnostic terms (if any).
3. Lab Results & Vital Signs: Test names, measured values, reference units, abnormal flags (High/Low/Critical).
4. Allergies & Contraindications mentioned.
5. Doctor / Clinic Name, Date of visit, Follow-up instructions.
6. Red flags or potential drug interactions.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentClassification: { type: Type.STRING, description: "Prescription, Lab Report, Radiology, Discharge Summary" },
              prescribedBy: { type: Type.STRING },
              prescriptionDate: { type: Type.STRING },
              extractedMedications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    medicineName: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    timing: { type: Type.STRING, description: "Before meals / After meals / Bedtime" },
                    duration: { type: Type.STRING },
                    category: { type: Type.STRING, description: "Allopathy, Ayurveda/Ayush, Supplement" },
                  },
                },
              },
              diagnosesFound: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              labParameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    isAbnormal: { type: Type.BOOLEAN },
                    clinicalNote: { type: Type.STRING },
                  },
                },
              },
              allergiesOrWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              summaryText: { type: Type.STRING },
            },
            required: ["documentClassification", "extractedMedications", "diagnosesFound", "summaryText"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    }

    // Fallback extraction simulation if offline
    return res.json({
      success: true,
      data: {
        documentClassification: "Prescription & Clinical OPD Card",
        prescribedBy: "Dr. A. K. Sharma (MD Ayur, Senior Consultant)",
        prescriptionDate: "2026-02-14",
        extractedMedications: [
          {
            medicineName: "Tab. Yogaraj Guggulu",
            dosage: "500 mg",
            frequency: "1-0-1 (BD)",
            timing: "After meals with lukewarm water",
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
            timing: "After breakfast",
            duration: "Continuous",
            category: "Allopathy",
          },
        ],
        diagnosesFound: ["Sandhigata Vata (Osteoarthritis knee)", "Essential Hypertension (Stage 1)"],
        labParameters: [
          { testName: "Serum Uric Acid", value: "6.8", unit: "mg/dL", isAbnormal: false, clinicalNote: "Borderline high normal" },
          { testName: "HbA1c", value: "5.9", unit: "%", isAbnormal: false, clinicalNote: "Pre-diabetic zone" },
          { testName: "Blood Pressure", value: "148/92", unit: "mmHg", isAbnormal: true, clinicalNote: "Uncontrolled systolic" },
        ],
        allergiesOrWarnings: ["Reported mild gastric irritation with NSAIDs (Ibuprofen) in 2024"],
        summaryText: "Patient on integrative regimen for knee joint pain and hypertension. Knee stiffness marked in morning; Telmisartan 40mg active.",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/intake/ocr-extract:", error);
    res.status(500).json({ success: false, error: error.message || "Failed OCR extraction" });
  }
});

// 3. Complete Doctor-Ready Case Summary Generator (SOAP + Ayush Integrative)
app.post("/api/intake/generate-summary", async (req, res) => {
  try {
    const {
      patientProfile,
      chatHistory,
      extractedSymptoms,
      ocrData,
      vitals,
      ayushInputs,
      painScore,
    } = req.body;

    const ai = getGenAI();

    if (ai) {
      const prompt = `Synthesize a comprehensive, doctor-ready patient case sheet and clinical summary for an OPD consultation.
The solution is built for "Smart India Hackathon 2026 (SIH26047)" for the Ministry of Ayush - All India Institute of Ayurveda and Integrative Medicine.

Patient Data:
- Name: ${patientProfile?.name}
- Age: ${patientProfile?.age}, Gender: ${patientProfile?.gender}
- ABHA / Ayush Health ID: ${patientProfile?.abhaId || "ABHA-91-" + Math.floor(1000000000 + Math.random() * 9000000000)}
- Phone: ${patientProfile?.phone}
- Primary Language: ${patientProfile?.language || "English"}
- Pain Rating (1-10): ${painScore || "N/A"}
- Vitals Recorded: ${JSON.stringify(vitals || {})}
- Conversation & Reported Symptoms: ${JSON.stringify(chatHistory || [])}
- Extracted Documents / Medications: ${JSON.stringify(ocrData || [])}
- Ayush Specific Markers (Agni, Kostha, Nidra, Ahara, Dosha): ${JSON.stringify(ayushInputs || {})}

Generate an authoritative, structured clinical summary containing:
1. Triage Acuity (Emergency, High, Moderate, Low) with clear rationale.
2. Red-Flag Alerts (with severity, clinical reasoning, immediate triage recommendation).
3. SOAP Notes:
   - Subjective (Chief Complaints with duration, History of Present Illness (HPI), Past Medical History, Family History, Personal/Lifestyle History, Allergies).
   - Objective (Vitals analysis, General Physical Examination signs, Ayush Ashtavidha Pariksha / Nadi/Jihva indicators, Lab values from OCR).
   - Assessment (Provisional Western Diagnosis, Ayush Nidana/Dosha Lakshana, Differential Diagnoses list with likelihood %).
   - Plan (Suggested integrative management, immediate investigations needed, patient education, diet/lifestyle/Pathya-Apathya guidance).
4. Medical History Timeline (chronological events).
5. Ayush Prakriti & Agni Assessment summary.
6. Key Doctor Talking Points (3-4 bullet points to save consultation time).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              triageAcuity: { type: Type.STRING, description: "Emergency, High, Moderate, Low" },
              triageColor: { type: Type.STRING, description: "red, orange, yellow, green" },
              triageReason: { type: Type.STRING },
              redFlagAlerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING, description: "Critical, High, Moderate" },
                    description: { type: Type.STRING },
                    recommendedAction: { type: Type.STRING },
                  },
                },
              },
              soapNote: {
                type: Type.OBJECT,
                properties: {
                  subjective: {
                    type: Type.OBJECT,
                    properties: {
                      chiefComplaints: { type: Type.ARRAY, items: { type: Type.STRING } },
                      historyOfPresentIllness: { type: Type.STRING },
                      pastMedicalHistory: { type: Type.ARRAY, items: { type: Type.STRING } },
                      medicationHistory: { type: Type.ARRAY, items: { type: Type.STRING } },
                      allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
                      familyHistory: { type: Type.STRING },
                      reviewOfSystems: { type: Type.STRING },
                    },
                  },
                  objective: {
                    type: Type.OBJECT,
                    properties: {
                      vitalsSummary: { type: Type.STRING },
                      physicalExaminationFindings: { type: Type.STRING },
                      diagnosticFindingsFromOCR: { type: Type.ARRAY, items: { type: Type.STRING } },
                      ayushExamination: {
                        type: Type.OBJECT,
                        properties: {
                          nadi: { type: Type.STRING },
                          jihva: { type: Type.STRING },
                          agni: { type: Type.STRING },
                          kostha: { type: Type.STRING },
                          nidra: { type: Type.STRING },
                        },
                      },
                    },
                  },
                  assessment: {
                    type: Type.OBJECT,
                    properties: {
                      primaryProvisionalDiagnosis: { type: Type.STRING },
                      ayushNidanaRoga: { type: Type.STRING },
                      differentialDiagnoses: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            condition: { type: Type.STRING },
                            probability: { type: Type.STRING },
                            rationale: { type: Type.STRING },
                          },
                        },
                      },
                      clinicalRiskStratification: { type: Type.STRING },
                    },
                  },
                  plan: {
                    type: Type.OBJECT,
                    properties: {
                      suggestedModernInterventions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      suggestedAyushFormulations: { type: Type.ARRAY, items: { type: Type.STRING } },
                      pathyaApathyaDietLifestyle: {
                        type: Type.OBJECT,
                        properties: {
                          recommendedPathya: { type: Type.ARRAY, items: { type: Type.STRING } },
                          avoidApathya: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                      },
                      investigationsOrdered: { type: Type.ARRAY, items: { type: Type.STRING } },
                      followUpInterval: { type: Type.STRING },
                    },
                  },
                },
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    period: { type: Type.STRING },
                    title: { type: Type.STRING },
                    details: { type: Type.STRING },
                    type: { type: Type.STRING, description: "onset, medication, surgery, lab, consultation" },
                  },
                },
              },
              doctorTalkingPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              timeSavedMinutesEstimated: { type: Type.INTEGER },
            },
            required: ["triageAcuity", "soapNote", "timeline", "doctorTalkingPoints"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    }

    // Default rich fallback structure if offline
    return res.json({
      success: true,
      data: {
        triageAcuity: vitals?.bpSystolic > 160 || painScore >= 8 ? "High" : "Moderate",
        triageColor: vitals?.bpSystolic > 160 || painScore >= 8 ? "orange" : "yellow",
        triageReason: "Subacute pain presentation with chronic metabolic comorbidity needing physician evaluation.",
        redFlagAlerts: [
          {
            type: "Elevated Systolic Blood Pressure",
            severity: "Moderate",
            description: `Recorded BP is ${vitals?.bpSystolic || 142}/${vitals?.bpDiastolic || 90} mmHg; monitor prior to prescribing stimulant herbs.`,
            recommendedAction: "Recheck BP post-rest; verify antihypertensive compliance.",
          },
        ],
        soapNote: {
          subjective: {
            chiefComplaints: [
              `Bilateral knee pain with morning stiffness lasting >30 mins (Duration: 8 months)`,
              `Epigastric bloating & sour eructations after evening meals (Duration: 3 weeks)`,
            ],
            historyOfPresentIllness:
              "A 54-year-old individual presents with progressive knee ache aggravated by stair climbing and prolonged standing. Also reports mild heartburn after spicy meals. No nocturnal pain or limb weakness.",
            pastMedicalHistory: ["Hypertension diagnosed in 2021", "Dyslipidemia on lifestyle management"],
            medicationHistory: ["Tab. Telmisartan 40mg OD", "Occasional Ayurvedic churnas"],
            allergies: ["NSAIDs (gastric intolerance reported)", "No known drug allergies to Beta-lactams"],
            familyHistory: "Mother had osteoarthritis; Father had CAD at age 65.",
            reviewOfSystems: "Appetite reduced; Sleep disturbed due to stiffness; Bowels irregular (Krura Kostha).",
          },
          objective: {
            vitalsSummary: `BP: ${vitals?.bpSystolic || 142}/${vitals?.bpDiastolic || 90} mmHg, HR: ${vitals?.pulse || 78} bpm, SpO2: ${vitals?.spo2 || 98}%, Temp: ${vitals?.temp || 98.4}°F, BMI: 27.2 kg/m²`,
            physicalExaminationFindings: "Mild crepitus noted in bilateral patellofemoral joints. No joint effusion or acute erythema.",
            diagnosticFindingsFromOCR: [
              "X-Ray Bilateral Knees (Jan 2026): Grade II Kellgren-Lawrence Osteoarthritis with medial joint space narrowing.",
              "Serum Uric Acid: 6.2 mg/dL (Normal).",
            ],
            ayushExamination: {
              nadi: "Vata-Kapha Vahana (Tremulous & slow pulse)",
              jihva: "Sama (Mild white coating at root indicating Ama)",
              agni: "Manda-Vishama Agni (Sluggish & variable digestion)",
              kostha: "Krura Kostha (Constipation tendency)",
              nidra: "Khandita Nidra (Interrupted sleep)",
            },
          },
          assessment: {
            primaryProvisionalDiagnosis: "Bilateral Knee Osteoarthritis (Grade II) & Secondary Functional Dyspepsia",
            ayushNidanaRoga: "Sandhigata Vata (associated with Ama & Vata-Pitta Prakopa)",
            differentialDiagnoses: [
              { condition: "Primary Knee Osteoarthritis", probability: "85%", rationale: "Age, mechanical pain, crepitus, classic X-ray changes" },
              { condition: "Anserine Bursitis", probability: "25%", rationale: "Medial joint tenderness may have soft-tissue component" },
              { condition: "Crystal Arthropathy (Gout/CPPD)", probability: "10%", rationale: "Low likelihood given normal uric acid and subacute onset" },
            ],
            clinicalRiskStratification: "Low cardiac risk; moderate functional musculoskeletal limitation.",
          },
          plan: {
            suggestedModernInterventions: [
              "Isometric quadriceps strengthening physiotherapy",
              "Topical NSAID gel / Capsaicin cream for localized pain flare",
              "Continue antihypertensive Telmisartan 40mg with BP log",
            ],
            suggestedAyushFormulations: [
              "Yogaraj Guggulu 500mg BD after meals",
              "Dashamoola Kashayam 15ml with equal water BD before food",
              "Janu Basti / Patra Pinda Sweda local fomentation course (7 days)",
              "Shunthi (Zingiber officinale) + Haritaki churna at bedtime for Ama Pachana",
            ],
            pathyaApathyaDietLifestyle: {
              recommendedPathya: ["Warm freshly cooked meals", "Ghee in moderation", "Fenugreek (Methi) seeds water", "Gentle non-weight bearing swimming/cycling"],
              avoidApathya: ["Dry cold fermented foods (Vatala ahara)", "Direct air-conditioner exposure on joints", "Excessive curd at night", "Prolonged cross-legged sitting"],
            },
            investigationsOrdered: ["Repeat Fasting Lipid Profile & HbA1c", "Serum Calcium & Vitamin D3 25-OH"],
            followUpInterval: "Review in OPD after 3 weeks with exercise compliance log",
          },
        },
        timeline: [
          { period: "2021", title: "Hypertension Diagnosis", details: "Initiated on Telmisartan 40mg with good control.", type: "medication" },
          { period: "June 2025", title: "Knee Discomfort Onset", details: "First noticed pain after descending stairs during pilgrimage.", type: "onset" },
          { period: "Jan 2026", title: "Orthopedic Evaluation & X-Ray", details: "Diagnosed with Grade II Bilateral OA Knee.", type: "lab" },
          { period: "Today", title: "MediSaarthi AI Pre-Consultation Intake", details: "Structured case prepared with integrative Ayush + Allopathy triage.", type: "consultation" },
        ],
        doctorTalkingPoints: [
          "Patient has morning stiffness for 30 min; confirm if knee clicking limits walking distance.",
          "Check adherence to Telmisartan; BP today is 142/90 mmHg.",
          "Inquire about gastric tolerance before recommending any oral analgesics.",
          "Highlight Ayurvedic Janu Basti and quadriceps exercises for joint preservation.",
        ],
        timeSavedMinutesEstimated: 14,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/intake/generate-summary:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate summary" });
  }
});

// 4. Doctor AI Clinical Scribe & Prescription Formatter
app.post("/api/doctor/dictate-enhance", async (req, res) => {
  try {
    const { roughDoctorNotes, currentSoapNote } = req.body;
    const ai = getGenAI();

    if (ai && roughDoctorNotes) {
      const prompt = `You are a medical scribe assistant for a doctor.
The doctor just dictated rough clinical notes: "${roughDoctorNotes}".
Enhance and structure these notes into clean professional medical prose formatted for the Doctor's Plan / Clinical Notes section.
Keep the doctor in full control. Retain all specific drugs, dosages, and diagnostic insights.

Return JSON with:
- enhancedNotes: string (formal medical wording)
- additionalRx: array of { medicineName, dosage, frequency, duration, instructions }
- followUpNote: string`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              enhancedNotes: { type: Type.STRING },
              additionalRx: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    medicineName: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                  },
                },
              },
              followUpNote: { type: Type.STRING },
            },
            required: ["enhancedNotes"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    }

    return res.json({
      success: true,
      data: {
        enhancedNotes: `Doctor Examination & Findings: ${roughDoctorNotes}. Advised continuation of integrative supportive care with close vital monitoring.`,
        additionalRx: [],
        followUpNote: "Review in 2 weeks or SOS if symptoms aggravate.",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/doctor/dictate-enhance:", error);
    res.status(500).json({ success: false, error: error.message || "Failed enhancement" });
  }
});

// Setup Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediSaarthi AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
