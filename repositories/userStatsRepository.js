import firestore from '@react-native-firebase/firestore';

export const incrementUserStat = async (uid, field, amount = 1) => {
  try {
    const ref = firestore()
      .collection("users")
      .doc(uid)
      .collection("total")
      .doc("stats");

    await ref.set(
      { [field]: firestore.FieldValue.increment(amount) },
      { merge: true }
    );

    console.log(`✅ Incremented ${field} by ${amount} for user ${uid}`);
  } catch (error) {
    console.error(`❌ Error incrementing ${field}:`, error);
  }
};