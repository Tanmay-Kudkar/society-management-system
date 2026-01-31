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
import { Layout, COMPLAINT_STATUS } from '../../constants';
import { complaintAPI } from '../../services/api';

const ComplaintsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { isAdmin, isStaff } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchComplaints = async () => {
    try {
      setError(null);
      const response = await complaintAPI.getComplaints({ 
        status: filter !== 'all' ? filter : undefined 
      });
      setComplaints(response.data);
    } catch (err) {
      setError('Failed to load complaints');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, [filter]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      [COMPLAINT_STATUS.OPEN]: { label: 'Open', variant: 'warning' },
      [COMPLAINT_STATUS.IN_PROGRESS]: { label: 'In Progress', variant: 'info' },
      [COMPLAINT_STATUS.RESOLVED]: { label: 'Resolved', variant: 'success' },
      [COMPLAINT_STATUS.CLOSED]: { label: 'Closed', variant: 'default' },
    };
    return statusConfig[status] || { label: status, variant: 'default' };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      plumbing: 'water-outline',
      electrical: 'flash-outline',
      cleaning: 'sparkles-outline',
      security: 'shield-outline',
      noise: 'volume-high-outline',
      parking: 'car-outline',
      other: 'chatbubble-outline',
    };
    return icons[category] || 'chatbubble-outline';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: COMPLAINT_STATUS.OPEN, label: 'Open' },
    { key: COMPLAINT_STATUS.IN_PROGRESS, label: 'In Progress' },
    { key: COMPLAINT_STATUS.RESOLVED, label: 'Resolved' },
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
    complaintCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    complaintHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Layout.spacing.sm,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    complaintContent: {
      flex: 1,
    },
    complaintTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    complaintDescription: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    complaintMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Layout.spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Layout.spacing.md,
    },
    metaText: {
      fontSize: Layout.fontSize.xs,
      color: theme.textTertiary,
      marginLeft: 4,
    },
    complaintFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginLeft: Layout.spacing.sm,
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

  const renderComplaint = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.complaintCard}
        onPress={() => navigation.navigate('ComplaintDetail', { complaint: item })}
        activeOpacity={0.7}
      >
        <View style={styles.complaintHeader}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getCategoryIcon(item.category)} 
              size={24} 
              color={theme.primary} 
            />
          </View>
          <View style={styles.complaintContent}>
            <Text style={styles.complaintTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.complaintDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.complaintMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={12} color={theme.textTertiary} />
                <Text style={styles.metaText}>{item.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={theme.textTertiary} />
                <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.complaintFooter}>
          {(isAdmin || isStaff) && item.user && (
            <View style={styles.userInfo}>
              <Avatar name={item.user.name} size="xs" />
              <Text style={styles.userName}>{item.user.name}</Text>
            </View>
          )}
          <Badge label={statusBadge.label} variant={statusBadge.variant} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Complaints" showBack />
        <Loading fullScreen text="Loading complaints..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Complaints" showBack />
        <ErrorState message={error} onRetry={fetchComplaints} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Complaints" showBack />
      
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
        data={complaints}
        renderItem={renderComplaint}
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
            icon="chatbubbles-outline"
            title="No Complaints"
            message="There are no complaints to display."
            actionLabel="Create Complaint"
            onAction={() => navigation.navigate('CreateComplaint')}
          />
        }
      />

      {/* FAB for creating new complaint */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateComplaint')}
      >
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ComplaintsScreen;
