import { useState } from 'react';
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

// Demo jobs data
const initialJobs: Job[] = [
  {
    id: '1',
    postedBy: 'Marcus Sterling',
    roleType: 'alumni',
    time: '2 days ago',
    title: 'Senior Software Engineer',
    company: 'OrbitGlobal',
    location: 'Bangalore, India',
    salary: '₹25-35 LPA',
  },
  {
    id: '2',
    postedBy: 'Dr. Sarah Vance',
    roleType: 'alumni',
    time: '5 days ago',
    title: 'Data Science Intern',
    company: 'HealthTech Solutions',
    location: 'Remote',
    salary: '₹40,000/month',
  },
  {
    id: '3',
    postedBy: 'Admin',
    roleType: 'admin',
    time: '1 week ago',
    title: 'Full Stack Developer',
    company: 'TechStartup Inc.',
    location: 'Chennai, India',
    salary: '₹12-18 LPA',
  },
  {
    id: '4',
    postedBy: 'John Alumni',
    roleType: 'alumni',
    time: '2 weeks ago',
    title: 'Product Manager',
    company: 'Amazon',
    location: 'Hyderabad, India',
    salary: '₹30-45 LPA',
  },
];

const Jobs = () => {
  const { user } = useAuth();
  const pageRef = usePageTransition();
  
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
  });

  const canPost = user?.role === 'alumni' || user?.role === 'admin';

  const handleAddJob = () => {
    if (!formData.title || !formData.company) {
      toast.error('Please fill in required fields');
      return;
    }

    const newJob: Job = {
      id: Date.now().toString(),
      postedBy: user?.username || 'Anonymous',
      roleType: user?.role || 'alumni',
      time: 'Just now',
      title: formData.title,
      company: formData.company,
      location: formData.location || 'Remote',
      salary: formData.salary || 'Not specified',
    };

    setJobs([newJob, ...jobs]);
    setFormData({ title: '', company: '', location: '', salary: '' });
    setShowModal(false);
    toast.success('Job posted successfully!');
  };

  const handleDelete = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
    toast.success('Job removed');
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
            {jobs.map((job) => (
              <div key={job.id} className="glass-card rounded-xl border border-border overflow-hidden relative p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-primary">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-sm font-bold text-primary">{job.company}</p>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                        Posted by {job.postedBy} • {job.time}
                      </p>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === job.id ? null : job.id)}
                      className="p-2 hover:bg-muted rounded-full transition"
                    >
                      <MoreHorizontal size={20} className="text-muted-foreground" />
                    </button>

                    {openDropdown === job.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-2 animate-fade-in">
                        {(user?.role === 'admin' || job.postedBy === user?.username) && (
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 font-bold"
                          >
                            <Trash2 size={16} /> Remove Job
                          </button>
                        )}
                        <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                          <Share2 size={16} /> Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 text-foreground bg-muted p-2 rounded-lg">
                    <MapPin size={16} />
                    <span className="text-xs font-bold">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground bg-muted p-2 rounded-lg">
                    <Wallet size={16} />
                    <span className="text-xs font-bold">{job.salary}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleApply(job)}
                  className="w-full py-3 btn-primary"
                >
                  Apply Now
                </button>
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
                className="input-solid"
              />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                className="input-solid"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Location"
                  className="input-solid"
                />
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Salary Range"
                  className="input-solid"
                />
              </div>
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
