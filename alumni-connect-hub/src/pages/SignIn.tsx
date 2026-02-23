import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import VantaBackground from '@/components/layout/VantaBackground';
import { toast } from 'sonner';

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'admin', label: 'Admin' },
  ];

  const getPlaceholder = () => {
    switch (role) {
      case 'student':
        return 'roll_no@kgkite.ac.in';
      case 'alumni':
        return 'name@kgkite.ac.in or @kgkite.alumni.ac.in';
      case 'admin':
        return 'Admin Email (admin@college.edu)';
      default:
        return 'Email';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(email, password, role);

    if (result.success) {
      toast.success('Welcome back!');
      // Redirect based on role
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'alumni':
          navigate('/alumni');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    } else {
      toast.error(result.error || 'Login failed');
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
              <span className="text-foreground">WELCOME</span>{' '}
              <span className="text-primary">BACK</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-3 font-medium">
              Sign in to your professional account
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-muted p-1.5 rounded-2xl mb-10">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
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
            {/* Email Input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={getPlaceholder()}
              className="input-solid"
            />

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-solid pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Save Password */}
            <div className="flex items-center gap-3 ml-1">
              <input
                type="checkbox"
                id="save-login"
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="save-login"
                className="text-label text-muted-foreground cursor-pointer select-none"
              >
                Save password
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-10 text-center">
            <p className="text-[11px] text-muted-foreground font-medium italic">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary font-bold not-italic hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted rounded-2xl">
            <p className="text-xs text-muted-foreground font-bold mb-2">Demo Credentials:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Admin: admin@college.edu / Admin@123</p>
              <p>• Student: student1@kgkite.ac.in / Student@123</p>
              <p>• Alumni: arjun.das@kgkite.alumni.ac.in / Alumni@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
