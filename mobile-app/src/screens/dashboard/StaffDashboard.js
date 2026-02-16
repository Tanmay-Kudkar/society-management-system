import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, Avatar, Badge, ErrorState } from '../../components/common';
import { StaffDashboardSkeleton } from '../../components/common/Skeleton';
import { Layout } from '../../constants';
import { reportAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const StaffDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    pendingVisitors: [],
    activeVisitors: [],
    pendingTasks: 0,
    completedToday: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await reportAPI.getDashboard(user?.societyId);
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const quickActions = [
    { icon: 'chatbubbles-outline', label: 'Complaints', screen: 'Complaints', color: theme.warning },
    { icon: 'call-outline', label: 'Emergency', screen: 'EmergencyContacts', color: theme.error },
    { icon: 'megaphone-outline', label: 'Notices', screen: 'Notices', color: theme.primary },
    { icon: 'car-outline', label: 'Vehicles', screen: 'Vehicles', color: theme.info },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
      backgroundColor: theme.primary,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    greeting: {
      marginLeft: Layout.spacing.md,
    },
    greetingText: {
      fontSize: Layout.fontSize.sm,
      color: 'rgba(255,255,255,0.8)',
    },
    userName: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.white,
    },
    roleLabel: {
      fontSize: Layout.fontSize.xs,
      color: 'rgba(255,255,255,0.9)',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Layout.spacing.sm,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.white,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
      marginTop: Layout.spacing.md,
    },
    sectionTitle: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
    },
    seeAll: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: -4,
      marginBottom: Layout.spacing.md,
    },
    statCard: {
      flex: 1,
      margin: 4,
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      alignItems: 'center',
    },
    statValue: {
      fontSize: Layout.fontSize.xxxl,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    quickAction: {
      width: '50%',
      padding: 4,
    },
    quickActionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Layout.spacing.md,
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.sm,
    },
    quickActionLabel: {
      fontSize: Layout.fontSize.sm,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
    },
    visitorCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
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
    visitorDetails: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    visitorActions: {
      flexDirection: 'row',
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return <StaffDashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.name} size="md" />
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Staff'}</Text>
            <Text style={styles.roleLabel}>
              {user?.role || 'Staff'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.white} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.warning }]}>
              {dashboardData.pendingTasks}
            </Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {dashboardData.completedToday}
            </Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={styles.quickActionInner}>
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security specific - Pending Visitors */}
        {isSecurity && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Visitors')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {dashboardData.pendingVisitors?.length > 0 ? (
              dashboardData.pendingVisitors.slice(0, 3).map((visitor, index) => (
                <View key={index} style={styles.visitorCard}>
                  <Avatar name={visitor.name} size="md" />
                  <View style={styles.visitorInfo}>
                    <Text style={styles.visitorName}>{visitor.name}</Text>
                    <Text style={styles.visitorDetails}>
                      Visiting: Flat {visitor.flatNumber}
                    </Text>
                  </View>
                  <View style={styles.visitorActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
                    >
                      <Ionicons name="checkmark" size={20} color={theme.success} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                    >
                      <Ionicons name="close" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Card variant="elevated">
                <View style={{ alignItems: 'center', paddingVertical: Layout.spacing.lg }}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={theme.success} />
                  <Text style={{ 
                    color: theme.textSecondary, 
                    marginTop: Layout.spacing.sm,
                    fontSize: Layout.fontSize.md,
                  }}>
                    No pending approvals
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}

        {/* Active Visitors */}
        {isSecurity && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Currently Inside</Text>
              <Badge label={`${dashboardData.activeVisitors?.length || 0} visitors`} variant="info" />
            </View>
            
            {dashboardData.activeVisitors?.length > 0 ? (
              dashboardData.activeVisitors.slice(0, 3).map((visitor, index) => (
                <View key={index} style={styles.visitorCard}>
                  <Avatar name={visitor.name} size="md" />
                  <View style={styles.visitorInfo}>
                    <Text style={styles.visitorName}>{visitor.name}</Text>
                    <Text style={styles.visitorDetails}>
                      Flat {visitor.flatNumber} • In since {visitor.checkInTime}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                  >
                    <Ionicons name="exit-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Card variant="elevated">
                <View style={{ alignItems: 'center', paddingVertical: Layout.spacing.lg }}>
                  <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
                  <Text style={{ 
                    color: theme.textSecondary, 
                    marginTop: Layout.spacing.sm,
                    fontSize: Layout.fontSize.md,
                  }}>
                    No active visitors
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StaffDashboard;
