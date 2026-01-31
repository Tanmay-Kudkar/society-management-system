import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';
import Button from './Button';

const EmptyState = ({
  icon = 'folder-open-outline',
  title = 'No Data Found',
  message = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Layout.spacing.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.lg,
    },
    title: {
      fontSize: Layout.fontSize.xl,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Layout.fontSize.md,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={theme.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button 
          title={actionLabel} 
          onPress={onAction}
          variant="primary"
        />
      )}
    </View>
  );
};

export default EmptyState;
