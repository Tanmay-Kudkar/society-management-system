import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Header, Card, Loading, EmptyState, ErrorState } from '../../components/common';
import { EmergencyContactsSkeleton } from '../../components/common/Skeleton';
import { Layout } from '../../constants';
import { emergencyAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const EmergencyContactsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);

  // Default emergency contacts (always available)
  const defaultContacts = [
    { id: 'emergency', name: 'Emergency', number: '112', icon: 'alert-circle', color: '#EF4444' },
    { id: 'police', name: 'Police', number: '100', icon: 'shield', color: '#3B82F6' },
    { id: 'ambulance', name: 'Ambulance', number: '102', icon: 'medkit', color: '#10B981' },
    { id: 'fire', name: 'Fire', number: '101', icon: 'flame', color: '#F59E0B' },
  ];

  const fetchContacts = async () => {
    try {
      setError(null);
      const response = await emergencyAPI.getContacts();
      setContacts(response.data);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts();
  }, []);

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
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
    emergencyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginBottom: Layout.spacing.lg,
    },
    emergencyItem: {
      width: '50%',
      padding: 4,
    },
    emergencyButton: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      alignItems: 'center',
      borderWidth: 2,
    },
    emergencyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.sm,
    },
    emergencyName: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
    },
    emergencyNumber: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '700',
      marginTop: 4,
    },
    contactCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
    },
    contactRole: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    contactNumber: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      marginTop: 2,
    },
    callButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.success + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Emergency Contacts" showBack />
        <EmergencyContactsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Emergency Contacts" showBack />
      
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Quick Emergency Contacts */}
            <Text style={styles.sectionTitle}>Quick Emergency</Text>
            <View style={styles.emergencyGrid}>
              {defaultContacts.map((contact) => (
                <View key={contact.id} style={styles.emergencyItem}>
                  <TouchableOpacity
                    style={[styles.emergencyButton, { borderColor: contact.color + '30' }]}
                    onPress={() => handleCall(contact.number)}
                  >
                    <View style={[styles.emergencyIcon, { backgroundColor: contact.color + '20' }]}>
                      <Ionicons name={contact.icon} size={28} color={contact.color} />
                    </View>
                    <Text style={styles.emergencyName}>{contact.name}</Text>
                    <Text style={[styles.emergencyNumber, { color: contact.color }]}>
                      {contact.number}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Society Contacts Header */}
            <Text style={styles.sectionTitle}>Society Contacts</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="person-outline" size={24} color={theme.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactRole}>{item.role}</Text>
              <Text style={styles.contactNumber}>{item.phone}</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => handleCall(item.phone)}
            >
              <Ionicons name="call" size={22} color={theme.success} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Society Contacts"
            message="Society contacts will appear here."
          />
        }
      />
    </SafeAreaView>
  );
};

export default EmergencyContactsScreen;
