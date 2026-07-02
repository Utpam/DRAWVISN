import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthChange, signInWithGoogle, signOutUser } from "../services/auth.service";
import { createUserDocument } from "../services/user.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const signedInUser = await signInWithGoogle();

      // Upsert the users/ Firestore document (idempotent — safe on every login)
      await createUserDocument(signedInUser.uid, {
        displayName: signedInUser.displayName,
        email: signedInUser.email,
        photoURL: signedInUser.photoURL,
      });

      setUser(signedInUser);
    } catch (error) {
      console.error("[AuthContext] login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error("[AuthContext] logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};