import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import {
  MoreHorizontal, Trash2, Share2, Building2, MapPin, Wallet, Briefcase, PlusCircle,
  X, Upload, FileText, CheckCircle2, XCircle, Clock, Loader2,
  Users, CalendarDays, ChevronDown, ChevronUp, Star, Award, ArrowRight, Send,
  Eye, EyeOff, Download, Cpu, Code2, Lightbulb, UserCheck, Mail, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
interface Application {
  _id: string;
  student: { name: string; username: string; collegeEmail: string; department: string; batch: string; yearOfStudy?: string };
  status: 'pending' | 'screening' | 'shortlisted' | 'rejected';
  aiScore: number | null;
  aiSummary: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string;
  studentSkills: string[];
  experience: string;
  projects: string;
  resumePath: string;
  interviewDate: string | null;
  screened: boolean;
  emailSent: boolean;
  createdAt: string;
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  screening: 'bg-primary/10 text-primary',
  shortlisted: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive'
};
const statusIcon: Record<string, JSX.Element> = {
  pending: <Clock size={13} />,
  screening: <Loader2 size={13} className="animate-spin" />,
  shortlisted: <CheckCircle2 size={13} />,
  rejected: <XCircle size={13} />
};

const Jobs = () => {
  const { user } = useAuth();
  const pageRef = usePageTransition();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Alumni: see applicants panel per job
  const [openApplicants, setOpenApplicants] = useState<string | null>(null);
  const [applicantsMap, setApplicantsMap] = useState<Record<string, Application[]>>({});
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [interviewDates, setInterviewDates] = useState<Record<string, string>>({});
  // Track which applicant detail panels are expanded
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const toggleDetails = (appId: string) => setExpandedDetails(prev => ({ ...prev, [appId]: !prev[appId] }));

  // Student: apply states per job
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyStep, setApplyStep] = useState(1);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    experience: 'Fresher',
    projects: '',
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);
  const [screening, setScreening] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [myStatuses, setMyStatuses] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '', company: '', location: '', salaryMin: '', salaryMax: '',
    jobType: 'full-time', companyWebsiteURL: '', description: '', skills: ''
  });

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [verifiedApplicants, setVerifiedApplicants] = useState<Application[]>([]);

  const fetchJobs = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);

        // Default: auto-select the first available job so right panel always shows applicants
        if (data.jobs.length > 0 && (user?.role === 'alumni' || user?.role === 'admin') && !selectedJobId) {
          setSelectedJobId(data.jobs[0]._id);
          toggleApplicants(data.jobs[0]._id);
        }

        // For students, fetch their application status for each job
        if (user?.role === 'student') {
          fetchMyStatuses(data.jobs.map((j: any) => j._id), token!);
        }
      }
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStatuses = async (jobIds: string[], token: string) => {
    const statuses: Record<string, any> = {};
    await Promise.all(
      jobIds.map(async (id) => {
        try {
          const res = await fetch(`/api/resume/${id}/my-status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const d = await res.json();
          if (d.success) statuses[id] = d;
        } catch { }
      })
    );
    setMyStatuses(statuses);
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const canPost = user?.role === 'admin' || user?.role === 'alumni';
  const isStudent = user?.role === 'student';

  // ── Post Job ──────────────────────────────────────────────────────────────
  const handleAddJob = async () => {
    if (!formData.title || !formData.company || !formData.description) {
      toast.error('Please fill in required fields (Title, Company, Description)');
      return;
    }
    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading('Posting Opportunity...');

    // Prepare data for backend
    const payload = {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      companyWebsiteURL: formData.companyWebsiteURL || 'https://placeholder.com',
      salary: {
        min: Number(formData.salaryMin) || 0,
        max: Number(formData.salaryMax) || 0,
        currency: 'INR'
      }
    };

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Job posted!', { id: tid });
        setFormData({ title: '', company: '', location: '', salaryMin: '', salaryMax: '', jobType: 'full-time', companyWebsiteURL: '', description: '', skills: '' });
        setShowModal(false);
        fetchJobs();
      } else {
        toast.error(data.error || data.message || 'Failed to post job', { id: tid });
      }
    } catch {
      toast.error('Connection error', { id: tid });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this job listing?')) return;
    const prev = [...jobs];
    setJobs(jobs.filter(j => j._id !== id));
    setOpenDropdown(null);
    const token = localStorage.getItem('alumni_hub_token');
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) { setJobs(prev); toast.error(data.message || 'Delete failed'); }
      else toast.success('Job removed');
    } catch { setJobs(prev); toast.error('Connection error'); }
  };

  // ── Student: upload resume ────────────────────────────────────────────────
  const handleApplySubmit = async () => {
    if (!applyFile || !applyJobId) return;

    // Auto-add skill if user typed but didn't press enter
    let finalSkills = [...studentInfo.skills];
    if (skillInput.trim()) {
      const skillsFromInput = skillInput.split(',').map(s => s.trim()).filter(s => s && !finalSkills.includes(s));
      finalSkills = [...finalSkills, ...skillsFromInput];
    }

    if (finalSkills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }

    // ── Link Validation ──────────────────────────────────────────────────
    const link = studentInfo.projects.trim().toLowerCase();
    if (link) {
      const isGithub = link.includes('github.com') || link.includes('github.io');
      const isPortfolio = [
        'vercel.app', 'netlify.app', 'behance.net',
        'dribbble.com', 'portfolio', 'resume', 'me.'
      ].some(k => link.includes(k));

      if (!isGithub && !isPortfolio) {
        toast.error('Invalid Link! Please provide a GitHub or Portfolio link (Vercel, Netlify, etc.)');
        return;
      }
    }
    // ───────────────────────────────────────────────────────────────────

    const token = localStorage.getItem('alumni_hub_token');

    setScreening(true);
    setApplyStep(3); // Result step

    try {
      const form = new FormData();
      form.append('resume', applyFile);
      form.append('experience', studentInfo.experience);
      form.append('projects', studentInfo.projects);
      studentInfo.skills.forEach(s => form.append('studentSkills[]', s));

      const res = await fetch(`/api/resume/${applyJobId}/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setApplyStep(3); // Show Success/Final step
        setAiResult({ status: 'Submitted' }); // Artificial result to show success screen
        // Refresh status
        if (applyJobId) {
          const statRes = await fetch(`/api/resume/${applyJobId}/my-status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const statData = await statRes.json();
          setMyStatuses(prev => ({ ...prev, [applyJobId]: statData }));
        }
      } else {
        toast.error(data.message || 'Application failed');
        setApplyStep(2);
      }
    } catch (err) {
      toast.error('System error during submission');
    } finally {
      setScreening(false);
    }
  };

  const handleRunAIScreening = async (applicationId: string, jobId: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading('Al is analyzing resume...');
    try {
      const res = await fetch(`/api/resume/${applicationId}/screen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('AI Screening complete!', { id: tid });
        // Refresh applicants for this job
        setApplicantsMap(prev => ({ ...prev, [jobId]: undefined as any }));
        toggleApplicants(jobId);
      } else {
        toast.error(data.message || 'Screening failed', { id: tid });
      }
    } catch {
      toast.error('Connection error', { id: tid });
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !studentInfo.skills.includes(s)) {
      setStudentInfo({ ...studentInfo, skills: [...studentInfo.skills, s] });
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) => {
    setStudentInfo({ ...studentInfo, skills: studentInfo.skills.filter(skill => skill !== s) });
  };

  // ── Alumni: fetch applicants ──────────────────────────────────────────────
  const toggleApplicants = async (jobId: string, force = false) => {
    if (!force && openApplicants === jobId) { setOpenApplicants(null); return; }
    setOpenApplicants(jobId);
    if (!force && applicantsMap[jobId]) return; // already loaded
    setApplicantsLoading(true);
    try {
      const token = localStorage.getItem('alumni_hub_token');
      const res = await fetch(`/api/resume/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApplicantsMap(prev => ({ ...prev, [jobId]: data.applications }));
      }
    } catch { toast.error('Failed to load applicants'); }
    finally { setApplicantsLoading(false); }
  };

  // ── Alumni: shortlist / reject ────────────────────────────────────────────
  const handleStatusChange = async (applicationId: string, status: 'shortlisted' | 'rejected', jobId: string) => {
    const interviewDate = interviewDates[applicationId];
    if (status === 'shortlisted' && !interviewDate) {
      toast.error('Please set an interview date before shortlisting');
      return;
    }
    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading(status === 'shortlisted' ? 'Shortlisting and sending email...' : 'Rejecting...');
    try {
      const res = await fetch(`/api/resume/${applicationId}/shortlist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, interviewDate })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: tid });
        // Refresh applicants
        setApplicantsMap(prev => {
          const newMap = { ...prev };
          delete newMap[jobId];
          return newMap;
        });
        toggleApplicants(jobId);
      } else {
        toast.error(data.message, { id: tid });
      }
    } catch {
      toast.error('Connection error', { id: tid });
    }
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);

  return (
    <MainLayout>
      <div className="pt-24 pb-0 px-4 h-screen overflow-hidden bg-background/50">
        <div ref={pageRef} className="max-w-none mx-auto w-full h-full">
          {canPost ? (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">
              {/* LEFT SIDE: JOBS LIST */}
              <div className="lg:w-1/3 flex flex-col gap-6">
                <div className="glass-card rounded-[2rem] p-6 border border-primary/10 shadow-xl flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Job Board</h2>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">Manage Opportunities</p>
                  </div>
                  <button onClick={() => setShowModal(true)} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                    <PlusCircle size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                  <div className="mb-2">
                    {loading ? (
                      <div className="py-10 text-center animate-pulse">
                        <Loader2 className="animate-spin mx-auto text-primary mb-2" size={24} />
                      </div>
                    ) : (() => {
                      const myJobs = jobs.filter(j => j.postedBy?._id === user?.id || j.postedBy === user?.id);
                      const otherJobs = jobs.filter(j => j.postedBy?._id !== user?.id && j.postedBy !== user?.id);

                      const jobCard = (job: any, isOwn: boolean) => (
                        <div
                          key={job._id}
                          onClick={() => {
                            setSelectedJobId(job._id);
                            // If clicking the same job header, or map is empty, force a refresh to catch new applicants
                            const shouldRefresh = applicantsMap[job._id] === undefined || selectedJobId === job._id;
                            toggleApplicants(job._id, shouldRefresh);
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group mb-3 ${selectedJobId === job._id
                            ? isOwn
                              ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.02]'
                              : 'border-primary/60 bg-primary/5 shadow-lg scale-[1.01]'
                            : isOwn
                              ? 'glass-card border-primary/20 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]'
                              : 'bg-muted/20 border-border/40 hover:border-border hover:bg-muted/40 opacity-70 hover:opacity-100'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${selectedJobId === job._id
                              ? 'bg-primary text-white'
                              : isOwn
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                              }`}>
                              <Building2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-black text-sm truncate leading-tight ${selectedJobId === job._id ? 'text-primary' : isOwn ? 'text-foreground' : 'text-foreground/70'
                                }`}>
                                {job.title}
                              </h3>
                              <p className={`text-xs font-bold uppercase tracking-widest truncate mt-1 ${isOwn ? 'text-muted-foreground' : 'text-muted-foreground/60'
                                }`}>{job.company}</p>
                            </div>
                            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase flex-shrink-0 ${job.jobType === 'full-time'
                              ? isOwn ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground/70'
                              : isOwn ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground/70'
                              }`}>
                              {(job.jobType || 'full-time').replace('-', ' ')}
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <>
                          {/* ── MY POSTINGS ── */}
                          <div className="mb-2">
                            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                              My Postings
                            </p>
                            {myJobs.length === 0 ? (
                              <div className="text-center py-6 bg-muted/10 rounded-2xl border border-dashed border-border/60 mb-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">You haven't posted any jobs yet</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-1">Click + to post your first job</p>
                              </div>
                            ) : (
                              <div>{myJobs.map(job => jobCard(job, true))}</div>
                            )}
                          </div>

                          {/* ── OTHER ALUMNI'S JOBS ── */}
                          {otherJobs.length > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-3 px-1">
                                <div className="flex-1 h-px bg-border/60" />
                                <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.15em] whitespace-nowrap">
                                  Other Listings
                                </p>
                                <div className="flex-1 h-px bg-border/60" />
                              </div>
                              <div className="bg-muted/10 border border-border/40 rounded-[1.5rem] p-3">
                                {otherJobs.map(job => jobCard(job, false))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: SELECTED JOB DETAILS & APPLICANTS */}
              <div className="lg:w-2/3 h-full pb-4">
                {selectedJob ? (
                  <div className="glass-card rounded-[2.5rem] border border-border h-full flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-border bg-muted/10 flex-shrink-0">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <Building2 size={32} />
                          </div>
                          <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">{selectedJob.title}</h2>
                            <p className="text-sm font-black text-primary mt-2 uppercase tracking-[0.2em]">{selectedJob.company}</p>
                            <div className="flex gap-4 mt-4">
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <MapPin size={12} className="text-primary" /> {selectedJob.location}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <Wallet size={12} className="text-success" /> ₹{selectedJob.salary?.min}-{selectedJob.salary?.max} LPA
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(selectedJob.postedBy?._id === user?.id || selectedJob.postedBy === user?.id || user?.role === 'admin') && (
                            <button onClick={() => handleDelete(selectedJob._id)} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                      {/* Description Mini */}
                      <div className="p-6 bg-muted/20 rounded-3xl border border-border/50">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Job Overview</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">{selectedJob.description}</p>
                      </div>

                      {/* Skills required */}
                      {selectedJob.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills.map((sk: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ── GATE: Only show applicants panel for OWN jobs ── */}
                      {(() => {
                        const isOwnJob = selectedJob.postedBy?._id === user?.id || selectedJob.postedBy === user?.id || user?.role === 'admin';

                        if (!isOwnJob) {
                          return (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/60 gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                                <EyeOff size={28} className="text-muted-foreground/40" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground/50 uppercase tracking-widest">Read-Only View</p>
                                <p className="text-[11px] text-muted-foreground/50 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                                  This job was posted by another alumni. You can view the details above but cannot manage applicants or run AI screening.
                                </p>
                              </div>
                              <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-muted/20 border border-border/30">
                                Only the job poster can manage this listing
                              </div>
                            </div>
                          );
                        }

                        return (
                          /* Applicants List inside details */
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                <Users size={24} className="text-primary" />
                                Applicants {(applicantsMap[selectedJob._id]?.length || 0) > 0 && `(${applicantsMap[selectedJob._id].length})`}
                              </h3>
                              <button
                                onClick={() => toggleApplicants(selectedJob._id, true)}
                                className="flex items-center gap-2 px-4 py-2 bg-muted/20 hover:bg-muted/40 rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest transition-all"
                              >
                                <RefreshCw size={14} className={applicantsLoading ? "animate-spin" : ""} />
                                Sync Candidates
                              </button>
                            </div>

                            <div className="space-y-4">
                              {applicantsLoading ? (
                                <div className="py-20 text-center">
                                  <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-4">Retrieving Candidates...</p>
                                </div>
                              ) : !applicantsMap[selectedJob._id] || applicantsMap[selectedJob._id].length === 0 ? (
                                <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border opacity-60">
                                  <Users size={48} className="mx-auto mb-4" />
                                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No applications for this role</p>
                                </div>
                              ) : applicantsMap[selectedJob._id].map((app) => (
                                <div key={app._id} className="bg-card border border-border rounded-[2rem] shadow-xl hover:border-primary/20 transition-all overflow-hidden relative">
                                  {/* Background highlight for high scores */}
                                  {app.aiScore && app.aiScore >= 80 && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-3xl rounded-full pointer-events-none" />
                                  )}

                                  {/* ── Header ── */}
                                  <div className="p-5 flex justify-between items-center relative z-10">
                                    <div className="flex gap-4 items-center">
                                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xl text-primary">
                                        {app.student.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-black text-foreground text-lg leading-tight">{app.student.name}</p>
                                        <p className="text-xs text-muted-foreground font-bold">{app.student.collegeEmail}</p>
                                        <p className="text-xs text-primary font-bold uppercase tracking-widest">{app.student.department} • {app.student.batch}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.1em] border-2 shadow-sm ${statusColor[app.status]}`}>
                                        {app.status}
                                      </div>
                                      {/* Toggle student details */}
                                      <button
                                        onClick={() => toggleDetails(app._id)}
                                        className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all text-sm font-black"
                                        title={expandedDetails[app._id] ? 'Hide Details' : 'View Student Details'}
                                      >
                                        {expandedDetails[app._id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Collapsible Student Profile Details ── */}
                                  {expandedDetails[app._id] && (
                                    <div className="mx-5 mb-4 p-5 bg-muted/30 rounded-[1.5rem] border border-border/50 space-y-4">
                                      <p className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <UserCheck size={14} /> Student Profile Details
                                      </p>

                                      {/* Experience */}
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest w-24">Experience</span>
                                        <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{app.experience || 'Fresher'}</span>
                                      </div>

                                      {/* Self-reported Skills */}
                                      {app.studentSkills?.length > 0 && (
                                        <div>
                                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1">
                                            <Code2 size={13} /> Self-Reported Skills
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {app.studentSkills.map((sk, i) => (
                                              <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">{sk}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Projects / GitHub */}
                                      {app.projects && (
                                        <div>
                                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <Lightbulb size={13} /> Projects / GitHub
                                          </p>
                                          <a
                                            href={app.projects.startsWith('http') ? app.projects : `https://${app.projects}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary font-bold underline underline-offset-2 break-all hover:text-primary/70 transition-colors"
                                          >
                                            {app.projects}
                                          </a>
                                        </div>
                                      )}

                                      {/* AI Matched / Missing Skills */}
                                      {app.screened && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-[9px] font-black text-success uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                              <CheckCircle2 size={10} /> Matched Skills
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {app.matchedSkills?.length > 0
                                                ? app.matchedSkills.map((sk, i) => (
                                                  <span key={i} className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-bold rounded-full border border-success/20">{sk}</span>
                                                ))
                                                : <span className="text-[9px] text-muted-foreground">None matched</span>}
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black text-destructive uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                              <XCircle size={10} /> Missing Skills
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {app.missingSkills?.length > 0
                                                ? app.missingSkills.map((sk, i) => (
                                                  <span key={i} className="px-2 py-0.5 bg-destructive/10 text-destructive text-[9px] font-bold rounded-full border border-destructive/20">{sk}</span>
                                                ))
                                                : <span className="text-[9px] text-muted-foreground">No gaps</span>}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* AI Suggestions */}
                                      {app.suggestions && (
                                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">AI Suggestion</p>
                                          <p className="text-xs text-foreground/80 font-medium leading-relaxed">{app.suggestions}</p>
                                        </div>
                                      )}

                                      {/* Resume Download Button */}
                                      <a
                                        href={`/api/resume/${app._id}/download?token=${localStorage.getItem('alumni_hub_token') || ''}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-foreground/5 border border-border hover:bg-primary hover:text-white hover:border-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group/dl"
                                      >
                                        <Download size={14} className="group-hover/dl:scale-110 transition-transform" /> View / Download Resume PDF
                                      </a>
                                    </div>
                                  )}

                                  {/* ── AI Score Bar ── */}
                                  {/* ══ VERIFICATION: TWO PATHS ══ */}
                                  <div className="mx-5 mb-4 space-y-3">

                                    {/* ── PATH 1: AI Screening (Gemini) ── */}
                                    <div className={`p-4 rounded-2xl border-2 transition-all ${app.status === 'shortlisted' ? 'bg-success/5 border-success/30'
                                      : app.status === 'rejected' ? 'bg-destructive/5 border-destructive/20'
                                        : 'bg-primary/5 border-primary/20'
                                      }`}>
                                      <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Cpu size={14} /> Path 1 — AI Screening · ≥70% = Shortlisted
                                      </p>
                                      {app.aiScore !== null ? (
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-muted-foreground">Domain-Aware Fit Score</span>
                                            <span className={`text-lg font-black ${app.aiScore >= 70 ? 'text-success' : app.aiScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                                              {app.aiScore}%
                                            </span>
                                          </div>
                                          {/* Progress bar with 70% threshold line */}
                                          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                                            <div
                                              className={`h-full rounded-full transition-all duration-1000 shadow-sm ${app.aiScore >= 70 ? 'bg-success' : app.aiScore >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                                              style={{ width: `${app.aiScore}%` }}
                                            />
                                            <div className="absolute top-0 left-[70%] w-0.5 h-full bg-foreground/40 z-10" title="70% threshold" />
                                          </div>
                                          <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                                            <span>0%</span>
                                            <span className="text-primary font-bold uppercase tracking-widest">70% threshold</span>
                                            <span>100%</span>
                                          </div>
                                          <p className={`text-xs font-black text-center py-3 px-4 rounded-xl uppercase tracking-widest mt-2 leading-relaxed ${app.aiScore >= 70 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                            }`}>
                                            {app.aiSummary}
                                          </p>

                                          {/* ── Re-Screen button ── */}
                                          <div className="pt-1 flex items-center gap-2">
                                            <button
                                              onClick={() => handleRunAIScreening(app._id, selectedJob._id)}
                                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary hover:text-white hover:border-primary transition-all group/re"
                                              title="Re-run AI screening with the latest model to get an updated score"
                                            >
                                              <RefreshCw size={14} className="group-hover/re:rotate-180 transition-transform duration-500" />
                                              Re-Screen with Updated AI
                                            </button>
                                            <span className="text-[10px] text-muted-foreground font-medium shrink-0 italic">Refreshes Score</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center space-y-2">
                                          <p className="text-[8px] text-muted-foreground font-medium">
                                            AI analyses the student's domain, tech stack, projects &amp; resume — then compares with job needs. Score ≥70% = auto shortlist.
                                          </p>
                                          <button
                                            onClick={() => handleRunAIScreening(app._id, selectedJob._id)}
                                            className="px-8 py-3.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                                          >
                                            <Cpu size={18} /> Run AI Screening
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* ── Divider ── */}
                                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] py-4">
                                      <div className="flex-1 h-px bg-border/40" />
                                      <span>or review manually</span>
                                      <div className="flex-1 h-px bg-border/40" />
                                    </div>

                                    {/* ── PATH 2: Manual Review by Alumni ── */}
                                    <div className="p-4 rounded-2xl border-2 border-border/40 bg-muted/10">
                                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                        <Eye size={14} /> Path 2 — Manual Review
                                      </p>
                                      <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed">
                                        Review the student profile above, then select a status.
                                      </p>
                                      {app.status !== 'shortlisted' && app.status !== 'rejected' && (
                                        <div className="space-y-2">
                                          <div className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                              <CalendarDays size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                              <input
                                                type="datetime-local"
                                                value={interviewDates[app._id] || (app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : '')}
                                                onChange={e => setInterviewDates(prev => ({ ...prev, [app._id]: e.target.value }))}
                                                className="w-full h-9 bg-background border border-border rounded-xl pl-8 pr-3 text-[9px] font-bold outline-none focus:border-primary transition-all"
                                              />
                                            </div>
                                            <button
                                              onClick={() => handleStatusChange(app._id, 'shortlisted', selectedJob._id)}
                                              className="px-5 h-10 bg-success text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-success/90 transition shadow-lg shadow-success/10 flex items-center gap-2 whitespace-nowrap"
                                            >
                                              <Award size={14} /> Shortlist
                                            </button>
                                            <button
                                              onClick={() => handleStatusChange(app._id, 'rejected', selectedJob._id)}
                                              className="px-4 h-10 border-2 border-destructive/30 text-destructive rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-destructive/10 transition flex items-center gap-2 whitespace-nowrap"
                                            >
                                              <XCircle size={14} /> Reject
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                  </div>

                                  {/* ── Shortlisted: Gmail button ── */}
                                  <div className="px-5 pb-5">
                                    {app.status === 'shortlisted' && (
                                      <div className="flex flex-col gap-2">
                                        <button
                                          onClick={() => {
                                            const subject = encodeURIComponent(`🎉 Congratulations! Shortlisted for ${selectedJob.title} at ${selectedJob.company}`);
                                            const body = encodeURIComponent(
                                              `Dear ${app.student.name},\n\nCongratulations! You have been shortlisted for the position of ${selectedJob.title} at ${selectedJob.company}.\n\nWe were impressed by your technical skills and domain expertise.\n\nPlease reply to confirm your availability for the next steps.\n\nBest regards,\n${user?.username}`
                                            );
                                            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.student.collegeEmail)}&su=${subject}&body=${body}`, '_blank');
                                          }}
                                          className="w-full py-4 bg-success text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl shadow-success/20 transition-all"
                                        >
                                          <Mail size={18} /> Open Gmail &amp; Send Congratulations Mail
                                        </button>
                                        <p className="text-[10px] font-black text-success/60 text-center uppercase tracking-widest mt-2 px-4 shadow-sm">
                                          ✓ System auto-sent a notification to {app.student.collegeEmail}
                                        </p>
                                      </div>
                                    )}
                                    {app.status === 'rejected' && (
                                      <p className="text-center text-[9px] font-black text-destructive/60 uppercase tracking-widest py-1">
                                        ✗ Application Rejected
                                      </p>
                                    )}
                                    {app.emailSent && (
                                      <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-black text-success uppercase tracking-widest">
                                        <CheckCircle2 size={11} /> Shortlist email dispatched ✓
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 glass-card rounded-[3rem] border border-dashed border-border opacity-40">
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                      <Briefcase size={48} className="text-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Select a Job Position</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">Choose a job listing from the left panel to review candidates and manage verifications.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="feed-container w-full h-[calc(100vh-7rem)] overflow-y-auto pr-4 custom-scrollbar">
              {/* STUDENT VIEW - Optimized vertical list */}
              <div className="space-y-8 pb-20">
                {loading ? (
                  <div className="py-20 text-center animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Scanning Opportunities...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-20 bg-muted/10 rounded-[3rem] border border-dashed border-border opacity-40">
                    <Briefcase size={64} className="mx-auto mb-6 text-primary" />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">No opportunities found</h3>
                    <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">Check back later for new openings.</p>
                  </div>
                ) : jobs.map((job) => {
                  const myStatus = myStatuses[job._id];
                  const hasApplied = myStatus?.applied;

                  return (
                    <div key={job._id} className="glass-card rounded-[2.5rem] border border-border overflow-hidden relative p-8 hover:border-primary/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary/5 group">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-6">
                          <div className="w-20 h-20 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                            <Building2 size={36} />
                          </div>
                          <div>
                            <h3 className="font-black text-2xl text-foreground leading-tight group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-base font-black text-primary mt-1 uppercase tracking-widest">{job.company}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                                {job.jobType || 'Full-time'}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === job._id ? null : job._id)}
                            className="p-3 hover:bg-muted rounded-2xl transition"
                          >
                            <MoreHorizontal size={24} className="text-muted-foreground" />
                          </button>
                          {openDropdown === job._id && (
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-3 animate-fade-in">
                              <button className="w-full text-left px-5 py-3 text-[10px] font-black text-foreground hover:bg-muted flex items-center gap-3 uppercase tracking-widest">
                                <Share2 size={16} /> SHARE LISTING
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Posted By Alumnus Card */}
                      <div className="flex items-center gap-3 bg-muted/50 border border-border/50 px-5 py-3 rounded-2xl group/author transition-all hover:bg-muted mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs group-hover/author:bg-primary group-hover/author:text-white transition-all">
                          {job.postedBy?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">Posted By Alumnus</p>
                          <p className="text-xs font-bold text-foreground">
                            {job.postedBy?.name || 'Senior Alumnus'} <span className="text-primary mx-1">•</span> <span className="text-muted-foreground">{job.postedBy?.currentCompany || job.company}</span>
                          </p>
                        </div>
                      </div>

                      {/* Skills tags */}
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {job.skills.map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Location / Salary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 text-foreground bg-muted/30 p-4 rounded-2xl border border-border/50">
                          <MapPin size={20} className="text-primary" />
                          <span className="text-sm font-black uppercase tracking-tight">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-foreground bg-muted/30 p-4 rounded-2xl border border-border/50">
                          <Wallet size={20} className="text-success" />
                          <span className="text-sm font-black uppercase tracking-tight">₹{job.salary?.min || 0} - {job.salary?.max || 0} LPA</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-8 p-6 bg-muted/20 rounded-3xl border border-border/50">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Job Description</h4>
                        <p className="text-sm text-foreground/80 font-medium leading-relaxed">{job.description}</p>
                      </div>

                      {/* ── STUDENT: Apply button ── */}
                      <div>
                        {!hasApplied ? (
                          <button
                            onClick={() => {
                              setApplyJobId(job._id);
                              setApplyFile(null);
                              setApplyStep(1);
                              setStudentInfo({
                                name: (user as any)?.name || '',
                                email: (user as any)?.collegeEmail || '',
                                phone: (user as any)?.mobileNumber || '',
                                department: (user as any)?.department || '',
                                experience: 'Fresher',
                                projects: '',
                                skills: []
                              });
                            }}
                            className="w-full py-5 btn-primary text-center text-xs font-black tracking-[0.3em] flex items-center justify-center gap-3"
                          >
                            <Upload size={18} />
                            APPLY WITH RESUME (FOR ALUMNI REVIEW)
                          </button>
                        ) : (
                          <div className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest uppercase ${myStatus && myStatus.status ? statusColor[myStatus.status] : ''}`}>
                            {myStatus && myStatus.status && statusIcon[myStatus.status]}
                            {myStatus && myStatus.status === 'pending' && 'RESUME SUBMITTED — AWAITING ALUMNI VERIFICATION'}
                            {myStatus && myStatus.status === 'screening' && 'ALUMNI ARE VERIFYING YOUR RESUME...'}
                            {myStatus && myStatus.status === 'shortlisted' && (
                              <span className="flex flex-col items-center gap-1">
                                <span>🎉 SHORTLISTED! CHECK YOUR EMAIL</span>
                                {myStatus.interviewDate && (
                                  <span className="text-[10px] font-medium">
                                    Interview: {new Date(myStatus.interviewDate).toLocaleDateString('en-IN', {
                                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </span>
                                )}
                              </span>
                            )}
                            {myStatus && myStatus.status === 'rejected' && 'NOT SHORTLISTED FOR THIS ROLE'}
                          </div>
                        )}
                        {hasApplied && myStatus?.aiSummary && (
                          <div className="mt-3 p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                            <strong className="text-foreground">Feedback:</strong> {myStatus.aiSummary}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Premium Glassmorphism AI Application Modal ────────────────────────── */}
      {
        applyJobId && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
            <div className="bg-white/10 glass-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative animate-scale-in">
              {/* Gradient Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

              <div className="p-8 md:p-12 relative z-10 text-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                      <Award className="text-primary" />
                      AI-Powered Job Application
                    </h2>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-2">
                      {applyStep === 1 ? 'Step 1: Bio & Details' : applyStep === 2 ? 'Step 2: Skills & Resume' : 'Analysis Results'}
                    </p>
                  </div>
                  <button onClick={() => { setApplyJobId(null); setAiResult(null); setScreening(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-0 relative">
                {applyStep === 1 && (
                  <div className="p-8 md:p-12 space-y-6 animate-slide-up max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Full Name</label>
                        <input
                          type="text"
                          value={studentInfo.name}
                          onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl h-14 px-5 text-white font-bold outline-none transition-all placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Email Address</label>
                        <input
                          type="email"
                          value={studentInfo.email}
                          onChange={e => setStudentInfo({ ...studentInfo, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl h-14 px-5 text-white font-bold outline-none transition-all placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Phone Number</label>
                        <input
                          type="tel"
                          value={studentInfo.phone}
                          onChange={e => setStudentInfo({ ...studentInfo, phone: e.target.value })}
                          placeholder="+91 00000 00000"
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl h-14 px-5 text-white font-bold outline-none transition-all placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Experience Level</label>
                        <div className="relative">
                          <select
                            value={studentInfo.experience}
                            onChange={e => setStudentInfo({ ...studentInfo, experience: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl h-14 px-5 text-white font-bold outline-none appearance-none cursor-pointer pr-12 transition-all"
                          >
                            <option value="Fresher" className="bg-slate-900">Fresher</option>
                            <option value="0-1 yrs" className="bg-slate-900">0-1 yrs</option>
                            <option value="1-2 yrs" className="bg-slate-900">1-2 yrs</option>
                            <option value="2+ yrs" className="bg-slate-900">2+ yrs</option>
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button onClick={() => setApplyStep(2)} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs tracking-[0.3em] uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                        Continue to Skills <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {applyStep === 2 && (
                  <div className="p-8 md:p-12 relative z-10 text-white space-y-6 animate-slide-up text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Technical Stack</label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] shadow-inner">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {studentInfo.skills.map(skill => (
                            <span key={skill} className="bg-primary/20 text-white border border-primary/30 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 animate-scale-in">
                              {skill}
                              <X size={12} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="Add your tech stack (e.g. React, Python)..."
                          className="bg-transparent border-none outline-none text-white font-bold text-sm w-full p-1 placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Project / Portfolio Link (GitHub/Drive)</label>
                      <input
                        type="url"
                        value={studentInfo.projects}
                        onChange={e => setStudentInfo({ ...studentInfo, projects: e.target.value })}
                        placeholder="https://github.com/your-username/project-link"
                        className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl h-14 px-5 text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Upload PDF Resume</label>
                      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setApplyFile(e.target.files?.[0] || null)} />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${applyFile ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}
                      >
                        {applyFile ? (
                          <div className="text-center animate-fade-in">
                            <CheckCircle2 className="text-primary mb-2 mx-auto" size={32} />
                            <p className="text-white font-black text-xs">{applyFile.name}</p>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-bold">PDF Ready — Click to Change</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="text-white/20 mb-2 mx-auto" size={32} />
                            <p className="text-white/60 font-black text-xs uppercase tracking-widest">Select PDF Resume</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setApplyStep(1)} className="flex-1 py-5 border border-white/10 text-white/60 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-white/5 transition-all">
                        Back
                      </button>
                      <button
                        onClick={handleApplySubmit}
                        disabled={!applyFile}
                        className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        SUBMIT TO ALUMNI <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {applyStep === 3 && (
                  <div className="p-8 md:p-12 relative z-10 text-white animate-fade-in py-4 text-left">
                    {screening && !aiResult ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="relative mb-12">
                          <div className="w-28 h-28 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Star className="text-primary animate-pulse" size={40} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3">Verification in Progress...</h3>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.5em] animate-pulse">Running advanced analysis</p>
                      </div>
                    ) : aiResult && (
                      <div className="animate-slide-up">
                        <div className={`p-8 rounded-[3rem] border-2 mb-8 relative overflow-hidden ${aiResult.status === 'Shortlisted' ? 'border-primary/30 bg-primary/10' : aiResult.status === 'Submitted' ? 'border-success/30 bg-success/10' : 'border-red-500/30 bg-red-500/10'}`}>
                          {aiResult.status === 'Shortlisted' && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                          )}

                          <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                              <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${aiResult.status === 'Shortlisted' ? 'bg-primary/20 text-primary border-primary/30' : aiResult.status === 'Submitted' ? 'bg-success/20 text-success border-success/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                                {aiResult.status === 'Shortlisted' ? '✨ SHORTLISTED' : aiResult.status === 'Submitted' ? '✅ SUBMITTED' : '⚠️ PROFILE GAP'}
                              </span>
                            </div>
                            {aiResult.status !== 'Submitted' && (
                              <div className="text-right">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Match Accuracy</p>
                                <p className="text-5xl font-black text-white">{aiResult.match_score || 0}%</p>
                              </div>
                            )}
                          </div>

                          {aiResult.status === 'Submitted' ? (
                            <div className="relative z-10 py-6 text-center">
                              <CheckCircle2 size={64} className="mx-auto text-success mb-6" />
                              <h3 className="text-2xl font-black mb-2 text-white">Application Sent!</h3>
                              <p className="text-white/60 text-sm font-medium">Your resume has been forwarded to the alumni. You will be notified once they verify your application.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                              <div className="space-y-4">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1 flex items-center gap-2">
                                  <CheckCircle2 size={12} className="text-primary" /> Matched Assets
                                </p>
                                <div className="flex flex-wrap gap-2 text-white/90">
                                  {(aiResult.matched_skills || []).map((s: string) => (
                                    <span key={s} className="bg-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/10 tracking-tight">{s}</span>
                                  ))}
                                  {(!aiResult.matched_skills || aiResult.matched_skills.length === 0) && <span className="text-xs text-white/30 italic">No direct matches found</span>}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                  <XCircle size={12} /> Improvement Areas
                                </p>
                                <div className="flex flex-wrap gap-2 text-red-100/90">
                                  {(aiResult.missing_skills || []).map((s: string) => (
                                    <span key={s} className="bg-red-500/10 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-red-500/20 tracking-tight">{s}</span>
                                  ))}
                                  {(!aiResult.missing_skills || aiResult.missing_skills.length === 0) && <span className="text-xs text-primary italic font-bold">Perfect Match!</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {aiResult.status !== 'Submitted' && (
                          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-8 flex items-start gap-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 animate-bounce">
                              <Star size={32} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Growth Suggestions</p>
                              <p className="text-sm text-white/70 leading-relaxed font-medium">{aiResult.suggestions}</p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => { setApplyJobId(null); setAiResult(null); setScreening(false); }}
                          className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs tracking-[0.4em] uppercase hover:scale-[1.02] active:scale-98 transition-all shadow-xl shadow-white/5"
                        >
                          CLOSE DASHBOARD
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* ── Post Job Modal ─────────────────────────────────────────── */}
      {
        showModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-24 bg-background/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-scale-in my-auto relative z-50 p-8 md:p-16">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">Post Job</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">
                    Once verified by alumni, notification will be sent to candidates
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-14 h-14 flex items-center justify-center hover:bg-muted rounded-full transition border border-border shadow-sm">
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                    <label className="text-[10px] font-black text-primary uppercase ml-1 mb-2 block tracking-[0.2em]">Job Position Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-base outline-none transition-all placeholder:text-muted-foreground/30" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Company Name</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Google, TechCorp" className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm outline-none transition-all placeholder:text-muted-foreground/30" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Skills Required (comma-separated)</label>
                    <input type="text" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g. React, Node.js, Python" className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm outline-none transition-all placeholder:text-muted-foreground/30" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Min Salary (LPA)</label>
                      <input type="number" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                        placeholder="e.g. 10" className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm outline-none transition-all placeholder:text-muted-foreground/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Max Salary (LPA)</label>
                      <input type="number" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                        placeholder="e.g. 15" className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm outline-none transition-all placeholder:text-muted-foreground/30" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Location</label>
                      <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Remote / On-site" className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm outline-none transition-all placeholder:text-muted-foreground/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Job Type</label>
                      <select value={formData.jobType} onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                        className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-sm uppercase tracking-widest outline-none transition-all">
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="internship">Internship</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Full Job Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and benefits in detail..."
                      className="w-full bg-background border-2 border-border focus:border-primary rounded-[2rem] h-[220px] p-6 resize-none text-sm font-medium leading-relaxed outline-none transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <button onClick={() => setShowModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
                  Discard
                </button>
                <button onClick={handleAddJob} className="flex-[2] py-5 btn-primary text-xs tracking-[0.4em]">
                  PUBLISH LISTING
                </button>
              </div>
            </div>
          </div>
        )
      }
    </MainLayout >
  );
};

export default Jobs;
