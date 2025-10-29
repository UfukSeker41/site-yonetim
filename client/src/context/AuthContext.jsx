// Auth Context - Kullanıcı kimlik doğrulama yönetimi
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Kullanıcı bilgilerini sunucudan doğrula
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
          
          // Socket.IO bağlantısını kur
          connectSocket(token);
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Token geçersizse temizle
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login fonksiyonu
  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.login({ username, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Token ve kullanıcı bilgilerini kaydet
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        // Socket.IO bağlantısını kur
        connectSocket(token);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      const message = error.message || 'Giriş yapılırken bir hata oluştu';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = () => {
    // Socket bağlantısını kapat
    disconnectSocket();
    
    // Local storage'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // State'i temizle
    setUser(null);
    setError(null);
  };

  // Kullanıcı rolü kontrolü
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
