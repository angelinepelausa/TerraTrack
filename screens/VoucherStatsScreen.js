import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale, vScale } from '../utils/scaling';
import auth from '@react-native-firebase/auth';
import { voucherRepository } from '../repositories/voucherRepository';

const VoucherStatsScreen = () => {
  const [stats, setStats] = useState({
    totalRedeemed: 0,
    claimedToday: 0,
    availableVouchers: 0,
    unclaimedVouchers: 0
  });
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState({ current: 0, target: 100 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const user = auth().currentUser;
      if (!user) return;

      const statsResult = await voucherRepository.getVoucherStats(user.uid, 'month');
      
      if (statsResult.success) {
        setStats({
          totalRedeemed: statsResult.totalRedeemed,
          claimedToday: statsResult.claimedToday,
          availableVouchers: statsResult.availableVouchers,
          unclaimedVouchers: statsResult.unclaimedVouchers
        });

        setMonthlyGoal({
          current: statsResult.totalRedeemed,
          target: 100
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    return Math.min((monthlyGoal.current / monthlyGoal.target) * 100, 100);
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 80) return '#709775';
    if (progress >= 50) return '#FFA500';
    return '#FF6B6B';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#709775" />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Voucher Analytics</Text>
        <Text style={styles.subtitle}>Track your voucher performance</Text>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="ticket" size={scale(24)} color="#709775" />
          <Text style={styles.statNumber}>{stats.totalRedeemed}</Text>
          <Text style={styles.statLabel}>Total Redeemed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="today" size={scale(24)} color="#709775" />
          <Text style={styles.statNumber}>{stats.claimedToday}</Text>
          <Text style={styles.statLabel}>Claimed Today</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={scale(24)} color="#709775" />
          <Text style={styles.statNumber}>{stats.availableVouchers}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time" size={scale(24)} color="#709775" />
          <Text style={styles.statNumber}>{stats.unclaimedVouchers}</Text>
          <Text style={styles.statLabel}>Unclaimed</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Performance Goal</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Ionicons name="trophy" size={scale(20)} color="#709775" />
            <Text style={styles.goalText}>
              {monthlyGoal.current} / {monthlyGoal.target} vouchers
            </Text>
          </View>

          <View style={styles.progressSpacing} />
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${calculateProgress()}%`,
                  backgroundColor: getProgressColor()
                }
              ]} 
            />
          </View>

          <View style={styles.progressSpacing} />
          
          <Text style={styles.progressText}>
            {calculateProgress().toFixed(0)}% completed
            {calculateProgress() >= 100 && 'Goal achieved!'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
    marginTop: vScale(10),
  },
  header: {
    padding: scale(20),
    paddingTop: vScale(50),
    marginBottom: vScale(10),
  },
  title: {
    fontSize: scale(24),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(5),
  },
  subtitle: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scale(20),
    marginBottom: vScale(30),
    justifyContent: 'space-between',
  },
  statCard: {
    width: scale(160),
    backgroundColor: '#1f1f1f',
    padding: scale(20),
    borderRadius: scale(15),
    alignItems: 'center',
    marginBottom: vScale(15),
  },
  statNumber: {
    fontSize: scale(20),
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    marginVertical: vScale(8),
  },
  statLabel: {
    fontSize: scale(11),
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: scale(20),
    marginBottom: vScale(30),
  },
  sectionTitle: {
    fontSize: scale(18),
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(20),
  },
  goalCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: scale(15),
    padding: scale(25),
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
    marginLeft: scale(12),
  },
  progressSpacing: {
    height: vScale(15),
  },
  progressBar: {
    height: scale(12),
    backgroundColor: '#2a2a2a',
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(6),
  },
  progressText: {
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
    textAlign: 'center',
  },
});

export default VoucherStatsScreen;