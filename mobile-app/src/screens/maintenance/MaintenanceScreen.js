import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Header, Card, Loading, EmptyState, Badge } from '../../components/common';
import { PaymentPageSkeleton } from '../../components/common/Skeleton';
import { Layout } from '../../constants';
import { maintenanceAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const MaintenanceScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending');

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'all', label: 'All Bills' },
  ];

  const fetchBills = async () => {
    try {
      setError(null);
      const response = await maintenanceAPI.getBills();
      setBills(response.data);
    } catch (err) {
      setError('Failed to load bills');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBills();
  }, []);

  const filteredBills = bills.filter(bill => {
    if (selectedTab === 'pending') return bill.status === 'PENDING' || bill.status === 'OVERDUE';
    if (selectedTab === 'paid') return bill.status === 'PAID';
    return true;
  });

  const totalPending = bills
    .filter(b => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'OVERDUE':
        return 'error';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const formatAmount = (amount) => {
    return '₹' + (amount || 0).toLocaleString('en-IN');
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
      marginHorizontal: Layout.spacing.lg,
      marginTop: Layout.spacing.lg,
    },
    summaryLabel: {
      fontSize: Layout.fontSize.sm,
      color: '#FFFFFF99',
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 4,
    },
    payButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: Layout.borderRadius.md,
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.lg,
      alignSelf: 'flex-start',
      marginTop: Layout.spacing.md,
    },
    payButtonText: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: '#6366F1',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
      gap: Layout.spacing.sm,
    },
    tab: {
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.md,
      borderRadius: Layout.borderRadius.full,
      backgroundColor: theme.card,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    billCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    billHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Layout.spacing.sm,
    },
    billMonth: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
    },
    billYear: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    billAmount: {
      fontSize: Layout.fontSize.xl,
      fontWeight: '700',
      color: theme.primary,
    },
    billDetails: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: Layout.spacing.sm,
      marginTop: Layout.spacing.sm,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    billLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    billValue: {
      fontSize: Layout.fontSize.sm,
      color: theme.text,
    },
    billFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dueDate: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewButtonText: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      fontWeight: '500',
      marginRight: 4,
    },
  });

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Maintenance Bills" showBack />
        <PaymentPageSkeleton tabCount={3} cardCount={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Maintenance Bills" showBack />
      
      {/* Summary Card */}
      {totalPending > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pending Amount</Text>
          <Text style={styles.summaryAmount}>{formatAmount(totalPending)}</Text>
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Bills List */}
      <FlatList
        data={filteredBills}
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
        renderItem={({ item }) => (
          <View style={styles.billCard}>
            <View style={styles.billHeader}>
              <View>
                <Text style={styles.billMonth}>{item.month} {item.year}</Text>
                <Text style={styles.billYear}>Maintenance Bill</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.billAmount}>{formatAmount(item.amount)}</Text>
                <Badge 
                  label={item.status} 
                  variant={getStatusVariant(item.status)}
                  size="sm"
                />
              </View>
            </View>
            
            <View style={styles.billDetails}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Maintenance Charges</Text>
                <Text style={styles.billValue}>{formatAmount(item.maintenanceAmount)}</Text>
              </View>
              {item.waterCharges > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Water Charges</Text>
                  <Text style={styles.billValue}>{formatAmount(item.waterCharges)}</Text>
                </View>
              )}
              {item.parkingCharges > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Parking Charges</Text>
                  <Text style={styles.billValue}>{formatAmount(item.parkingCharges)}</Text>
                </View>
              )}
              {item.otherCharges > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Other Charges</Text>
                  <Text style={styles.billValue}>{formatAmount(item.otherCharges)}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.billFooter}>
              <Text style={styles.dueDate}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </Text>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('BillDetail', { bill: item })}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Bills"
            message={selectedTab === 'pending' 
              ? "You have no pending bills." 
              : "No bills found."}
          />
        }
      />
    </SafeAreaView>
  );
};

export default MaintenanceScreen;
