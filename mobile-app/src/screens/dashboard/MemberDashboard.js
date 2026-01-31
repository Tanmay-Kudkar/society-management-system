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
import { Card, Avatar, Badge, Loading, ErrorState } from '../../components/common';
import { Layout } from '../../constants';
import { dashboardAPI, maintenanceAPI } from '../../services/api';

const MemberDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    flatInfo: null,
    pendingDues: 0,
    openComplaints: 0,
    upcomingVisitors: 0,
    recentNotices: [],
  });

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getMemberDashboard();
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
    { icon: 'add-circle-outline', label: 'New Complaint', screen: 'CreateComplaint', color: theme.primary },
    { icon: 'person-add-outline', label: 'Add Visitor', screen: 'AddVisitor', color: theme.secondary },
    { icon: 'card-outline', label: 'Pay Dues', screen: 'PaymentHistory', color: theme.success },
    { icon: 'document-text-outline', label: 'Notices', screen: 'Notices', color: theme.warning },
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
    flatInfo: {
      fontSize: Layout.fontSize.xs,
      color: theme.primary,
      marginTop: 2,
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
    dueCard: {
      backgroundColor: theme.error + '15',
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
    },
    dueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    dueLabel: {
      fontSize: Layout.fontSize.md,
      color: theme.error,
      fontWeight: '500',
    },
    dueAmount: {
      fontSize: Layout.fontSize.xxxl,
      fontWeight: '700',
      color: theme.error,
    },
    payButton: {
      backgroundColor: theme.error,
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.lg,
      borderRadius: Layout.borderRadius.md,
      marginTop: Layout.spacing.md,
      alignItems: 'center',
    },
    payButtonText: {
      color: theme.white,
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
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
    statusCards: {
      flexDirection: 'row',
      marginHorizontal: -4,
    },
    statusCard: {
      flex: 1,
      margin: 4,
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      alignItems: 'center',
    },
    statusValue: {
      fontSize: Layout.fontSize.xxl,
      fontWeight: '700',
      color: theme.text,
    },
    statusLabel: {
      fontSize: Layout.fontSize.xs,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    noticeCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    noticeTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    noticeDate: {
      fontSize: Layout.fontSize.xs,
      color: theme.textSecondary,
    },
  });

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.name} size="md" />
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Member'}</Text>
            {dashboardData.flatInfo && (
              <Text style={styles.flatInfo}>
                Flat {dashboardData.flatInfo.number} | {dashboardData.flatInfo.building}
              </Text>
            )}
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
        {/* Pending Dues Alert */}
        {dashboardData.pendingDues > 0 && (
          <View style={styles.dueCard}>
            <View style={styles.dueHeader}>
              <Text style={styles.dueLabel}>Pending Dues</Text>
              <Ionicons name="alert-circle" size={24} color={theme.error} />
            </View>
            <Text style={styles.dueAmount}>₹{dashboardData.pendingDues.toLocaleString()}</Text>
            <TouchableOpacity 
              style={styles.payButton}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Status Cards */}
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusCards}>
          <TouchableOpacity 
            style={styles.statusCard}
            onPress={() => navigation.navigate('Complaints')}
          >
            <Ionicons name="chatbubbles-outline" size={28} color={theme.warning} />
            <Text style={styles.statusValue}>{dashboardData.openComplaints}</Text>
            <Text style={styles.statusLabel}>Open Complaints</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statusCard}
            onPress={() => navigation.navigate('Visitors')}
          >
            <Ionicons name="people-outline" size={28} color={theme.secondary} />
            <Text style={styles.statusValue}>{dashboardData.upcomingVisitors}</Text>
            <Text style={styles.statusLabel}>Upcoming Visitors</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Notices */}
        <Text style={styles.sectionTitle}>Recent Notices</Text>
        {dashboardData.recentNotices?.length > 0 ? (
          dashboardData.recentNotices.map((notice, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.noticeCard}
              onPress={() => navigation.navigate('NoticeDetail', { notice })}
            >
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeDate}>{notice.date}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Card variant="elevated">
            <View style={{ alignItems: 'center', paddingVertical: Layout.spacing.lg }}>
              <Ionicons name="document-text-outline" size={48} color={theme.textTertiary} />
              <Text style={{ 
                color: theme.textSecondary, 
                marginTop: Layout.spacing.sm,
                fontSize: Layout.fontSize.md,
              }}>
                No recent notices
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberDashboard;
