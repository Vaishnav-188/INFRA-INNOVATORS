import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Linkedin } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import VantaBackground from '@/components/layout/VantaBackground';
import { toast } from 'sonner';

const SignUp = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [studentVerified, setStudentVerified] = useState(false);
  const [alumniVerified, setAlumniVerified] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    batch: '',
    linkedin: '',
    github: '',
    mentorDomainPreference: '',
    adminCode: '',
    adminSecret: '',
  });

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'admin', label: 'Admin' },
  ];

  const batches = {
    student: ['2022 - 2026', '2023 - 2027', '2024 - 2028'],
    alumni: ['Class of 2018', 'Class of 2019', 'Class of 2020', 'Class of 2021'],
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVerifyEmail = () => {
    const domain = role === 'student' ? '@kgkite.ac.in' : '@kgkite.alumni.ac.in';
    if (!formData.email.endsWith(domain)) {
      toast.error(`Please use your official email (${domain})`);
      return;
    }
    if (role === 'student') setStudentVerified(true);
    if (role === 'alumni') setAlumniVerified(true);
    toast.success('Email verified! Complete your registration.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let userData;

    if (role === 'student') {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      userData = {
        username: formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        role: 'student' as UserRole,
        batch: formData.batch,
        github: formData.github,
        linkedIn: formData.linkedin,
        mentorDomainPreference: formData.mentorDomainPreference,
      };
    } else if (role === 'alumni') {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      userData = {
        username: formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        role: 'alumni' as UserRole,
        batch: formData.batch,
        phone: formData.phone,
        linkedIn: formData.linkedin,
        github: formData.github,
      };
    } else {
      if (!formData.adminCode || !formData.adminSecret) {
        toast.error('Please provide admin credentials');
        return;
      }
      userData = {
        username: formData.adminCode,
        email: `${formData.adminCode}@admin.com`,
        password: formData.adminSecret,
        role: 'admin' as UserRole,
      };
    }

    const result = await register(userData);

    if (result.success) {
      if (result.error) {
        // Handle pending admin approval (for students and new admins)
        toast.info(result.error, { duration: 6000 });
        navigate('/signin');
      } else {
        toast.success('Account created successfully!');
        // Redirect to appropriate dashboard only if successfully logged in (alumni)
        navigate(role === 'alumni' ? '/alumni' : '/signin');
      }
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <VantaBackground backgroundColor={0xf8fafc} />

      <div className="w-full max-w-2xl">
        <div className="glass-solid rounded-[3rem] p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-foreground">SIGNUP</span>{' '}
              <span className="text-primary">PAGE</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-3 font-medium">
              Please select your role to begin sign up
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-muted p-1.5 rounded-2xl mb-10">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRole(r.value);
                  setStudentVerified(false);
                  setAlumniVerified(false);
                }}
                className={`flex-1 py-3 text-nav rounded-xl transition-all duration-300 ${role === r.value
                  ? 'bg-card shadow-lg text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Form */}
            {role === 'student' && (
              <div className="space-y-5">
                <div>
                  <label className="text-label text-muted-foreground mb-2 block">
                    College Mail ID
                  </label>
                  <div className="relative flex gap-3">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="roll_no@kgkite.ac.in"
                      className="input-solid flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="px-6 bg-primary text-primary-foreground text-label rounded-2xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                    >
                      VERIFY
                    </button>
                  </div>
                </div>

                {studentVerified && (
                  <div className="space-y-5 animate-fade-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-label text-muted-foreground mb-1 block">
                          Mentorship Domain
                        </label>
                        <select
                          value={formData.mentorDomainPreference}
                          onChange={(e) => updateField('mentorDomainPreference', e.target.value)}
                          className="input-solid"
                        >
                          <option value="">Preferred Domain</option>
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Data Science">Data Science</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="Cybersecurity">Cybersecurity</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-label text-muted-foreground mb-1 block">
                          Batch
                        </label>
                        <select
                          value={formData.batch}
                          onChange={(e) => updateField('batch', e.target.value)}
                          className="input-solid"
                        >
                          <option value="">Select Batch</option>
                          {batches.student.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-label text-muted-foreground mb-1 block">
                          GitHub Profile
                        </label>
                        <input
                          type="url"
                          value={formData.github}
                          onChange={(e) => updateField('github', e.target.value)}
                          placeholder="https://github.com/profile"
                          className="input-solid"
                        />
                      </div>
                      <div className="relative">
                        <label className="text-label text-muted-foreground mb-1 block">
                          LinkedIn Profile
                        </label>
                        <input
                          type="url"
                          value={formData.linkedin}
                          onChange={(e) => updateField('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/profile"
                          className="input-solid"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-label text-muted-foreground mb-1 block">
                        Create Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="••••••••"
                        className="input-solid pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-10 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alumni Form */}
            {role === 'alumni' && (
              <div className="space-y-5">
                <div>
                  <label className="text-label text-muted-foreground mb-2 block">
                    Alumni Graduate Mail ID
                  </label>
                  <div className="relative flex gap-3">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="name@kgkite.alumni.ac.in"
                      className="input-solid flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="px-6 bg-success text-success-foreground text-label rounded-2xl hover:bg-success/90 transition shadow-lg shadow-success/20"
                    >
                      VERIFY
                    </button>
                  </div>
                </div>

                {alumniVerified && (
                  <div className="space-y-5 animate-fade-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        placeholder="Full Name"
                        className="input-solid"
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="Phone Number"
                        className="input-solid"
                      />
                    </div>
                    <select
                      value={formData.batch}
                      onChange={(e) => updateField('batch', e.target.value)}
                      className="input-solid"
                    >
                      <option value="" disabled>Pass-out Batch</option>
                      {batches.alumni.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.linkedin}
                          onChange={(e) => updateField('linkedin', e.target.value)}
                          placeholder="LinkedIn Profile"
                          className="input-solid pr-12"
                        />
                        <span className="absolute right-4 top-4 text-primary">
                          <Linkedin size={20} />
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.github}
                          onChange={(e) => updateField('github', e.target.value)}
                          placeholder="GitHub Profile"
                          className="input-solid"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="Set Password"
                        className="input-solid pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Form */}
            {role === 'admin' && (
              <div className="space-y-4 text-center">
                <div className="p-6 bg-muted border border-dashed border-border rounded-3xl">
                  <p className="text-xs text-muted-foreground font-medium mb-4">
                    Administrative registration is limited.
                  </p>
                  <input
                    type="text"
                    value={formData.adminCode}
                    onChange={(e) => updateField('adminCode', e.target.value)}
                    placeholder="Employee Code"
                    className="input-solid mb-4"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminSecret}
                      onChange={(e) => updateField('adminSecret', e.target.value)}
                      placeholder="Admin Secret Key"
                      className="input-solid pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Credentials */}
            <div className="flex items-center gap-3 ml-2">
              <input
                type="checkbox"
                id="save"
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <label
                htmlFor="save"
                className="text-label text-muted-foreground cursor-pointer"
              >
                Save credentials for this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (role === 'student' && !studentVerified) || (role === 'alumni' && !alumniVerified)}
              className="w-full py-5 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Initialize Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center border-t border-border pt-6">
            <p className="text-xs text-muted-foreground font-medium italic">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="text-primary font-bold not-italic hover:underline"
              >
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
