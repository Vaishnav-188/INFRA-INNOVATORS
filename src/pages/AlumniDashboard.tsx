import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';
import { 
  Calendar, Briefcase, Heart, Users, ArrowRight, 
  PlusCircle, DollarSign, QrCode, Award
} from 'lucide-react';
import { toast } from 'sonner';

// Demo data
const myPosts = [
  { id: 1, type: 'job', title: 'Senior Software Engineer', date: '2 days ago', status: 'approved' },
  { id: 2, type: 'event', title: 'Tech Talk: AI Innovations', date: '1 week ago', status: 'pending' },
];

const recentDonations = [
  { id: 1, amount: 10000, purpose: 'Scholarship Fund', date: 'Jan 15, 2026' },
  { id: 2, amount: 5000, purpose: 'Library Books', date: 'Dec 20, 2025' },
];

const AlumniDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageRef = usePageTransition();
  const cardsRef = useStaggerReveal(0.1);

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('');

  // Redirect if not alumni
  useEffect(() => {
    if (!user || user.role !== 'alumni') {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleDonation = () => {
    if (!donationAmount) {
      toast.error('Please enter donation amount');
      return;
    }
    toast.success(`Thank you for your generous donation of ₹${donationAmount}!`);
    setDonationAmount('');
    setDonationPurpose('');
    setShowDonationModal(false);
  };

  if (!user || user.role !== 'alumni') {
    return null;
  }

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
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
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    post.type === 'job' ? 'bg-success/10' : 'bg-primary/10'
                  }`}>
                    {post.type === 'job' ? (
                      <Briefcase className="text-success" size={20} />
                    ) : (
                      <Calendar className="text-primary" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{post.title}</h3>
                    <p className="text-xs text-muted-foreground">{post.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                    post.status === 'approved' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
              {myPosts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No posts yet. Start sharing with the community!
                </p>
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
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <DollarSign className="text-success" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-success">₹{donation.amount.toLocaleString()}</h3>
                    <p className="text-xs text-muted-foreground">{donation.purpose}</p>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {donation.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-success/10 rounded-2xl text-center">
              <p className="text-sm font-bold text-success">
                Total Contributed: ₹{recentDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Impact Stats */}
        <GlassCard variant="solid" className="mt-10 p-8 md:p-12 rounded-[3rem]">
          <h2 className="text-2xl font-black text-foreground mb-8 text-center">
            Your Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-4xl font-black text-primary">{myPosts.length}</p>
              <p className="text-sm text-muted-foreground font-bold">Posts Shared</p>
            </div>
            <div>
              <p className="text-4xl font-black text-success">
                ₹{(recentDonations.reduce((sum, d) => sum + d.amount, 0) / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-muted-foreground font-bold">Donated</p>
            </div>
            <div>
              <p className="text-4xl font-black text-warning">5</p>
              <p className="text-sm text-muted-foreground font-bold">Students Mentored</p>
            </div>
            <div>
              <p className="text-4xl font-black text-destructive">120</p>
              <p className="text-sm text-muted-foreground font-bold">Profile Views</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 animate-scale-in">
            <h2 className="text-2xl font-black text-foreground mb-6 text-center">
              Support Your Alma Mater
            </h2>
            
            {/* QR Code Placeholder */}
            <div className="w-40 h-40 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-6">
              <QrCode size={80} className="text-muted-foreground" />
            </div>
            <p className="text-center text-xs text-muted-foreground mb-6">
              Scan QR code or enter details below
            </p>

            <div className="space-y-4">
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="input-solid"
              />
              <input
                type="text"
                value={donationPurpose}
                onChange={(e) => setDonationPurpose(e.target.value)}
                placeholder="Purpose (e.g., Scholarship Fund)"
                className="input-solid"
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowDonationModal(false)}
                className="flex-1 py-4 text-muted-foreground font-bold uppercase tracking-widest text-xs hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDonation}
                className="flex-1 py-4 btn-success"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AlumniDashboard;
