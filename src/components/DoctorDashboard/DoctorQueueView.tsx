import React, { useState } from "react";
import {
  Users,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  Sparkles,
  Stethoscope,
  Activity,
  FileText,
  UserCheck,
} from "lucide-react";
import { PatientCase } from "../../types";

interface DoctorQueueViewProps {
  cases: PatientCase[];
  onSelectCase: (caseItem: PatientCase) => void;
  onOpenNewIntake: () => void;
}

export const DoctorQueueView: React.FC<DoctorQueueViewProps> = ({
  cases,
  onSelectCase,
  onOpenNewIntake,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAcuity, setFilterAcuity] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Calculations
  const criticalCount = cases.filter(
    (c) => c.triageAcuity === "Emergency" || c.triageAcuity === "High" || c.redFlags.length > 0
  ).length;

  const totalTimeSaved = cases.reduce(
    (acc, c) => acc + (c.estimatedHistoryTimeSavedMin || 15),
    0
  );

  const completedCount = cases.filter((c) => c.status === "Consultation Completed").length;
  const waitingCount = cases.length - completedCount;

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.patientProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientProfile.abhaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.soapNote.subjective.chiefComplaints.some((cc) =>
        cc.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesAcuity =
      filterAcuity === "All" ? true : c.triageAcuity === filterAcuity;

    const matchesStatus =
      filterStatus === "All"
        ? true
        : filterStatus === "Completed"
        ? c.status === "Consultation Completed"
        : c.status !== "Consultation Completed";

    return matchesSearch && matchesAcuity && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Welcome & Metrics Strip */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 font-bold border border-teal-600/40">
                AIIA Integrative OPD Hub
              </span>
              <span className="text-xs text-slate-400">Dr. K. N. Mishra (Room 104)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              Active Doctor OPD Consultation Queue
            </h2>
            <p className="text-xs text-slate-400">
              Patient clinical histories are pre-synthesized by MediSaarthi AI with Ayush & Allopathy SOAP structuring.
            </p>
          </div>

          <button
            onClick={onOpenNewIntake}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-emerald-900/40 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Start New Patient Intake</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Patients in Queue</span>
              <div className="text-xl font-black text-white">{waitingCount} Waiting</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Red-Flag / High Triage</span>
              <div className="text-xl font-black text-rose-400">{criticalCount} Flagged</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Consultation Time Saved</span>
              <div className="text-xl font-black text-emerald-400">~{totalTimeSaved} Mins</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Completed & Signed</span>
              <div className="text-xl font-black text-teal-400">{completedCount} Patients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient Name, Token (#OPD-...), ABHA ID, or Symptom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Acuity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Triage:</span>
            <select
              value={filterAcuity}
              onChange={(e) => setFilterAcuity(e.target.value)}
              className="p-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium outline-none"
            >
              <option value="All">All Triage Levels</option>
              <option value="Emergency">Emergency</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Routine">Routine</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Waiting">Waiting / In Queue</option>
            <option value="Completed">Completed & Approved</option>
          </select>
        </div>
      </div>

      {/* Patients Queue List */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No matching patients found in queue.</p>
            <p className="text-xs text-slate-400">Try adjusting your search filters or start a new patient intake.</p>
          </div>
        ) : (
          filteredCases.map((patientCase) => {
            const hasRedFlag = patientCase.redFlags.length > 0;
            const isCompleted = patientCase.status === "Consultation Completed";

            return (
              <div
                key={patientCase.id}
                onClick={() => onSelectCase(patientCase)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                  hasRedFlag && !isCompleted
                    ? "bg-rose-50/50 border-rose-300 hover:border-rose-400"
                    : isCompleted
                    ? "bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100"
                    : "bg-white border-slate-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: Token & Patient Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono shrink-0 shadow-sm">
                      <span className="text-[10px] text-slate-400 uppercase">Token</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {patientCase.tokenNumber.split("-").pop() || "01"}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {patientCase.patientProfile.name}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">
                          ({patientCase.patientProfile.age} Y • {patientCase.patientProfile.gender})
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {patientCase.patientProfile.abhaId}
                        </span>
                      </div>

                      {/* Chief Complaints Tagged */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-semibold text-slate-700">Complaints:</span>
                        {patientCase.soapNote.subjective.chiefComplaints.map((cc, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-medium"
                          >
                            {cc}
                          </span>
                        ))}
                      </div>

                      {/* Clinical Summary snippet */}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-1 italic">
                        "{patientCase.soapNote.subjective.historyOfPresentIllness}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Badges & Call to Action */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
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
                        {patientCase.triageAcuity} Triage
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {patientCase.status}
                      </span>
                    </div>

                    {hasRedFlag && (
                      <div className="text-xs font-bold text-rose-700 flex items-center gap-1 bg-rose-100/70 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{patientCase.redFlags[0].type}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold mt-1 group">
                      <span>Open Pre-Synthesized SOAP Sheet</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
