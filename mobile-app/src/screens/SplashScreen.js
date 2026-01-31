import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // Icon fade in and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Wait before finishing
      Animated.delay(1000),
    ]).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="home" size={80} color={Colors.white} />
        </Animated.View>
        
        <Animated.View style={{ opacity: textFadeAnim }}>
          <Text style={styles.title}>Society Management</Text>
          <Text style={styles.subtitle}>Manage your community with ease</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: textFadeAnim }]}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default SplashScreen;
