import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const Loading = ({ 
  size = 'large', 
  color, 
  text = 'Loading...', 
  fullScreen = false,
  overlay = false,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Layout.spacing.lg,
    },
    fullScreen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    text: {
      marginTop: Layout.spacing.md,
      fontSize: Layout.fontSize.md,
      color: overlay ? theme.white : theme.textSecondary,
    },
  });

  const containerStyle = fullScreen 
    ? [styles.container, styles.fullScreen]
    : overlay 
      ? styles.overlay 
      : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={size} 
        color={color || theme.primary} 
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

export default Loading;
