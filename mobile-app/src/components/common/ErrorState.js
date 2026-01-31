import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const ErrorState = ({
  icon = 'alert-circle-outline',
  title = 'Something went wrong',
  message = 'An error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
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
      backgroundColor: theme.error + '15',
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
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.lg,
      borderRadius: Layout.borderRadius.md,
    },
    retryText: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.white,
      marginLeft: Layout.spacing.xs,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={theme.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color={theme.white} />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState;
