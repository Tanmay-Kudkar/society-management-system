import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const ListItem = ({
  title,
  subtitle,
  leftIcon,
  leftElement,
  rightIcon = 'chevron-forward',
  rightElement,
  showDivider = true,
  onPress,
  disabled = false,
  danger = false,
  style,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.md,
      backgroundColor: theme.card,
      opacity: disabled ? 0.5 : 1,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    leftContainer: {
      marginRight: Layout.spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: Layout.borderRadius.md,
      backgroundColor: danger ? theme.error + '15' : theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: Layout.fontSize.md,
      fontWeight: '500',
      color: danger ? theme.error : theme.text,
    },
    subtitle: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    rightContainer: {
      marginLeft: Layout.spacing.sm,
    },
  });

  const content = (
    <View style={[styles.container, showDivider && styles.divider, style]}>
      {(leftIcon || leftElement) && (
        <View style={styles.leftContainer}>
          {leftElement || (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={leftIcon} 
                size={22} 
                color={danger ? theme.error : theme.primary} 
              />
            </View>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {(rightIcon || rightElement) && (
        <View style={styles.rightContainer}>
          {rightElement || (
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={theme.textTertiary} 
            />
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default ListItem;
