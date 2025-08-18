import { onboardingRepository } from '../repositories/onboardingRepository';
import { tasksRepository } from '../repositories/tasksRepository';

const matchesRequirement = (preferences, task) => {
  const { requirements } = task;
  if (!requirements) return true;

  console.log('Checking task:', task.title);
  console.log('Requirements:', requirements);
  console.log('Preferences:', preferences);

  if (requirements.budget && requirements.budget !== preferences.budgetLevel) {
    console.log('Budget mismatch');
    return false;
  }

  if (requirements.transport) {
    const transportReqs = Array.isArray(requirements.transport) 
      ? requirements.transport 
      : [requirements.transport];
    
    if (transportReqs.length > 0) {
      const hasMatch = transportReqs.some(req => 
        preferences.transportationOptions?.includes(req)
      );
      if (!hasMatch) {
        console.log('Transport mismatch');
        return false;
      }
    }
  }

  if (requirements.diet) {
    const dietReqs = Array.isArray(requirements.diet)
      ? requirements.diet
      : [requirements.diet];
    
    if (dietReqs.length > 0 && dietReqs[0] !== '') {
      const hasMatch = dietReqs.some(req => 
        preferences.dietType?.includes(req)
      );
      if (!hasMatch) {
        console.log('Diet mismatch');
        return false;
      }
    }
  }

  if (requirements.energy) {
    const energyReqs = Array.isArray(requirements.energy)
      ? requirements.energy
      : [requirements.energy];
    
    if (energyReqs.length > 0 && energyReqs[0] !== '') {
      const hasMatch = energyReqs.some(req => 
        preferences.energyControl?.includes(req)
      );
      if (!hasMatch) {
        console.log('Energy mismatch');
        return false;
      }
    }
  }

  console.log('Task matches all requirements');
  return true;
};

const getRoutineTasks = async (userId) => {
  try {
    console.log('Fetching user preferences for userId:', userId);
    const preferences = await onboardingRepository.getUserPreferences(userId);
    console.log('Retrieved preferences:', JSON.stringify(preferences, null, 2));

    if (!preferences) {
      console.log('No preferences found for user');
      return [];
    }

    console.log('Fetching all tasks');
    const tasks = await tasksRepository.getAllTasks();
    console.log('Total tasks found:', tasks.length);

    const filteredTasks = tasks.filter(task => {
      const matches = matchesRequirement(preferences, task);
      console.log(`Task "${task.title}" matches: ${matches}`);
      return matches;
    });

    console.log('Filtered tasks count:', filteredTasks.length);
    console.log('Filtered tasks:', JSON.stringify(filteredTasks, null, 2));
    
    return filteredTasks;
  } catch (error) {
    console.error('Error in getRoutineTasks:', error);
    throw error;
  }
};

export const routineService = {
  getRoutineTasks,
};