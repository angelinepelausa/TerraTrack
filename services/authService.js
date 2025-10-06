import auth from '@react-native-firebase/auth';
import { createUserDocument } from '../repositories/userRepository';

export const signUpWithEmail = async (email, password, userData) => {
  try {
    // Validate input data
    if (!email || !password || !userData || !userData.username) {
      throw new Error('Missing required fields');
    }

    // Create auth user
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    
    if (!userCredential || !userCredential.user) {
      throw new Error('Failed to create user account');
    }

    const userId = userCredential.user.uid;

    // Create user document with only necessary data
    const userDocumentData = {
      username: userData.username,
      email: email,
      userId: userId
    };

    // Wait a moment for auth to fully initialize
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = await createUserDocument(userDocumentData);

    if (!result.success) {
      // If document creation fails, delete the auth user to rollback
      await auth().currentUser?.delete();
      throw new Error(result.error || 'Failed to create user document');
    }

    // Return the user credential
    return { 
      success: true, 
      user: userCredential.user,
      uid: userCredential.user.uid
    };
  } catch (error) {
    console.error('Auth error:', error);
    let errorMessage = 'Signup failed. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled.';
    } else if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please contact support.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code
    };
  }
};