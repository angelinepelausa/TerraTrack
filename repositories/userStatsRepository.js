import firestore from '@react-native-firebase/firestore';

/**
 * Generic function to increment any user stat field.
 * Example usage: incrementUserStat(uid, "quizFinished", 1)
 */
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

/**
 * Specific function to handle weekly quiz completions.
 * Path: users/{uid}/total/stats/weeklyQuizFinished
 * - Creates the field if it doesn't exist.
 * - Increments it by 1 each time the user finishes a weekly quiz.
 */
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

    console.log(`✅ Weekly quiz finished count incremented for user ${uid}`);
  } catch (error) {
    console.error("❌ Error incrementing weeklyQuizFinished:", error);
  }
};

/**
 * Fetches total stats for a specific user (referee).
 * Path: users/{uid}/total/stats
 * Returns an object with default values if fields are missing.
 */
export const getUserTotals = async (uid) => {
  try {
    const ref = firestore()
      .collection("users")
      .doc(uid)
      .collection("total")
      .doc("stats");

    const doc = await ref.get();

    // Return defaults if the document doesn’t exist or has no data
    if (!doc.exists || !doc.data()) {
      console.log(`ℹ️ No stats found for user ${uid}, returning defaults.`);
      return {
        taskFinished: 0,
        educationalQuizFinished: 0,
        weeklyQuizFinished: 0,
      };
    }

    // Safely extract values with fallback defaults
    const data = doc.data() || {};

    return {
      taskFinished: data.taskFinished ?? 0,
      educationalQuizFinished: data.educationalQuizFinished ?? 0,
      weeklyQuizFinished: data.weeklyQuizFinished ?? 0,
    };
  } catch (error) {
    console.error("❌ Error fetching user totals:", error);
    return {
      taskFinished: 0,
      educationalQuizFinished: 0,
      weeklyQuizFinished: 0,
    };
  }
};
