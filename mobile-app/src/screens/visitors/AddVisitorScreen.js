import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Header, Input, Button } from '../../components/common';
import { Layout } from '../../constants';
import { visitorAPI } from '../../services/api';

const AddVisitorScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    vehicleNumber: '',
    expectedDate: '',
    expectedTime: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose of visit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await visitorAPI.createVisitor(formData);
      Alert.alert(
        'Success',
        'Visitor has been registered successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to register visitor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: Layout.spacing.lg,
    },
    sectionTitle: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Layout.spacing.md,
      marginTop: Layout.spacing.md,
    },
    helperText: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginBottom: Layout.spacing.lg,
    },
    submitButton: {
      marginTop: Layout.spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Add Visitor" showBack />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.helperText}>
            Pre-register a visitor to allow smooth entry at the gate.
          </Text>

          {/* Visitor Details */}
          <Text style={styles.sectionTitle}>Visitor Details</Text>
          
          <Input
            label="Visitor Name"
            placeholder="Enter visitor's full name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
            leftIcon="person-outline"
            required
          />

          <Input
            label="Phone Number"
            placeholder="Enter visitor's phone number"
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({ ...formData, phone: text });
              setErrors({ ...errors, phone: '' });
            }}
            error={errors.phone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            maxLength={10}
            required
          />

          <Input
            label="Purpose of Visit"
            placeholder="e.g., Delivery, Guest, Service"
            value={formData.purpose}
            onChangeText={(text) => {
              setFormData({ ...formData, purpose: text });
              setErrors({ ...errors, purpose: '' });
            }}
            error={errors.purpose}
            leftIcon="clipboard-outline"
            required
          />

          {/* Vehicle Details */}
          <Text style={styles.sectionTitle}>Vehicle Details (Optional)</Text>
          
          <Input
            label="Vehicle Number"
            placeholder="e.g., MH 01 AB 1234"
            value={formData.vehicleNumber}
            onChangeText={(text) => setFormData({ ...formData, vehicleNumber: text.toUpperCase() })}
            leftIcon="car-outline"
            autoCapitalize="characters"
          />

          {/* Additional Info */}
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <Input
            label="Notes"
            placeholder="Any additional notes for the security..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <Button
            title="Register Visitor"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            gradient
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddVisitorScreen;
