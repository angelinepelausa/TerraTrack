// screens/TaskVerifyScreen.js
import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import { getUserTerraCoins } from '../repositories/userRepository';

const TODAY = new Date().toISOString().split('T')[0];

const TaskVerifyScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [terraCoins, setTerraCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  // user's own submissions for Task Verification section
  const [myVerifications, setMyVerifications] = useState([]);

  // sets assigned to current user to verify (max 3)
  const [verifySets, setVerifySets] = useState([]);

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      loadVerificationData();
    }
  }, [user]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) setTerraCoins(result.terraCoins);
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
    }
  };

  const loadVerificationData = async () => {
    setLoading(true);
    try {
      const today = TODAY;

      // 1) load current user's verifications (for "Task Verification" section)
      const myVerRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('verifications')
        .doc(today);

      const mySnap = await myVerRef.get();
      const myData = mySnap.exists ? mySnap.data() : {};
      // myData shape: { [taskId]: { photoUrl, status, verifiedBy, submittedAt } }
      const myList = await Promise.all(
        Object.keys(myData || {}).map(async (taskId) => {
          const entry = myData[taskId];
          // fetch task title
          let title = 'Unknown Task';
          try {
            const taskDoc = await firestore().collection('tasks').doc(taskId).get();
            if (taskDoc.exists) title = taskDoc.data()?.title || title;
          } catch (err) {
            console.warn('Failed fetching task title for', taskId, err);
          }
          return {
            taskId,
            title,
            photoUrl: entry.photoUrl || null,
            status: entry.status || 'pending',
          };
        })
      );
      setMyVerifications(myList);

      // 2) load other users' verifications for today
      // approach: query all users who have a verifications/{today} doc.
      // Firestore doesn't provide a direct "has child doc" query; we will read users collection and try fetching each user's verifications doc.
      // This is heavier but acceptable for moderate user counts. If you have many users, consider a backend/cloud func to index pending verification photos.
      const usersSnapshot = await firestore().collection('users').get();
      const otherUsers = usersSnapshot.docs
        .map((d) => d.id)
        .filter((uid) => uid !== user.uid);

      // gather pending photos grouped by owner
      const photosByOwner = {}; // { ownerId: [{ taskId, photoUrl, status }] }
      for (const ownerId of otherUsers) {
        try {
          const verDoc = await firestore()
            .collection('users')
            .doc(ownerId)
            .collection('verifications')
            .doc(today)
            .get();

          if (!verDoc.exists) continue;
          const verData = verDoc.data() || {};
          for (const [taskId, entry] of Object.entries(verData)) {
            if (entry && entry.photoUrl && entry.status === 'pending') {
              if (!photosByOwner[ownerId]) photosByOwner[ownerId] = [];
              photosByOwner[ownerId].push({
                ownerId,
                taskId,
                photoUrl: entry.photoUrl,
                status: entry.status,
              });
            }
          }
        } catch (err) {
          console.warn('Error fetching verifications for user', ownerId, err);
        }
      }

      // 3) Build 3 verification sets for the current user.
      // Goal: get photos from as many different owners as possible (one-per-owner) until we have 3 sets.
      const ownerIds = Object.keys(photosByOwner);
      const chosen = []; // array of { ownerId, taskId, photoUrl, taskTitle }

      if (ownerIds.length === 0) {
        // nothing to verify
        setVerifySets([]);
      } else {
        // For deterministic-ish distribution, iterate owners in order and pick one each round
        // Make shallow copy of photos arrays so we can pop chosen ones
        const photosByOwnerCopy = {};
        ownerIds.forEach((o) => {
          photosByOwnerCopy[o] = [...photosByOwner[o]];
        });

        // Round-robin pick up to 3
        let pickCount = 0;
        let ownerIndex = 0;
        while (pickCount < 3) {
          if (ownerIds.length === 0) break;
          const currentOwner = ownerIds[ownerIndex % ownerIds.length];
          const arr = photosByOwnerCopy[currentOwner];
          if (arr && arr.length > 0) {
            const photo = arr.shift(); // remove one photo from this owner
            // fetch task title for display in VerifyTask screen
            let title = 'Unknown Task';
            try {
              const taskDoc = await firestore().collection('tasks').doc(photo.taskId).get();
              if (taskDoc.exists) title = taskDoc.data()?.title || title;
            } catch (err) {
              console.warn('Failed fetching task title for', photo.taskId, err);
            }
            chosen.push({
              ownerId: photo.ownerId, // kept for internal reasons, not displayed
              taskId: photo.taskId,
              photoUrl: photo.photoUrl,
              taskTitle: title,
            });
            pickCount++;
            // if owner has no more photos, remove from ownerIds to avoid looping forever
            if (arr.length === 0) {
              const idx = ownerIds.indexOf(currentOwner);
              if (idx !== -1) ownerIds.splice(idx, 1);
              // adjust ownerIndex if needed
              if (ownerIndex >= ownerIds.length) ownerIndex = 0;
            } else {
              // move to next owner
              ownerIndex++;
            }
          } else {
            // owner had no photos (shouldn't happen due to earlier filtering) - remove it
            const idx = ownerIds.indexOf(currentOwner);
            if (idx !== -1) ownerIds.splice(idx, 1);
            if (ownerIds.length === 0) break;
            if (ownerIndex >= ownerIds.length) ownerIndex = 0;
          }
          // if we've cycled through owners but not enough picks and only single owner remains, allow picking more from same owner
          if (ownerIds.length === 1 && pickCount < 3) {
            // pick remaining from that owner until 3 or exhausted
            const lastOwner = ownerIds[0];
            const arr2 = photosByOwnerCopy[lastOwner] || [];
            while (pickCount < 3 && arr2.length > 0) {
              const photo = arr2.shift();
              let title = 'Unknown Task';
              try {
                const taskDoc = await firestore().collection('tasks').doc(photo.taskId).get();
                if (taskDoc.exists) title = taskDoc.data()?.title || title;
              } catch (err) {
                console.warn('Failed fetching task title for', photo.taskId, err);
              }
              chosen.push({
                ownerId: photo.ownerId,
                taskId: photo.taskId,
                photoUrl: photo.photoUrl,
                taskTitle: title,
              });
              pickCount++;
            }
            break;
          }
          // safety: if ownerIds is empty break
          if (ownerIds.length === 0) break;
        } // end while

        setVerifySets(chosen);
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
      Alert.alert('Error', 'Failed to load verification data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.backandfilter}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>

        {/* Filter Button */}
        <Image source={require('../assets/icons/filter.png')} style={styles.filterIcon} />
      </View>

      <Text style={styles.taskverText}>Task Verification</Text>

      <View style={styles.tasksContainer}>
        {myVerifications.length === 0 ? (
          <Text style={{ color: '#FFF', marginLeft: scale(15) }}>You have no verifications submitted today.</Text>
        ) : (
          myVerifications.map((v) => (
            <View key={v.taskId} style={styles.taskCard}>
              {v.photoUrl ? (
                <Image source={{ uri: v.photoUrl }} style={styles.taskimg} />
              ) : (
                <Image source={require('../assets/images/bus.png')} style={styles.taskimg} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {v.title}
                </Text>
                <Text style={styles.taskStatus}>{v.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.vertaskText}>Verify Task</Text>

      <View style={styles.vertaskContainer}>
        {verifySets.length === 0 ? (
          <View style={[styles.vertaskCard, { justifyContent: 'center' }]}>
            <Text style={{ color: '#333' }}>No photos available to verify right now.</Text>
          </View>
        ) : (
          // Show up to 3 cards (one per set). Each card shows the photo and a Verify button.
          verifySets.map((s, idx) => (
            <View key={`${s.taskId}-${idx}`} style={styles.vertaskCard}>
              <Image source={{ uri: s.photoUrl }} style={styles.vertaskimg} />
              <View style={{ flex: 1, paddingLeft: scale(8) }}>
                <Text style={{ fontWeight: 'bold', color: '#131313' }} numberOfLines={1}>
                  {/* Hide submitter username — only show truncated task title */}
                  {s.taskTitle || 'Task'}
                </Text>
                <Text style={{ color: '#555', marginTop: vScale(6) }} numberOfLines={2}>
                  {/* Do not show owner/username */}
                  {'Photo provided for verification'}
                </Text>
                <TouchableOpacity
                  style={styles.taskVerifyBtn}
                  onPress={() =>
                    navigation.navigate('VerifyTask', {
                      ownerUid: s.ownerId,
                      taskId: s.taskId,
                      photoUrl: s.photoUrl,
                      date: TODAY,
                      taskTitle: s.taskTitle,
                    })
                  }
                >
                  <Text style={styles.taskVerifyText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  scrollContainer: {
    paddingBottom: vScale(30),
  },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  topBar: {
    height: vScale(110),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: scale(10),
  },
  coinBox: {
    width: scale(80),
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
    resizeMode: 'contain',
  },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: scale(12) },
  taskverText: {
    color: '#FFFFFF',
    fontSize: scale(24),
    marginLeft: scale(15),
    fontWeight: 'bold',
    marginTop: vScale(10),
  },
  backandfilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    marginTop: vScale(15),
  },
  backIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  filterIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  tasksContainer: {
    padding: scale(15),
    marginTop: vScale(15),
    width: '100%',
  },
  taskCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(15),
    padding: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(12),
  },
  taskimg: {
    width: 60,
    height: 60,
    marginRight: scale(16),
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#131313',
    flexShrink: 1,
  },
  taskStatus: {
    fontSize: scale(11),
    color: '#555555',
    marginTop: vScale(6),
  },
  vertaskText: {
    color: '#FFFFFF',
    fontSize: scale(24),
    marginLeft: scale(15),
    fontWeight: 'bold',
    marginTop: vScale(8),
  },
  vertaskContainer: {
    padding: scale(15),
    marginTop: vScale(12),
    width: '100%',
    paddingBottom: vScale(40),
  },
  vertaskCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(15),
    padding: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(15),
  },
  vertaskimg: {
    width: 85,
    height: 85,
    marginRight: scale(12),
    borderRadius: 8,
  },
  taskVerifyBtn: {
    backgroundColor: '#415D43',
    borderRadius: scale(12),
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    marginTop: vScale(10),
    alignSelf: 'flex-start',
  },
  taskVerifyText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
});

export default TaskVerifyScreen;
