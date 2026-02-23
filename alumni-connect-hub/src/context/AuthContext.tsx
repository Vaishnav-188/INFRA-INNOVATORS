import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '@/config/api';

// User roles type
export type UserRole = 'guest' | 'student' | 'alumni' | 'admin';

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  batch?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  mentorDomainPreference?: string;
  isVerified?: boolean;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS: (User & { password: string })[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    username: 'John Student',
    email: 'john@kgkite.ac.in',
    password: 'student123',
    role: 'student',
    batch: '2022 - 2026',
  },
  {
    id: '3',
    username: 'Sarah Alumni',
    email: 'sarah@alumni.com',
    password: 'alumni123',
    role: 'alumni',
    batch: 'Class of 2020',
    linkedin: 'https://linkedin.com/in/sarah',
    isVerified: true,
  },
];

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('alumni_hub_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('alumni_hub_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collegeEmail: email,
          password: password,
          role: role
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Store token
        localStorage.setItem('alumni_hub_token', data.token);

        // Create user object
        const user: User = {
          id: data.user._id,
          username: data.user.username || data.user.name,
          email: data.user.collegeEmail,
          role: data.user.role,
          batch: data.user.batch,
          phone: data.user.mobileNumber,
          linkedin: data.user.linkedIn,
          isVerified: true,
        };

        setUser(user);
        localStorage.setItem('alumni_hub_user', JSON.stringify(user));
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.message || 'Invalid credentials. Please check your email, password, and role.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'Unable to connect to server. Please try again.' };
    }
  };

  // Register function
  const register = async (
    userData: Partial<User> & { password: string }
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.username,
          username: userData.username,
          collegeEmail: userData.email,
          password: userData.password,
          role: userData.role,
          batch: userData.batch,
          mobileNumber: userData.phone,
          linkedIn: (userData as any).linkedIn || userData.linkedin,
          github: (userData as any).github,
          mentorDomainPreference: (userData as any).mentorDomainPreference,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Only set user if we got a token (verified roles like alumni/admin)
        if (data.token) {
          localStorage.setItem('alumni_hub_token', data.token);

          const newUser: User = {
            id: data.user._id,
            username: data.user.username || data.user.name,
            email: data.user.collegeEmail,
            role: data.user.role,
            batch: data.user.batch,
            phone: data.user.mobileNumber,
            linkedin: data.user.linkedIn,
            isVerified: true,
          };

          setUser(newUser);
          localStorage.setItem('alumni_hub_user', JSON.stringify(newUser));
        }

        setIsLoading(false);
        // Special case: return message for students needing approval
        return {
          success: true,
          error: !data.token ? data.message : undefined
        };
      } else {
        setIsLoading(false);
        return { success: false, error: data.message || 'Registration failed.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false, error: 'Unable to connect to server. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('alumni_hub_user');
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('alumni_hub_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) => {
  return (props: P) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return null; // Router will handle redirect
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null; // Router will handle redirect
    }

    return <WrappedComponent {...props} />;
  };
};
