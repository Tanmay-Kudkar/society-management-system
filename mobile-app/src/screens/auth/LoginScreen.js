import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/common';
import { Layout } from '../../constants';

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateEmail()) return;
    
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: 40,
      paddingBottom: 30,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginTop: 8,
    },
    content: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      marginTop: -20,
      paddingTop: 30,
      paddingHorizontal: Layout.spacing.lg,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: Layout.borderRadius.lg,
      padding: 4,
      marginBottom: Layout.spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: Layout.spacing.sm,
      alignItems: 'center',
      borderRadius: Layout.borderRadius.md,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    form: {
      marginBottom: Layout.spacing.lg,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: Layout.spacing.lg,
    },
    forgotPasswordText: {
      fontSize: Layout.fontSize.sm,
      color: theme.primary,
      fontWeight: '500',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Layout.spacing.lg,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: Layout.spacing.md,
      fontSize: Layout.fontSize.sm,
      color: theme.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Layout.spacing.lg,
    },
    footerText: {
      fontSize: Layout.fontSize.md,
      color: theme.textSecondary,
    },
    footerLink: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.primary,
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="home" size={50} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to continue to Society Management
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {/* Login Form */}
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                keyboardType="email-address"
                leftIcon="mail-outline"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                fullWidth
                gradient
              />
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Continue as Guest"
              variant="outline"
              fullWidth
              icon="person-outline"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Contact Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
