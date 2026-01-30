import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find user in demo users
    const foundUser = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && 
           u.password === password && 
           u.role === role
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('alumni_hub_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid credentials. Please check your email, password, and role.' };
  };

  // Register function
  const register = async (
    userData: Partial<User> & { password: string }
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if email already exists
    const existingUser = DEMO_USERS.find(
      u => u.email.toLowerCase() === userData.email?.toLowerCase()
    );

    if (existingUser) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      username: userData.username || '',
      email: userData.email || '',
      role: userData.role || 'student',
      batch: userData.batch,
      phone: userData.phone,
      linkedin: userData.linkedin,
      isVerified: userData.role === 'student',
    };

    setUser(newUser);
    localStorage.setItem('alumni_hub_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
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
