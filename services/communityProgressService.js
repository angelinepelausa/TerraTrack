import { getCommunityLeaderboard, getUserCommunityRank } from '../repositories/communityProgressRepository';

export const fetchCommunityLeaderboard = async (limit = 3) => {
  try {
    const leaderboard = await getCommunityLeaderboard();
    return { success: true, users: leaderboard.slice(0, limit) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchUserCommunityRank = async (userId) => {
  try {
    const user = await getUserCommunityRank(userId);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
