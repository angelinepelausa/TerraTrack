import auth from '@react-native-firebase/auth';
import { createUserDocument } from '../repositories/userRepository';

export const signUpWithEmail = async (email, password, userData) => {
  try {
    // 1. Create auth user
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    
    // 2. Create user document (wait for auth to fully initialize)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await createUserDocument({
      ...userData,
      email,
      userId: userCredential.user.uid
    });

    if (!result.success) {
      // If document creation fails, delete the auth user to rollback
      await auth().currentUser.delete();
      throw new Error(result.error);
    }

    return { success: true };
  } catch (error) {
    console.error('Auth error:', error);
    let errorMessage = 'Signup failed. Please try again.';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please contact support.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code
    };
  }
};