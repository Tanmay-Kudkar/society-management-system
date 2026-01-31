import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Card = ({
  children,
  title,
  subtitle,
  icon,
  iconColor,
  rightElement,
  onPress,
  variant = 'default', // default, elevated, outlined
  padding = 'md',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      sm: Layout.spacing.sm,
      md: Layout.spacing.md,
      lg: Layout.spacing.lg,
    };
    return paddingMap[padding] || Layout.spacing.md;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.card,
          shadowColor: theme.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
        };
      default:
        return {
          backgroundColor: theme.card,
        };
    }
  };

  const styles = StyleSheet.create({
    container: {
      borderRadius: Layout.borderRadius.lg,
      padding: getPaddingValue(),
      marginBottom: Layout.spacing.md,
      ...getVariantStyles(),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: children ? Layout.spacing.md : 0,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: Layout.borderRadius.md,
      backgroundColor: (iconColor || theme.primary) + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: Layout.fontSize.lg,
      fontWeight: '600',
      color: theme.text,
    },
    subtitle: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
  });

  const content = (
    <View style={[styles.container, style]} {...props}>
      {(title || icon || rightElement) && (
        <View style={styles.header}>
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={icon} 
                size={22} 
                color={iconColor || theme.primary} 
              />
            </View>
          )}
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightElement}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default Card;
