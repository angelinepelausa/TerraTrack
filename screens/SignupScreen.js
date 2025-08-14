// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const HomeScreen = () => {
  const [terraCoins, setTerraCoins] = useState(0);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (uid) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(uid)
        .onSnapshot(doc => {
          if (doc.exists) {
            setTerraCoins(doc.data()?.terraCoins || 0);
          }
        });
      return () => unsubscribe();
    }
  }, []);

  const gridItems = [
    { title: 'Weekly Quiz', desc: 'Answer the weekly quiz to\nearn Terra Points and Coins!' },
    { title: 'Achievements', desc: 'Accomplish achievements to\nearn Terra Points and Coins!' },
    { title: 'Read', desc: 'Read and answer the quiz to\nearn Terra Points and Coins!' },
    { title: 'Invite', desc: 'Invite friends to TerraTrack to\nearn Terra Coins and Points!' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with TerraCoins */}
        <View style={styles.header}>
          <View style={styles.coinBox}>
            <Image
              source={require('../assets/images/TerraCoin.png')}
              style={styles.coinImage}
              resizeMode="contain"
            />
            <Text style={styles.coinText}>{terraCoins}</Text>
          </View>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          {gridItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.gridItem}>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terra Shop */}
        <TouchableOpacity style={styles.shopContainer}>
          <Image
            source={require('../assets/images/TerraShop.png')}
            style={styles.shopImage}
            resizeMode="contain"
          />
          <Text style={styles.shopText}>
            Buy exclusive avatars and rewards from{'\n'}our partners from the Terra Shop!
          </Text>
        </TouchableOpacity>

        {/* Community Progress */}
        <View style={styles.communityContainer}>
          <Text style={styles.communityTitle}>Community Progress</Text>
          <Text style={styles.communityTask}>Sample Task from Admin</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {['Home', 'Routine', 'Leaderboards', 'Profile'].map((item, index) => (
          <TouchableOpacity key={index} style={styles.navItem}>
            <Text style={[styles.navText, item === 'Home' && styles.activeNav]}>{item}</Text>
            {item === 'Home' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  scrollContent: {
    paddingBottom: vScale(20),
  },
  header: {
    width: '100%',
    height: vScale(143),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    paddingHorizontal: scale(20),
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: vScale(15),
  },
  coinBox: {
    width: scale(79),
    height: vScale(32),
    backgroundColor: '#DDDDDD',
    borderRadius: scale(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinImage: {
    width: scale(20),
    height: scale(20),
    marginRight: scale(5),
  },
  coinText: {
    color: '#131313',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    marginTop: vScale(20),
    gap: vScale(20),
  },
  gridItem: {
    width: scale(174),
    height: vScale(168),
    backgroundColor: '#1F1F1F',
    borderRadius: scale(15),
    padding: scale(10),
    justifyContent: 'center',
  },
  gridTitle: {
    color: '#709775',
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: vScale(5),
  },
  gridDesc: {
    color: '#CCCCCC',
    fontSize: scale(12),
    fontWeight: '500',
    lineHeight: vScale(16),
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#415D43',
    width: scale(371),
    height: vScale(90),
    borderRadius: scale(25),
    paddingHorizontal: scale(15),
    marginTop: vScale(25),
    alignSelf: 'center',
  },
  shopImage: {
    width: scale(50),
    height: scale(50),
    marginRight: scale(15),
  },
  shopText: {
    color: '#CCCCCC',
    fontSize: scale(12),
    fontWeight: '500',
  },
  communityContainer: {
    backgroundColor: '#CCCCCC',
    width: scale(371),
    borderRadius: scale(15),
    padding: scale(15),
    marginTop: vScale(25),
    alignSelf: 'center',
  },
  communityTitle: {
    color: '#131313',
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: vScale(5),
  },
  communityTask: {
    color: '#131313',
    fontSize: scale(12),
    marginBottom: vScale(10),
  },
  progressBar: {
    width: scale(281),
    height: vScale(41),
    backgroundColor: '#FFFDFD',
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#415D43',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#415D43',
    paddingVertical: vScale(10),
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#DDDDDD',
    fontSize: scale(12),
    fontWeight: '600',
  },
  activeNav: {
    fontWeight: 'bold',
  },
  activeIndicator: {
    marginTop: vScale(4),
    height: scale(2),
    width: '100%',
    backgroundColor: '#DDDDDD',
  },
});

export default HomeScreen;
