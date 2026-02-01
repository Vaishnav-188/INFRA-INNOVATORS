import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { toast } from 'sonner';
import { Plus, Info, Bell, CheckCircle, Trash2, Edit3, MoreHorizontal, Bookmark } from 'lucide-react';

type TabType = 'verifications' | 'events' | 'donations' | 'csv_upload' | 'settings';

interface Verification {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
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

  // Fetch stats separately
  const fetchStats = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/users/stats', {
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
      const response = await fetch(`http://localhost:5000/api/csv/${endpoint}`, {
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
        fetchStats();
      } else {
        toast.error(data.message || 'Import failed', { id: toastId });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Connection error while uploading', { id: toastId });
    }
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
      const response = await fetch('http://localhost:5000/api/system/settings');
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
        const response = await fetch('http://localhost:5000/api/users/pending-verifications', {
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

  // Fetch all donations
  const fetchDonations = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/donations', {
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

  const handleApproveVerification = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/verify/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/users/reject/${id}`, {
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

  const handleApproveEvent = (id: string) => {
    setEvents(events.map(e =>
      e.id === id ? { ...e, status: 'approved' } : e
    ));
    toast.success('Event approved!');
  };

  const handleRejectEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success('Event rejected');
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/system/settings', {
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
    { value: 'events', label: 'Event Approvals' },
    { value: 'donations', label: 'Donations' },
    { value: 'csv_upload', label: 'CSV Upload' },
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
          <GlassCard variant="light" className="p-6 text-center shadow-success/5">
            <p className="text-4xl font-black text-success">
              ₹{(stats?.totalDonations || 0).toLocaleString()}
            </p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Total Donations</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center shadow-info/5">
            <div className="flex justify-around items-center">
              <div>
                <p className="text-3xl font-black text-info">{stats?.students ?? '0'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Students</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <p className="text-3xl font-black text-primary">{stats?.alumni ?? '0'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Alumni</p>
              </div>
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase mt-4 border-t border-border/50 pt-2 tracking-widest">Database Reach</p>
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-xl text-foreground">{v.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${v.role === 'admin' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                      {v.role}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {v.email}
                  </p>
                  {v.role === 'student' && (
                    <p className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-tight">
                      Roll No: {v.rollNumber} • Year: {v.yearOfStudy}
                    </p>
                  )}
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
              <GlassCard key={e.id} variant="default" className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className={e.status === 'pending' ? 'status-pending' : 'status-approved'}>
                    {e.status}
                  </span>
                  <h3 className="font-black text-xl text-foreground mt-2">{e.title}</h3>
                  <p className="text-muted-foreground text-sm">{e.description}</p>
                </div>
                {e.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveEvent(e.id)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-[10px] hover:bg-primary/90 transition"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => handleRejectEvent(e.id)}
                      className="bg-muted text-foreground px-4 py-2 rounded-lg font-bold text-[10px] hover:bg-muted/80 transition"
                    >
                      REJECT
                    </button>
                  </div>
                )}
              </GlassCard>
            ))}
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

        {/* CSV Upload Tab */}
        {tab === 'csv_upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
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
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          !settings ? (
            <div className="flex flex-col items-center justify-center py-24 animate-pulse">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Synchronizing Configuration...</p>
            </div>
          ) : (
            <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
                                const res = await fetch('http://localhost:5000/api/system/upload-qr', {
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
            </div>
          )
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
