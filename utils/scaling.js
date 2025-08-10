import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const baseWidth = 390;
const baseHeight = 844;
const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;

export const scale = size => Math.round(size * scaleWidth);
export const vScale = size => Math.round(size * scaleHeight);