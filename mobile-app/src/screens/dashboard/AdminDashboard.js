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
import { AdminDashboardSkeleton } from '../../components/common/Skeleton';
import { Layout } from '../../constants';
import { reportAPI } from '../../services/api';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';

const AdminDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalFlats: 0,
    totalMembers: 0,
    pendingComplaints: 0,
    pendingPayments: 0,
    todayVisitors: 0,
    totalVehicles: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await reportAPI.getDashboard(user?.societyId);
      setStats(response.data);
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
    { icon: 'megaphone-outline', label: 'Notices', screen: 'Notices', color: theme.primary },
    { icon: 'chatbubbles-outline', label: 'Complaints', screen: 'Complaints', color: theme.warning },
    { icon: 'people-outline', label: 'Visitors', screen: 'Visitors', color: theme.secondary },
    { icon: 'card-outline', label: 'Payments', screen: 'Payments', color: theme.info },
  ];

  const statCards = [
    { icon: 'home-outline', label: 'Total Flats', value: stats.totalFlats, color: theme.primary },
    { icon: 'people-outline', label: 'Members', value: stats.totalMembers, color: theme.secondary },
    { icon: 'warning-outline', label: 'Pending Complaints', value: stats.pendingComplaints, color: theme.warning },
    { icon: 'cash-outline', label: 'Pending Payments', value: stats.pendingPayments, color: theme.error },
    { icon: 'walk-outline', label: "Today's Visitors", value: stats.todayVisitors, color: theme.info },
    { icon: 'car-outline', label: 'Vehicles', value: stats.totalVehicles, color: theme.accent },
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
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
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
      color: theme.textSecondary,
    },
    userName: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surface,
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
    sectionTitle: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Layout.spacing.md,
      marginTop: Layout.spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickAction: {
      flex: 1,
      alignItems: 'center',
      padding: Layout.spacing.md,
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      marginHorizontal: 4,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.sm,
    },
    quickActionLabel: {
      fontSize: Layout.fontSize.sm,
      fontWeight: '500',
      color: theme.text,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    statCard: {
      width: '50%',
      padding: 4,
    },
    statCardInner: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: Layout.fontSize.xxl,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
  });

  const showSkeleton = useMinLoadingTime(loading);

  if (showSkeleton) {
    return <AdminDashboardSkeleton />;
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
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
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
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistics */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity could go here */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card variant="elevated">
          <View style={{ alignItems: 'center', paddingVertical: Layout.spacing.lg }}>
            <Ionicons name="time-outline" size={48} color={theme.textTertiary} />
            <Text style={{ 
              color: theme.textSecondary, 
              marginTop: Layout.spacing.sm,
              fontSize: Layout.fontSize.md,
            }}>
              No recent activity
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;
