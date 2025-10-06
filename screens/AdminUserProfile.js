import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { adminUserRepository } from "../repositories/adminUserRepository";
import HeaderRow from "../components/HeaderRow";
import { ChartSection } from "../components/ChartSection";
import { useChartData } from "../hooks/useChartData";

// Suspension Modal Component
const SuspensionModal = ({ visible, onClose, onConfirm }) => {
  const [selectedDuration, setSelectedDuration] = useState('1');

  const durationOptions = [
    { label: '1 Day', value: '1' },
    { label: '7 Days', value: '7' }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Suspension Duration</Text>
          
          {durationOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.durationOption,
                selectedDuration === option.value && styles.durationOptionSelected
              ]}
              onPress={() => setSelectedDuration(option.value)}
            >
              <Text style={[
                styles.durationText,
                selectedDuration === option.value && styles.durationTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => onConfirm(selectedDuration)}
            >
              <Text style={styles.buttonText}>Confirm Suspension</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Tab Components
const ProfileTab = ({ 
    userDetails, 
    userId, 
    onBanUser, 
    onSuspendUser, 
    onActivateUser,
    chartData,
    chartLoading,
    selectedYear,
    selectedCategory,
    years,
    categories,
    dropdownOpen,
    setDropdownOpen,
    setSelectedYear,
    setSelectedCategory 
}) => (
    <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InfoRow label="Username" value={userDetails.username} />
            <InfoRow label="Email" value={userDetails.email} />
            <InfoRow label="User ID" value={userDetails.id} />
            <InfoRow label="Status" value={userDetails.status || 'Active'} />
            <InfoRow label="Referral Code" value={userDetails.referralCode} />
            <InfoRow label="Referred By" value={userDetails.referredBy || 'None'} />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress & Stats</Text>
            <InfoRow label="Terra Coins" value={userDetails.terraCoins?.toString()} />
            <InfoRow label="Terra Points" value={userDetails.terraPoints?.toString()} />
            <InfoRow label="Materials Read" value={userDetails.stats?.educationalMaterialsRead?.toString()} />
            <InfoRow label="Quizzes Finished" value={userDetails.stats?.educationalQuizFinished?.toString()} />
            <InfoRow label="Tasks Completed" value={userDetails.stats?.taskFinished?.toString()} />

            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={styles.adminChartWrapper}>
                    <ChartSection
                    chartData={chartData}
                    chartLoading={chartLoading}
                    selectedYear={selectedYear}
                    selectedCategory={selectedCategory}
                    years={years}
                    categories={categories}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    setSelectedYear={setSelectedYear}
                    setSelectedCategory={setSelectedCategory}
                    />
                </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <View style={styles.adminActions}>
                {userDetails?.status?.toLowerCase() === 'active' ? (
                    <>
                        <TouchableOpacity style={[styles.adminActionBtn, styles.suspendBtn]} onPress={onSuspendUser}>
                            <Text style={styles.adminActionBtnText}>Suspend User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.adminActionBtn, styles.banBtn]} onPress={onBanUser}>
                            <Text style={styles.adminActionBtnText}>Ban User</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity style={[styles.adminActionBtn, styles.activateBtn]} onPress={onActivateUser}>
                        <Text style={styles.adminActionBtnText}>Activate User</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </ScrollView>
);

const PreferencesTab = ({ userDetails }) => (
    <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle Preferences</Text>
            <InfoRow label="Budget Level" value={userDetails.preferences?.budgetLevel} />
            <InfoRow label="Commute Distance" value={userDetails.preferences?.commuteDistance} />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diet Preferences</Text>
            {userDetails.preferences?.dietType?.length > 0 ? (
                userDetails.preferences.dietType.map((diet, index) => (
                    <Text key={index} style={styles.itemLine}>{diet}</Text>
                ))
            ) : (
                <Text style={styles.noDataText}>No diet preferences set</Text>
            )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Energy Control</Text>
            {userDetails.preferences?.energyControl?.length > 0 ? (
                userDetails.preferences.energyControl.map((energy, index) => (
                    <Text key={index} style={styles.itemLine}>{energy}</Text>
                ))
            ) : (
                <Text style={styles.noDataText}>No energy preferences set</Text>
            )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transportation</Text>
            {userDetails.preferences?.transportationOptions?.length > 0 ? (
                userDetails.preferences.transportationOptions.map((transport, index) => (
                    <Text key={index} style={styles.itemLine}>{transport}</Text>
                ))
            ) : (
                <Text style={styles.noDataText}>No transportation preferences set</Text>
            )}
        </View>
    </ScrollView>
);

const AchievementsTab = ({ userDetails }) => (
  <ScrollView style={styles.tabContentScroll} contentContainerStyle={styles.tabContentContainer}>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Badges ({userDetails.unlockedBadges?.length || 0})</Text>
      {userDetails.unlockedBadges?.length > 0 ? (
        <View style={styles.gridContainer}>
          {userDetails.unlockedBadges.map((badge) => (
            <View key={badge.id} style={styles.gridItem}>
              <Image
                source={badge.imageUrl ? { uri: badge.imageUrl } : require("../assets/images/Avatar.png")}
                style={styles.gridImage}
                onError={(e) => {
                  console.log('Error loading badge image:', badge.imageUrl);
                  e.nativeEvent.target = null;
                }}
                defaultSource={require("../assets/images/Avatar.png")}
              />
              <Text style={styles.gridText} numberOfLines={2}>{badge.name || 'Unnamed Badge'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No badges unlocked yet</Text>
      )}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Avatars ({userDetails.purchasedAvatars?.length || 0})</Text>
      {userDetails.purchasedAvatars && userDetails.purchasedAvatars.length > 0 ? (
        <View style={styles.gridContainer}>
          {userDetails.purchasedAvatars.map((avatar) => (
            <View key={avatar.id} style={styles.gridItem}>
              <Image
                source={avatar.imageUrl ? { uri: avatar.imageUrl } : require("../assets/images/Avatar.png")}
                style={styles.gridImage}
                onError={(e) => {
                  console.log('Error loading avatar image:', avatar.imageUrl);
                  e.nativeEvent.target = null;
                }}
                defaultSource={require("../assets/images/Avatar.png")}
              />
              <Text style={styles.gridText} numberOfLines={2}>{avatar.name || 'Unnamed Avatar'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No avatars purchased yet</Text>
      )}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Invites ({userDetails.invites?.length || 0})</Text>
      {userDetails.invites?.length > 0 ? (
        userDetails.invites.map((invite) => (
          <View key={invite.id} style={styles.inviteItem}>
            <Text style={styles.inviteUsername}>{invite.invitedUsername || 'Unknown User'}</Text>
            <Text style={styles.inviteId}>User ID: {invite.id}</Text>
            <Text style={styles.inviteEmail}>Email: {invite.invitedUserEmail || 'No email'}</Text>
            <Text style={styles.inviteDate}>
              Invited: {invite.createdAt?.toDate ? invite.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
            </Text>
            <View style={styles.inviteStats}>
              <Text style={styles.inviteStat}>Tasks: {invite.taskFinished || 0}</Text>
              <Text style={styles.inviteStat}>Quizzes: {invite.educationalQuizFinished || 0}</Text>
              <Text style={styles.inviteStat}>Weekly: {invite.weeklyQuizFinished || 0}</Text>
            </View>
            <Text style={styles.rewardStatus}>
              Rewards {invite.rewardsClaimed ? 'Claimed' : 'Not Claimed'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No users invited yet</Text>
      )}
    </View>
  </ScrollView>
);

// Reusable Components
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
);

// Main Component
const AdminUserProfile = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId, userData } = route.params;

    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [showSuspensionModal, setShowSuspensionModal] = useState(false);
    
    // Chart state management
    const [dropdownOpen, setDropdownOpen] = useState({ year: false, category: false });
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedCategory, setSelectedCategory] = useState('Total');
    const categories = ['Total', 'Diet', 'Transport', 'Energy'];
    
    // Use the chart hook
    const { chartData, chartLoading } = useChartData(userId, selectedYear, selectedCategory, userDetails);

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const userData = await adminUserRepository.getUserFullData(userId);
            console.log('Fetched user data:', userData);

            if (userData.unlockedBadges && userData.unlockedBadges.length > 0) {
                console.log('First badge details:', userData.unlockedBadges[0]);
            }

            if (userData.purchasedAvatars && Object.keys(userData.purchasedAvatars).length > 0) {
                console.log('First avatar details:', Object.values(userData.purchasedAvatars)[0]);
            }

            setUserDetails(userData);
            
            // Set available years for chart dropdown
            if (userData.footprints) {
                const availableYears = [
                    ...new Set(Object.keys(userData.footprints).map(key => key.split('-')[0]))
                ].sort().reverse();
                setYears(availableYears.length > 0 ? availableYears : [selectedYear]);
            } else {
                setYears([selectedYear]);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            Alert.alert("Error", "Failed to load user details. You may not have admin permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async () => {
        Alert.alert(
            "Ban User",
            "Are you sure you want to ban this user?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Ban",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await adminUserRepository.banUser(userId);
                            fetchUserDetails();
                            Alert.alert("Success", "User has been banned");
                        } catch (error) {
                            Alert.alert("Error", "Failed to ban user");
                        }
                    }
                }
            ]
        );
    };

    const handleSuspendUser = async () => {
        setShowSuspensionModal(true);
    };

    const executeSuspension = async (durationDays) => {
        try {
            await adminUserRepository.suspendUser(userId, parseInt(durationDays));
            fetchUserDetails();
            Alert.alert("Success", `User has been suspended for ${durationDays} day(s)`);
        } catch (error) {
            Alert.alert("Error", "Failed to suspend user");
        }
        setShowSuspensionModal(false);
    };

    const handleActivateUser = async () => {
        try {
            await adminUserRepository.activateUser(userId);
            fetchUserDetails();
            Alert.alert("Success", "User has been activated");
        } catch (error) {
            Alert.alert("Error", "Failed to activate user");
        }
    };

    const renderTabContent = () => {
        if (loading || !userDetails) {
            return <ActivityIndicator size="large" color="#709775" style={styles.loader} />;
        }

        switch (activeTab) {
            case "profile":
                return (
                    <ProfileTab
                        userDetails={userDetails}
                        userId={userId}
                        onBanUser={handleBanUser}
                        onSuspendUser={handleSuspendUser}
                        onActivateUser={handleActivateUser}
                        chartData={chartData}
                        chartLoading={chartLoading}
                        selectedYear={selectedYear}
                        selectedCategory={selectedCategory}
                        years={years}
                        categories={categories}
                        dropdownOpen={dropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                        setSelectedYear={setSelectedYear}
                        setSelectedCategory={setSelectedCategory}
                    />
                );
            case "preferences":
                return <PreferencesTab userDetails={userDetails} />;
            case "achievements":
                return <AchievementsTab userDetails={userDetails} />;
            default:
                return (
                    <ProfileTab
                        userDetails={userDetails}
                        userId={userId}
                        onBanUser={handleBanUser}
                        onSuspendUser={handleSuspendUser}
                        onActivateUser={handleActivateUser}
                        chartData={chartData}
                        chartLoading={chartLoading}
                        selectedYear={selectedYear}
                        selectedCategory={selectedCategory}
                        years={years}
                        categories={categories}
                        dropdownOpen={dropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                        setSelectedYear={setSelectedYear}
                        setSelectedCategory={setSelectedCategory}
                    />
                );
        }
    };

    if (loading && !userDetails) {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <HeaderRow
                        title="User Profile"
                        showBack={true}
                        onBackPress={() => navigation.goBack()}
                    />
                </View>
                <ActivityIndicator size="large" color="#709775" style={styles.loader} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <HeaderRow
                    title="User Profile"
                    showBack={true}
                    onBackPress={() => navigation.goBack()}
                />
            </View>

            <View style={styles.userSummary}>
                <Image
                    source={
                        userDetails?.avatar
                            ? { uri: userDetails.avatar }
                            : require("../assets/images/Avatar.png")
                    }
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <View style={styles.usernameRow}>
                        <Text style={styles.username}>{userDetails?.username || 'Unknown User'}</Text>
                        <View style={[
                            styles.statusBadge,
                            userDetails?.status === 'Banned' && styles.statusBanned,
                            userDetails?.status === 'Suspended' && styles.statusSuspended
                        ]}>
                            <Text style={styles.statusText}>{userDetails?.status || 'Active'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "profile" && styles.activeTab]}
                        onPress={() => setActiveTab("profile")}
                    >
                        <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
                            Profile
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "preferences" && styles.activeTab]}
                        onPress={() => setActiveTab("preferences")}
                    >
                        <Text style={[styles.tabText, activeTab === "preferences" && styles.activeTabText]}>
                            Preferences
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "achievements" && styles.activeTab]}
                        onPress={() => setActiveTab("achievements")}
                    >
                        <Text style={[styles.tabText, activeTab === "achievements" && styles.activeTabText]}>
                            Achievements
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
                {renderTabContent()}
            </View>

            {/* Suspension Modal */}
            <SuspensionModal
                visible={showSuspensionModal}
                onClose={() => setShowSuspensionModal(false)}
                onConfirm={executeSuspension}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#131313",
    },
    headerContainer: {
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    userSummary: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#1E1E1E",
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    usernameRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    username: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "#709775",
        minWidth: 70,
        alignItems: "center",
    },
    statusBanned: {
        backgroundColor: "#DC2626",
    },
    statusSuspended: {
        backgroundColor: "#F59E0B",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    tabsContainer: {
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#2A2A2A",
        marginTop: 10,
    },
    tabs: {
        flexDirection: "row",
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: "center",
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: "#709775",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#888888",
        textAlign: "center",
    },
    activeTabText: {
        color: "#709775",
        fontWeight: "600",
    },
    tabContent: {
        flex: 1,
    },
    tabContentScroll: {
        flex: 1,
    },
    tabContentContainer: {
        flexGrow: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#2A2A2A",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#709775",
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: "#CCCCCC",
        fontWeight: "500",
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "400",
        textAlign: "right",
        flex: 1,
        paddingLeft: 10,
    },
    chartContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#2A2A2A",
    },
    adminChartWrapper: {
        width: '120%',
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    adminActions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
        gap: 10,
    },
    adminActionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: "center",
        minHeight: 44,
        justifyContent: "center",
    },
    suspendBtn: {
        backgroundColor: "#db8e08ff",
    },
    banBtn: {
        backgroundColor: "#b41f1fff",
    },
    activateBtn: {
        backgroundColor: "#709775",
    },
    adminActionBtnText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
        textAlign: "center",
    },
    listItem: {
        fontSize: 14,
        color: "#FFFFFF",
        marginBottom: 6,
        paddingLeft: 8,
    },
    itemLine: {
        fontSize: 14,
        color: "#FFFFFF",
        marginBottom: 6,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    gridItem: {
        alignItems: "center",
        width: "30%",
        marginBottom: 15,
    },
    gridImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    gridText: {
        fontSize: 12,
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "400",
    },
    inviteItem: {
        backgroundColor: "#2A2A2A",
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    inviteUsername: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "600",
        marginBottom: 4,
    },
    inviteId: {
        fontSize: 12,
        color: "#888888",
        marginBottom: 2,
    },
    inviteEmail: {
        fontSize: 12,
        color: "#888888",
        marginBottom: 8,
    },
    inviteDate: {
        fontSize: 12,
        color: "#709775",
        fontWeight: "500",
        marginBottom: 8,
    },
    inviteStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    inviteStat: {
        fontSize: 11,
        color: "#CCCCCC",
    },
    rewardStatus: {
        fontSize: 11,
        color: "#F59E0B",
        fontWeight: "500",
        textAlign: "right",
    },
    noDataText: {
        fontSize: 14,
        color: "#888888",
        fontStyle: "italic",
        textAlign: "center",
        marginVertical: 10,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2A2A2A',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    durationOption: {
        width: '100%',
        padding: 15,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    durationOptionSelected: {
        backgroundColor: '#709775',
    },
    durationText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    durationTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#666',
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#F59E0B',
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AdminUserProfile;