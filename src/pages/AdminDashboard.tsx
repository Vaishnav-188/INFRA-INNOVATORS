import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { toast } from 'sonner';

type TabType = 'verifications' | 'events' | 'donations';

interface Verification {
  id: string;
  name: string;
  rollNumber: string;
  yearOfStudy: string;
  linkedinProfile: string;
}

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved';
}

interface Donation {
  id: string;
  amount: number;
  purpose: string;
  timestamp: string;
}

// Demo data
const demoVerifications: Verification[] = [
  {
    id: '1',
    name: 'John Smith',
    rollNumber: 'CS2022001',
    yearOfStudy: '2022 - 2026',
    linkedinProfile: 'https://linkedin.com/in/johnsmith',
  },
  {
    id: '2',
    name: 'Emily Johnson',
    rollNumber: 'EC2022045',
    yearOfStudy: '2022 - 2026',
    linkedinProfile: 'https://linkedin.com/in/emilyjohnson',
  },
];

const demoEvents: PendingEvent[] = [
  {
    id: '1',
    title: 'Tech Talk: AI in Healthcare',
    description: 'A comprehensive session on the latest AI applications in medical diagnosis.',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Alumni Networking Night',
    description: 'An evening of networking and connecting with fellow alumni.',
    status: 'approved',
  },
];

const demoDonations: Donation[] = [
  { id: '1', amount: 50000, purpose: 'Scholarship Fund', timestamp: '2026-01-25' },
  { id: '2', amount: 25000, purpose: 'Library Upgrade', timestamp: '2026-01-20' },
  { id: '3', amount: 100000, purpose: 'Campus Infrastructure', timestamp: '2026-01-15' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();
  
  const [tab, setTab] = useState<TabType>('verifications');
  const [verifications, setVerifications] = useState<Verification[]>(demoVerifications);
  const [events, setEvents] = useState<PendingEvent[]>(demoEvents);
  const [donations] = useState<Donation[]>(demoDonations);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleApproveVerification = (id: string) => {
    setVerifications(verifications.filter(v => v.id !== id));
    toast.success('Verification approved!');
  };

  const handleRejectVerification = (id: string) => {
    setVerifications(verifications.filter(v => v.id !== id));
    toast.success('Verification rejected');
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

  const tabs: { value: TabType; label: string }[] = [
    { value: 'verifications', label: 'Verifications' },
    { value: 'events', label: 'Event Approvals' },
    { value: 'donations', label: 'Donations' },
  ];

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
        <h1 className="text-4xl font-black text-foreground mb-10 tracking-tight underline decoration-primary">
          Admin Dashboard
        </h1>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <GlassCard variant="light" className="p-6 text-center">
            <p className="text-4xl font-black text-primary">{verifications.length}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Pending Verifications</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center">
            <p className="text-4xl font-black text-warning">{events.filter(e => e.status === 'pending').length}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Pending Events</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center">
            <p className="text-4xl font-black text-success">₹{(totalDonations / 1000).toFixed(0)}K</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">Total Donations</p>
          </GlassCard>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition ${
                tab === t.value
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
                  <h3 className="font-black text-xl text-foreground">{v.name}</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Roll No: {v.rollNumber} • Year: {v.yearOfStudy}
                  </p>
                  <a
                    href={v.linkedinProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-bold mt-2 inline-block"
                  >
                    LinkedIn Profile →
                  </a>
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
              <GlassCard key={d.id} variant="default" className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl text-success">
                    ₹{d.amount.toLocaleString()}
                  </h3>
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">
                    Purpose: {d.purpose}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">
                  {new Date(d.timestamp).toLocaleDateString()}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
