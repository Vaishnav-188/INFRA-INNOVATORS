import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useHeroReveal, useScrollReveal, useStaggerReveal } from '@/hooks/useGSAP';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

// Success stories data
const successStories = [
  {
    id: 1,
    name: 'Marcus Sterling',
    role: 'CEO @ OrbitGlobal',
    batch: "Class of '14",
    avatar: 'https://i.pravatar.cc/150?u=4',
    quote: 'This institution gave me more than just a degree; it gave me a mindset. Staying connected via this portal has been vital for my professional growth.',
  },
  {
    id: 2,
    name: 'Dr. Sarah Vance',
    role: 'Medical Lead',
    batch: "Class of '19",
    avatar: 'https://i.pravatar.cc/150?u=9',
    quote: 'Giving back through mentorship on this platform allows me to stay engaged with the brilliant minds coming out of our college every year.',
  },
];

// Gallery images
const galleryImages = [
  'https://picsum.photos/500/500?random=10',
  'https://picsum.photos/500/500?random=11',
  'https://picsum.photos/500/500?random=12',
  'https://picsum.photos/500/500?random=13',
];

const Index = () => {
  const { user } = useAuth();
  const heroRef = useHeroReveal();
  const storiesRef = useScrollReveal();
  const galleryRef = useStaggerReveal(0.1);
  const verificationRef = useScrollReveal();
  const donationRef = useScrollReveal();
  const feedbackRef = useScrollReveal();

  // Verification form state
  const [verifyForm, setVerifyForm] = useState({
    name: '',
    roll: '',
    study: '',
    dob: '',
    linkedin: '',
  });

  // Donation form state
  const [donationForm, setDonationForm] = useState({
    amount: '',
    purpose: '',
  });

  // Feedback state
  const [feedback, setFeedback] = useState('');

  const handleVerifySubmit = () => {
    if (!verifyForm.name || !verifyForm.roll) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Verification request submitted! Admin will review your application.');
    setVerifyForm({ name: '', roll: '', study: '', dob: '', linkedin: '' });
  };

  const handleDonation = () => {
    if (!donationForm.amount) {
      toast.error('Please enter donation amount');
      return;
    }
    toast.success(`Thank you for your donation of ₹${donationForm.amount}!`);
    setDonationForm({ amount: '', purpose: '' });
  };

  const handleFeedback = () => {
    if (!feedback.trim()) {
      toast.error('Please write your feedback');
      return;
    }
    toast.success('Feedback submitted to management!');
    setFeedback('');
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <header ref={heroRef} className="pt-48 pb-32 px-10 text-center max-w-5xl mx-auto">
        <h1 className="text-hero text-foreground mb-8">
          <span className="hero-line block">EXCELLENCE</span>
          <span className="hero-line block text-primary italic">RECONNECTED.</span>
        </h1>
        <p className="hero-subtitle text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed">
          The official professional gateway for our alumni community. Share stories, 
          discover opportunities, and mentor the next generation.
        </p>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-20 pb-32 max-w-7xl mx-auto">
        {/* Success Stories Section */}
        <section ref={storiesRef} className="mb-24">
          <h2 className="text-label text-primary mb-10 text-center">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {successStories.map((story) => (
              <GlassCard key={story.id} variant="light" hover>
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-muted rounded-2xl overflow-hidden">
                    <img
                      src={story.avatar}
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{story.name}</h4>
                    <p className="text-xs font-bold text-primary uppercase">
                      {story.batch} • {story.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium italic">
                  "{story.quote}"
                </p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Campus Gallery Section */}
        <section className="mb-24">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-section-title text-foreground">Campus Gallery</h2>
            <div className="h-[1px] flex-1 mx-10 bg-border" />
            <button className="text-label border-b-2 border-primary text-primary">
              View All
            </button>
          </div>
          <div ref={galleryRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square glass-light rounded-3xl overflow-hidden group"
              >
                <img
                  src={img}
                  alt={`Campus ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Student Verification Section - Only for Students */}
        {user?.role === 'student' && (
          <section ref={verificationRef} className="mb-24">
            <GlassCard variant="light" className="p-12 md:p-16 rounded-[3rem]">
              <h2 className="text-4xl font-black text-foreground mb-6 tracking-tight">
                Become an Alumni Member
              </h2>
              <p className="text-muted-foreground font-medium mb-10">
                Submit your details for verification to transition from Student to Alumni status.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={verifyForm.name}
                  onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })}
                  className="input-glass"
                />
                <input
                  type="text"
                  placeholder="Roll Number"
                  value={verifyForm.roll}
                  onChange={(e) => setVerifyForm({ ...verifyForm, roll: e.target.value })}
                  className="input-glass"
                />
                <input
                  type="text"
                  placeholder="Year of Study"
                  value={verifyForm.study}
                  onChange={(e) => setVerifyForm({ ...verifyForm, study: e.target.value })}
                  className="input-glass"
                />
                <input
                  type="date"
                  value={verifyForm.dob}
                  onChange={(e) => setVerifyForm({ ...verifyForm, dob: e.target.value })}
                  className="input-glass"
                />
                <input
                  type="url"
                  placeholder="LinkedIn Profile"
                  value={verifyForm.linkedin}
                  onChange={(e) => setVerifyForm({ ...verifyForm, linkedin: e.target.value })}
                  className="input-glass md:col-span-2"
                />
              </div>
              <button
                onClick={handleVerifySubmit}
                className="w-full mt-6 py-5 btn-primary"
              >
                Submit for Verification
              </button>
            </GlassCard>
          </section>
        )}

        {/* Donation Section - Only for Alumni */}
        {user?.role === 'alumni' && (
          <section ref={donationRef} className="mb-24">
            <GlassCard variant="light" className="p-12 md:p-16 rounded-[3rem]">
              <h2 className="text-4xl font-black text-foreground mb-6 tracking-tight">
                Support Your Alma Mater
              </h2>
              <p className="text-muted-foreground font-medium mb-10">
                Your contribution helps us provide scholarships and improve campus infrastructure.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  className="input-glass flex-1"
                />
                <input
                  type="text"
                  placeholder="Purpose (e.g. Scholarship)"
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  className="input-glass flex-1"
                />
                <button
                  onClick={handleDonation}
                  className="px-10 py-4 btn-success"
                >
                  Donate Now
                </button>
              </div>
            </GlassCard>
          </section>
        )}

        {/* Feedback Section */}
        <section ref={feedbackRef}>
          <GlassCard variant="light" className="p-12 md:p-16 rounded-[3rem] flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-black text-foreground mb-6 tracking-tight">
                Feedback
              </h2>
              <p className="text-muted-foreground font-medium">
                Your insights help the management team improve campus life and institutional operations. 
                All feedback is reviewed by the Board of Directors.
              </p>
            </div>
            <div className="w-full max-w-md space-y-4">
              <textarea
                placeholder="Write your suggestion here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-glass h-32 resize-none"
              />
              <button
                onClick={handleFeedback}
                className="w-full py-4 btn-secondary"
              >
                Submit to Management
              </button>
            </div>
          </GlassCard>
        </section>

        {/* Call to Action for Guests */}
        {!user && (
          <section className="mt-24 text-center">
            <GlassCard variant="solid" className="p-12 rounded-[3rem]">
              <h2 className="text-3xl font-black text-foreground mb-4">
                Join Our Alumni Network
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Connect with fellow alumni, discover career opportunities, and give back to the community.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/signin">
                  <button className="px-8 py-4 btn-primary">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-8 py-4 btn-secondary">
                    Create Account
                  </button>
                </Link>
              </div>
            </GlassCard>
          </section>
        )}
      </main>
    </MainLayout>
  );
};

export default Index;
