import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Header = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightElement,
  transparent = false,
  centerTitle = true,
  style,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: transparent ? 'transparent' : theme.card,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      minHeight: 56,
      borderBottomWidth: transparent ? 0 : 1,
      borderBottomColor: theme.divider,
    },
    leftContainer: {
      width: 40,
      alignItems: 'flex-start',
    },
    centerContainer: {
      flex: 1,
      alignItems: centerTitle ? 'center' : 'flex-start',
      marginHorizontal: Layout.spacing.sm,
    },
    rightContainer: {
      width: 40,
      alignItems: 'flex-end',
    },
    title: {
      fontSize: Layout.fontSize.xl,
      fontWeight: '600',
      color: theme.text,
    },
    subtitle: {
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
      marginTop: 2,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, style]}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {(showBack || leftIcon) && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={showBack ? handleBack : onLeftPress}
            >
              <Ionicons 
                name={showBack ? 'arrow-back' : leftIcon} 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.rightContainer}>
          {rightElement || (rightIcon && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onRightPress}
            >
              <Ionicons name={rightIcon} size={24} color={theme.text} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;
