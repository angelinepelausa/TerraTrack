import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import {
  getLeaderboard,
  getLeaderboardConfig,
  savePendingLeaderboardConfig,
  applyPendingConfigIfNeeded
} from '../repositories/leaderboardRepository';
import Toast from '../components/Toast';
import { useNavigation } from '@react-navigation/native';

const AdminLeaderboard = () => {
  const navigation = useNavigation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [config, setConfig] = useState({
    status: 'active',
    resetFrequency: 'weekly',
    currentCycleEnd: null, // <-- no cycle initially
    rewards: {
      top1: { terraCoins: 0, terraPoints: 0 },
      top2: { terraCoins: 0, terraPoints: 0 },
      top3: { terraCoins: 0, terraPoints: 0 },
      top4to10: { terraCoins: 0, terraPoints: 0 },
      top11plus: { terraCoins: 0, terraPoints: 0 },
    },
    pendingConfig: null,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      await applyPendingConfigIfNeeded();
      const cfg = await getLeaderboardConfig();
      setConfig(prev => ({ ...prev, ...cfg }));
      const topUsers = await getLeaderboard(10);
      setLeaderboard(topUsers);
    };
    init();
  }, []);

  const handleConfigChange = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleRewardChange = (rankKey, type, value) => {
    const newRewards = { ...config.rewards, [rankKey]: { ...config.rewards[rankKey], [type]: Number(value) || 0 } };
    handleConfigChange('rewards', newRewards);
  };

  const handleStatusToggle = () => {
    if (config.status === 'active') {
      Alert.alert(
        'Pause Leaderboard?',
        'Are you sure you want to pause the leaderboard?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => handleConfigChange('status', 'paused') },
        ]
      );
    } else {
      handleConfigChange('status', 'active');
    }
  };

  const handleSave = async () => {
    try {
      await savePendingLeaderboardConfig(config);
      const cfg = await getLeaderboardConfig();
      setConfig(prev => ({ ...prev, ...cfg }));
      const message = cfg.pendingConfig ? 'Configuration saved as PENDING. Will apply next cycle.' : 'Configuration applied immediately!';
      setToastMessage(message);
      setToastVisible(true);
    } catch (err) {
      console.error('Error saving config:', err);
      setToastMessage('Error saving configuration.');
      setToastVisible(true);
    }
  };

  const handleReset = () => {
    const defaultConfig = {
      status: 'active',
      resetFrequency: 'weekly',
      rewards: {
        top1: { terraCoins: 0, terraPoints: 0 },
        top2: { terraCoins: 0, terraPoints: 0 },
        top3: { terraCoins: 0, terraPoints: 0 },
        top4to10: { terraCoins: 0, terraPoints: 0 },
        top11plus: { terraCoins: 0, terraPoints: 0 },
      },
      currentCycleEnd: null, // <-- reset to no cycle
      pendingConfig: null,
    };
    setConfig(defaultConfig);
    setToastMessage('Configuration reset! Fill in new values and save.');
    setToastVisible(true);
  };

  const rankOptions = ['top1','top2','top3','top4to10','top11plus'];
  const resetOptions = ['daily','weekly','monthly'];

  const formatDate = timestamp => {
    if (!timestamp) return 'Not started';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Leaderboard Settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require("../assets/icons/back.png")} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Current Cycle Ends:</Text>
      <Text style={styles.cycleEndText}>{formatDate(config.currentCycleEnd)}</Text>

      {config.pendingConfig && (
        <>
          <Text style={[styles.label, { color:'#f2b930' }]}>Pending Configuration:</Text>
          <Text style={styles.cycleEndText}>Will apply next cycle</Text>
        </>
      )}

      <Text style={styles.label}>Leaderboard Reset Frequency</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownOpen(!dropdownOpen)}>
        <Text style={styles.dropdownButtonText}>
          {config.resetFrequency.charAt(0).toUpperCase() + config.resetFrequency.slice(1)}
        </Text>
      </TouchableOpacity>
      {dropdownOpen && resetOptions.map(opt => (
        <TouchableOpacity
          key={opt}
          style={styles.option}
          onPress={() => { handleConfigChange('resetFrequency', opt); setDropdownOpen(false); }}
        >
          <Text style={{ color: config.resetFrequency === opt ? '#fff' : '#ccc' }}>
            {config.resetFrequency === opt ? '✓ ' : ''}{opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Leaderboard Status</Text>
      <TouchableOpacity
        style={[styles.toggleButton, config.status === 'active' ? styles.toggleActive : styles.togglePaused]}
        onPress={handleStatusToggle}
      >
        <Text style={styles.toggleText}>{config.status === 'active' ? 'Active' : 'Paused'}</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Rewards Configuration</Text>
      <View style={styles.rewardHeaderRow}>
        <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
        <Text style={[styles.rewardLabel, { flex: 1, textAlign: 'center' }]}>TerraCoins</Text>
        <Text style={[styles.rewardLabel, { flex: 1, textAlign: 'center' }]}>TerraPoints</Text>
      </View>
      {rankOptions.map(rankKey => {
        let displayLabel = '';
        switch(rankKey) {
          case 'top1': displayLabel = 'Top 1'; break;
          case 'top2': displayLabel = 'Top 2'; break;
          case 'top3': displayLabel = 'Top 3'; break;
          case 'top4to10': displayLabel = 'Top 4-10'; break;
          case 'top11plus': displayLabel = 'Top 11+'; break;
        }
        return (
          <View key={rankKey} style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>{displayLabel}</Text>
            <TextInput
              style={[styles.rewardInput, { textAlign: 'center' }]}
              keyboardType="numeric"
              value={String(config.rewards?.[rankKey]?.terraCoins || 0)}
              onChangeText={text => handleRewardChange(rankKey, 'terraCoins', text)}
            />
            <TextInput
              style={[styles.rewardInput, { textAlign: 'center' }]}
              keyboardType="numeric"
              value={String(config.rewards?.[rankKey]?.terraPoints || 0)}
              onChangeText={text => handleRewardChange(rankKey, 'terraPoints', text)}
            />
          </View>
        )
      })}

      <View style={{ flexDirection:'row', justifyContent:'space-between', marginVertical:20 }}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor:'#709775' }]} onPress={handleSave}>
          <Text style={styles.actionText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor:'#B00020' }]} onPress={handleReset}>
          <Text style={styles.actionText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>Current Top Users</Text>
      {leaderboard.map(user => (
        <View key={user.id} style={styles.userRow}>
          <Text style={styles.userRank}>{user.rank}.</Text>
          <Text style={styles.userName}>{user.username}</Text>
          <Text style={styles.userPoints}>{user.terraPoints} pts</Text>
        </View>
      ))}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000', padding:20 },
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  headerText: { fontSize:22, color:'#709775', fontWeight:'bold' },
  backIcon: { width:40, height:40, resizeMode:'contain', tintColor:'#709775' },
  label: { fontSize:16, color:'#CCCCCC', marginTop:15, marginBottom:5 },
  cycleEndText: { color:'#fff', marginBottom:10 },
  dropdownButton: { backgroundColor:'#222', padding:12, borderRadius:12 },
  dropdownButtonText: { color:'#fff' },
  option: { padding:12, backgroundColor:'#222', borderRadius:12, marginVertical:2 },
  toggleButton: { paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 10 },
  toggleActive: { backgroundColor:'#709775' },
  togglePaused: { backgroundColor:'#222' },
  toggleText: { color:'#fff', fontWeight:'600', fontSize:16 },
  rewardHeaderRow: { flexDirection:'row', marginBottom:5 },
  rewardRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  rewardLabel: { flex:1, color:'#CCCCCC', fontWeight:'600' },
  rewardInput: { flex:1, backgroundColor:'#222', color:'#fff', paddingHorizontal:10, paddingVertical:6, borderRadius:10, marginLeft:8 },
  actionButton: { flex:1, padding:12, borderRadius:15, alignItems:'center', marginHorizontal:5 },
  actionText: { color:'#fff', fontWeight:'600', fontSize:16 },
  userRow: { flexDirection:'row', alignItems:'center', paddingVertical:6, borderBottomWidth:0.5, borderBottomColor:'#444' },
  userRank: { color:'#CCCCCC', width:30 },
  userName: { color:'#CCCCCC', flex:1 },
  userPoints: { color:'#CCCCCC' },
});

export default AdminLeaderboard;
