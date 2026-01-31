import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  gradient = false,
  style,
  textStyle,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: Layout.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    const sizeStyles = {
      sm: { height: 36, paddingHorizontal: 12 },
      md: { height: 48, paddingHorizontal: 20 },
      lg: { height: 56, paddingHorizontal: 28 },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: theme.primary,
      },
      secondary: {
        backgroundColor: theme.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: theme.error,
      },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && { width: '100%' },
      disabled && { opacity: 0.5 },
      style,
    ];
  };

  const getTextStyles = () => {
    const baseFontSize = {
      sm: Layout.fontSize.sm,
      md: Layout.fontSize.md,
      lg: Layout.fontSize.lg,
    };

    const variantTextStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: theme.primary },
      ghost: { color: theme.primary },
      danger: { color: '#FFFFFF' },
    };

    return [
      {
        fontSize: baseFontSize[size],
        fontWeight: '600',
      },
      variantTextStyles[variant],
      textStyle,
    ];
  };

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
              color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={getTextStyles()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
              color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </View>
  );

  if (gradient && (variant === 'primary' || variant === 'secondary')) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={variant === 'primary' 
            ? [theme.primary, theme.primaryDark] 
            : [theme.secondary, theme.secondaryDark]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={getButtonStyles()}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
