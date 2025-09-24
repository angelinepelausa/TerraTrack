import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

export const useLeaderboardStats = (userId) => {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyTotalResults, setHistoryTotalResults] = useState(0);
  const [bestRank, setBestRank] = useState(null);
  const [bestRankDate, setBestRankDate] = useState(null);
  const [bestRankStreak, setBestRankStreak] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchLeaderboardHistoryStats(userId);
    }
  }, [userId]);

  const parseResultIdToDate = (resultId) => {
    if (!resultId || typeof resultId !== 'string') return null;
    const prefix = 'result_';
    if (!resultId.startsWith(prefix)) return null;
    const datePart = resultId.slice(prefix.length);
    const d = new Date(datePart);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const formatResultIdToReadable = (resultId) => {
    const dt = parseResultIdToDate(resultId);
    if (!dt) return null;
    return dt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const fetchLeaderboardHistoryStats = async (uid) => {
    setHistoryLoading(true);
    try {
      if (!uid) {
        resetStats();
        return;
      }

      const leaderboardDocs = await firestore().collection('leaderboard').get();

      if (leaderboardDocs.empty) {
        resetStats();
        return;
      }

      const { total, best, bestDateId, bestRankCount } =
        await processLeaderboardData(leaderboardDocs, uid);

      setHistoryTotalResults(total);
      if (best === Number.POSITIVE_INFINITY) {
        resetStats();
      } else {
        setBestRank(best);
        setBestRankDate(bestDateId ? formatResultIdToReadable(bestDateId) : null);
        setBestRankStreak(bestRankCount);
      }
    } catch (err) {
      resetStats();
    } finally {
      setHistoryLoading(false);
    }
  };

  const processLeaderboardData = async (leaderboardDocs, uid) => {
    let total = 0;
    let best = Number.POSITIVE_INFINITY;
    let bestRankCount = 0;
    let latestBestRankDate = null;

    const sortedDocs = leaderboardDocs.docs.sort((a, b) => {
      const dateA = parseResultIdToDate(a.id)?.getTime() || 0;
      const dateB = parseResultIdToDate(b.id)?.getTime() || 0;
      return dateB - dateA;
    });

    for (const doc of sortedDocs) {
      try {
        const userRankDoc = await firestore()
          .collection('leaderboard')
          .doc(doc.id)
          .collection('users')
          .doc(uid)
          .get();

        if (userRankDoc.exists) {
          const d = userRankDoc.data() || {};
          let rank =
            typeof d.rank === 'number' ? d.rank : parseInt(d.rank, 10);

          if (rank == null || Number.isNaN(rank)) continue;

          total += 1;

          // ✅ update stats properly
          const { newBest, newCount, newDate } = updateBestRankStats(
            rank,
            doc.id,
            best,
            bestRankCount,
            latestBestRankDate
          );

          best = newBest;
          bestRankCount = newCount;
          latestBestRankDate = newDate;
        }
      } catch (err) {
        continue;
      }
    }

    return { total, best, bestDateId: latestBestRankDate, bestRankCount };
  };

  const updateBestRankStats = (
    rank,
    docId,
    currentBest,
    currentCount,
    currentDate
  ) => {
    let newBest = currentBest;
    let newCount = currentCount;
    let newDate = currentDate;

    if (rank < newBest) {
      newBest = rank;
      newCount = 1;
      newDate = docId;
    } else if (rank === newBest) {
      newCount += 1;
      if (!newDate || isNewerDate(docId, newDate)) {
        newDate = docId;
      }
    }

    return { newBest, newCount, newDate };
  };

  const isNewerDate = (dateId1, dateId2) => {
    const date1 = parseResultIdToDate(dateId1);
    const date2 = parseResultIdToDate(dateId2);
    return date1 && date2 && date1.getTime() > date2.getTime();
  };

  const resetStats = () => {
    setHistoryTotalResults(0);
    setBestRank(null);
    setBestRankDate(null);
    setBestRankStreak(0);
  };

  return {
    historyLoading,
    historyTotalResults,
    bestRank,
    bestRankDate,
    bestRankStreak,
    fetchLeaderboardHistoryStats,
  };
};
