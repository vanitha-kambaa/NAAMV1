import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, LandDetailsUpdateData } from '@/services/api';

interface LandDetailsUpdateFormProps {
  landId: number;
  onSuccess?: () => void;
}

export const LandDetailsUpdateForm: React.FC<LandDetailsUpdateFormProps> = ({
  landId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<LandDetailsUpdateData>({
    land_ownership_type: '',
    total_land_holding: '',
    irrigation_source: '',
    soil_type: '',
    irrigation_type: '',
    land_lattitude: '',
    land_longitude: '',
    village: '',
    taluk: '',
    district: '',
    state: '',
    pincode: '',
    patta_number: '',
    coconut_farm: '0',
    coconut_area: '',
    no_of_trees: '',
    trees_age: '',
    estimated_falling: '',
    last_harvest_date: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const success = await apiService.updateLandDetails(landId, formData, token);
      
      if (success) {
        Alert.alert('Success', 'Land details updated successfully');
        onSuccess?.();
      } else {
        Alert.alert('Error', 'Failed to update land details');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An error occurred while updating land details');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LandDetailsUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Land Details</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Land Ownership Type (e.g., owned, leased)"
          value={formData.land_ownership_type}
          onChangeText={(text) => updateField('land_ownership_type', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Total Land Holding (acres)"
          value={formData.total_land_holding}
          onChangeText={(text) => updateField('total_land_holding', text)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Irrigation Source (e.g., borewell, canal)"
          value={formData.irrigation_source}
          onChangeText={(text) => updateField('irrigation_source', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Soil Type (e.g., red, black, clay)"
          value={formData.soil_type}
          onChangeText={(text) => updateField('soil_type', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Irrigation Type (e.g., drip, sprinkler)"
          value={formData.irrigation_type}
          onChangeText={(text) => updateField('irrigation_type', text)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Village"
          value={formData.village}
          onChangeText={(text) => updateField('village', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Taluk"
          value={formData.taluk}
          onChangeText={(text) => updateField('taluk', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="District"
          value={formData.district}
          onChangeText={(text) => updateField('district', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="State"
          value={formData.state}
          onChangeText={(text) => updateField('state', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          value={formData.pincode}
          onChangeText={(text) => updateField('pincode', text)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Patta Number"
          value={formData.patta_number}
          onChangeText={(text) => updateField('patta_number', text)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coconut Farm Details</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Coconut Farm:</Text>
          <TouchableOpacity
            style={[styles.toggle, formData.coconut_farm === '1' && styles.toggleActive]}
            onPress={() => updateField('coconut_farm', formData.coconut_farm === '1' ? '0' : '1')}
          >
            <Text style={styles.toggleText}>
              {formData.coconut_farm === '1' ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {formData.coconut_farm === '1' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Coconut Area (acres)"
              value={formData.coconut_area}
              onChangeText={(text) => updateField('coconut_area', text)}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Number of Trees"
              value={formData.no_of_trees}
              onChangeText={(text) => updateField('no_of_trees', text)}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Trees Age (years)"
              value={formData.trees_age}
              onChangeText={(text) => updateField('trees_age', text)}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Estimated Yield (coconuts)"
              value={formData.estimated_falling}
              onChangeText={(text) => updateField('estimated_falling', text)}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Last Harvest Date (YYYY-MM-DD)"
              value={formData.last_harvest_date}
              onChangeText={(text) => updateField('last_harvest_date', text)}
            />
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Updating...' : 'Update Land Details'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#48bb78',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#2d3748',
    marginRight: 15,
  },
  toggle: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#48bb78',
  },
  toggleText: {
    color: '#2d3748',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#48bb78',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});