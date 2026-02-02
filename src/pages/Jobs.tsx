import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { MoreHorizontal, Trash2, Share2, Building2, MapPin, Wallet, Briefcase, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Jobs = () => {
  const { user } = useAuth();
  const pageRef = usePageTransition();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: 'full-time',
    companyWebsiteURL: '',
    description: '',
  });

  const fetchJobs = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const canPost = user?.role === 'alumni' || user?.role === 'admin';

  const handleAddJob = async () => {
    if (!formData.title || !formData.company || !formData.companyWebsiteURL || !formData.description) {
      toast.error('Please fill in required fields (Title, Company, Website, Description)');
      return;
    }

    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading('Posting job opportunity...');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          salary: {
            min: parseInt(formData.salary.split('-')[0]) || 0,
            max: parseInt(formData.salary.split('-')[1]) || 0
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Job opportunity shared with the community!', { id: tid });
        setFormData({
          title: '',
          company: '',
          location: '',
          salary: '',
          jobType: 'full-time',
          companyWebsiteURL: '',
          description: '',
        });
        setShowModal(false);
        fetchJobs();
      } else {
        toast.error(data.message || 'Failed to post job', { id: tid });
      }
    } catch (error) {
      toast.error('Connection error', { id: tid });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this job listing?')) return;

    // Optimistic Update
    const previousJobs = [...jobs];
    setJobs(jobs.filter(j => j._id !== id));
    setOpenDropdown(null);

    const token = localStorage.getItem('alumni_hub_token');
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Job opportunity removed');
      } else {
        // Rollback
        setJobs(previousJobs);
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      setJobs(previousJobs);
      toast.error('Connection error');
    }
  };

  return (
    <MainLayout>
      <div className="pt-40 pb-20 px-4 flex flex-col items-center">
        <div ref={pageRef} className="feed-container w-full">
          {/* Post Job Button */}
          {canPost && (
            <div className="glass-card rounded-[2rem] p-8 mb-8 border border-primary/10 shadow-xl shadow-primary/5">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <Briefcase size={28} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Hire from the Hub</h2>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Share career opportunities with students & alumni</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-8 py-4 btn-primary"
                >
                  POST JOB
                </button>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Scanning Opportunities...</p>
              </div>
            ) : jobs.map((job) => (
              <div key={job._id} className="glass-card rounded-[2.5rem] border border-border overflow-hidden relative p-8 hover:border-primary/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary/5 group">
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
                        {(user?.role === 'admin' || job.postedBy?._id === user?.id || job.postedBy === user?.id) && (
                          <button
                            onClick={() => handleDelete(job._id)}
                            className="w-full text-left px-5 py-3 text-[10px] font-black text-destructive hover:bg-destructive/10 flex items-center gap-3 uppercase tracking-widest"
                          >
                            <Trash2 size={16} /> REMOVE LISTING
                          </button>
                        )}
                        <button className="w-full text-left px-5 py-3 text-[10px] font-black text-foreground hover:bg-muted flex items-center gap-3 uppercase tracking-widest">
                          <Share2 size={16} /> SHARE LISTING
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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

                <div className="mb-8 p-6 bg-muted/20 rounded-3xl border border-border/50">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Job Description</h4>
                  <p className="text-sm text-foreground/80 font-medium leading-relaxed">{job.description}</p>
                </div>

                {job.companyWebsiteURL && (
                  <a
                    href={job.companyWebsiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 btn-primary text-center block text-xs font-black tracking-[0.3em]"
                  >
                    APPLY ON COMPANY WEBSITE
                  </a>
                )}
              </div>
            ))}
          </div>

          {!loading && jobs.length === 0 && (
            <div className="text-center py-32 bg-muted/10 rounded-[3rem] border border-dashed border-border mt-10">
              <Briefcase size={64} className="mx-auto mb-6 opacity-20 text-primary" />
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">No Opportunities Yet</h3>
              <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">Fresh listings will appear here soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-24 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-scale-in my-auto relative z-50 p-8 md:p-16">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">
                  Post Job
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Create a new career listing for the community</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-14 h-14 flex items-center justify-center hover:bg-muted rounded-full transition border border-border shadow-sm"
              >
                <X size={24} className="text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                  <label className="text-[10px] font-black text-primary uppercase ml-1 mb-2 block tracking-[0.2em]">Job Position Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-14 px-5 font-bold text-base outline-none transition-all placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Google, TechCorp"
                    className="input-solid h-14 px-5 text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Application Link</label>
                  <input
                    type="url"
                    value={formData.companyWebsiteURL}
                    onChange={(e) => setFormData({ ...formData, companyWebsiteURL: e.target.value })}
                    placeholder="https://company.com/careers"
                    className="input-solid h-14 px-5 text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Remote / On-site"
                      className="input-solid h-14 px-5 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Salary (LPA)</label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g. 15-20"
                      className="input-solid h-14 px-5 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Employment Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="input-solid h-14 px-5 text-sm font-black uppercase tracking-widest bg-card"
                  >
                    <option value="full-time">Full-time Position</option>
                    <option value="part-time">Part-time Role</option>
                    <option value="internship">Internship / Trainee</option>
                    <option value="contract">Project Contract</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Full Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Role requirements, stack, and benefits..."
                    className="input-solid h-[132px] p-5 resize-none text-sm font-medium leading-relaxed"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleAddJob}
                className="flex-[2] py-5 btn-primary text-xs tracking-[0.4em]"
              >
                PUBLISH LISTING
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Jobs;
