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
import { Header, Card, Badge, Loading, EmptyState, ErrorState } from '../../components/common';
import { Layout } from '../../constants';
import { noticeAPI } from '../../services/api';

const NoticesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('all'); // all, important, general

  const fetchNotices = async () => {
    try {
      setError(null);
      const response = await noticeAPI.getNotices({ type: filter !== 'all' ? filter : undefined });
      setNotices(response.data);
    } catch (err) {
      setError('Failed to load notices');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotices();
  }, [filter]);

  const getNoticeIcon = (type) => {
    switch (type) {
      case 'important':
        return { name: 'warning-outline', color: theme.error };
      case 'event':
        return { name: 'calendar-outline', color: theme.secondary };
      case 'maintenance':
        return { name: 'construct-outline', color: theme.warning };
      default:
        return { name: 'megaphone-outline', color: theme.primary };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'important', label: 'Important' },
    { key: 'general', label: 'General' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
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
    noticeCard: {
      backgroundColor: theme.card,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    noticeHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    noticeIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    noticeContent: {
      flex: 1,
    },
    noticeTitle: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    noticeDescription: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    noticeFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    noticeDate: {
      fontSize: Layout.fontSize.xs,
      color: theme.textTertiary,
    },
    readMore: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      fontWeight: '500',
    },
  });

  const renderNotice = ({ item }) => {
    const icon = getNoticeIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={styles.noticeCard}
        onPress={() => navigation.navigate('NoticeDetail', { notice: item })}
        activeOpacity={0.7}
      >
        <View style={styles.noticeHeader}>
          <View style={[styles.noticeIconContainer, { backgroundColor: icon.color + '15' }]}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.noticeContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.noticeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.type === 'important' && (
                <Badge label="Important" variant="error" size="sm" style={{ marginLeft: 8 }} />
              )}
            </View>
            <Text style={styles.noticeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.noticeFooter}>
          <Text style={styles.noticeDate}>
            <Ionicons name="time-outline" size={12} color={theme.textTertiary} />
            {' '}{formatDate(item.createdAt)}
          </Text>
          <Text style={styles.readMore}>Read more →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Notices & Announcements" showBack />
        <Loading fullScreen text="Loading notices..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Notices & Announcements" showBack />
        <ErrorState message={error} onRetry={fetchNotices} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Notices & Announcements" showBack />
      
      {/* Filters */}
      <View style={styles.filterContainer}>
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

      <FlatList
        data={notices}
        renderItem={renderNotice}
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
            icon="megaphone-outline"
            title="No Notices"
            message="There are no notices or announcements at the moment."
          />
        }
      />
    </SafeAreaView>
  );
};

export default NoticesScreen;
