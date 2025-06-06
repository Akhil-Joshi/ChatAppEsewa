import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyRegistrationOTP, resendOTP } from '../../helpers/postAPIs';

const { width, height } = Dimensions.get('window');

export default function OTPVerification({ navigation, route }) {
  // Get email from previous screen or use default
  const email = route?.params?.email || 'user@example.com';

  // const [formData, setFormData] = useState({

  //   otp_code: '',

  // });

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Refs for OTP inputs
  const inputRefs = useRef([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus first input
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 500);
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0 && !canResend) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev === 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, canResend]);

  const handleOtpChange = (value, index) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      shakeAnimation();
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsVerifying(true);

    try {
      const payload = {
        email: email,
        otp_code: otpCode,
      };
      await verifyRegistrationOTP(payload);
      setIsVerifying(false);
      navigation.navigate('Login', { email: payload.email })
    } catch (error) {

    }


  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // const handleResendOtp = () => {
  //   if (!canResend) return;

  //   setIsLoading(true);

  //   // Simulate API call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     setCanResend(false);
  //     setResendTimer(60);
  //     Alert.alert('OTP Sent', 'A new OTP has been sent to your email address.');
  //   }, 1500);
  // };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const payload = {
        email: email,
        purpose: 'registration',
      }
      await resendOTP(payload)
      setIsLoading(false)
      setCanResend(false)
      setResendTimer(60)
    } catch (error) {
      setIsLoading(false);
      // Handle error
      console.log(error, "Error occurred");
      Alert.alert('Error', 'Something went wrong. Please try again later!');
    }

  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
      ? username.slice(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#5D50FE']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Floating Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <Animated.View style={[styles.floatingCircle, styles.circle1, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle2, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle3, { opacity: fadeAnim }]} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail-outline" size={60} color="#fff" />
                </View>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={styles.emailText}>{maskEmail(email)}</Text>
                </Text>
              </View>
            </Animated.View>

            {/* OTP Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formSlideAnim }]
                }
              ]}
            >
              <View style={styles.formCard}>
                <Text style={styles.otpLabel}>Enter Verification Code</Text>

                {/* OTP Input Fields */}
                <Animated.View
                  style={[
                    styles.otpContainer,
                    { transform: [{ translateX: shakeAnim }] }
                  ]}
                >
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                        isVerifying && styles.otpInputDisabled
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      editable={!isVerifying}
                    />
                  ))}
                </Animated.View>

                {/* Verify Button */}
                <Animated.View style={[{ transform: [{ scale: buttonScaleAnim }] }]}>
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      (isVerifying || otp.join('').length !== 6) && styles.verifyButtonDisabled
                    ]}
                    onPress={() => handleVerifyOtp()}
                    disabled={isVerifying || otp.join('').length !== 6}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isVerifying || otp.join('').length !== 6
                          ? ['#ccc', '#999']
                          : ['#ffffff', '#f8f9ff']
                      }
                      style={styles.verifyGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isVerifying ? (
                        <View style={styles.loadingContainer}>
                          <View style={styles.loadingSpinner} />
                          <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.verifyText}>Verify Code</Text>
                          <Ionicons name="checkmark-circle" size={20} color="#5D50FE" style={styles.buttonIcon} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendPrompt}>Didn't receive the code?</Text>

                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={isLoading}
                      style={styles.resendButton}
                    >
                      <Text style={[styles.resendText, isLoading && styles.resendTextDisabled]}>
                        {isLoading ? 'Sending...' : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.timerContainer}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.timerText}>
                        Resend in {formatTime(resendTimer)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Help Text */}
                <View style={styles.helpContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#666" />
                  <Text style={styles.helpText}>
                    Check your spam folder if you don't see the email
                  </Text>
                </View>
              </View>

              {/* Change Email Link */}
              <View style={styles.changeEmailContainer}>
                <Text style={styles.changeEmailPrompt}>Wrong email address? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.changeEmailLink}>Change Email</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: height * 0.12,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: height * 0.35,
    left: -10,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: height * 0.25,
    right: 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
  },
  header: {
    paddingTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  otpLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#5D50FE',
    backgroundColor: '#fff',
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  verifyButton: {
    marginBottom: 25,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#5D50FE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  verifyText: {
    color: '#5D50FE',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5D50FE',
    borderTopColor: 'transparent',
    marginRight: 10,
  },
  loadingText: {
    color: '#5D50FE',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendPrompt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    color: '#5D50FE',
    fontSize: 16,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5D50FE',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  changeEmailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  changeEmailPrompt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  changeEmailLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});