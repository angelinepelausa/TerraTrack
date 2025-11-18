import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image,
  ScrollView,
  Modal
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { updatePartnerProfile } from '../repositories/partnerRepository';
import auth from '@react-native-firebase/auth';
import { scale, vScale } from '../utils/scaling';

const PartnerProfileSetup = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Business Hours State
  const [businessHoursModal, setBusinessHoursModal] = useState(false);
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('06');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('PM');
  const [businessHours, setBusinessHours] = useState('');

  // Time options - circular arrays
  const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        setUploading(true);
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        setLogoUrl(imageUrl);
        setUploading(false);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to upload image');
      setUploading(false);
    }
  };

  const openBusinessHoursModal = () => {
    setBusinessHoursModal(true);
  };

  const handleSaveBusinessHours = () => {
    const hoursString = `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;
    setBusinessHours(hoursString);
    setBusinessHoursModal(false);
  };

  // Circular navigation functions
  const getNextItem = (array, current) => {
    const index = array.indexOf(current);
    return array[(index + 1) % array.length];
  };

  const getPrevItem = (array, current) => {
    const index = array.indexOf(current);
    return array[(index - 1 + array.length) % array.length];
  };

  const TimePickerSection = ({ label, hour, minute, period, onHourChange, onMinuteChange, onPeriodChange }) => (
    <View style={styles.timeSection}>
      <Text style={styles.timeSectionLabel}>{label}</Text>
      <View style={styles.timePickerCompact}>
        {/* Hour */}
        <View style={styles.timeColumnCompact}>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onHourChange(getPrevItem(hours, hour))}
          >
            <Ionicons name="chevron-up" size={scale(20)} color="#709775" />
          </TouchableOpacity>
          <Text style={styles.timeDisplay}>{hour}</Text>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onHourChange(getNextItem(hours, hour))}
          >
            <Ionicons name="chevron-down" size={scale(20)} color="#709775" />
          </TouchableOpacity>
        </View>

        <Text style={styles.timeSeparator}>:</Text>

        {/* Minute */}
        <View style={styles.timeColumnCompact}>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onMinuteChange(getPrevItem(minutes, minute))}
          >
            <Ionicons name="chevron-up" size={scale(20)} color="#709775" />
          </TouchableOpacity>
          <Text style={styles.timeDisplay}>{minute}</Text>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onMinuteChange(getNextItem(minutes, minute))}
          >
            <Ionicons name="chevron-down" size={scale(20)} color="#709775" />
          </TouchableOpacity>
        </View>

        {/* Period */}
        <View style={styles.timeColumnCompact}>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onPeriodChange(getPrevItem(periods, period))}
          >
            <Ionicons name="chevron-up" size={scale(20)} color="#709775" />
          </TouchableOpacity>
          <Text style={styles.timeDisplay}>{period}</Text>
          <TouchableOpacity 
            style={styles.timeArrow}
            onPress={() => onPeriodChange(getNextItem(periods, period))}
          >
            <Ionicons name="chevron-down" size={scale(20)} color="#709775" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return false;
    }
    if (!formData.contact.trim()) {
      Alert.alert('Error', 'Please enter your contact information');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter your business address');
      return false;
    }
    if (!businessHours.trim()) {
      Alert.alert('Error', 'Please set your business hours');
      return false;
    }
    if (!logoUrl) {
      Alert.alert('Error', 'Please upload your business logo');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const updateResult = await updatePartnerProfile(user.uid, {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        address: formData.address.trim(),
        businessHours: businessHours.trim(),
        logoUrl: logoUrl,
      });

      if (updateResult.success) {
        navigation.replace('PartnerDashboard');
      } else {
        throw new Error(updateResult.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Please provide your business information to get started
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={styles.uploadContainer} 
          onPress={handleImagePick}
          disabled={uploading}
        >
          {logoUrl ? (
            <Image 
              source={{ uri: logoUrl }} 
              style={styles.logoCircle} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.uploadCircle}>
              {uploading ? (
                <ActivityIndicator size="small" color="#709775" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={scale(30)} color="#709775" />
                  <Text style={styles.uploadText}>Upload Logo</Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Business Name"
          placeholderTextColor="#666"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Contact Information"
          placeholderTextColor="#666"
          value={formData.contact}
          onChangeText={(value) => handleInputChange('contact', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Business Address"
          placeholderTextColor="#666"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
        />

        {/* Business Hours Input */}
        <TouchableOpacity 
          style={styles.businessHoursButton}
          onPress={openBusinessHoursModal}
        >
          <Ionicons name="time-outline" size={scale(20)} color="#709775" style={styles.businessHoursIcon} />
          <Text style={styles.businessHoursText}>
            {businessHours || 'Set Business Hours'}
          </Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#DDDDDD" />
          ) : (
            <Text style={styles.submitButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Business Hours Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={businessHoursModal}
        onRequestClose={() => setBusinessHoursModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.businessHoursModal]}>
            <Text style={styles.modalTitle}>Set Business Hours</Text>
            
            <View style={styles.timePickerContainer}>
              <TimePickerSection
                label="Open Time"
                hour={startHour}
                minute={startMinute}
                period={startPeriod}
                onHourChange={setStartHour}
                onMinuteChange={setStartMinute}
                onPeriodChange={setStartPeriod}
              />

              <TimePickerSection
                label="Close Time"
                hour={endHour}
                minute={endMinute}
                period={endPeriod}
                onHourChange={setEndHour}
                onMinuteChange={setEndMinute}
                onPeriodChange={setEndPeriod}
              />
            </View>

            <Text style={styles.selectedTimePreview}>
              {`${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setBusinessHoursModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleSaveBusinessHours}
              >
                <Text style={styles.modalSaveText}>Save Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#131313',
    paddingHorizontal: scale(20),
    paddingVertical: vScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: vScale(40),
  },
  title: {
    fontSize: scale(24),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(10),
  },
  subtitle: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  uploadContainer: {
    alignItems: 'center',
    marginBottom: vScale(30),
  },
  uploadCircle: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: '#1f1f1f',
    borderWidth: 2,
    borderColor: '#709775',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
  },
  uploadText: {
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(12),
    marginTop: vScale(5),
  },
  input: {
    backgroundColor: '#CBCBCB',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginBottom: vScale(15),
    fontSize: scale(11),
    paddingLeft: scale(20),
    width: '100%',
    color: '#000',
  },
  businessHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBCBCB',
    borderRadius: scale(30),
    height: vScale(50),
    marginBottom: vScale(15),
    paddingLeft: scale(20),
    paddingRight: scale(15),
    width: '100%',
  },
  businessHoursIcon: {
    marginRight: scale(10),
  },
  businessHoursText: {
    flex: 1,
    color: '#000',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(11),
  },
  submitButton: {
    backgroundColor: '#709775',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginTop: vScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    fontFamily: 'DMSans-Bold',
    color: '#DDDDDD',
    fontSize: scale(12),
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: scale(20),
    padding: scale(25),
    width: '100%',
    maxWidth: scale(400),
  },
  businessHoursModal: {
    maxWidth: scale(350),
  },
  modalTitle: {
    fontSize: scale(18),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(20),
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#415D43',
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
    marginRight: scale(10),
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#709775',
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
    marginLeft: scale(10),
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
  },
  // Time Picker Styles
  timePickerContainer: {
    marginBottom: vScale(20),
  },
  timeSection: {
    marginBottom: vScale(25),
  },
  timeSectionLabel: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
    marginBottom: vScale(15),
    textAlign: 'center',
  },
  timePickerCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: scale(15),
    padding: scale(20),
  },
  timeColumnCompact: {
    alignItems: 'center',
    marginHorizontal: scale(8),
  },
  timeArrow: {
    padding: scale(8),
  },
  timeDisplay: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(18),
    marginVertical: vScale(5),
    minWidth: scale(40),
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(18),
    marginHorizontal: scale(5),
  },
  selectedTimePreview: {
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
    textAlign: 'center',
    marginBottom: vScale(20),
    backgroundColor: '#2a2a2a',
    padding: scale(12),
    borderRadius: scale(10),
  },
});

export default PartnerProfileSetup;