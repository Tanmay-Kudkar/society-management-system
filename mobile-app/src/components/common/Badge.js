import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Badge = ({
  label,
  variant = 'default', // default, primary, success, warning, error, info
  size = 'md', // sm, md, lg
  style,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: theme.border,
        textColor: theme.text,
      },
      primary: {
        backgroundColor: theme.primary + '20',
        textColor: theme.primary,
      },
      success: {
        backgroundColor: theme.success + '20',
        textColor: theme.success,
      },
      warning: {
        backgroundColor: theme.warning + '20',
        textColor: theme.warning,
      },
      error: {
        backgroundColor: theme.error + '20',
        textColor: theme.error,
      },
      info: {
        backgroundColor: theme.info + '20',
        textColor: theme.info,
      },
    };
    return variants[variant] || variants.default;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        fontSize: 10,
        borderRadius: 4,
      },
      md: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        fontSize: 12,
        borderRadius: 6,
      },
      lg: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        fontSize: 14,
        borderRadius: 8,
      },
    };
    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: variantStyles.backgroundColor,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: sizeStyles.fontSize,
      fontWeight: '600',
      color: variantStyles.textColor,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

export default Badge;
