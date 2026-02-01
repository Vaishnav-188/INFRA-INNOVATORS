import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { MoreHorizontal, Trash2, Share2, Building2, MapPin, Wallet, Briefcase, X } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  postedBy: string;
  roleType: string;
  time: string;
  title: string;
  company: string;
  location: string;
  salary: string;
}

// Demo jobs data removed - using live database values

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
      const response = await fetch('http://localhost:5000/api/jobs', {
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
      const response = await fetch('http://localhost:5000/api/jobs', {
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
    const token = localStorage.getItem('alumni_hub_token');
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Job opportunity removed');
        fetchJobs();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Connection error');
    }
    setOpenDropdown(null);
  };

  const handleApply = (job: Job) => {
    toast.success(`Application submitted for ${job.title} at ${job.company}!`);
  };

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 pb-12 px-4 flex justify-center">
        <div className="feed-container">
          {/* Post Job Button */}
          {canPost && (
            <div className="glass-card rounded-xl p-5 mb-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground">
                  <Briefcase size={20} />
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 text-left px-6 py-3 rounded-full bg-muted text-muted-foreground font-semibold text-sm border border-border hover:bg-muted/80 transition"
                >
                  Post a Job Opportunity....
                </button>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Scanning Opportunities...</p>
              </div>
            ) : jobs.map((job) => (
              <div key={job._id} className="glass-card rounded-xl border border-border overflow-hidden relative p-5 hover:border-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-sm font-black text-primary">{job.company}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        Posted by {job.postedBy?.name || 'Anonymous'} • {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === job._id ? null : job._id)}
                      className="p-2 hover:bg-muted rounded-full transition"
                    >
                      <MoreHorizontal size={20} className="text-muted-foreground" />
                    </button>

                    {openDropdown === job._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-2 animate-fade-in shadow-primary/10">
                        {(user?.role === 'admin' || (job.postedBy?._id === user?.id || job.postedBy === user?.id)) && (
                          <button
                            onClick={() => handleDelete(job._id)}
                            className="w-full text-left px-4 py-3 text-xs font-black text-destructive hover:bg-destructive/10 flex items-center gap-2"
                          >
                            <Trash2 size={16} /> REMOVE LISTING
                          </button>
                        )}
                        <button className="w-full text-left px-4 py-3 text-xs font-black text-foreground hover:bg-muted flex items-center gap-2">
                          <Share2 size={16} /> SHARE LISTING
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 text-foreground bg-muted/50 p-3 rounded-xl border border-border/50">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-xs font-black">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground bg-muted/50 p-3 rounded-xl border border-border/50">
                    <Wallet size={16} className="text-success" />
                    <span className="text-xs font-black">₹{job.salary?.min || 0} - {job.salary?.max || 0} LPA</span>
                  </div>
                </div>

                <div className="mb-5 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium line-clamp-3">{job.description}</p>
                </div>

                {job.companyWebsiteURL && (
                  <a
                    href={job.companyWebsiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 btn-primary text-center block"
                  >
                    Apply on Company Website
                  </a>
                )}
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No jobs posted yet</p>
              <p className="text-sm">Check back later for new opportunities!</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                Post Job
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-full transition"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Job Title (e.g. Web Developer)"
                className="input-solid h-14"
                required
              />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                className="input-solid h-14"
                required
              />
              <input
                type="url"
                value={formData.companyWebsiteURL}
                onChange={(e) => setFormData({ ...formData, companyWebsiteURL: e.target.value })}
                placeholder="Application / Website Link (https://...)"
                className="input-solid h-14"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Location (e.g. Bangalore / Remote)"
                  className="input-solid h-14"
                />
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Salary Range (e.g. 10-15)"
                  className="input-solid h-14"
                />
              </div>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                className="input-solid h-14 w-full bg-background"
              >
                <option value="full-time">Full-time Position</option>
                <option value="part-time">Part-time Role</option>
                <option value="internship">Internship / Trainee</option>
                <option value="contract">Project Contract</option>
              </select>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief Job Description & Requirements"
                className="input-solid h-32 py-3 resize-none"
                required
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-muted-foreground font-bold uppercase tracking-widest text-xs hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddJob}
                className="flex-1 py-4 btn-primary"
              >
                Post Job
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Jobs;
