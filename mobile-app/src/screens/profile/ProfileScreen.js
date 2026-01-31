import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Header, Card, Input, Button, Loading } from '../../components/common';
import { Layout } from '../../constants';
import { userAPI } from '../../services/api';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(formData);
      await updateUser(response.data);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: Layout.spacing.xl,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: Layout.spacing.md,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.card,
    },
    userName: {
      fontSize: Layout.fontSize.xxl,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    userRole: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      textTransform: 'capitalize',
    },
    flatInfo: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      marginTop: 4,
    },
    content: {
      flex: 1,
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
    },
    section: {
      marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Layout.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Layout.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    infoValue: {
      fontSize: Layout.fontSize.md,
      color: theme.text,
      fontWeight: '500',
      marginTop: 2,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.md,
      borderRadius: Layout.borderRadius.md,
      marginBottom: Layout.spacing.sm,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    menuLabel: {
      flex: 1,
      fontSize: Layout.fontSize.md,
      color: theme.text,
      fontWeight: '500',
    },
    logoutButton: {
      marginTop: Layout.spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: Layout.spacing.md,
    },
  });

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header 
          title="Edit Profile" 
          showBack 
          onBackPress={() => setIsEditing(false)}
        />
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            leftIcon="person-outline"
          />
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            leftIcon="mail-outline"
            keyboardType="email-address"
          />
          <Input
            label="Phone Number"
            placeholder="Enter your phone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />
          <Input
            label="Address"
            placeholder="Enter your address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            leftIcon="location-outline"
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setIsEditing(false)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { icon: 'car-outline', label: 'My Vehicles', screen: 'Vehicles', color: theme.primary },
    { icon: 'document-text-outline', label: 'My Documents', screen: 'Documents', color: theme.secondary },
    { icon: 'people-outline', label: 'Family Members', screen: 'FamilyMembers', color: theme.warning },
    { icon: 'lock-closed-outline', label: 'Change Password', screen: 'ChangePassword', color: theme.info },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Support', color: theme.accent },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header 
        title="Profile" 
        rightIcon="create-outline"
        onRightPress={() => setIsEditing(true)}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar name={user?.name} size="xl" />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={theme.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.role || 'Member'}</Text>
          {user?.flatNumber && (
            <Text style={styles.flatInfo}>
              Flat {user.flatNumber} | {user.building}
            </Text>
          )}
        </View>

        <View style={styles.content}>
          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Card>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{user?.address || 'Not provided'}</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Menu Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <Button
            title="Logout"
            variant="danger"
            icon="log-out-outline"
            onPress={handleLogout}
            fullWidth
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
