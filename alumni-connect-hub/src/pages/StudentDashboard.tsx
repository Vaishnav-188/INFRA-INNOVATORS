import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';
import { Calendar, Briefcase, GraduationCap, BookOpen, Users, ArrowRight, X, PartyPopper, CalendarDays, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();
  const cardsRef = useStaggerReveal(0.1);

  // Dynamic state
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [alumniCount, setAlumniCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Shortlist notification popup
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsData, setCongratsData] = useState<any | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchShortlistNotifications();
      fetchMyApplications();
    }
  }, [user]);

  const fetchMyApplications = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    try {
      const res = await fetch('/api/resume/my-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyApplications(data.applications);
      }
    } catch { /* non-critical */ }
  };

  const fetchShortlistNotifications = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    try {
      const res = await fetch('/api/resume/my-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.shortlisted?.length > 0) {
        // Show popup for the first (most recent) shortlisting
        const latest = data.shortlisted[0];
        const dismissedKey = `congrats_dismissed_${latest._id}`;
        if (!localStorage.getItem(dismissedKey)) {
          setCongratsData(latest);
          setShowCongrats(true);
        }
      }
    } catch { /* non-critical */ }
  };

  const dismissCongrats = () => {
    if (congratsData) {
      localStorage.setItem(`congrats_dismissed_${congratsData._id}`, '1');
    }
    setShowCongrats(false);
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('alumni_hub_token');

    try {
      setIsLoading(true);

      // Fetch events
      const eventsResponse = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        const now = new Date().getTime();
        const upcoming = eventsData.events
          .filter(event => new Date(event.date).getTime() >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);
      }

      // Fetch jobs
      const jobsResponse = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jobsData = await jobsResponse.json();
      if (jobsData.success) {
        setRecentJobs(jobsData.jobs.slice(0, 3));
      }

      // Fetch alumni count
      const alumniResponse = await fetch('/api/connections/match', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const alumniData = await alumniResponse.json();
      if (alumniData.success) {
        setAlumniCount(alumniData.count || alumniData.alumni?.length || 0);
      }

      // Fetch connections/mentorship count
      const connectionsResponse = await fetch('/api/connections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const connectionsData = await connectionsResponse.json();
      if (connectionsData.success) {
        setConnectionsCount(connectionsData.connections?.length || 0);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlumniRequest = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    const toastId = toast.loading('Submitting alumni verification request...');

    try {
      const response = await fetch('/api/users/request-alumni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ batch: user?.batch })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message, { id: toastId });
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      } else {
        toast.error(data.error || 'Request failed', { id: toastId });
      }
    } catch (error) {
      console.error('Error requesting alumni status:', error);
      toast.error('Connection error', { id: toastId });
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      navigate('/signin');
    }
  }, [user, navigate, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <>
      <MainLayout>
        <div ref={pageRef} className="pt-40 px-6 md:px-20 max-w-7xl mx-auto pb-20">
          {/* Welcome Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Welcome, {user.username}!
            </h1>
            <p className="text-muted-foreground font-medium mt-2">
              {user.batch} • Student Dashboard
            </p>
          </div>

          {/* Quick Stats */}
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <GlassCard variant="light" className="p-6 text-center hover-lift">
              <Calendar className="w-10 h-10 mx-auto text-primary mb-3" />
              <p className="text-2xl font-black text-foreground">{upcomingEvents.length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">Upcoming Events</p>
            </GlassCard>
            <GlassCard variant="light" className="p-6 text-center hover-lift">
              <Briefcase className="w-10 h-10 mx-auto text-success mb-3" />
              <p className="text-2xl font-black text-foreground">{recentJobs.length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">Job Openings</p>
            </GlassCard>
            <GlassCard variant="light" className="p-6 text-center hover-lift">
              <Users className="w-10 h-10 mx-auto text-warning mb-3" />
              <p className="text-2xl font-black text-foreground">{alumniCount}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">Alumni Network</p>
            </GlassCard>
            <Link to="/student/mentorship">
              <GlassCard variant="light" className="p-6 text-center hover-lift cursor-pointer group">
                <BookOpen className="w-10 h-10 mx-auto text-destructive mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-black text-foreground">{connectionsCount}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">My Mentorships</p>
              </GlassCard>
            </Link>
          </div>

          {/* Application Status Section */}
          {myApplications.length > 0 && (
            <GlassCard variant="solid" className="mb-10 p-8 rounded-[3rem] border-primary/20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Application Status</h2>
                  <p className="text-xs font-medium text-muted-foreground">Real-time feedback from AI screening & Recruitment teams</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myApplications.map((app) => (
                  <div key={app._id} className={`p-6 rounded-[2rem] border-2 transition-all group hover:scale-[1.02] ${app.status === 'shortlisted' ? 'bg-success/5 border-success/20' : app.status === 'rejected' ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border/50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-foreground text-lg leading-tight uppercase">{app.job?.title}</h4>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{app.job?.company}</p>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${app.status === 'shortlisted' ? 'border-success text-success' : app.status === 'rejected' ? 'border-destructive text-destructive' : 'border-primary/40 text-primary'}`}>
                        {app.status}
                      </div>
                    </div>

                    {app.screened ? (
                      <div className={`mt-4 p-4 rounded-xl text-xs font-black uppercase tracking-widest text-center ${app.status === 'shortlisted' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {app.aiSummary}
                      </div>
                    ) : (
                      <div className="mt-4 p-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border border-dashed border-border rounded-xl">
                        Awaiting AI Verification...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard variant="light" className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-foreground">Upcoming Events</h2>
                <Link to="/events" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="text-primary" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                        {event.eventType || 'Event'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard variant="light" className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-foreground">Recent Job Openings</h2>
                <Link to="/jobs" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {recentJobs.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No job openings</p>
                ) : (
                  recentJobs.map((job) => (
                    <div
                      key={job._id}
                      className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <Briefcase className="text-success" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
                      </div>
                      <Link to="/jobs">
                        <button className="text-[10px] font-bold bg-success text-success-foreground px-4 py-2 rounded-xl hover:bg-success/90 transition uppercase">
                          Apply
                        </button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>

          <GlassCard variant="solid" className="mt-10 p-8 md:p-12 rounded-[3rem] text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-black text-foreground mb-4">
              Ready to Become an Alumni?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              After graduation, submit your verification request to transition to alumni status
              and unlock exclusive features like posting jobs, mentoring students, and more.
            </p>
            <button
              onClick={handleAlumniRequest}
              className="px-8 py-4 btn-primary"
            >
              Submit Verification Request
            </button>
          </GlassCard>
        </div>
      </MainLayout>

      {/* ── Congratulations Popup ── */}
      {showCongrats && congratsData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-lg animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-success/20 overflow-hidden animate-scale-in relative">
            <div className="bg-gradient-to-br from-success via-success/80 to-primary p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />
              <PartyPopper className="text-white mx-auto mb-4" size={52} />
              <h2 className="text-3xl font-black text-white tracking-tight">CONGRATULATIONS!</h2>
              <p className="text-white/80 text-sm mt-2 font-medium">Your resume has been shortlisted 🎉</p>
            </div>
            <div className="p-8">
              <div className="bg-success/5 border border-success/20 rounded-2xl p-5 mb-6">
                <p className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Position</p>
                <p className="text-xl font-black text-foreground">{congratsData.job?.title}</p>
                <p className="text-sm font-bold text-primary">{congratsData.job?.company}</p>
              </div>
              {congratsData.interviewDate && (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
                  <CalendarDays className="text-warning mt-1" size={22} />
                  <div>
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">Interview Date & Time</p>
                    <p className="text-lg font-black text-foreground">
                      {new Date(congratsData.interviewDate).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm font-bold text-muted-foreground">
                      {new Date(congratsData.interviewDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center mb-8">
                📧 A detailed email has been sent to your college email. Please carry a printed copy of your resume!
              </p>
              <button
                onClick={dismissCongrats}
                className="w-full py-5 bg-gradient-to-r from-success to-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-success/20"
              >
                Got it! 🎊
              </button>
            </div>
            <button
              onClick={dismissCongrats}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;
