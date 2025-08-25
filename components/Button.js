import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { scale } from '../utils/scaling';

const Button = ({ title, style, textStyle, onPress }) => (
  <TouchableOpacity
    style={[
      {
        backgroundColor: '#415D43',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: scale(10),
        paddingHorizontal: scale(20),
      },
      style,
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text
      style={[
        {
          color: 'white',
          fontWeight: 'bold',
          fontSize: scale(14),
        },
        textStyle,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default Button;
