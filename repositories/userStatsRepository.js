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

    console.log(`Incremented ${field} by ${amount} for user ${uid}`);
  } catch (error) {
    console.error(`Error incrementing ${field}:`, error);
  }
};

export const incrementWeeklyQuizFinished = async (uid) => {
  try {
    const ref = firestore()
      .collection("users")
      .doc(uid)
      .collection("total")
      .doc("stats");

    await firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(ref);

      if (!doc.exists) {
        transaction.set(ref, { weeklyQuizFinished: 1 }, { merge: true });
      } else {
        const current = doc.data()?.weeklyQuizFinished || 0;
        transaction.update(ref, { weeklyQuizFinished: current + 1 });
      }
    });

    console.log(`Weekly quiz finished count incremented for user ${uid}`);
  } catch (error) {
    console.error("Error incrementing weeklyQuizFinished:", error);
  }
};

export const getUserTotals = async (uid) => {
  try {
    const ref = firestore()
      .collection("users")
      .doc(uid)
      .collection("total")
      .doc("stats");

    const doc = await ref.get();

    if (!doc.exists || !doc.data()) {
      console.log(`No stats found for user ${uid}, returning defaults.`);
      return {
        taskFinished: 0,
        educationalQuizFinished: 0,
        weeklyQuizFinished: 0,
      };
    }

    const data = doc.data() || {};

    return {
      taskFinished: data.taskFinished ?? 0,
      educationalQuizFinished: data.educationalQuizFinished ?? 0,
      weeklyQuizFinished: data.weeklyQuizFinished ?? 0,
    };
  } catch (error) {
    console.error("Error fetching user totals:", error);
    return {
      taskFinished: 0,
      educationalQuizFinished: 0,
      weeklyQuizFinished: 0,
    };
  }
};
