import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const Onboarding = ({ navigation }) => {
  const buttonWidth = scale(308);
  const buttonHeight = vScale(53);

  return (
    <View style={[styles.container, { paddingVertical: vScale(40) }]}>
      <View style={styles.centeredContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.head, { 
            fontSize: scale(32),
            lineHeight: vScale(36),
            marginBottom: vScale(20)
          }]}>
            Before We Get {"\n"}Started
          </Text>
          <Text style={[styles.subhead, {
            fontSize: scale(12),
            lineHeight: vScale(18),
            marginBottom: vScale(40)
          }]}>
            Help TerraTrack personalize your routine, so{"\n"}you can maximize your environmental impact!
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            { 
              width: buttonWidth, 
              height: buttonHeight,
              marginTop: vScale(20)
            }
          ]}
          onPress={() => navigation.navigate('OnboardingScreen')}
        >
          <Text style={styles.buttonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  centeredContent: {
    width: '100%',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  head: {
    color: '#709775',
    textAlign: 'center',
    fontFamily: 'DMSans-Bold',
  },
  subhead: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontFamily: 'DMSans-Bold',
  },
  button: {
    backgroundColor: '#415D43',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Onboarding;