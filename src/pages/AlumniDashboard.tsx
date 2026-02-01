import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';
import {
  Calendar, Briefcase, Heart, Users, ArrowRight,
  PlusCircle, DollarSign, QrCode, Award, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Demo data removed - using live database values

const AlumniDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();
  const cardsRef = useStaggerReveal(0.1);

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('general');
  const [settings, setSettings] = useState<any>(null);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchAlumniData = async () => {
    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    setIsDataLoading(true);
    try {
      // Fetch Donations
      const donRes = await fetch('http://localhost:5000/api/donations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const donData = await donRes.json();
      if (donData.success) {
        setMyDonations(donData.donations);
      }

      // Fetch Jobs
      const jobRes = await fetch('http://localhost:5000/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jobData = await jobRes.json();

      // Fetch Events
      const eveRes = await fetch('http://localhost:5000/api/events/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eveData = await eveRes.json();

      // Combine and filter jobs
      const myJobs = jobData.success ? jobData.jobs.filter((j: any) => j.postedBy?._id === user?.id || j.postedBy === user?.id) : [];
      const myEvents = eveData.success ? eveData.events : [];

      const combined: any[] = [
        ...myJobs.map((j: any) => ({
          id: j._id,
          type: 'job',
          title: j.title,
          date: new Date(j.createdAt).toLocaleDateString(),
          status: j.status || 'approved'
        })),
        ...myEvents.map((e: any) => ({
          id: e._id,
          type: 'event',
          title: e.title,
          date: new Date(e.createdAt).toLocaleDateString(),
          status: e.status || 'approved'
        }))
      ];

      // Sort by date newest
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMyPosts(combined);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    if (user) fetchAlumniData();
  }, [user]);

  // Redirect if not alumni
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'alumni')) {
      navigate('/signin');
    }
  }, [user, navigate, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Entering Alumni Lounge...</p>
        </div>
      </div>
    );
  }

  const handleDonation = async () => {

    const token = localStorage.getItem('alumni_hub_token');
    if (!token) return;

    if (!isVerifying) {
      if (!donationAmount || Number(donationAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      setIsVerifying(true);
      return;
    }

    if (!transactionId) {
      toast.error('Verification failed: You didn\'t provide the Transaction ID!');
      return;
    }

    const tid = toast.loading('Synchronizing with bank records...');
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(donationAmount),
          purpose: donationPurpose,
          transactionId: transactionId
        })
      });

      const data = await response.json();

      // Artificial delay for "Wow" effect
      await new Promise(r => setTimeout(r, 1500));

      if (data.success) {
        setIsSuccess(true);
        toast.success(`Transaction Verified!`, { id: tid });
        setDonationAmount('');
        setTransactionId('');
        setDonationPurpose('general');
        fetchAlumniData();

        setTimeout(() => {
          setShowDonationModal(false);
          setIsSuccess(false);
          setIsVerifying(false);
          setIsProcessing(false);
        }, 3000);
      } else {
        toast.error(data.message || 'Payment not found in bank logs', { id: tid });
      }
    } catch (err) {
      toast.error('Connection error', { id: tid });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || user.role !== 'alumni') {
    return null;
  }

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
        {/* Urgent Notification */}
        {settings?.donationSettings?.isDonationUrgent && (
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between animate-pulse-slow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Important Donation Request</p>
                <p className="text-xs text-muted-foreground">{settings.donationSettings.urgentMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDonationModal(true)}
              className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
            >
              DETAILS
            </button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Welcome, {user.username}!
            </h1>
            {user.isVerified && (
              <span className="badge-alumni flex items-center gap-1">
                <Award size={12} /> Verified
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            {user.batch} • Alumni Dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Link to="/events">
            <GlassCard variant="light" className="p-6 text-center hover-lift cursor-pointer group">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition">
                <PlusCircle className="text-primary" size={24} />
              </div>
              <p className="font-bold text-foreground">Post Event</p>
              <p className="text-xs text-muted-foreground">Share with community</p>
            </GlassCard>
          </Link>
          <Link to="/jobs">
            <GlassCard variant="light" className="p-6 text-center hover-lift cursor-pointer group">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-success/10 flex items-center justify-center mb-3 group-hover:bg-success/20 transition">
                <Briefcase className="text-success" size={24} />
              </div>
              <p className="font-bold text-foreground">Post Job</p>
              <p className="text-xs text-muted-foreground">Help students grow</p>
            </GlassCard>
          </Link>
          <GlassCard
            variant="light"
            className="p-6 text-center hover-lift cursor-pointer group"
            onClick={() => setShowDonationModal(true)}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-3 group-hover:bg-warning/20 transition">
              <Heart className="text-warning" size={24} />
            </div>
            <p className="font-bold text-foreground">Donate</p>
            <p className="text-xs text-muted-foreground">Support your alma mater</p>
          </GlassCard>
          <GlassCard variant="light" className="p-6 text-center hover-lift cursor-pointer group">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-3 group-hover:bg-destructive/20 transition">
              <Users className="text-destructive" size={24} />
            </div>
            <p className="font-bold text-foreground">Mentorship</p>
            <p className="text-xs text-muted-foreground">Guide students</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Posts */}
          <GlassCard variant="light" className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-foreground">My Posts</h2>
              <Link to="/events" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                Create New <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {isDataLoading ? (
                <div className="py-20 text-center animate-pulse">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fetching Posts...</p>
                </div>
              ) : myPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${post.type === 'job' ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                    {post.type === 'job' ? (
                      <Briefcase className="text-success" size={20} />
                    ) : (
                      <Calendar className="text-primary" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-sm">{post.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">{post.date}</p>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${post.status === 'approved' || post.status === 'upcoming'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                    }`}>
                    {post.status}
                  </span>
                </div>
              ))}
              {!isDataLoading && myPosts.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Users className="text-muted-foreground" size={24} />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                    No contributions yet
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Start by sharing an event or job opportunity
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Donation History */}
          <GlassCard variant="light" className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-foreground">My Donations</h2>
              <button
                onClick={() => setShowDonationModal(true)}
                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
              >
                Donate Now <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {isDataLoading ? (
                <div className="py-20 text-center animate-pulse">
                  <div className="w-8 h-8 border-2 border-success border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading History...</p>
                </div>
              ) : myDonations.map((donation) => (
                <div
                  key={donation._id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <DollarSign className="text-success" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-success text-sm">₹{donation.amount.toLocaleString()}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{donation.purpose || 'General'}</p>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {!isDataLoading && myDonations.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Heart className="text-muted-foreground" size={24} />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                    No donations found
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Support your college today
                  </p>
                </div>
              )}
            </div>
            {myDonations.length > 0 && (
              <div className="mt-6 p-5 bg-success/10 rounded-[2rem] text-center border border-success/10">
                <p className="text-xs font-black text-success uppercase tracking-widest">
                  Total Contributed
                </p>
                <p className="text-2xl font-black text-success mt-1">
                  ₹{myDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Impact Stats */}
        <GlassCard variant="solid" className="mt-10 p-8 md:p-12 rounded-[3rem]">
          <h2 className="text-2xl font-black text-foreground mb-8 text-center">
            Your Impact
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <p className="text-5xl font-black text-primary tracking-tighter">{myPosts.length}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Contributions</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-black text-success tracking-tighter">
                ₹{(myDonations.reduce((sum, d) => sum + d.amount, 0) / 1000).toFixed(0)}K
              </p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Donated</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-black text-warning tracking-tighter">0</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Mentee Count</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-black text-destructive tracking-tighter">0</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Impact Reach</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center p-8 animate-scale-in">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center animate-bounce-slow shadow-lg shadow-success/30">
                    <CheckCircle className="text-success-foreground" size={32} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-foreground tracking-tighter">PAID SUCCESSFULLY</h2>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Transaction Verified by Bank</p>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success animate-progress-fast" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Updating College Records...</p>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-8 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="text-primary animate-bounce-slow" size={40} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Verifying Payment</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">Connecting to UPI Network...</p>
                </div>
              </div>
            ) : isVerifying ? (
              <div className="w-full space-y-8 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground">VERIFICATION</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black rounded-full uppercase tracking-tighter">Step 2 of 2</span>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Enter UTR Details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 p-5 rounded-3xl border border-border">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Confirming Amount</p>
                    <p className="text-2xl font-black text-primary">₹{donationAmount}</p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="12-Digit Transaction ID / UTR"
                      className="w-full h-16 bg-muted/30 border-2 border-primary/10 rounded-2xl px-6 font-black text-sm outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                    />
                    <div className="absolute -top-3 left-6 px-2 bg-card text-[9px] font-black text-primary uppercase tracking-widest">
                      Transaction Reference
                    </div>
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground font-medium italic">
                    You can find this ID in your Google Pay / PhonePe history
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleDonation}
                    className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-primary transition-all active:scale-[0.98]"
                  >
                    VERIFY & FINISH
                  </button>
                  <button
                    onClick={() => setIsVerifying(false)}
                    className="w-full py-3 text-muted-foreground font-black uppercase tracking-widest text-[9px] hover:text-foreground transition-colors"
                  >
                    Back to QR
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
                    Payment Gateway
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] font-black rounded-full uppercase tracking-tighter">Step 1 of 2</span>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      Secure UPI Transfer
                    </p>
                  </div>
                </div>

                {/* Amount Input - Prominent */}
                <div className="w-full mb-8">
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary transition-colors group-focus-within:text-foreground">₹</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-20 bg-muted/30 border-2 border-primary/10 rounded-3xl pl-12 pr-6 text-3xl font-black text-foreground outline-none focus:border-primary/30 focus:bg-background transition-all"
                    />
                    <div className="absolute -top-3 left-6 px-2 bg-card text-[10px] font-black text-primary uppercase tracking-widest">
                      Enter Amount
                    </div>
                  </div>
                </div>

                {/* Dynamic QR Code */}
                <div className="relative group mb-8">
                  <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-48 h-48 bg-white p-4 rounded-3xl shadow-xl border-2 border-primary/5 flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${settings?.donationSettings?.upiId || '9994463950@ptaxis'}&pn=Alumni%20Hub&am=${donationAmount}&cu=INR`)}`}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Floating tooltip */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground text-background text-[8px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap">
                    Amount Pre-filled
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-2xl mb-8 flex items-center justify-between w-full border border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Merchant UPI ID</p>
                    <p className="text-xs font-black text-foreground tracking-tight">{settings?.donationSettings?.upiId || '9994463950@ptaxis'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <QrCode size={16} />
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      console.log('Transitioning to verification stage...');
                      handleDonation();
                    }}
                    disabled={!donationAmount || Number(donationAmount) <= 0}
                    className="w-full py-5 bg-success text-success-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    CONTINUE TO VERIFY
                  </button>
                  <button
                    onClick={() => setShowDonationModal(false)}
                    className="w-full py-3 text-muted-foreground font-black uppercase tracking-widest text-[9px] hover:text-foreground transition-colors"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AlumniDashboard;
