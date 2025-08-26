import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const checkIfUserIsAdmin = async (userId) => {
  try {
    console.log('Checking admin status for user ID:', userId);
    
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      console.log('No authenticated user found');
      return false;
    }
    
    const userEmail = currentUser.email;
    console.log('User email from auth:', userEmail);
    
    if (!userEmail) {
      console.log('No email found for authenticated user');
      return false;
    }
    
    const adminsSnapshot = await firestore()
      .collection('admins')
      .get();
    
    console.log('Total admin documents:', adminsSnapshot.size);
    
    let isAdmin = false;
    
    adminsSnapshot.forEach((doc) => {
      const adminData = doc.data();
      console.log('Admin document:', doc.id, 'Data:', adminData);
      
      if (adminData.email && adminData.email.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
        console.log('Email match found! User is admin');
        isAdmin = true;
      }
    });
    
    console.log('Final admin status:', isAdmin);
    return isAdmin;
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};