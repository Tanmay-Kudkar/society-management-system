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
import { Header, Card, Badge, Loading, EmptyState, ErrorState, Avatar } from '../../components/common';
import { FilteredListSkeleton } from '../../components/common/Skeleton';
import { Layout, VISITOR_STATUS } from '../../constants';
import { visitorAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const VisitorsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { isAdmin, isStaff, isSecurity } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchVisitors = async () => {
    try {
      setError(null);
      const response = await visitorAPI.getVisitors({ 
        status: filter !== 'all' ? filter : undefined 
      });
      setVisitors(response.data);
    } catch (err) {
      setError('Failed to load visitors');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVisitors();
  }, [filter]);

  const handleApprove = async (visitorId) => {
    try {
      await visitorAPI.approveVisitor(visitorId);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (visitorId) => {
    try {
      await visitorAPI.rejectVisitor(visitorId);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (visitorId) => {
    try {
      await visitorAPI.checkIn(visitorId);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async (visitorId) => {
    try {
      await visitorAPI.checkOut(visitorId);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [VISITOR_STATUS.PENDING]: { label: 'Pending', variant: 'warning' },
      [VISITOR_STATUS.APPROVED]: { label: 'Approved', variant: 'success' },
      [VISITOR_STATUS.CHECKED_IN]: { label: 'Inside', variant: 'info' },
      [VISITOR_STATUS.CHECKED_OUT]: { label: 'Left', variant: 'default' },
      [VISITOR_STATUS.REJECTED]: { label: 'Rejected', variant: 'error' },
    };
    return statusConfig[status] || { label: status, variant: 'default' };
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: VISITOR_STATUS.PENDING, label: 'Pending' },
    { key: VISITOR_STATUS.CHECKED_IN, label: 'Inside' },
    { key: VISITOR_STATUS.CHECKED_OUT, label: 'Left' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    filterContainer: {
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterButton: {
      paddingVertical: Layout.spacing.xs,
      paddingHorizontal: Layout.spacing.md,
      borderRadius: Layout.borderRadius.full,
      marginRight: Layout.spacing.sm,
      backgroundColor: theme.surface,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
    },
    filterText: {
      fontSize: Layout.fontSize.sm,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    filterTextActive: {
      color: theme.white,
    },
    listContent: {
      padding: Layout.spacing.lg,
    },
    visitorCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    visitorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    visitorInfo: {
      flex: 1,
      marginLeft: Layout.spacing.md,
    },
    visitorName: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
    },
    visitorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Layout.spacing.md,
    },
    metaText: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginLeft: 4,
    },
    visitorDetails: {
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      width: 80,
    },
    detailValue: {
      fontSize: Layout.fontSize.sm,
      color: theme.text,
      flex: 1,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: Layout.spacing.md,
      justifyContent: 'flex-end',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Layout.spacing.xs,
      paddingHorizontal: Layout.spacing.md,
      borderRadius: Layout.borderRadius.md,
      marginLeft: Layout.spacing.sm,
    },
    actionButtonText: {
      fontSize: Layout.fontSize.sm,
      fontWeight: '600',
      marginLeft: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  const renderVisitor = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <View style={styles.visitorCard}>
        <View style={styles.visitorHeader}>
          <Avatar name={item.name} size="md" />
          <View style={styles.visitorInfo}>
            <Text style={styles.visitorName}>{item.name}</Text>
            <View style={styles.visitorMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="home-outline" size={14} color={theme.textSecondary} />
                <Text style={styles.metaText}>Flat {item.flatNumber}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                <Text style={styles.metaText}>{formatDate(item.expectedAt)}</Text>
              </View>
            </View>
          </View>
          <Badge label={statusBadge.label} variant={statusBadge.variant} />
        </View>

        <View style={styles.visitorDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose:</Text>
            <Text style={styles.detailValue}>{item.purpose}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.phone}</Text>
          </View>
          {item.vehicleNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle:</Text>
              <Text style={styles.detailValue}>{item.vehicleNumber}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons based on status and role */}
        {(isSecurity || isAdmin) && (
          <View style={styles.actionButtons}>
            {item.status === VISITOR_STATUS.PENDING && (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                  onPress={() => handleReject(item.id)}
                >
                  <Ionicons name="close" size={18} color={theme.error} />
                  <Text style={[styles.actionButtonText, { color: theme.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
                  onPress={() => handleApprove(item.id)}
                >
                  <Ionicons name="checkmark" size={18} color={theme.success} />
                  <Text style={[styles.actionButtonText, { color: theme.success }]}>Approve</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === VISITOR_STATUS.APPROVED && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleCheckIn(item.id)}
              >
                <Ionicons name="enter-outline" size={18} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Check In</Text>
              </TouchableOpacity>
            )}
            {item.status === VISITOR_STATUS.CHECKED_IN && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.warning + '20' }]}
                onPress={() => handleCheckOut(item.id)}
              >
                <Ionicons name="exit-outline" size={18} color={theme.warning} />
                <Text style={[styles.actionButtonText, { color: theme.warning }]}>Check Out</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Visitors" showBack />
        <FilteredListSkeleton filterCount={3} cardCount={4} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Visitors" showBack />
        <ErrorState message={error} onRetry={fetchVisitors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Visitors" showBack />
      
      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={visitors}
        renderItem={renderVisitor}
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
            icon="people-outline"
            title="No Visitors"
            message="There are no visitor records to display."
            actionLabel="Add Visitor"
            onAction={() => navigation.navigate('AddVisitor')}
          />
        }
      />

      {/* FAB for adding new visitor */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddVisitor')}
      >
        <Ionicons name="person-add" size={24} color={theme.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default VisitorsScreen;
