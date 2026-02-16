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
import { Header, Input, Button, Card } from '../../components/common';
import { Layout } from '../../constants';
import { complaintAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const CreateComplaintScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [errors, setErrors] = useState({});

  const categories = [
    { key: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
    { key: 'electrical', label: 'Electrical', icon: 'flash-outline' },
    { key: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
    { key: 'security', label: 'Security', icon: 'shield-outline' },
    { key: 'noise', label: 'Noise', icon: 'volume-high-outline' },
    { key: 'parking', label: 'Parking', icon: 'car-outline' },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description should be at least 20 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await complaintAPI.createComplaint(formData, user?.id);
      Alert.alert(
        'Success',
        'Your complaint has been submitted successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
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
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Layout.spacing.md,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginBottom: Layout.spacing.lg,
    },
    categoryItem: {
      width: '25%',
      padding: 4,
    },
    categoryButton: {
      alignItems: 'center',
      padding: Layout.spacing.md,
      borderRadius: Layout.borderRadius.md,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryButtonActive: {
      backgroundColor: theme.primary + '15',
      borderColor: theme.primary,
    },
    categoryIcon: {
      marginBottom: Layout.spacing.xs,
    },
    categoryLabel: {
      fontSize: Layout.fontSize.xs,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    categoryLabelActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    errorText: {
      fontSize: Layout.fontSize.sm,
      color: theme.error,
      marginTop: -Layout.spacing.sm,
      marginBottom: Layout.spacing.md,
    },
    submitButton: {
      marginTop: Layout.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Create Complaint" showBack />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selection */}
          <Text style={styles.sectionTitle}>Select Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <View key={category.key} style={styles.categoryItem}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    formData.category === category.key && styles.categoryButtonActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: category.key });
                    setErrors({ ...errors, category: '' });
                  }}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={24} 
                    color={formData.category === category.key ? theme.primary : theme.textSecondary}
                    style={styles.categoryIcon}
                  />
                  <Text style={[
                    styles.categoryLabel,
                    formData.category === category.key && styles.categoryLabelActive,
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

          {/* Title Input */}
          <Input
            label="Complaint Title"
            placeholder="Brief title for your complaint"
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              setErrors({ ...errors, title: '' });
            }}
            error={errors.title}
            maxLength={100}
          />

          {/* Description Input */}
          <Input
            label="Description"
            placeholder="Describe your complaint in detail..."
            value={formData.description}
            onChangeText={(text) => {
              setFormData({ ...formData, description: text });
              setErrors({ ...errors, description: '' });
            }}
            error={errors.description}
            multiline
            numberOfLines={5}
          />

          {/* Submit Button */}
          <Button
            title="Submit Complaint"
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

export default CreateComplaintScreen;
