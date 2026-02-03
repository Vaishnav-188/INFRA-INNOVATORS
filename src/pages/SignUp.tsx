import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/context/AuthContext';
import VantaBackground from '@/components/layout/VantaBackground';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const SignUp = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'password'>('email');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [verifiedUserData, setVerifiedUserData] = useState<any>(null);

  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    linkedin: '',
    github: '',
  });

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'alumni', label: 'Alumni' },
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Verify email exists in pre-verified list
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Please enter your college email');
      return;
    }

    const isEmailValid = role === 'student'
      ? formData.email.toLowerCase().endsWith('@kgkite.ac.in')
      : (formData.email.toLowerCase().endsWith('@kgkite.alumni.ac.in') || formData.email.toLowerCase().endsWith('@kgkite.ac.in'));

    if (!isEmailValid) {
      const domain = role === 'student' ? '@kgkite.ac.in' : '@kgkite.alumni.ac.in';
      toast.error(`Please use your official domain: ${domain}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeEmail: formData.email,
          role
        })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        setVerifiedUserData(data.user);
        setFormData(prev => ({ ...prev, name: data.user.name }));
        setStep('password');
        toast.success(data.message);
      } else if (data.accountExists) {
        toast.error(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to verify email. Please try again.');
    }
  };

  // Step 2: Set password and complete registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          collegeEmail: formData.email,
          password: formData.password,
          role,
          mobileNumber: formData.phone,
          linkedIn: formData.linkedin,
          github: formData.github
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);

        // Store token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Redirect based on role
          if (role === 'student') {
            navigate('/student');
          } else if (role === 'alumni') {
            navigate('/alumni');
          }
        } else {
          // Pending verification
          navigate('/signin');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <VantaBackground backgroundColor={0xf8fafc} />

      <div className="w-full max-w-[500px]">
        <div className="glass-solid rounded-[3.5rem] p-10 md:p-14">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black tracking-tight">
              <span className="text-foreground">JOIN</span>{' '}
              <span className="text-primary">US</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-3 font-medium">
              {step === 'email' ? 'Verify your college email' : 'Set your account password'}
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-muted p-1.5 rounded-2xl mb-10">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRole(r.value);
                  setStep('email');
                  setVerifiedUserData(null);
                }}
                disabled={step === 'password'}
                className={`flex-1 py-3 text-nav rounded-xl transition-all duration-300 ${role === r.value
                    ? 'bg-card shadow-lg text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  } ${step === 'password' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Step 1: Email Verification */}
          {step === 'email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-8">
              <div>
                <label className="block text-nav font-semibold mb-3">
                  College Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={role === 'student' ? 'your.name@kgkite.ac.in' : 'your.name@kgkite.alumni.ac.in'}
                  className="input-modern w-full"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-modern w-full group"
              >
                <span>Verify Email</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>

              <div className="text-center text-body">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Password Setup */}
          {step === 'password' && verifiedUserData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Verified Email Badge */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={24} />
                <div>
                  <p className="text-sm font-semibold text-green-900">Email Verified</p>
                  <p className="text-sm text-green-700">{formData.email}</p>
                </div>
              </div>

              {/* Name (pre-filled from DB) */}
              <div>
                <label className="block text-nav font-semibold mb-3">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="input-modern w-full"
                  required
                  disabled
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-nav font-semibold mb-3">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input-modern w-full pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-nav font-semibold mb-3">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className="input-modern w-full"
                  required
                />
              </div>

              {/* Optional Fields */}
              <div>
                <label className="block text-nav font-semibold mb-3">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-nav font-semibold mb-3">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-nav font-semibold mb-3">
                  GitHub Profile (Optional)
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => updateField('github', e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="input-modern w-full"
                />
              </div>

              <button
                type="submit"
                className="btn-modern w-full"
              >
                Complete Registration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
