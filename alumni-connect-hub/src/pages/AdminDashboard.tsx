import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { toast } from 'sonner';
import { Plus, Info, Bell, CheckCircle, Search } from 'lucide-react';

type TabType = 'verifications' | 'events' | 'donations' | 'users' | 'csv_upload' | 'settings';

interface Verification {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  yearOfStudy: string;
  linkedinProfile: string;
  githubProfile?: string;
  role: string;
}

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved';
}

// Demo data removed - using live database values

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();

  const [tab, setTab] = useState<TabType>('verifications');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [latestDonation, setLatestDonation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [lastImportResults, setLastImportResults] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Fetch stats separately
  const fetchStats = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;
    try {
      const response = await fetch('/api/users/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllUsers = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleConvertToAlumni = async (userId: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/users/convert-to-alumni/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          graduationYear: new Date().getFullYear(),
          currentCompany: 'Unknown',
          isPlaced: false
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchAllUsers();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error converting student:', error);
      toast.error('Failed to convert student');
    }
  };

  const handleCSVUpload = async (file: File, endpoint: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) {
      toast.error('Authentication error. Please login again.');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const response = await fetch(`/api/csv/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Imported ${data.summary.inserted} records!`, {
          id: toastId,
          description: `Total: ${data.summary.totalRows}, Skipped: ${data.summary.skipped}`
        });

        // Store results for password export
        if (data.summary.newUsers || data.summary.newAlumni) {
          setLastImportResults({
            type: endpoint.includes('students') ? 'STUDENTS' : 'ALUMNI',
            data: data.summary.newUsers || data.summary.newAlumni
          });
        }

        fetchStats();
      } else {
        toast.error(data.message || 'Import failed', { id: toastId });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Connection error while uploading', { id: toastId });
    }
  };

  const downloadCredentialCSV = () => {
    if (!lastImportResults) return;

    const headers = lastImportResults.type === 'STUDENTS'
      ? ['Name', 'Email', 'Password', 'Batch', 'Roll Number']
      : ['Name', 'Email', 'Password', 'Graduation Year', 'Company'];

    const rows = lastImportResults.data.map((u: any) =>
      lastImportResults.type === 'STUDENTS'
        ? [u.name, u.email, u.password, u.batch, u.rollNumber]
        : [u.name, u.email, u.password, u.batch, u.company]
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${lastImportResults.type.toLowerCase()}_credentials_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Credential report downloaded!');
  };

  useEffect(() => {
    fetchStats();
  }, [verifications, events]);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/signin');
    }
  }, [user, navigate, authLoading]);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/system/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch settings when tab changes to settings to ensure fresh data
  useEffect(() => {
    if (tab === 'settings') {
      fetchSettings();
    }
  }, [tab]);

  // Fetch pending verifications
  useEffect(() => {
    const fetchVerifications = async () => {
      const token = localStorage.getItem('alumni_hub_token');
      if (!token) return;

      try {
        const response = await fetch('/api/users/pending-verifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          // Map backend _id to id
          const mapped = data.verifications.map((v: any) => ({
            id: v._id,
            name: v.name,
            email: v.collegeEmail,
            rollNumber: v.rollNumber || 'N/A',
            department: v.department || 'N/A',
            yearOfStudy: v.yearOfStudy || 'N/A',
            linkedinProfile: v.linkedIn || '#',
            githubProfile: v.github || '#',
            role: v.role
          }));
          setVerifications(mapped);
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
        toast.error('Failed to load pending verifications');
      }
    };

    if (tab === 'verifications') fetchVerifications();
  }, [tab]);

  // Fetch pending events
  useEffect(() => {
    const fetchPendingEvents = async () => {
      const token = localStorage.getItem('alumni_hub_token');
      if (!token) return;

      try {
        const response = await fetch('/api/events/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Error fetching pending events:', error);
        toast.error('Failed to load pending events');
      }
    };

    if (tab === 'events') fetchPendingEvents();
  }, [tab]);

  // Fetch all donations
  const fetchDonations = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch('/api/donations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDonations(data.donations);
        // Set latest donation if it's very recent (e.g. today or last one)
        if (data.donations.length > 0) {
          setLatestDonation(data.donations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [tab === 'donations']);

  useEffect(() => {
    if (tab === 'users') fetchAllUsers();
  }, [tab]);

  const handleApproveVerification = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/users/verify/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const approvedUser = verifications.find(v => v.id === id);
        setVerifications(verifications.filter(v => v.id !== id));
        toast.success(`${approvedUser?.role === 'admin' ? 'Admin' : 'Student'} approved successfully!`);
      }
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleRejectVerification = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/users/reject/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVerifications(verifications.filter(v => v.id !== id));
        toast.success('Registration rejected');
      }
    } catch (error) {
      toast.error('Failed to reject registration');
    }
  };

  const handleApproveEvent = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'upcoming' })
      });
      const data = await response.json();
      if (data.success) {
        setEvents(events.filter(e => e._id !== id));
        toast.success('Event approved and is now live!');
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEvents(events.filter(e => e._id !== id));
        toast.success('Event request rejected');
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to reject event');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete ${name}'s account?`)) return;

    const token = localStorage.getItem('alumni_hub_token');
    try {
      const response = await fetch(`/api/users/reject/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`${name} removed`);
        fetchStats();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Settings updated successfully!');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const tabs: { value: TabType; label: string }[] = [
    { value: 'verifications', label: 'Verifications' },
    { value: 'events', label: 'Events' },
    { value: 'donations', label: 'Donations' },
    { value: 'users', label: 'Manage Users' },
    { value: 'csv_upload', label: 'CSV' },
    { value: 'settings', label: 'Settings' },
  ];

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
        <div className="flex justify-between items-end mb-10">
          <h1 className="text-4xl font-black text-foreground tracking-tight underline decoration-primary">
            Admin Dashboard
          </h1>
          {latestDonation && (
            <div className="animate-bounce-slow h-10 px-4 bg-success/10 border border-success/20 rounded-full flex items-center gap-3">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-success uppercase tracking-widest">
                Latest: {latestDonation.donor?.name || 'Alumnus'} contributed ₹{latestDonation.amount.toLocaleString()}!
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <GlassCard variant="light" className="p-6 text-center shadow-primary/5">
            <p className="text-4xl font-black text-primary">{stats?.unverifiedUsers ?? '...'}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Pending Verifications</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center">
            <p className="text-4xl font-black text-warning">{stats?.pendingEvents ?? '0'}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Pending Events</p>
          </GlassCard>
          <GlassCard
            variant="light"
            className="p-6 text-center shadow-success/5 cursor-pointer hover:bg-success/5 transition-all group"
            onClick={() => navigate('/admin/directory?role=alumni')}
          >
            <p className="text-4xl font-black text-success group-hover:scale-110 transition-transform">
              {stats?.alumni ?? '0'}
            </p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Managed Alumni</p>
            <p className="text-[10px] font-black text-success mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Open Directory →</p>
          </GlassCard>
          <GlassCard
            variant="light"
            className="p-6 text-center shadow-info/5 cursor-pointer hover:bg-info/5 transition-all group"
            onClick={() => navigate('/admin/directory?role=student')}
          >
            <p className="text-4xl font-black text-info group-hover:scale-110 transition-transform">
              {stats?.students ?? '0'}
            </p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Active Students</p>
            <p className="text-[10px] font-black text-info mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Open Directory →</p>
          </GlassCard>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition ${tab === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-muted'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Verifications Tab */}
        {tab === 'verifications' && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            {verifications.map((v) => (
              <GlassCard key={v.id} variant="default" className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${v.role === 'admin' ? 'bg-primary/20 text-primary' :
                    v.role === 'alumni' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                    {v.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl text-foreground uppercase tracking-tight leading-none">{v.name}</h3>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${v.role === 'admin' ? 'bg-primary text-primary-foreground animate-pulse' :
                        v.role === 'alumni' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                        {v.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{v.email || 'No email'}</p>
                    <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">
                      {v.role === 'student' ? `${v.department || 'N/A'} • ${v.rollNumber}` : v.role === 'alumni' ? `ALUMNI • Grad ${v.yearOfStudy}` : 'ADMINISTRATOR ACCESS REQUEST'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <a
                    href={v.linkedinProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-bold mt-2 inline-block hover:underline"
                  >
                    LinkedIn Profile →
                  </a>
                  {v.githubProfile && v.githubProfile !== '#' && (
                    <a
                      href={v.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground text-xs font-bold mt-2 inline-block hover:underline"
                    >
                      GitHub Profile →
                    </a>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproveVerification(v.id)}
                    className="bg-success text-success-foreground px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-success/90 transition"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleRejectVerification(v.id)}
                    className="bg-destructive text-destructive-foreground px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-destructive/90 transition"
                  >
                    REJECT
                  </button>
                </div>
              </GlassCard>
            ))}
            {verifications.length === 0 && (
              <p className="p-10 text-center text-muted-foreground font-bold italic">
                No pending verifications
              </p>
            )}
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            {events.map((e) => (
              <GlassCard key={e._id} variant="default" className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-primary/10 shadow-xl shadow-primary/5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-warning/10 text-warning text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-warning/20">
                      PENDING REVIEW
                    </span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {new Date(e.date).toLocaleDateString()} • {e.venue}
                    </span>
                  </div>
                  <h3 className="font-black text-2xl text-foreground mb-2 uppercase tracking-tight">{e.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium mb-4 line-clamp-2">{e.description}</p>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                      {e.organizer?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Proposed By</p>
                      <p className="text-sm font-black text-foreground">{e.organizer?.name || 'Anonymous'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    onClick={() => handleApproveEvent(e._id)}
                    className="flex-1 md:flex-none bg-primary text-primary-foreground px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleRejectEvent(e._id)}
                    className="flex-1 md:flex-none bg-destructive/10 text-destructive px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    REJECT
                  </button>
                </div>
              </GlassCard>
            ))}
            {events.length === 0 && (
              <div className="py-24 text-center glass-card rounded-[3rem] border border-dashed border-border">
                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">All event requests are cleared</p>
                <p className="text-xs text-muted-foreground/60 font-medium mt-2">Check back later for new proposals from alumni</p>
              </div>
            )}
          </div>
        )}

        {/* Donations Tab */}
        {tab === 'donations' && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            {donations.map((d) => (
              <GlassCard key={d._id} variant="default" className="p-6 flex justify-between items-center hover:border-success/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                    <Bell className="text-success" size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-success leading-tight">
                      ₹{d.amount.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                      From: {d.donor?.name || 'Anonymous'} • TID: {d.transactionId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[8px] text-muted-foreground/50 font-black uppercase">{d.purpose || 'General'}</p>
                </div>
              </GlassCard>
            ))}
            {donations.length === 0 && (
              <p className="p-10 text-center text-muted-foreground font-bold italic">
                No donations recorded yet
              </p>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-card/60 backdrop-blur-xl border border-border h-16 pl-14 pr-6 rounded-[2rem] font-bold text-sm outline-none focus:ring-2 ring-primary/20 transition-all shadow-lg"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {allUsers
                .filter((u) =>
                  u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.collegeEmail.toLowerCase().includes(userSearch.toLowerCase())
                )
                .map((u) => (
                  <GlassCard key={u._id} variant="default" className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${u.role === 'admin' ? 'bg-primary/20 text-primary' :
                        u.role === 'alumni' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-xl text-foreground">{u.name}</h3>
                          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-primary text-primary-foreground' :
                            u.role === 'alumni' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{u.collegeEmail}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                          {u.department || 'No Dept'} {u.rollNumber ? `• ${u.rollNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      {u.role === 'student' && (
                        <button
                          onClick={() => handleConvertToAlumni(u._id)}
                          className="flex-1 md:flex-none bg-success text-success-foreground px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-success/90 transition shadow-lg shadow-success/10"
                        >
                          UPGRADE TO ALUMNI
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="flex-1 md:flex-none text-destructive hover:bg-destructive/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition border border-destructive/20"
                      >
                        DELETE ACCOUNT
                      </button>
                    </div>
                  </GlassCard>
                ))}
              {allUsers.filter(u =>
                u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.collegeEmail.toLowerCase().includes(userSearch.toLowerCase())
              ).length === 0 && (
                  <div className="py-24 text-center glass-card rounded-[3rem] border border-dashed border-border mt-6">
                    <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">
                      {allUsers.length === 0 ? 'No users found' : 'No matching users found'}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* CSV Upload Tab */}
        {tab === 'csv_upload' && (
          <div className="space-y-8 animate-fade-in">
            {lastImportResults && (
              <GlassCard variant="solid" className="p-8 border-primary/20 bg-primary/5 shadow-primary/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-primary font-black uppercase tracking-widest text-xs mb-1">IMPORT COMPLETE</h4>
                    <p className="font-bold text-foreground">Generated {lastImportResults.data.length} new {lastImportResults.type} credentials.</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={downloadCredentialCSV}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                    >
                      DOWNLOAD PASSWORDS CSV
                    </button>
                    <button
                      onClick={() => setLastImportResults(null)}
                      className="px-4 py-3 bg-muted text-muted-foreground rounded-2xl text-[10px] font-black uppercase"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard variant="default" className="p-8">
                <h3 className="font-black text-2xl text-foreground mb-4">STUDENT DATA</h3>
                <p className="text-muted-foreground text-sm mb-6 font-medium">
                  Upload student CSV file to bulk import student records.
                  Ensure the file follows the required format.
                </p>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".csv"
                    id="student-csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCSVUpload(file, 'upload-students');
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('student-csv')?.click()}
                    className="w-full py-4 btn-primary"
                  >
                    SELECT STUDENT CSV
                  </button>
                </div>
              </GlassCard>

              <GlassCard variant="default" className="p-8">
                <h3 className="font-black text-2xl text-foreground mb-4">ALUMNI DATA</h3>
                <p className="text-muted-foreground text-sm mb-6 font-medium">
                  Upload alumni CSV file to bulk import alumni records.
                  Placement data and salary info will be initialized.
                </p>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".csv"
                    id="alumni-csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCSVUpload(file, 'upload-alumni');
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('alumni-csv')?.click()}
                    className="w-full py-4 btn-primary"
                  >
                    SELECT ALUMNI CSV
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          !settings ? (
            <div className="flex flex-col items-center justify-center py-24 animate-pulse">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Synchronizing Configuration...</p>
            </div>
          ) : (
            <div className="animate-fade-in max-w-full mx-auto space-y-12">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Payment Configuration */}
                <GlassCard variant="solid" className="p-10 rounded-[3rem] border border-primary/10 shadow-xl shadow-primary/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Plus className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-foreground">Payment Setup</h3>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Alumni Donation Options</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3 block">UPI ID for Direct Transfers</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          className="input-solid flex-1 h-14"
                          value={settings.donationSettings.upiId}
                          onChange={(e) => setSettings({
                            ...settings,
                            donationSettings: { ...settings.donationSettings, upiId: e.target.value }
                          })}
                          placeholder="e.g. college@upi"
                        />
                        <button
                          onClick={handleUpdateSettings}
                          className="px-8 bg-primary text-primary-foreground rounded-2xl text-xs font-black hover:bg-primary/90 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        >
                          SET UPI
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3 block">Global Payment URL (Razorpay/Stripe)</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          className="input-solid flex-1 h-14"
                          value={settings.donationSettings.paymentUrl || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            donationSettings: { ...settings.donationSettings, paymentUrl: e.target.value }
                          })}
                          placeholder="e.g. https://razorpay.me/@college"
                        />
                        <button
                          onClick={handleUpdateSettings}
                          className="px-8 bg-primary text-primary-foreground rounded-2xl text-xs font-black hover:bg-primary/90 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        >
                          SET URL
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3 block">Official QR Code</label>
                      <div className="space-y-4">
                        <input
                          type="file"
                          accept="image/*"
                          id="qr-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const token = localStorage.getItem('alumni_hub_token');
                              const formData = new FormData();
                              formData.append('qrCode', file);

                              const tid = toast.loading('Uploading Secure QR Code...');
                              try {
                                const res = await fetch('/api/system/upload-qr', {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` },
                                  body: formData
                                });
                                const data = await res.json();
                                if (data.success) {
                                  setSettings({
                                    ...settings,
                                    donationSettings: { ...settings.donationSettings, qrCodeUrl: data.qrCodeUrl }
                                  });
                                  toast.success('System QR Updated!', { id: tid });
                                } else {
                                  toast.error(data.message || 'Upload failed', { id: tid });
                                }
                              } catch (err) {
                                toast.error('Upload connection error', { id: tid });
                              }
                            }
                          }}
                        />

                        {settings.donationSettings.qrCodeUrl ? (
                          <div className="relative group rounded-3xl overflow-hidden border border-border h-56 bg-white/50 backdrop-blur-sm self-center">
                            <img src={settings.donationSettings.qrCodeUrl} className="w-full h-full object-contain p-4" />
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => document.getElementById('qr-upload')?.click()}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black shadow-xl"
                              >
                                CHANGE QR IMAGE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => document.getElementById('qr-upload')?.click()}
                            className="w-full h-56 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                          >
                            <div className="w-14 h-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                              <Plus className="text-primary" size={24} />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Image File</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Notices Configuration */}
                <GlassCard variant="solid" className="p-10 rounded-[3rem] border border-warning/10 shadow-xl shadow-warning/5 flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                      <Info className="text-warning" size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-foreground">Communication</h3>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Urgent Announcements</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Why Donate (Explainer Text)</label>
                      <textarea
                        className="input-solid min-h-[100px] text-sm"
                        value={settings.donationSettings.whyDonateText}
                        onChange={(e) => setSettings({
                          ...settings,
                          donationSettings: { ...settings.donationSettings, whyDonateText: e.target.value }
                        })}
                        placeholder="Explain how funds will be used..."
                      ></textarea>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                      <input
                        type="checkbox"
                        id="urgent"
                        className="w-5 h-5 rounded-md"
                        checked={settings.donationSettings.isDonationUrgent}
                        onChange={(e) => setSettings({
                          ...settings,
                          donationSettings: { ...settings.donationSettings, isDonationUrgent: e.target.checked }
                        })}
                      />
                      <label htmlFor="urgent" className="text-xs font-bold text-foreground cursor-pointer uppercase tracking-tight">
                        Enable Urgent Banner
                      </label>
                    </div>

                    {settings.donationSettings.isDonationUrgent && (
                      <div className="animate-fade-in">
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Urgent Message</label>
                        <input
                          type="text"
                          className="input-solid"
                          value={settings.donationSettings.urgentMessage}
                          onChange={(e) => setSettings({
                            ...settings,
                            donationSettings: { ...settings.donationSettings, urgentMessage: e.target.value }
                          })}
                        />
                      </div>
                    )}

                    <div className="mt-auto pt-6">
                      <button type="submit" className="w-full btn-primary py-4">
                        UPDATE MESSAGES
                      </button>
                    </div>
                  </form>
                </GlassCard>
              </div>

              {/* Homepage Dynamic Content */}
              <GlassCard variant="default" className="p-12 rounded-[3.5rem] border border-primary/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Homepage Content</h3>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2">Design your landing page identity</p>
                    </div>
                    <button
                      onClick={async () => {
                        const confirm = window.confirm("Reset all homepage content to system defaults?");
                        if (!confirm) return;

                        const defaults = {
                          successStories: [
                            { name: 'Marcus Sterling', role: 'CEO @ OrbitGlobal', quote: 'This institution gave me more than just a degree...', avatar: 'https://i.pravatar.cc/150?u=4' },
                            { name: 'Dr. Sarah Vance', role: 'Medical Lead', quote: 'Giving back through mentorship...', avatar: 'https://i.pravatar.cc/150?u=9' }
                          ],
                          galleryImages: [
                            'https://picsum.photos/500/500?random=10',
                            'https://picsum.photos/500/500?random=11',
                            'https://picsum.photos/500/500?random=12',
                            'https://picsum.photos/500/500?random=13'
                          ]
                        };

                        setSettings({ ...settings, homepageSettings: defaults });
                        toast.info("Defaults loaded. Click Save to finish.");
                      }}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      RESET TO DEFAULTS
                    </button>
                  </div>

                  <div className="space-y-12">
                    {/* Hero Section */}
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          placeholder="Heading Line 1 (Main Text)"
                          className="input-solid h-16 text-sm font-bold px-6 rounded-3xl"
                          value={settings.homepageSettings?.hero?.line1 ?? ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            homepageSettings: {
                              ...settings.homepageSettings,
                              hero: { ...(settings.homepageSettings?.hero || {}), line1: e.target.value }
                            }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="Heading Line 2 (Highlighted Text)"
                          className="input-solid h-16 text-sm font-bold px-6 rounded-3xl text-primary"
                          value={settings.homepageSettings?.hero?.line2 ?? ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            homepageSettings: {
                              ...settings.homepageSettings,
                              hero: { ...(settings.homepageSettings?.hero || {}), line2: e.target.value }
                            }
                          })}
                        />
                      </div>
                      <textarea
                        placeholder="Hero Subtitle / Description - Keep it impactful and brief..."
                        className="input-solid min-h-[120px] text-sm p-6 resize-none rounded-3xl"
                        value={settings.homepageSettings?.hero?.subtitle || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          homepageSettings: {
                            ...settings.homepageSettings,
                            hero: { ...(settings.homepageSettings?.hero || {}), subtitle: e.target.value }
                          }
                        })}
                      />
                    </div>

                    {/* Success Stories */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">SUCCESS STORIES (FIRST 2 BOXES)</h4>
                        {(!settings.homepageSettings?.successStories || settings.homepageSettings.successStories.length === 0) && (
                          <button
                            onClick={() => {
                              const newStories = [
                                { name: '', role: '', quote: '', avatar: '' },
                                { name: '', role: '', quote: '', avatar: '' }
                              ];
                              setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                            }}
                            className="text-[10px] font-black text-foreground underline"
                          >
                            + ADD STORY SLOTS
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(settings.homepageSettings?.successStories || []).map((story: any, idx: number) => (
                          <div key={idx} className="glass-card p-8 rounded-[2.5rem] border border-border/50 bg-muted/20 relative group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 overflow-hidden border border-primary/20">
                                <img src={story.avatar || `https://ui-avatars.com/api/?name=${story.name}`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">STORY BOX {idx + 1}</p>
                                <p className="text-sm font-black text-foreground">{story.name || 'Emply Slot'}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  className="input-solid h-11 text-xs px-4"
                                  value={story.name}
                                  onChange={(e) => {
                                    const newStories = [...settings.homepageSettings.successStories];
                                    newStories[idx].name = e.target.value;
                                    setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Company / Role"
                                  className="input-solid h-11 text-xs px-4"
                                  value={story.role}
                                  onChange={(e) => {
                                    const newStories = [...settings.homepageSettings.successStories];
                                    newStories[idx].role = e.target.value;
                                    setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                                  }}
                                />
                              </div>
                              <textarea
                                placeholder="Success Story Quote..."
                                className="input-solid min-h-[100px] p-4 text-xs resize-none"
                                value={story.quote}
                                onChange={(e) => {
                                  const newStories = [...settings.homepageSettings.successStories];
                                  newStories[idx].quote = e.target.value;
                                  setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                                }}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Avatar Image URL (or upload below)"
                                  className="input-solid flex-1 h-11 text-xs px-4"
                                  value={story.avatar || ''}
                                  onChange={(e) => {
                                    const newStories = [...settings.homepageSettings.successStories];
                                    newStories[idx].avatar = e.target.value;
                                    setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`avatar-upload-${idx}`)?.click()}
                                  className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black hover:bg-primary/20 transition"
                                >
                                  CHOOSE FILE
                                </button>
                                <input
                                  type="file"
                                  id={`avatar-upload-${idx}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const token = localStorage.getItem('alumni_hub_token');
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const tid = toast.loading('Uploading Avatar...');
                                    try {
                                      const res = await fetch('/api/system/upload-image', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        body: formData
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        const newStories = [...settings.homepageSettings.successStories];
                                        newStories[idx].avatar = data.imageUrl;
                                        setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, successStories: newStories } });
                                        toast.success('Avatar Uploaded!', { id: tid });
                                      } else {
                                        toast.error(data.message || 'Upload failed', { id: tid });
                                      }
                                    } catch (err) {
                                      toast.error('Connection error', { id: tid });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">CAMPUS GALLERY (4 IMAGES)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {(settings.homepageSettings?.galleryImages || []).map((url: string, idx: number) => (
                          <div key={idx} className="space-y-4 group">
                            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted border border-border shadow-md group-hover:scale-[1.02] transition-all relative">
                              <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => document.getElementById(`gallery-upload-${idx}`)?.click()}
                                  className="bg-white text-primary px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                >
                                  UPLOAD NEW
                                </button>
                                <input
                                  type="file"
                                  id={`gallery-upload-${idx}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const token = localStorage.getItem('alumni_hub_token');
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const tid = toast.loading('Uploading to Gallery...');
                                    try {
                                      const res = await fetch('/api/system/upload-image', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        body: formData
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        const newGallery = [...settings.homepageSettings.galleryImages];
                                        newGallery[idx] = data.imageUrl;
                                        setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, galleryImages: newGallery } });
                                        toast.success('Gallery Updated!', { id: tid });
                                      } else {
                                        toast.error(data.message || 'Upload failed', { id: tid });
                                      }
                                    } catch (err) {
                                      toast.error('Connection error', { id: tid });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder="Image URL"
                              className="input-solid h-10 text-[9px] px-3 font-bold"
                              value={url || ''}
                              onChange={(e) => {
                                const newGallery = [...settings.homepageSettings.galleryImages];
                                newGallery[idx] = e.target.value;
                                setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, galleryImages: newGallery } });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateSettings}
                      className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs"
                    >
                      SAVE ALL HOMEPAGE CHANGES
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )
        )}
      </div>
    </MainLayout >
  );
};

export default AdminDashboard;
