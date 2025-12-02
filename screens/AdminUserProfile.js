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
import { scale } from "../utils/scaling";

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
              <View style={styles.durationRadio}>
                {selectedDuration === option.value && (
                  <View style={styles.durationRadioDot} />
                )}
              </View>
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => onConfirm(selectedDuration)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
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
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoGrid}>
                <InfoRow label="Username" value={userDetails.username} />
                <InfoRow label="Email" value={userDetails.email} />
                <InfoRow label="User ID" value={userDetails.id} />
                <InfoRow label="Status" value={userDetails.status || 'Active'} />
                <InfoRow label="Referral Code" value={userDetails.referralCode} />
                <InfoRow label="Referred By" value={userDetails.referredBy || 'None'} />
            </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress & Stats</Text>
            <View style={styles.statsGrid}>
                <StatItem label="Terra Coins" value={userDetails.terraCoins?.toString()} />
                <StatItem label="Terra Points" value={userDetails.terraPoints?.toString()} />
                <StatItem label="Materials Read" value={userDetails.stats?.educationalMaterialsRead?.toString()} />
                <StatItem label="Quizzes Finished" value={userDetails.stats?.educationalQuizFinished?.toString()} />
                <StatItem label="Tasks Completed" value={userDetails.stats?.taskFinished?.toString()} />
            </View>
        </View>

        {/* Chart */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environmental Impact</Text>
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

        {/* Admin Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <View style={styles.actionButtons}>
                {userDetails?.status?.toLowerCase() === 'active' ? (
                    <>
                        <TouchableOpacity style={[styles.actionButton, styles.suspendButton]} onPress={onSuspendUser}>
                            <Text style={styles.actionButtonText}>Suspend</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.banButton]} onPress={onBanUser}>
                            <Text style={styles.actionButtonText}>Ban</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity style={[styles.actionButton, styles.activateButton]} onPress={onActivateUser}>
                        <Text style={styles.actionButtonText}>Activate</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </ScrollView>
);

const PreferencesTab = ({ userDetails }) => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Lifestyle */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle Preferences</Text>
            <View style={styles.preferenceCards}>
                <PreferenceCard label="Budget Level" value={userDetails.preferences?.budgetLevel} />
                <PreferenceCard label="Commute Distance" value={userDetails.preferences?.commuteDistance} />
            </View>
        </View>

        {/* Diet */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diet Preferences</Text>
            {userDetails.preferences?.dietType?.length > 0 ? (
                <View style={styles.tagContainer}>
                    {userDetails.preferences.dietType.map((diet, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{diet}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <EmptyState text="No diet preferences set" />
            )}
        </View>

        {/* Energy */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Energy Control</Text>
            {userDetails.preferences?.energyControl?.length > 0 ? (
                <View style={styles.tagContainer}>
                    {userDetails.preferences.energyControl.map((energy, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{energy}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <EmptyState text="No energy preferences set" />
            )}
        </View>

        {/* Transportation */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transportation</Text>
            {userDetails.preferences?.transportationOptions?.length > 0 ? (
                <View style={styles.tagContainer}>
                    {userDetails.preferences.transportationOptions.map((transport, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{transport}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <EmptyState text="No transportation preferences set" />
            )}
        </View>
    </ScrollView>
);

const AchievementsTab = ({ userDetails }) => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Badges */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges ({userDetails.unlockedBadges?.length || 0})</Text>
            {userDetails.unlockedBadges?.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {userDetails.unlockedBadges.map((badge) => (
                        <View key={badge.id} style={styles.badgeCard}>
                            <Image
                                source={badge.imageUrl ? { uri: badge.imageUrl } : require("../assets/images/Avatar.png")}
                                style={styles.badgeImage}
                                onError={(e) => {
                                    console.log('Error loading badge image:', badge.imageUrl);
                                    e.nativeEvent.target = null;
                                }}
                                defaultSource={require("../assets/images/Avatar.png")}
                            />
                            <Text style={styles.badgeName} numberOfLines={1}>{badge.name || 'Unnamed Badge'}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <EmptyState text="No badges unlocked yet" />
            )}
        </View>

        {/* Avatars */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avatars ({userDetails.purchasedAvatars?.length || 0})</Text>
            {userDetails.purchasedAvatars && userDetails.purchasedAvatars.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {userDetails.purchasedAvatars.map((avatar) => (
                        <View key={avatar.id} style={styles.avatarCard}>
                            <Image
                                source={avatar.imageUrl ? { uri: avatar.imageUrl } : require("../assets/images/Avatar.png")}
                                style={styles.avatarImage}
                                onError={(e) => {
                                    console.log('Error loading avatar image:', avatar.imageUrl);
                                    e.nativeEvent.target = null;
                                }}
                                defaultSource={require("../assets/images/Avatar.png")}
                            />
                            <Text style={styles.avatarName} numberOfLines={1}>{avatar.name || 'Unnamed Avatar'}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <EmptyState text="No avatars purchased yet" />
            )}
        </View>

        {/* Invites */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invites ({userDetails.invites?.length || 0})</Text>
            {userDetails.invites?.length > 0 ? (
                <View style={styles.invitesList}>
                    {userDetails.invites.map((invite) => (
                        <View key={invite.id} style={styles.inviteCard}>
                            <View style={styles.inviteHeader}>
                                <Text style={styles.inviteUsername}>{invite.invitedUsername || 'Unknown User'}</Text>
                                <View style={[
                                    styles.inviteStatusBadge,
                                    invite.rewardsClaimed ? styles.statusClaimed : styles.statusUnclaimed
                                ]}>
                                    <Text style={styles.inviteStatusText}>
                                        {invite.rewardsClaimed ? 'Claimed' : 'Unclaimed'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.inviteEmail}>{invite.invitedUserEmail || 'No email'}</Text>
                            <Text style={styles.inviteDate}>
                                {invite.createdAt?.toDate ? invite.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                            </Text>
                            <View style={styles.inviteStats}>
                                <Text style={styles.inviteStat}>{invite.taskFinished || 0} tasks</Text>
                                <Text style={styles.inviteStat}>{invite.educationalQuizFinished || 0} quizzes</Text>
                                <Text style={styles.inviteStat}>{invite.weeklyQuizFinished || 0} weekly</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <EmptyState text="No users invited yet" />
            )}
        </View>
    </ScrollView>
);

// Reusable Components
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || 'Not set'}</Text>
    </View>
);

const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
        <Text style={styles.statValue}>{value || '0'}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const PreferenceCard = ({ label, value }) => (
    <View style={styles.preferenceCard}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceValue}>{value || 'Not set'}</Text>
    </View>
);

const EmptyState = ({ text }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{text}</Text>
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
            Alert.alert("Error", "Failed to load user details.");
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
            Alert.alert("Success", `User suspended for ${durationDays} day(s)`);
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
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#709775" />
                </View>
            );
        }

        switch (activeTab) {
            case "profile":
                return (
                    <ProfileTab
                        userDetails={userDetails}
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
                        onBackPress={() => navigation.goBack()}
                    />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#709775" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <HeaderRow
                    title="User Profile"
                    onBackPress={() => navigation.goBack()}
                />
            </View>

            {/* User Header Card */}
            <View style={styles.userHeaderCard}>
                <Image
                    source={
                        userDetails?.avatar
                            ? { uri: userDetails.avatar }
                            : require("../assets/images/Avatar.png")
                    }
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.username} numberOfLines={1}>{userDetails?.username || 'Unknown User'}</Text>
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
                {["profile", "preferences", "achievements"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                        {activeTab === tab && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.contentContainer}>
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
        paddingHorizontal: scale(16),
        paddingTop: scale(20),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    
    // User Header Card
    userHeaderCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E1E1E",
        marginHorizontal: scale(16),
        marginTop: scale(16),
        marginBottom: scale(16),
        padding: scale(20),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    avatar: {
        width: scale(64),
        height: scale(64),
        borderRadius: scale(32),
        marginRight: scale(16),
    },
    userInfo: {
        flex: 1,
    },
    userInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    username: {
        fontSize: scale(18),
        fontWeight: "600",
        color: "#FFFFFF",
        flex: 1,
        marginRight: scale(12),
    },
    statusBadge: {
        paddingHorizontal: scale(12),
        paddingVertical: scale(6),
        borderRadius: scale(20),
        backgroundColor: "#709775",
    },
    statusBanned: {
        backgroundColor: "#FF6B6B",
    },
    statusSuspended: {
        backgroundColor: "#FFA500",
    },
    statusText: {
        fontSize: scale(12),
        fontWeight: "600",
        color: "#FFFFFF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    
    // Tabs
    tabsContainer: {
        flexDirection: "row",
        backgroundColor: "#1E1E1E",
        marginHorizontal: scale(16),
        marginBottom: scale(16),
        borderRadius: scale(12),
        padding: scale(4),
    },
    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: scale(12),
        borderRadius: scale(8),
        position: "relative",
    },
    activeTab: {
        backgroundColor: "#252525",
    },
    tabText: {
        fontSize: scale(14),
        fontWeight: "600",
        color: "#888",
        textAlign: "center",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    tabIndicator: {
        position: "absolute",
        bottom: 0,
        left: "25%",
        right: "25%",
        height: scale(3),
        backgroundColor: "#709775",
        borderTopLeftRadius: scale(2),
        borderTopRightRadius: scale(2),
    },
    
    // Content
    contentContainer: {
        flex: 1,
        marginHorizontal: scale(16),
        marginBottom: scale(16),
    },
    tabContent: {
        flex: 1,
    },
    
    // Sections
    section: {
        backgroundColor: "#1E1E1E",
        borderRadius: scale(16),
        padding: scale(20),
        marginBottom: scale(16),
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    sectionTitle: {
        fontSize: scale(18),
        fontWeight: "600",
        color: "#FFFFFF",
        marginBottom: scale(20),
    },
    
    // Info Grid
    infoGrid: {
        gap: scale(12),
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: scale(10),
        borderBottomWidth: 1,
        borderBottomColor: "#2A2A2A",
    },
    infoLabel: {
        fontSize: scale(14),
        color: "#888",
        fontWeight: "500",
        flex: 1,
    },
    infoValue: {
        fontSize: scale(14),
        color: "#FFFFFF",
        fontWeight: "500",
        textAlign: "right",
        flex: 1,
        paddingLeft: scale(12),
    },
    
    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: scale(12),
    },
    statItem: {
        flex: 1,
        minWidth: scale(100),
        backgroundColor: "#252525",
        borderRadius: scale(12),
        padding: scale(16),
        alignItems: "center",
    },
    statValue: {
        fontSize: scale(20),
        fontWeight: "600",
        color: "#FFFFFF",
        marginBottom: scale(4),
    },
    statLabel: {
        fontSize: scale(12),
        color: "#888",
        textAlign: "center",
    },
    
    // Action Buttons
    actionButtons: {
        flexDirection: "row",
        gap: scale(12),
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: scale(14),
        borderRadius: scale(12),
    },
    suspendButton: {
        backgroundColor: "#FFA500",
    },
    banButton: {
        backgroundColor: "#FF6B6B",
    },
    activateButton: {
        backgroundColor: "#709775",
    },
    actionButtonText: {
        fontSize: scale(14),
        fontWeight: "600",
        color: "#FFFFFF",
    },
    
    // Preferences
    preferenceCards: {
        gap: scale(12),
    },
    preferenceCard: {
        backgroundColor: "#252525",
        borderRadius: scale(12),
        padding: scale(16),
    },
    preferenceLabel: {
        fontSize: scale(14),
        color: "#888",
        fontWeight: "500",
        marginBottom: scale(4),
    },
    preferenceValue: {
        fontSize: scale(16),
        color: "#FFFFFF",
        fontWeight: "600",
    },
    
    // Tags
    tagContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: scale(8),
    },
    tag: {
        backgroundColor: "#252525",
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        borderRadius: scale(20),
    },
    tagText: {
        fontSize: scale(12),
        color: "#FFFFFF",
        fontWeight: "500",
    },
    
    // Empty State
    emptyState: {
        padding: scale(40),
        alignItems: "center",
    },
    emptyStateText: {
        fontSize: scale(14),
        color: "#888",
        fontStyle: "italic",
    },
    
    // Horizontal Scroll
    horizontalScroll: {
        marginHorizontal: scale(-20),
        paddingHorizontal: scale(20),
    },
    
    // Badges & Avatars
    badgeCard: {
        alignItems: "center",
        marginRight: scale(16),
        width: scale(100),
    },
    badgeImage: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
        marginBottom: scale(8),
        backgroundColor: "#252525",
    },
    badgeName: {
        fontSize: scale(12),
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "500",
    },
    avatarCard: {
        alignItems: "center",
        marginRight: scale(16),
        width: scale(100),
    },
    avatarImage: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
        marginBottom: scale(8),
        backgroundColor: "#252525",
    },
    avatarName: {
        fontSize: scale(12),
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "500",
    },
    
    // Invites
    invitesList: {
        gap: scale(12),
    },
    inviteCard: {
        backgroundColor: "#252525",
        borderRadius: scale(12),
        padding: scale(16),
    },
    inviteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: scale(8),
    },
    inviteUsername: {
        fontSize: scale(16),
        fontWeight: "600",
        color: "#FFFFFF",
        flex: 1,
        marginRight: scale(12),
    },
    inviteStatusBadge: {
        paddingHorizontal: scale(8),
        paddingVertical: scale(4),
        borderRadius: scale(20),
    },
    statusClaimed: {
        backgroundColor: "rgba(76, 175, 80, 0.2)",
    },
    statusUnclaimed: {
        backgroundColor: "rgba(255, 165, 0, 0.2)",
    },
    inviteStatusText: {
        fontSize: scale(10),
        fontWeight: "600",
        color: "#709775",
    },
    inviteEmail: {
        fontSize: scale(12),
        color: "#888",
        marginBottom: scale(8),
    },
    inviteDate: {
        fontSize: scale(11),
        color: "#709775",
        fontWeight: "500",
        marginBottom: scale(12),
    },
    inviteStats: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    inviteStat: {
        fontSize: scale(11),
        color: "#888",
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: scale(16),
    },
    modalContent: {
        width: "100%",
        backgroundColor: "#1E1E1E",
        borderRadius: scale(20),
        padding: scale(24),
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    modalTitle: {
        fontSize: scale(18),
        fontWeight: "600",
        color: "#FFFFFF",
        marginBottom: scale(24),
        textAlign: "center",
    },
    durationOptions: {
        gap: scale(12),
        marginBottom: scale(24),
    },
    durationOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#252525",
        padding: scale(16),
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    durationOptionSelected: {
        borderColor: "#709775",
        backgroundColor: "rgba(112, 151, 117, 0.1)",
    },
    durationRadio: {
        width: scale(20),
        height: scale(20),
        borderRadius: scale(10),
        borderWidth: 2,
        borderColor: "#888",
        marginRight: scale(12),
        justifyContent: "center",
        alignItems: "center",
    },
    durationRadioDot: {
        width: scale(10),
        height: scale(10),
        borderRadius: scale(5),
        backgroundColor: "#709775",
    },
    durationText: {
        fontSize: scale(16),
        color: "#FFFFFF",
        fontWeight: "500",
    },
    durationTextSelected: {
        color: "#709775",
        fontWeight: "600",
    },
    modalButtons: {
        flexDirection: "row",
        gap: scale(12),
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#2A2A2A",
        paddingVertical: scale(14),
        borderRadius: scale(12),
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#FFFFFF",
        fontSize: scale(14),
        fontWeight: "600",
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#FFA500",
        paddingVertical: scale(14),
        borderRadius: scale(12),
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: scale(14),
        fontWeight: "600",
    },
});

export default AdminUserProfile;