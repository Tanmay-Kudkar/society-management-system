import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Avatar = ({
  source,
  name,
  size = 'md', // xs, sm, md, lg, xl
  showBadge = false,
  badgeColor,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const fontSizeMap = {
    xs: 10,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 36,
  };

  const avatarSize = sizeMap[size] || sizeMap.md;
  const fontSize = fontSizeMap[size] || fontSizeMap.md;
  const badgeSize = avatarSize * 0.3;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const styles = StyleSheet.create({
    container: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontSize: fontSize,
      fontWeight: '600',
      color: theme.white,
    },
    badge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: badgeColor || theme.success,
      borderWidth: 2,
      borderColor: theme.card,
    },
  });

  const content = (
    <View style={[styles.container, style]}>
      {source ? (
        <Image source={source} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.initials}>{getInitials(name)}</Text>
        </View>
      )}
      {showBadge && <View style={styles.badge} />}
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

export default Avatar;
