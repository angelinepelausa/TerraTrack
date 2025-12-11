import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { voucherRepository } from '../repositories/voucherRepository';

const AddPartnersVoucher = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingVoucher = route.params?.voucher;
  const onSaved = route.params?.onSaved;

  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [voucherData, setVoucherData] = useState({
    title: '',
    description: '',
    terraCoinCost: '',
    totalQuantity: '',
    voucherCode: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (existingVoucher && partners.length > 0) {
      // Auto-fill form with existing voucher data
      setVoucherData({
        title: existingVoucher.title || '',
        description: existingVoucher.description || '',
        terraCoinCost: existingVoucher.terraCoinCost?.toString() || '',
        totalQuantity: existingVoucher.totalQuantity?.toString() || '',
        voucherCode: existingVoucher.voucherCode || ''
      });
      
      // Find and set the partner
      const partner = partners.find(p => p.id === existingVoucher.partnerId);
      if (partner) {
        setSelectedPartner(partner);
      }
    }
  }, [existingVoucher, partners]); 

  const loadPartners = async () => {
    try {
      setLoading(true);
      const partnersList = await voucherRepository.getAllPartners();
      setPartners(partnersList);
      
      // If editing and we have partnerId, find the partner
      if (existingVoucher?.partnerId) {
        const partner = partnersList.find(p => p.id === existingVoucher.partnerId);
        if (partner) {
          setSelectedPartner(partner);
        }
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      Alert.alert('Error', 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoucher = async () => {
    if (!selectedPartner) {
      Alert.alert('Error', 'Please select a partner');
      return;
    }

    if (!voucherData.title.trim() || !voucherData.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!voucherData.terraCoinCost || voucherData.terraCoinCost <= 0) {
      Alert.alert('Error', 'Please enter a valid TerraCoin cost');
      return;
    }

    if (!voucherData.totalQuantity || voucherData.totalQuantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setSaving(true);
      
      const voucherPayload = {
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        title: voucherData.title.trim(),
        description: voucherData.description.trim(),
        terraCoinCost: parseInt(voucherData.terraCoinCost),
        totalQuantity: parseInt(voucherData.totalQuantity),
        voucherCode: voucherData.voucherCode
      };

      let result;
      if (existingVoucher) {
        // Update existing voucher
        result = await voucherRepository.updateVoucher(existingVoucher.id, voucherPayload);
      } else {
        // Create new voucher
        result = await voucherRepository.createVoucher(voucherPayload);
      }
      
      if (result.success) {
        Alert.alert(
          'Success', 
          existingVoucher ? 'Voucher updated successfully!' : 'Voucher created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                if (onSaved) onSaved();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      Alert.alert('Error', error.message || `Failed to ${existingVoucher ? 'update' : 'create'} voucher`);
    } finally {
      setSaving(false);
    }
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const resetForm = () => {
    setSelectedPartner(null);
    setVoucherData({
      title: '',
      description: '',
      terraCoinCost: '',
      totalQuantity: '',
      voucherCode: ''
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#709775" />
        <Text style={styles.loadingText}>Loading partners...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {existingVoucher ? 'Edit Voucher' : 'Create Voucher'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.label}>Select Partner</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          <Text style={styles.dropdownButtonText}>
            {selectedPartner ? selectedPartner.name : 'Select Partner'}
          </Text>
        </TouchableOpacity>
        
        {dropdownOpen && partners.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.option}
            onPress={() => { 
              setSelectedPartner(partner); 
              setDropdownOpen(false);
              if (!existingVoucher) {
                const generatedCode = voucherRepository.generateVoucherCode(partner.name);
                setVoucherData(prev => ({ ...prev, voucherCode: generatedCode }));
              }
            }}
          >
            <Text style={{ color: '#fff' }}>{partner.name}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Voucher Title</Text>
        <TextInput
          style={styles.input}
          value={voucherData.title}
          onChangeText={(text) => setVoucherData(prev => ({ ...prev, title: text }))}
          placeholder="e.g., P10 Off Purchase"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={voucherData.description}
          onChangeText={(text) => setVoucherData(prev => ({ ...prev, description: text }))}
          placeholder="Describe the voucher offer..."
          placeholderTextColor="#888"
          multiline
        />

        <Text style={styles.label}>TerraCoin Cost</Text>
        <TextInput
          style={styles.input}
          value={voucherData.terraCoinCost}
          onChangeText={(text) => setVoucherData(prev => ({ ...prev, terraCoinCost: text.replace(/[^0-9]/g, '') }))}
          placeholder="e.g., 100"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={voucherData.totalQuantity}
          onChangeText={(text) => setVoucherData(prev => ({ ...prev, totalQuantity: text.replace(/[^0-9]/g, '') }))}
          placeholder="e.g., 50"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Voucher Code</Text>
        <TextInput
          style={styles.input}
          value={voucherData.voucherCode}
          placeholder={existingVoucher ? "Voucher Code" : "Select partner to generate code"}
          placeholderTextColor="#888"
          editable={!existingVoucher} 
        />

        {!existingVoucher && (
          <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
            <Text style={styles.resetButtonText}>Reset Form</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.saveContainer}>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSaveVoucher} 
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : (existingVoucher ? 'Update Voucher' : 'Create Voucher')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#131313', 
    paddingTop: 40 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#709775',
    fontSize: 14,
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  backIcon: { 
    width: 40, 
    height: 40, 
    resizeMode: "contain", 
    tintColor: "#709775" 
  },
  headerText: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#709775" 
  },

  // Form Styles
  label: { 
    color: '#fff', 
    marginTop: 12, 
    marginBottom: 6, 
    fontWeight: '600', 
    paddingHorizontal: 16 
  },
  input: { 
    backgroundColor: '#1E1E1E', 
    color: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 14, 
    marginBottom: 10, 
    marginHorizontal: 16 
  },
  
  dropdownButton: { 
    backgroundColor: '#1E1E1E', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 6, 
    marginHorizontal: 16 
  },
  dropdownButtonText: { 
    color: '#fff' 
  },
  option: { 
    padding: 12, 
    backgroundColor: '#1E1E1E', 
    borderRadius: 12, 
    marginVertical: 2, 
    marginHorizontal: 16 
  },

  resetButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#709775',
  },
  resetButtonText: {
    color: '#709775',
    fontWeight: '600',
  },

  saveContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    backgroundColor: '#131313' 
  },
  submitButton: { 
    backgroundColor: '#415D43', 
    paddingVertical: 14, 
    borderRadius: 25, 
    alignItems: 'center' 
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});

export default AddPartnersVoucher;