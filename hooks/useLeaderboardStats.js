import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

export const useLeaderboardStats = (userId) => {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyTotalResults, setHistoryTotalResults] = useState(0);
  const [bestRank, setBestRank] = useState(null);
  const [bestRankDate, setBestRankDate] = useState(null);
  const [bestRankStreak, setBestRankStreak] = useState(0);

  useEffect(() => {
    // Reset all states when userId changes
    setHistoryLoading(true);
    setHistoryTotalResults(0);
    setBestRank(null);
    setBestRankDate(null);
    setBestRankStreak(0);

    if (userId) {
      fetchLeaderboardHistoryStats(userId);
    } else {
      setHistoryLoading(false);
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
    try {
      if (!uid) {
        resetStats();
        return;
      }

      console.log('Fetching leaderboard data for user:', uid);

      const leaderboardDocs = await firestore().collection('leaderboard').get();
      console.log('Found leaderboard documents:', leaderboardDocs.size);

      if (leaderboardDocs.empty) {
        console.log('No leaderboard documents found');
        resetStats();
        return;
      }

      const { total, best, bestDateId, bestRankCount } = await processLeaderboardData(leaderboardDocs, uid);
      
      console.log('Processed data:', { total, best, bestDateId, bestRankCount });

      setHistoryTotalResults(total);
      
      if (best === Number.POSITIVE_INFINITY || best === null) {
        console.log('No valid rank data found for user');
        setBestRank(null);
        setBestRankDate(null);
        setBestRankStreak(0);
      } else {
        setBestRank(best);
        setBestRankDate(bestDateId ? formatResultIdToReadable(bestDateId) : null);
        setBestRankStreak(bestRankCount);
        console.log('Best rank set:', best);
      }
    } catch (err) {
      console.error('Error fetching leaderboard stats:', err);
      resetStats();
    } finally {
      setHistoryLoading(false);
    }
  };

  const processLeaderboardData = async (leaderboardDocs, uid) => {
    let total = 0;
    let best = Number.POSITIVE_INFINITY;
    let bestRankCount = 0;
    let bestDateId = null;

    // Sort documents by date (newest first)
    const sortedDocs = leaderboardDocs.docs.sort((a, b) => {
      const dateA = parseResultIdToDate(a.id)?.getTime() || 0;
      const dateB = parseResultIdToDate(b.id)?.getTime() || 0;
      return dateB - dateA;
    });

    console.log('Processing', sortedDocs.length, 'leaderboard entries');

    for (const doc of sortedDocs) {
      try {
        const userRankDoc = await firestore()
          .collection('leaderboard')
          .doc(doc.id)
          .collection('users')
          .doc(uid)
          .get();

        if (userRankDoc.exists) {
          const data = userRankDoc.data() || {};
          console.log('Found user data in', doc.id, ':', data);
          
          let rank = typeof data.rank === 'number' ? data.rank : parseInt(data.rank, 10);

          // Validate rank
          if (rank != null && !isNaN(rank) && rank > 0) {
            total += 1;
            console.log('Valid rank found:', rank, 'in', doc.id);

            // Update best rank logic
            if (rank < best) {
              best = rank;
              bestRankCount = 1;
              bestDateId = doc.id;
              console.log('New best rank:', best);
            } else if (rank === best) {
              bestRankCount += 1;
              // Keep the most recent date for the best rank
              const currentDate = parseResultIdToDate(doc.id);
              const existingDate = parseResultIdToDate(bestDateId);
              if (!existingDate || (currentDate && currentDate > existingDate)) {
                bestDateId = doc.id;
              }
            }
          } else {
            console.log('Invalid rank found:', rank, 'in', doc.id);
          }
        } else {
          console.log('No user data found in', doc.id);
        }
      } catch (err) {
        console.error('Error processing document', doc.id, ':', err);
        continue;
      }
    }

    // If no valid ranks were found, reset best to null
    if (best === Number.POSITIVE_INFINITY) {
      best = null;
    }

    return { total, best, bestDateId, bestRankCount };
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