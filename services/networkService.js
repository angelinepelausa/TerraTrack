import NetInfo from '@react-native-community/netinfo';

export const subscribeToNetwork = (callback) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    callback(state.isConnected);
  });
  return unsubscribe;
};

export const checkNetworkNow = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};
