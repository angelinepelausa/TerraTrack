import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Modal,
  TextInput 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getPartnerData, updatePartnerProfile } from '../repositories/partnerRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';
import auth from '@react-native-firebase/auth';
import { scale, vScale } from '../utils/scaling';

const PartnerProfileScreen = ({ navigation }) => {
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [uploading, setUploading] = useState(false);

  const [businessHoursModal, setBusinessHoursModal] = useState(false);
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('06');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('PM');

  const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {

        navigation.replace('LoginScreen');
        return;
      }

      const partnerResult = await getPartnerData(user.uid);
      if (partnerResult.success) {
        setPartnerData(partnerResult.partner);

        if (partnerResult.partner.businessHours) {
          parseBusinessHours(partnerResult.partner.businessHours);
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseBusinessHours = (hoursString) => {
    const match = hoursString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      setStartHour(match[1].padStart(2, '0'));
      setStartMinute(match[2]);
      setStartPeriod(match[3].toUpperCase());
      setEndHour(match[4].padStart(2, '0'));
      setEndMinute(match[5]);
      setEndPeriod(match[6].toUpperCase());
    }
  };

  const openEditModal = (field, value) => {
    if (field === 'businessHours') {
      setBusinessHoursModal(true);
    } else {
      setEditingField(field);
      setEditValue(value || '');
      setModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      const updateData = { [editingField]: editValue.trim() };
      const updateResult = await updatePartnerProfile(user.uid, updateData);

      if (updateResult.success) {
        setPartnerData(prev => ({ ...prev, ...updateData }));
        setModalVisible(false);
        Alert.alert('Success', `${getFieldLabel(editingField)} updated successfully`);
      } else {
        throw new Error(updateResult.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update');
    }
  };

  const handleSaveBusinessHours = async () => {
    const businessHours = `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;
    
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      const updateResult = await updatePartnerProfile(user.uid, {
        businessHours: businessHours
      });

      if (updateResult.success) {
        setPartnerData(prev => ({ ...prev, businessHours }));
        setBusinessHoursModal(false);
        Alert.alert('Success', 'Business hours updated successfully');
      } else {
        throw new Error(updateResult.error || 'Failed to update business hours');
      }
    } catch (error) {
      console.error('Business hours update error:', error);
      Alert.alert('Error', error.message || 'Failed to update business hours');
    }
  };

  const getFieldLabel = (field) => {
    const labels = {
      name: 'Business Name',
      contact: 'Contact Details',
      address: 'Business Address',
      businessHours: 'Business Hours'
    };
    return labels[field] || field;
  };

  const getFieldValue = (field) => {
    return partnerData?.[field] || 'Not set';
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
        
        const user = auth().currentUser;
        if (!user) {
          Alert.alert('Error', 'No user logged in');
          return;
        }

        const updateResult = await updatePartnerProfile(user.uid, {
          logoUrl: imageUrl,
        });

        if (updateResult.success) {
          setPartnerData(prev => ({ ...prev, logoUrl: imageUrl }));
          Alert.alert('Success', 'Logo updated successfully');
        } else {
          throw new Error(updateResult.error || 'Failed to update logo');
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout: ' + error.message);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout }
      ]
    );
  };

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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick}>
          {partnerData?.logoUrl ? (
            <Image source={{ uri: partnerData.logoUrl }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="business" size={scale(30)} color="#709775" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.businessName}>
          {getFieldValue('name')}
        </Text>
        <Text style={styles.businessHoursHeader}>
          {getFieldValue('businessHours') || 'Business hours not set'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Profile</Text>
        
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => openEditModal('name', partnerData?.name)}
        >
          <Ionicons name="business-outline" size={scale(20)} color="#709775" />
          <Text style={styles.optionText}>Edit Business Name</Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => openEditModal('contact', partnerData?.contact)}
        >
          <Ionicons name="call-outline" size={scale(20)} color="#709775" />
          <Text style={styles.optionText}>Update Contact Details</Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => openEditModal('address', partnerData?.address)}
        >
          <Ionicons name="location-outline" size={scale(20)} color="#709775" />
          <Text style={styles.optionText}>Update Business Address</Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => openEditModal('businessHours', partnerData?.businessHours)}
        >
          <Ionicons name="time-outline" size={scale(20)} color="#709775" />
          <Text style={styles.optionText}>Manage Business Hours</Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={handleImagePick}
          disabled={uploading}
        >
          <Ionicons name="image-outline" size={scale(20)} color="#709775" />
          <Text style={styles.optionText}>
            {uploading ? 'Uploading Logo...' : 'Change Business Logo'}
          </Text>
          <Ionicons name="chevron-forward" size={scale(16)} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={scale(20)} color="#FF6B6B" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {getFieldLabel(editingField)}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={`Enter ${getFieldLabel(editingField).toLowerCase()}`}
              placeholderTextColor="#666"
              value={editValue}
              onChangeText={setEditValue}
              multiline={editingField === 'address'}
              numberOfLines={editingField === 'address' ? 3 : 1}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    flex: 1,
    backgroundColor: '#131313',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
  },
  header: {
    alignItems: 'center',
    padding: scale(20),
    paddingTop: vScale(50),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  logo: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    marginBottom: vScale(15),
  },
  logoPlaceholder: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vScale(15),
  },
  businessName: {
    fontSize: scale(20),
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(5),
    textAlign: 'center',
  },
  businessHoursHeader: {
    fontSize: scale(14),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  section: {
    padding: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: scale(18),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(15),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: scale(15),
    borderRadius: scale(12),
    marginBottom: vScale(10),
  },
  optionText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
    marginLeft: scale(10),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f',
    margin: scale(20),
    padding: scale(15),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
    marginLeft: scale(10),
  },
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
  modalInput: {
    backgroundColor: '#CBCBCB',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(10),
    padding: scale(15),
    fontSize: scale(14),
    color: '#000',
    marginBottom: vScale(20),
    textAlignVertical: 'top',
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

export default PartnerProfileScreen;