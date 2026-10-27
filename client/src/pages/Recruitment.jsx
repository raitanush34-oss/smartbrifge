import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  Plus,
  MoveRight,
  UserCheck,
  Star,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'border-slate-300 bg-slate-50 dark:bg-slate-800/40' },
  { id: 'screening', label: 'Screening', color: 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' },
  { id: 'interview', label: 'Tech Round', color: 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' },
  { id: 'offer', label: 'Offer Rollout', color: 'border-purple-300 bg-purple-50/50 dark:bg-purple-950/20' },
  { id: 'hired', label: 'Hired & Onboarded', color: 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' },
];

const Recruitment = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  // Forms
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    jobTitle: '',
    stage: 'applied',
    rating: 5,
    experienceYears: 4,
    currentCtc: '14 LPA',
    expectedCtc: '20 LPA',
    noticePeriod: '30 Days',
    location: 'Bengaluru',
    notes: '',
  });

  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bengaluru (Bellandur / Hybrid)',
    jobType: 'Full-time',
    vacancies: 2,
    salaryRange: '₹18,00,000 - ₹26,00,000 LPA',
    description: '',
  });

  const fetchRecruitmentData = async () => {
    try {
      const [candRes, jobRes] = await Promise.all([
        api.get('/recruitment/candidates'),
        api.get('/recruitment/jobs'),
      ]);
      if (candRes.data?.success) setCandidates(candRes.data.data);
      if (jobRes.data?.success) setJobs(jobRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  const handleMoveStage = async (candidate, nextStage) => {
    try {
      const res = await api.patch(`/recruitment/candidates/${candidate._id}/stage`, {
        stage: nextStage,
      });
      if (res.data?.success) {
        setCandidates((prev) =>
          prev.map((c) => (c._id === candidate._id ? { ...c, stage: nextStage } : c))
        );
        setToast({ type: 'success', message: `${candidate.name} moved to ${nextStage.toUpperCase()}!` });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to update candidate stage' });
    }
  };

  const handleConvertToEmployee = async (candidate) => {
    try {
      const res = await api.post(`/recruitment/candidates/${candidate._id}/convert-to-employee`);
      if (res.data?.success) {
        // Trigger celebratory confetti effect
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        setToast({
          type: 'success',
          message: `🎉 Badhaai Ho! ${candidate.name} is now onboarded into the Indian Tech Roster!`,
        });
        fetchRecruitmentData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Conversion failed' });
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/recruitment/candidates', newCandidate);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Candidate added to Indian talent pipeline!' });
        setCandidateModalOpen(false);
        setNewCandidate({
          name: '',
          email: '',
          phone: '+91 ',
          jobTitle: '',
          stage: 'applied',
          rating: 5,
          experienceYears: 4,
          currentCtc: '14 LPA',
          expectedCtc: '20 LPA',
          noticePeriod: '30 Days',
          location: 'Bengaluru',
          notes: '',
        });
        fetchRecruitmentData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error adding candidate' });
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/recruitment/jobs', newJob);
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Job opening posted!' });
        setJobModalOpen(false);
        setNewJob({
          title: '',
          department: 'Engineering',
          location: 'Bengaluru (Bellandur / Hybrid)',
          jobType: 'Full-time',
          vacancies: 2,
          salaryRange: '₹18,00,000 - ₹26,00,000 LPA',
          description: '',
        });
        fetchRecruitmentData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error creating job' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-blue-600" />
            Indian Tech Recruitment & Kanban Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track notice periods, CTC expectations in LPA, technical screening rounds, and 1-click onboard hired engineers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJobModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Building className="h-4 w-4 text-blue-600" /> Post Tech Opening
          </button>
          <button
            onClick={() => setCandidateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Active Tech Openings Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-blue-500" /> Active Openings Across Tech Centers ({jobs.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{job.title}</span>
                <span className="text-[11px] text-slate-400 ml-2">
                  {job.department} &bull; {job.vacancies} open &bull; {job.salaryRange}
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase">
                Hiring
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.stage === stage.id);
          return (
            <div
              key={stage.id}
              className={`flex flex-col rounded-2xl border ${stage.color} p-4 min-h-[500px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {stage.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageCandidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {candidate.name}
                      </h4>
                      <div className="flex items-center text-amber-400 text-[10px] font-bold">
                        <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                        {candidate.rating}
                      </div>
                    </div>

                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                      {candidate.jobTitle}
                    </p>

                    {/* Indian CTC & Notice Period Badge */}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {candidate.currentCtc || '12 LPA'} ➔ {candidate.expectedCtc || '18 LPA'}
                      </span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        ⏳ {candidate.noticePeriod || '30 Days'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1.5">
                      📍 {candidate.location || 'Bengaluru'} &bull; {candidate.experienceYears}y exp
                    </p>

                    {candidate.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded dark:bg-slate-800">
                        "{candidate.notes}"
                      </p>
                    )}

                    {/* Stage shift actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      {stage.id !== 'hired' ? (
                        <>
                          {/* Next stage selector */}
                          <select
                            value={candidate.stage}
                            onChange={(e) => handleMoveStage(candidate, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <option value="applied">Applied</option>
                            <option value="screening">Screening</option>
                            <option value="interview">Tech Round</option>
                            <option value="offer">Offer Rollout</option>
                            <option value="hired">Hired</option>
                          </select>

                          {stage.id === 'offer' && (
                            <button
                              onClick={() => handleConvertToEmployee(candidate)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-emerald-700"
                              title="1-Click Onboard to Employee"
                            >
                              <UserCheck className="h-3 w-3" /> Hire & Onboard
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Onboarded on Tech Payroll
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      <Modal isOpen={candidateModalOpen} onClose={() => setCandidateModalOpen(false)} title="Add Candidate to Tech Pipeline">
        <form onSubmit={handleAddCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
            <input
              type="text"
              value={newCandidate.name}
              onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Email Address *</label>
              <input
                type="email"
                value={newCandidate.email}
                onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Mobile Phone (+91)</label>
              <input
                type="text"
                value={newCandidate.phone}
                onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Current CTC</label>
              <input
                type="text"
                value={newCandidate.currentCtc}
                onChange={(e) => setNewCandidate({ ...newCandidate, currentCtc: e.target.value })}
                placeholder="e.g. 14 LPA"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Expected CTC</label>
              <input
                type="text"
                value={newCandidate.expectedCtc}
                onChange={(e) => setNewCandidate({ ...newCandidate, expectedCtc: e.target.value })}
                placeholder="e.g. 20 LPA"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Notice Period</label>
              <select
                value={newCandidate.noticePeriod}
                onChange={(e) => setNewCandidate({ ...newCandidate, noticePeriod: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="Immediate / Buyout">Immediate / Buyout</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
                <option value="90 Days">90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Target Role *</label>
              <input
                type="text"
                value={newCandidate.jobTitle}
                onChange={(e) => setNewCandidate({ ...newCandidate, jobTitle: e.target.value })}
                placeholder="e.g. Senior MERN Developer"
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Recruiter Notes / Alma Mater</label>
            <textarea
              value={newCandidate.notes}
              onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
              rows="3"
              placeholder="Candidate background, college, tech round remarks..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCandidateModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700"
            >
              Add to Pipeline
            </button>
          </div>
        </form>
      </Modal>

      {/* Post Job Modal */}
      <Modal isOpen={jobModalOpen} onClose={() => setJobModalOpen(false)} title="Create New Tech Opening">
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Job Title *</label>
            <input
              type="text"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              placeholder="e.g. Lead React & Node.js Architect"
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Department</label>
              <select
                value={newJob.department}
                onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Vacancies</label>
              <input
                type="number"
                value={newJob.vacancies}
                onChange={(e) => setNewJob({ ...newJob, vacancies: Number(e.target.value) })}
                min="1"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tech Hub Location</label>
              <input
                type="text"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="e.g. Bengaluru HQ / Hyderabad"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">CTC Range (LPA)</label>
              <input
                type="text"
                value={newJob.salaryRange}
                onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                placeholder="e.g. ₹20,00,000 - ₹30,00,000 LPA"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setJobModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700"
            >
              Publish Tech Opening
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Recruitment;
