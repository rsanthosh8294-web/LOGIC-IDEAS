import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  AlertTriangle,
  Activity,
  Heart,
  Flame,
  CheckCircle2,
  HelpCircle,
  Plus,
  RotateCcw,
} from "lucide-react";
import { ChatMessage, LanguageCode, PatientCase, RedFlagAlert } from "../../types";
import { COMMON_SYMPTOMS, SUPPORTED_LANGUAGES } from "../../data/multilingualPrompts";
import { SpeechService } from "../../utils/speechUtils";

interface VoiceTouchChatStepProps {
  patientName: string;
  patientAge: number;
  patientGender: string;
  selectedLang: LanguageCode;
  chatHistory: ChatMessage[];
  onUpdateChatHistory: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  painScore: number;
  onPainScoreChange: (score: number) => void;
  painLocation?: string;
  onPainLocationChange: (loc: string) => void;
  onRedFlagFound: (alert: RedFlagAlert) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VoiceTouchChatStep: React.FC<VoiceTouchChatStepProps> = ({
  patientName,
  patientAge,
  patientGender,
  selectedLang,
  chatHistory,
  onUpdateChatHistory,
  painScore,
  onPainScoreChange,
  painLocation,
  onPainLocationChange,
  onRedFlagFound,
  onNext,
  onBack,
}) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [autoSpeak, setAutoSpeak] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isAiLoading]);

  // Initial greeting if chat is empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      const initialGreeting =
        selectedLang === "hi"
          ? `नमस्ते ${patientName} जी! मैं मेडि-सारथी AI हूँ। आज आपको क्या मुख्य शारीरिक या मानसिक परेशानी महसूस हो रही है? आप बोलकर बता सकते हैं या नीचे दिए गए लक्षणों को चुन सकते हैं।`
          : selectedLang === "sa"
          ? `नमस्ते ${patientName}! अहं मेडि-सारथी अस्मि। अद्य भवते का मुख्य वेदना वा असुविधा वर्तते?`
          : `Hello ${patientName}! I am MediSaarthi AI, your clinical intake assistant. What primary symptoms or health concerns are you experiencing today? You can speak, type, or tap any common symptoms below.`;

      const initialQuickReplies =
        selectedLang === "hi"
          ? ["घुटनों व जोड़ों में दर्द", "खट्टी डकारें व गैस (Amlapitta)", "बुखार और बदन दर्द", "सीने में भारीपन"]
          : ["Joint & knee pain", "Acidity & indigestion", "Fever & body ache", "Persistent cough"];

      onUpdateChatHistory((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: "ai",
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuickReplies: initialQuickReplies,
        },
      ]);

      if (autoSpeak) {
        SpeechService.speak(initialGreeting, langConfig.voiceLangCode);
      }
    }
  }, [selectedLang, patientName]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputText).trim();
    if (!messageText || isAiLoading) return;

    // Stop mic if listening
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "patient",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onUpdateChatHistory((prev) => [...prev, userMsg]);
    setInputText("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: [...chatHistory, userMsg].map((m) => ({
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          patientProfile: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
          },
          currentInput: messageText,
          language: langConfig.label,
          ayushMode: true,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const aiData = resData.data;

        // Check if Red Flag is detected
        if (aiData.redFlagDetected) {
          onRedFlagFound({
            id: `rf-${Date.now()}`,
            type: "Clinical Red Flag Alert Detected",
            severity: aiData.triagePriority === "Emergency" ? "Critical" : "High",
            description: aiData.redFlagDetails || "Urgent symptom identified during patient intake dialogue.",
            recommendedAction: "Notify attending physician for expedited triage.",
          });
        }

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: "ai",
          text: aiData.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          extractedSymptoms: aiData.extractedSymptoms || [],
          suggestedQuickReplies: aiData.suggestedQuickReplies || [],
          isRedFlagAlert: aiData.redFlagDetected,
        };

        onUpdateChatHistory((prev) => [...prev, aiMsg]);

        if (autoSpeak) {
          setSpeakingMsgId(aiMsg.id);
          SpeechService.speak(aiMsg.text, langConfig.voiceLangCode, () => {
            setSpeakingMsgId(null);
          });
        }
      }
    } catch (err) {
      console.error("Error communicating with AI:", err);
      // Fallback
      const fallbackMsg: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: "ai",
        text: `Thank you for sharing that. To help the doctor understand further: How long have you had this, and is it worse at any particular time?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedQuickReplies: ["Since 2-3 days", "Over 1 month", "Worse in morning", "Worse after eating"],
      };
      onUpdateChatHistory((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      SpeechService.startListening(
        langConfig.voiceLangCode,
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal && transcript.trim().length > 3) {
            handleSendMessage(transcript);
          }
        },
        (error) => {
          console.warn("Mic error:", error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const speakMessage = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      SpeechService.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      SpeechService.stopSpeaking();
      setSpeakingMsgId(msgId);
      SpeechService.speak(text, langConfig.voiceLangCode, () => {
        setSpeakingMsgId(null);
      });
    }
  };

  // Collect all extracted symptoms from history
  const allExtractedSymptoms = Array.from(
    new Set(chatHistory.flatMap((m) => m.extractedSymptoms || []))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Step 2: Multilingual Voice & Touch Case-Taking</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                {langConfig.nativeLabel} ({langConfig.label})
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Speak using your microphone or tap the quick symptom buttons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              autoSpeak
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{autoSpeak ? "Voice Readout: ON" : "Voice Readout: OFF"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chat Window & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px]">
            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatHistory.map((msg) => {
                const isAi = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-start gap-2 max-w-[88%]">
                      {isAi && (
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold border border-emerald-500/40">
                          AI
                        </div>
                      )}
                      <div>
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isAi
                              ? msg.isRedFlagAlert
                                ? "bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-tl-sm"
                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                              : "bg-emerald-600 text-white rounded-tr-sm"
                          }`}
                        >
                          {msg.isRedFlagAlert && (
                            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-1.5 pb-1 border-b border-rose-200">
                              <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                              <span>Clinical Red-Flag Indicator Detected</span>
                            </div>
                          )}

                          <p>{msg.text}</p>

                          {/* Audio read-aloud button for AI */}
                          {isAi && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                              <span>{msg.timestamp}</span>
                              <button
                                type="button"
                                onClick={() => speakMessage(msg.id, msg.text)}
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-0.5 rounded hover:bg-emerald-50 transition"
                              >
                                {speakingMsgId === msg.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                    <span>Stop Voice</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick-tap Suggested Buttons for AI message */}
                        {isAi && msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                            {msg.suggestedQuickReplies.map((reply, rIdx) => (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => handleSendMessage(reply)}
                                className="px-3 py-1.5 text-xs rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-medium transition shadow-2xs hover:shadow-xs active:scale-95"
                              >
                                {reply}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAiLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <div className="p-3 bg-white rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-200"></span>
                    <span className="text-slate-500 text-xs ml-1">Analyzing symptoms with Ayush clinical models...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 rounded-b-2xl space-y-2">
              {isListening && (
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Listening in {langConfig.nativeLabel}... (Speak your symptoms now)</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className="text-xs font-bold text-rose-800 underline"
                  >
                    Done
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Microphone Button */}
                <button
                  type="button"
                  id="btn-voice-mic"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-all flex items-center justify-center shadow-sm ${
                    isListening
                      ? "bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse"
                      : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200"
                  }`}
                  title="Speak via Microphone"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-600" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  id="chat-text-input"
                  placeholder={
                    selectedLang === "hi"
                      ? "लक्षण लिखें या बोलें (उदा. 3 दिन से सीने में जलन है)..."
                      : "Type or speak your symptoms (e.g. Sharp knee pain on bending)..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  id="btn-chat-send"
                  disabled={!inputText.trim() || isAiLoading}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Symptom Chips Picker */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Tap to Add Common Symptoms</span>
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((symp) => {
                const labelInLang = symp.translations[selectedLang] || symp.translations["en"] || symp.name;
                return (
                  <button
                    key={symp.id}
                    type="button"
                    onClick={() => handleSendMessage(labelInLang)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 active:scale-95 ${
                      symp.isPotentialRedFlag
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200 hover:border-rose-300"
                        : "bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{labelInLang}</span>
                    {symp.isPotentialRedFlag && (
                      <span className="text-[10px] text-rose-600 font-bold">⚠️ Urgent</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Pain Assessment & Extracted Clinical Log */}
        <div className="space-y-4">
          {/* Pain Scale (0-10) Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Pain & Discomfort Severity</span>
              </h4>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  painScore >= 8
                    ? "bg-rose-100 text-rose-800"
                    : painScore >= 5
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {painScore} / 10
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={painScore}
                onChange={(e) => onPainScoreChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>0 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe/Unbearable)</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Primary Body Location
              </label>
              <input
                type="text"
                placeholder="e.g. Right Knee, Epigastrium, Lower Back"
                value={painLocation || ""}
                onChange={(e) => onPainLocationChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Real-time Extracted Clinical Facts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Extracted Symptoms Log ({allExtractedSymptoms.length})</span>
            </h4>

            {allExtractedSymptoms.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Symptoms will be automatically tagged as you speak with MediSaarthi AI.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allExtractedSymptoms.map((symp, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-950 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{symp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-1/3 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              ← Back
            </button>

            <button
              type="button"
              id="btn-proceed-to-ocr"
              onClick={onNext}
              className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer shadow-emerald-700/20"
            >
              <span>Next: Scan Prescriptions / Reports</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
