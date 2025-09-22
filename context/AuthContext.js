// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRememberedUser = async () => {
      const rememberedUid = await AsyncStorage.getItem('rememberedUser');
      if (rememberedUid) {
        const currentUser = auth().currentUser;
        if (currentUser && currentUser.uid === rememberedUid) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };

    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else setUser(null);
      setLoading(false);
    });

    checkRememberedUser();

    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
