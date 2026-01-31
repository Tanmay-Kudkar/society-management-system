import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Header, EmptyState } from '../../components/common';
import { Layout } from '../../constants';

const NotificationsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      notice: { name: 'megaphone', color: theme.primary },
      complaint: { name: 'chatbubbles', color: theme.warning },
      payment: { name: 'card', color: theme.success },
      visitor: { name: 'person', color: theme.info },
      maintenance: { name: 'construct', color: theme.accent },
      default: { name: 'notifications', color: theme.primary },
    };
    return icons[type] || icons.default;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    markAllText: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      fontWeight: '500',
      marginLeft: 4,
    },
    listContent: {
      paddingVertical: Layout.spacing.sm,
    },
    notificationItem: {
      flexDirection: 'row',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    unread: {
      backgroundColor: theme.primary + '08',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      flex: 1,
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.text,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginLeft: 8,
    },
    body: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    time: {
      fontSize: Layout.fontSize.xs,
      color: theme.textTertiary,
      marginTop: 4,
    },
    deleteButton: {
      padding: Layout.spacing.sm,
      marginLeft: Layout.spacing.sm,
    },
  });

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.data?.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unread]}
        onPress={() => {
          markAsRead(item.id);
          // Navigate based on notification type
          if (item.data?.screen) {
            navigation.navigate(item.data.screen, item.data.params);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{formatTime(item.date)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => clearNotification(item.id)}
        >
          <Ionicons name="close" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Notifications" showBack />
      
      {notifications.length > 0 && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={18} color={theme.primary} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            message="You're all caught up! Check back later for updates."
          />
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
