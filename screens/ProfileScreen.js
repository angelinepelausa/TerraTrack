import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  ActivityIndicator, Dimensions 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { BarChart } from "react-native-chart-kit";

import { avatarsRepository } from "../repositories/avatarsRepository";
import { statsRepository } from "../repositories/statsRepository";
import { statsService } from "../services/statsService";
import AvatarPicker from "../components/AvatarPicker";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = width * 0.25;
const categories = ["Total", "Diet", "Transport", "Energy"];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [chartLoading, setChartLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("Total");
  const [dropdownOpen, setDropdownOpen] = useState({ year: false, category: false });
  const [years, setYears] = useState([]);
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [userId, setUserId] = useState(null);

  // --- Leaderboard stats ---
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyTotalResults, setHistoryTotalResults] = useState(0);
  const [bestRank, setBestRank] = useState(null);
  const [bestRankDate, setBestRankDate] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUserData();

    const unsubscribeAvatar = firestore()
      .collection("users")
      .doc(userId)
      .onSnapshot(doc => {
        const data = doc.data();
        setUserData(data);

        if (data?.avatar) fetchAvatarUrl(data.avatar);
        else setCurrentAvatarUrl(null);
      });

    return () => unsubscribeAvatar();
  }, [userId]);

  useEffect(() => {
    if (selectedYear && selectedCategory && userData) fetchChart(selectedYear, selectedCategory);
  }, [selectedYear, selectedCategory, userData]);

  const fetchLeaderboardHistoryStats = async (uid) => {
    setHistoryLoading(true);
    try {
      if (!uid) {
        setHistoryTotalResults(0);
        setBestRank(null);
        setBestRankDate(null);
        setHistoryLoading(false);
        return;
      }

      let total = 0;
      let best = Number.POSITIVE_INFINITY;
      let bestDateId = null;

      try {
        const leaderboardDocs = await firestore()
          .collection("leaderboard")
          .get();

        if (leaderboardDocs.empty) {
          setHistoryTotalResults(0);
          setBestRank(null);
          setBestRankDate(null);
          setHistoryLoading(false);
          return;
        }

        for (const doc of leaderboardDocs.docs) {
          try {
            const userRankDoc = await firestore()
              .collection("leaderboard")
              .doc(doc.id)
              .collection("users")
              .doc(uid)
              .get();

            if (userRankDoc.exists) {
              const d = userRankDoc.data() || {};
              let rank = typeof d.rank === 'number' ? d.rank : parseInt(d.rank, 10);

              if (rank == null || Number.isNaN(rank)) continue;

              total += 1;

              if (rank < best) {
                best = rank;
                bestDateId = doc.id;
              } else if (rank === best) {
                const currentDate = parseResultIdToDate(doc.id);
                const previousDate = parseResultIdToDate(bestDateId);
                if (currentDate && previousDate && currentDate.getTime() > previousDate.getTime()) {
                  bestDateId = doc.id;
                }
              }
            }
          } catch (err) {
            continue;
          }
        }
      } catch (queryError) {
        setHistoryTotalResults(0);
        setBestRank(null);
        setBestRankDate(null);
        setHistoryLoading(false);
        return;
      }

      setHistoryTotalResults(total);
      if (best === Number.POSITIVE_INFINITY) {
        setBestRank(null);
        setBestRankDate(null);
      } else {
        setBestRank(best);
        setBestRankDate(bestDateId ? formatResultIdToReadable(bestDateId) : null);
      }
    } catch (err) {
      setHistoryTotalResults(0);
      setBestRank(null);
      setBestRankDate(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const parseResultIdToDate = (resultId) => {
    if (!resultId || typeof resultId !== "string") return null;
    const prefix = "result_";
    if (!resultId.startsWith(prefix)) return null;
    const datePart = resultId.slice(prefix.length);
    const d = new Date(datePart);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const formatResultIdToReadable = (resultId) => {
    const dt = parseResultIdToDate(resultId);
    if (!dt) return null;
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const fetchUserData = async () => {
    try {
      const profileDoc = await firestore().collection("users").doc(userId).get();
      if (!profileDoc.exists) return;

      const profileData = profileDoc.data();
      setUserData(profileData);

      if (profileData?.avatar) fetchAvatarUrl(profileData.avatar);
      else setCurrentAvatarUrl(null);

      if (profileData?.avatar) {
        const purchasesSnap = await firestore()
          .collection("users")
          .doc(userId)
          .collection("purchases")
          .doc("avatars")
          .get();
        const purchasedAvatars = purchasesSnap.exists ? purchasesSnap.data()?.list || [] : [];
        setUserPurchases(purchasedAvatars);
      } else {
        setUserPurchases([]);
      }

      const footprintsSnap = await firestore()
        .collection("users")
        .doc(userId)
        .collection("footprints")
        .get();

      if (!footprintsSnap.empty) {
        const availableYears = [
          ...new Set(footprintsSnap.docs.map(doc => doc.id.split("-")[0]))
        ].sort().reverse();
        setYears(availableYears);

        if (!availableYears.includes(selectedYear)) setSelectedYear(availableYears[0]);
      } else {
        setYears([currentYear]);
        setSelectedYear(currentYear);
      }

      fetchLeaderboardHistoryStats(userId);

    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchAvatarUrl = async (avatarId) => {
    if (!avatarId) return;
    try {
      const avatarDoc = await avatarsRepository.getAvatarById(avatarId);
      if (avatarDoc?.imageurl) setCurrentAvatarUrl(avatarDoc.imageurl);
      else setCurrentAvatarUrl(null);
    } catch (err) {
      console.error("Error fetching avatar image:", err);
      setCurrentAvatarUrl(null);
    }
  };

  const fetchChart = async (year, category) => {
    setChartLoading(true);
    try {
      if (!userData?.avatar) {
        setChartData({ labels: [], datasets: [{ data: [] }] });
      } else {
        const footprints = await statsRepository.getUserStats(userId);
        const chartReady = statsService.toMonthlyChartData(footprints, category);
        setChartData(chartReady);
      }
    } catch (err) {
      console.error("Error fetching chart:", err);
      setChartData({ labels: [], datasets: [{ data: [] }] });
    } finally {
      setChartLoading(false);
    }
  };

  const handleAvatarSelect = async (avatar) => {
    try {
      await firestore().collection("users").doc(userId).update({ avatar: avatar.id });
      setAvatarModalVisible(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate("SettingsScreen")}
      >
        <Image source={require("../assets/icons/edit.png")} style={styles.editIcon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setAvatarModalVisible(true)}>
        {currentAvatarUrl ? (
          <Image source={{ uri: currentAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#888" }}>No Avatar</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.username}>{userData?.username || "User"}</Text>

      {userData?.avatar && (
        <AvatarPicker
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
          onSelect={handleAvatarSelect}
        />
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Carbon Footprint Tracker</Text>
          <View style={styles.dropdownRow}>
            <View style={styles.dropdownWrapperLeft}>
              <TouchableOpacity
                style={styles.dropdownButtonSmall}
                onPress={() => setDropdownOpen({ year: !dropdownOpen.year, category: false })}
              >
                <Text style={styles.dropdownButtonTextSmall}>{selectedYear}</Text>
              </TouchableOpacity>
              {dropdownOpen.year && (
                <View style={styles.dropdownOverlayFull}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.optionFull, { backgroundColor: selectedYear === y ? "#709775" : "transparent" }]}
                      onPress={() => { setSelectedYear(y); setDropdownOpen({}); }}
                    >
                      <Text style={{ color: selectedYear === y ? "#fff" : "#ccc" }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dropdownWrapperRight}>
              <TouchableOpacity
                style={styles.dropdownButtonSmall}
                onPress={() => setDropdownOpen({ year: false, category: !dropdownOpen.category })}
              >
                <Text style={styles.dropdownButtonTextSmall}>{selectedCategory}</Text>
              </TouchableOpacity>
              {dropdownOpen.category && (
                <View style={styles.dropdownOverlayFull}>
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.optionFull, { backgroundColor: selectedCategory === c ? "#709775" : "transparent" }]}
                      onPress={() => { setSelectedCategory(c); setDropdownOpen({}); }}
                    >
                      <Text style={{ color: selectedCategory === c ? "#fff" : "#ccc" }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {chartLoading ? (
          <ActivityIndicator size="small" color="#709775" style={{ marginTop: 20 }} />
        ) : chartData.labels.length > 0 ? (
          <BarChart
            data={chartData}
            width={width * 0.9}
            height={160}
            fromZero
            showValuesOnTopOfBars
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#1c1c1c",
              backgroundGradientFrom: "#1c1c1c",
              backgroundGradientTo: "#1c1c1c",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(112, 151, 117, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 }
            }}
            style={{ borderRadius: 12, marginVertical: 8 }}
            verticalLabelRotation={0}
            yLabelsOffset={10}
          />
        ) : (
          <Text style={{ color: "#888", fontStyle: "italic", marginTop: 12 }}>
            No data available
          </Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: "#CCCCCC" }]}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <Text style={{ color: "#888", fontStyle: "italic" }}>No badges yet</Text>
      </View>

      {/* Stats Row: Best Rank only */}
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Best Leaderboard Rank</Text>
          {historyLoading ? (
            <ActivityIndicator size="small" color="#709775" style={{ marginVertical: 8 }} />
          ) : historyTotalResults === 0 ? (
            <>
              <Text style={styles.statsValue}>—</Text>
              <Text style={styles.statsSub}>No results yet</Text>
            </>
          ) : (
            <>
              <Text style={styles.statsValue}>{bestRank != null ? `#${bestRank}` : "—"}</Text>
              <Text style={styles.statsSub}>{bestRankDate ? bestRankDate : "Date not available"}</Text>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#131313"
  },
  editButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 100,
  },
  editIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 5,
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    width: "90%",
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#709775",
    fontWeight: "700",
    fontSize: 16,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1
  },
  dropdownWrapperLeft: {
    marginRight: 8
  },
  dropdownWrapperRight: {
    marginLeft: 8
  },
  dropdownButtonSmall: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownButtonTextSmall: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownOverlayFull: {
    position: "absolute",
    top: 35,
    width: "200%",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  optionFull: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  statsTitle: {
    color: "#709775",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  statsValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statsSub: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ProfileScreen;
