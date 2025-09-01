import { avatarsRepository } from './avatarsRepository';
import { purchasesRepository } from './purchasesRepository';
import { addUserRewards, deductUserCoins } from './userRepository'; // deductUserCoins is a new fn you add

export const buyAvatar = async (userId, avatarId) => {
  try {
    const avatar = await avatarsRepository.getAvatarById(avatarId);
    if (!avatar) return { success: false, error: 'Avatar not found' };

    const { terraCoins } = await getUserTerraCoins(userId); // from userRepository
    if (terraCoins < avatar.terracoin) return { success: false, error: 'Not enough TerraCoins' };

    await deductUserCoins(userId, avatar.terracoin); // userRepository handles coins
    await purchasesRepository.addAvatarPurchase(userId, avatarId);

    return { success: true };
  } catch (error) {
    console.error('Error buying avatar:', error);
    return { success: false, error: error.message };
  }
};
