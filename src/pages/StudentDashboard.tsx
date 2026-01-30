import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';
import { Calendar, Briefcase, GraduationCap, BookOpen, Users, ArrowRight } from 'lucide-react';

// Demo data
const upcomingEvents = [
  { id: 1, title: 'Annual Alumni Meet 2026', date: 'Feb 15, 2026', type: 'Networking' },
  { id: 2, title: 'Campus to Corporate Workshop', date: 'Mar 01, 2026', type: 'Workshop' },
  { id: 3, title: 'Placement Drive', date: 'Feb 28, 2026', type: 'Career' },
];

const recentJobs = [
  { id: 1, title: 'Software Engineer', company: 'OrbitGlobal', location: 'Bangalore' },
  { id: 2, title: 'Data Science Intern', company: 'HealthTech', location: 'Remote' },
  { id: 3, title: 'Full Stack Developer', company: 'TechStartup', location: 'Chennai' },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();
  const cardsRef = useStaggerReveal(0.1);

  // Redirect if not student
  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
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
            <p className="text-2xl font-black text-foreground">250+</p>
            <p className="text-xs font-bold text-muted-foreground uppercase">Alumni Network</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center hover-lift">
            <BookOpen className="w-10 h-10 mx-auto text-destructive mb-3" />
            <p className="text-2xl font-black text-foreground">15</p>
            <p className="text-xs font-bold text-muted-foreground uppercase">Mentorship Sessions</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <GlassCard variant="light" className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-foreground">Upcoming Events</h2>
              <Link to="/events" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="text-primary" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Jobs */}
          <GlassCard variant="light" className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-foreground">Recent Job Openings</h2>
              <Link to="/jobs" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Briefcase className="text-success" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{job.title}</h3>
                    <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
                  </div>
                  <button className="text-[10px] font-bold bg-success text-success-foreground px-4 py-2 rounded-xl hover:bg-success/90 transition uppercase">
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Become Alumni CTA */}
        <GlassCard variant="solid" className="mt-10 p-8 md:p-12 rounded-[3rem] text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-black text-foreground mb-4">
            Ready to Become an Alumni?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            After graduation, submit your verification request to transition to alumni status 
            and unlock exclusive features like posting jobs, mentoring students, and more.
          </p>
          <Link to="/">
            <button className="px-8 py-4 btn-primary">
              Submit Verification Request
            </button>
          </Link>
        </GlassCard>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
