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
import { Header, Card, Badge, Loading, EmptyState, ErrorState, Button } from '../../components/common';
import { PaymentPageSkeleton } from '../../components/common/Skeleton';
import { Layout, PAYMENT_STATUS } from '../../constants';
import { paymentAPI, maintenanceAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const PaymentHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState({ total: 0, items: [] });
  const [activeTab, setActiveTab] = useState('dues'); // 'dues' or 'history'

  const fetchData = async () => {
    try {
      setError(null);
      const pendingBills = await maintenanceAPI.getPendingBills();
      const pending = pendingBills.data || [];
      const totalDue = pending.reduce((sum, b) => sum + (b.amount || 0), 0);
      setDues({ total: totalDue, items: pending });
      setPayments(pending);
    } catch (err) {
      setError('Failed to load payment data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      [PAYMENT_STATUS.PENDING]: { label: 'Pending', variant: 'warning' },
      [PAYMENT_STATUS.PAID]: { label: 'Paid', variant: 'success' },
      [PAYMENT_STATUS.OVERDUE]: { label: 'Overdue', variant: 'error' },
      [PAYMENT_STATUS.PARTIAL]: { label: 'Partial', variant: 'info' },
    };
    return statusConfig[status] || { label: status, variant: 'default' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    summaryCard: {
      margin: Layout.spacing.lg,
      backgroundColor: theme.primary,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
    },
    summaryTitle: {
      fontSize: Layout.fontSize.sm,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.white,
    },
    summarySubtext: {
      fontSize: Layout.fontSize.sm,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 8,
    },
    payButton: {
      backgroundColor: theme.white,
      marginTop: Layout.spacing.md,
    },
    payButtonText: {
      color: theme.primary,
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
      backgroundColor: theme.surface,
      borderRadius: Layout.borderRadius.lg,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: Layout.spacing.sm,
      alignItems: 'center',
      borderRadius: Layout.borderRadius.md,
    },
    activeTab: {
      backgroundColor: theme.card,
    },
    tabText: {
      fontSize: Layout.fontSize.md,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    activeTabText: {
      color: theme.text,
    },
    listContent: {
      paddingHorizontal: Layout.spacing.lg,
      paddingBottom: Layout.spacing.lg,
    },
    dueCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    dueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Layout.spacing.sm,
    },
    dueTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    dueAmount: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '700',
      color: theme.error,
    },
    dueMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dueDate: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginLeft: 4,
    },
    dueActions: {
      flexDirection: 'row',
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    paymentCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '500',
      color: theme.text,
    },
    paymentDate: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    paymentAmount: {
      alignItems: 'flex-end',
    },
    paymentAmountText: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.success,
    },
    paymentMethod: {
      fontSize: Layout.fontSize.xs,
      color: theme.textSecondary,
      marginTop: 2,
    },
  });

  const renderDueItem = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <View style={styles.dueCard}>
        <View style={styles.dueHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dueTitle}>{item.title}</Text>
            <View style={styles.dueMeta}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.dueDate}>Due: {formatDate(item.dueDate)}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.dueAmount}>{formatCurrency(item.amount)}</Text>
            <Badge 
              label={statusBadge.label} 
              variant={statusBadge.variant} 
              size="sm" 
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
        <View style={styles.dueActions}>
          <Button
            title="View Details"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('BillDetail', { bill: item })}
            style={{ flex: 1 }}
          />
          <Button
            title="Pay Now"
            size="sm"
            onPress={() => navigation.navigate('Payment', { bill: item })}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    );
  };

  const renderPaymentItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.paymentCard}
        onPress={() => navigation.navigate('PaymentDetail', { payment: item })}
      >
        <View style={[styles.paymentIcon, { backgroundColor: theme.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{item.description}</Text>
          <Text style={styles.paymentDate}>{formatDate(item.paidAt)}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.paymentAmountText}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.paymentMethod}>{item.method}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Payments" showBack />
        <PaymentPageSkeleton tabCount={2} cardCount={4} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Payments" showBack />
        <ErrorState message={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Payments" showBack />
      
      {/* Summary Card */}
      {dues.total > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(dues.total)}</Text>
          <Text style={styles.summarySubtext}>
            {dues.items?.length || 0} pending payment(s)
          </Text>
          <Button
            title="Pay All Dues"
            style={styles.payButton}
            textStyle={styles.payButtonText}
            onPress={() => navigation.navigate('Payment', { payAll: true, amount: dues.total })}
          />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dues' && styles.activeTab]}
          onPress={() => setActiveTab('dues')}
        >
          <Text style={[styles.tabText, activeTab === 'dues' && styles.activeTabText]}>
            Pending Dues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Payment History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dues' ? (
        <FlatList
          data={dues.items}
          renderItem={renderDueItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title="No Pending Dues"
              message="You're all caught up! There are no pending payments."
            />
          }
        />
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Payment History"
              message="Your payment history will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default PaymentHistoryScreen;
