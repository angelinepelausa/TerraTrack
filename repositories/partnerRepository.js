import firestore from '@react-native-firebase/firestore';

export const checkIfUserIsPartner = async (userId) => {
  try {
    const partnerDoc = await firestore()
      .collection('partners')
      .doc(userId)
      .get();
    
    return partnerDoc.exists && partnerDoc.data().status === 'active';
  } catch (error) {
    console.error('Error checking partner status:', error);
    return false;
  }
};

export const getPartnerData = async (partnerId) => {
  try {
    const partnerDoc = await firestore()
      .collection('partners')
      .doc(partnerId)
      .get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const partnerData = partnerDoc.data();
    const completePartnerData = {
      name: partnerData.name || "",
      contact: partnerData.contact || partnerData.emailAddress || "",
      address: partnerData.address || partnerData.emailAddress || "",
      logoUrl: partnerData.logoUrl || "",
      status: partnerData.status || "active",
      createdAt: partnerData.createdAt,
      ...partnerData
    };

    return { success: true, partner: completePartnerData };
  } catch (error) {
    console.error('Error fetching partner data:', error);
    return { success: false, error: error.message };
  }
};

export const checkPartnerProfileComplete = async (partnerId) => {
  try {
    const partnerDoc = await firestore()
      .collection('partners')
      .doc(partnerId)
      .get();

    if (!partnerDoc.exists) {
      return false;
    }

    const partnerData = partnerDoc.data();
    return partnerData.name && partnerData.contact && partnerData.logoUrl;
  } catch (error) {
    console.error('Error checking partner profile:', error);
    return false;
  }
};

export const updatePartnerProfile = async (partnerId, updateData) => {
  try {
    await firestore()
      .collection('partners')
      .doc(partnerId)
      .update({
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating partner profile:', error);
    return { success: false, error: error.message };
  }
};