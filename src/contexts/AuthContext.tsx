import { createContext, useContext, useEffect, useState } from 'react';
import { UserData } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      
      if (data.isAuthenticated && data.uid) {
        const userDoc = await getDoc(doc(db, 'users', data.uid));
        if (userDoc.exists()) {
          setUser({ id: data.uid, ...userDoc.data() } as UserData);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (idToken: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      await checkAuth();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 