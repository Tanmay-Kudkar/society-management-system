import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Header, Card, Loading, EmptyState, ErrorState, Badge, Avatar } from '../../components/common';
import { Layout } from '../../constants';
import { vehicleAPI } from '../../services/api';

const VehiclesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicles = async () => {
    try {
      setError(null);
      const response = await vehicleAPI.getByUser(user.id);
      setVehicles(response.data);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, []);

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return 'car-sport';
      case 'motorcycle':
      case 'bike':
        return 'bicycle';
      case 'scooter':
        return 'bicycle';
      case 'truck':
        return 'bus';
      default:
        return 'car';
    }
  };

  const getVehicleColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return '#3B82F6';
      case 'motorcycle':
      case 'bike':
        return '#F59E0B';
      case 'scooter':
        return '#10B981';
      default:
        return theme.primary;
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
    summaryCard: {
      backgroundColor: theme.primary,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.lg,
    },
    summaryTitle: {
      fontSize: Layout.fontSize.md,
      color: '#FFFFFF99',
      marginBottom: Layout.spacing.sm,
    },
    summaryCount: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    summaryRow: {
      flexDirection: 'row',
      marginTop: Layout.spacing.md,
    },
    summaryItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItemText: {
      fontSize: Layout.fontSize.sm,
      color: '#FFFFFF99',
      marginLeft: 6,
    },
    vehicleCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleIcon: {
      width: 56,
      height: 56,
      borderRadius: Layout.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleNumber: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 1,
    },
    vehicleModel: {
      fontSize: Layout.fontSize.md,
      color: theme.textSecondary,
      marginTop: 2,
    },
    vehicleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    vehicleType: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      textTransform: 'capitalize',
    },
    vehicleStatus: {
      marginLeft: Layout.spacing.sm,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    parkingSlot: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    parkingText: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="My Vehicles" showBack />
        <Loading fullScreen text="Loading vehicles..." />
      </SafeAreaView>
    );
  }

  const carCount = vehicles.filter(v => v.type?.toLowerCase() === 'car').length;
  const bikeCount = vehicles.filter(v => ['motorcycle', 'bike', 'scooter'].includes(v.type?.toLowerCase())).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="My Vehicles" showBack />
      
      <FlatList
        data={vehicles}
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Vehicles</Text>
            <Text style={styles.summaryCount}>{vehicles.length}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="car-sport" size={18} color="#FFFFFF99" />
                <Text style={styles.summaryItemText}>{carCount} Cars</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="bicycle" size={18} color="#FFFFFF99" />
                <Text style={styles.summaryItemText}>{bikeCount} Two-wheelers</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const iconColor = getVehicleColor(item.type);
          return (
            <View style={styles.vehicleCard}>
              <View style={[styles.vehicleIcon, { backgroundColor: iconColor + '15' }]}>
                <Ionicons name={getVehicleIcon(item.type)} size={28} color={iconColor} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleNumber}>{item.registrationNumber}</Text>
                <Text style={styles.vehicleModel}>{item.make} {item.model}</Text>
                <View style={styles.vehicleMeta}>
                  <Text style={styles.vehicleType}>{item.type}</Text>
                  {item.color && (
                    <>
                      <Text style={styles.vehicleType}> • </Text>
                      <Text style={styles.vehicleType}>{item.color}</Text>
                    </>
                  )}
                </View>
                {item.parkingSlot && (
                  <View style={styles.parkingSlot}>
                    <Ionicons name="location" size={14} color={theme.primary} />
                    <Text style={styles.parkingText}>Slot: {item.parkingSlot}</Text>
                  </View>
                )}
              </View>
              <Badge 
                text={item.isApproved ? 'Approved' : 'Pending'} 
                variant={item.isApproved ? 'success' : 'warning'}
                size="small"
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No Vehicles"
            message="You haven't registered any vehicles yet."
            action={{
              label: 'Add Vehicle',
              onPress: () => navigation.navigate('AddVehicle'),
            }}
          />
        }
      />
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddVehicle')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default VehiclesScreen;
