// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
          <View style={styles.headContainer}>
            <Text style={styles.head}>Before We Get {"\n"}Started</Text>
            <Text style={styles.subhead}>
              Help TerraTrack personalize your routine, so{"\n"}you can maximize your environmental impact!
            </Text>
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:'center',
    backgroundColor: '#131313'
  },
  headContainer: {
    padding: '4.5%',
    marginTop: '35%',
    alignItems: 'center'
  },
  head: {
    fontSize: 30,
    color: '#709775',
    marginBottom: '6%',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center'
  },
  subhead: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center'
  },
});