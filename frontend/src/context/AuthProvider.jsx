import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import * as authService from '../services/authService';
import * as userService from '../services/userService';

// Asks the server who the user is when the application starts. The token is in an httpOnly
// cookie that JavaScript cannot read, so /auth/me is the only way to know if there is a session.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  // Creates the account and then logs in with it, so the new customer can order at once
  const signUp = useCallback(
    async (newUser) => {
      await userService.signUp(newUser);
      return login(newUser.email, newUser.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signUp, logout }),
    [user, loading, login, signUp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
