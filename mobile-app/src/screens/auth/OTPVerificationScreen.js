import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Header } from '../../components/common';
import { Layout } from '../../constants';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;

const OTPVerificationScreen = ({ route, navigation }) => {
  const { phone } = route.params;
  const { theme } = useTheme();
  const { verifyOTP, sendOTP, isLoading } = useAuth();
  
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit) && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpValue = otp.join('')) => {
    if (otpValue.length !== OTP_LENGTH) {
      Alert.alert('Invalid OTP', 'Please enter the complete OTP');
      return;
    }

    const result = await verifyOTP(phone, otpValue);
    if (!result.success) {
      Alert.alert('Verification Failed', result.error);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    const result = await sendOTP(phone);
    if (result.success) {
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
      setCanResend(false);
      setResendTimer(RESEND_TIMEOUT);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const maskedPhone = phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      paddingTop: Layout.spacing.xxl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Layout.spacing.lg,
    },
    title: {
      fontSize: Layout.fontSize.xxl,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    subtitle: {
      fontSize: Layout.fontSize.md,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.xl,
    },
    phone: {
      fontWeight: '600',
      color: theme.text,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: Layout.spacing.xl,
    },
    otpInput: {
      width: 48,
      height: 56,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: Layout.borderRadius.md,
      marginHorizontal: 6,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
      backgroundColor: theme.surface,
    },
    otpInputFilled: {
      borderColor: theme.primary,
    },
    resendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Layout.spacing.lg,
    },
    resendText: {
      fontSize: Layout.fontSize.md,
      color: theme.textSecondary,
    },
    resendButton: {
      marginLeft: 4,
    },
    resendButtonText: {
      fontSize: Layout.fontSize.md,
      fontWeight: '600',
      color: theme.primary,
    },
    resendDisabled: {
      color: theme.disabled,
    },
    buttonContainer: {
      width: '100%',
      marginTop: Layout.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Verify OTP" showBack />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={40} color={theme.primary} />
          </View>
          
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{'\n'}
            <Text style={styles.phone}>{maskedPhone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Verify"
              onPress={() => handleVerify()}
              loading={isLoading}
              fullWidth
              gradient
              disabled={otp.some(d => !d)}
            />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResend}
              disabled={!canResend}
            >
              <Text style={[
                styles.resendButtonText,
                !canResend && styles.resendDisabled,
              ]}>
                {canResend ? 'Resend' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;
