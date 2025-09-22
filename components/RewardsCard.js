    import React from 'react';
    import { View, Text, Image, StyleSheet } from 'react-native';
    import TerraCoin from '../assets/images/TerraCoin.png';
    import TerraPoint from '../assets/images/TerraPoint.png';

    const RewardsCard = ({ rewards, title = "Leaderboard Rewards" }) => {
    const rewardTiers = [
        { label: 'Top 1', reward: rewards.top1 },
        { label: 'Top 2', reward: rewards.top2 },
        { label: 'Top 3', reward: rewards.top3 },
        { label: 'Top 4-10', reward: rewards.top4to10 },
        { label: 'Top 11+', reward: rewards.top11plus },
    ];

    return (
        <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {rewardTiers.map((item, index, arr) => (
            <View key={item.label}>
            <View style={styles.rewardRow}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.rewardGroup}>
                <Image source={TerraPoint} style={styles.icon} />
                <Text style={styles.text}>{item.reward.terraPoints}</Text>
                </View>
                <View style={styles.rewardGroup}>
                <Text style={styles.text}>{item.reward.terraCoins}</Text>
                <Image source={TerraCoin} style={styles.icon} />
                </View>
            </View>
            {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
        ))}
        </View>
    );
    };

    const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1B2B20',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    title: {
        color: '#CCCCCC',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    label: {
        color: '#CCCCCC',
        fontSize: 14,
        fontWeight: 'bold',
        width: 70,
    },
    rewardGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    text: {
        color: '#CCCCCC',
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 4,
    },
    icon: {
        width: 20,
        height: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#415D43',
        marginVertical: 4,
        opacity: 0.4,
    },
    });

    export default RewardsCard;