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
import { verifyResetPasswordOTP, resetPassword } from '../../helpers/postAPIs';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordOTP({ navigation, route }) {
  // Get email from previous screen
  const email = route?.params?.email || 'user@example.com';

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Password state
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Refs for OTP inputs
  const inputRefs = useRef([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const passwordFormAnim = useRef(new Animated.Value(0)).current;

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

      // Uncomment when API is ready
      await verifyResetPasswordOTP(payload);


    } catch (error) {
      console.error("Verify OTP error:", error);
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      setIsVerifying(false);
      shakeAnimation();
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

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const payload = {
        email: email,
        purpose: 'password_reset',
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

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePasswordForm = () => {
    const { newPassword, confirmPassword } = formData;

    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePasswordForm()) return;

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

    setIsLoading(true);

    try {
      const payload = {
        email: email,
        otp_code: otp.join(''),
        new_password: formData.newPassword,
        confirm_newPassword: formData.confirmPassword,
      };

      // Uncomment when API is ready
      await resetPassword(payload);


    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
      setIsLoading(false);
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

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '#ccc', width: '0%' };
    if (password.length < 4) return { text: 'Weak', color: '#ff4757', width: '25%' };
    if (password.length < 6) return { text: 'Fair', color: '#ffa502', width: '50%' };
    if (password.length < 8) return { text: 'Good', color: '#3742fa', width: '75%' };
    return { text: 'Strong', color: '#2ed573', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

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
                  <Ionicons
                    name={isOtpVerified ? "lock-open-outline" : "mail-outline"}
                    size={60}
                    color="#fff"
                  />
                </View>
                <Text style={styles.title}>
                  {isOtpVerified ? "Reset Password" : "Verify Your Email"}
                </Text>
                <Text style={styles.subtitle}>
                  {isOtpVerified
                    ? "Enter your new password below"
                    : `We've sent a 6-digit code to\n${maskEmail(email)}`
                  }
                </Text>
              </View>
            </Animated.View>

            {/* Form */}
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
                {!isOtpVerified ? (
                  // OTP Verification Section
                  <>
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

                    {/* Resend OTP */}
                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>Didn't receive the code? </Text>
                      {canResend ? (
                        <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                          <Text style={[styles.resendLink, isLoading && styles.resendLinkDisabled]}>
                            Resend Code
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.resendTimer}>
                          Resend in {formatTime(resendTimer)}
                        </Text>
                      )}
                    </View>
                  </>
                ) : (
                  // Password Reset Section
                  <Animated.View
                    style={[
                      {
                        opacity: passwordFormAnim, transform: [{
                          translateY: passwordFormAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <Text style={styles.passwordLabel}>Create New Password</Text>

                    {/* New Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={[
                        styles.inputWrapper,
                        focusedField === 'newPassword' && styles.inputWrapperFocused
                      ]}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={focusedField === 'newPassword' ? "#5D50FE" : "#999"}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter new password"
                          placeholderTextColor="#999"
                          value={formData.newPassword}
                          onChangeText={(value) => updateFormData('newPassword', value)}
                          onFocus={() => setFocusedField('newPassword')}
                          onBlur={() => setFocusedField('')}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#999"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Password Strength Indicator */}
                      {formData.newPassword.length > 0 && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthBar}>
                            <View
                              style={[
                                styles.strengthFill,
                                {
                                  width: passwordStrength.width,
                                  backgroundColor: passwordStrength.color
                                }
                              ]}
                            />
                          </View>
                          <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                            {passwordStrength.text}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={[
                        styles.inputWrapper,
                        focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                        formData.confirmPassword && formData.newPassword !== formData.confirmPassword && styles.inputWrapperError
                      ]}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={focusedField === 'confirmPassword' ? "#5D50FE" : "#999"}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Confirm new password"
                          placeholderTextColor="#999"
                          value={formData.confirmPassword}
                          onChangeText={(value) => updateFormData('confirmPassword', value)}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField('')}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#999"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Password Match Indicator */}
                      {formData.confirmPassword && (
                        <View style={styles.matchContainer}>
                          <Ionicons
                            name={formData.newPassword === formData.confirmPassword ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={formData.newPassword === formData.confirmPassword ? "#2ed573" : "#ff4757"}
                          />
                          <Text style={[
                            styles.matchText,
                            { color: formData.newPassword === formData.confirmPassword ? "#2ed573" : "#ff4757" }
                          ]}>
                            {formData.newPassword === formData.confirmPassword ? "Passwords match" : "Passwords don't match"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Reset Password Button */}
                    <Animated.View style={[{ transform: [{ scale: buttonScaleAnim }] }]}>
                      <TouchableOpacity
                        style={[
                          styles.resetButton,
                          (isLoading || !formData.newPassword || !formData.confirmPassword) && styles.resetButtonDisabled
                        ]}
                        onPress={handleResetPassword}
                        disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={
                            isLoading || !formData.newPassword || !formData.confirmPassword
                              ? ['#ccc', '#999']
                              : ['#ffffff', '#f8f9ff']
                          }
                          style={styles.resetGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          {isLoading ? (
                            <View style={styles.loadingContainer}>
                              <View style={styles.loadingSpinner} />
                              <Text style={styles.loadingText}>Resetting Password...</Text>
                            </View>
                          ) : (
                            <>
                              <Text style={styles.resetText}>Reset Password</Text>
                              <Ionicons name="key" size={20} color="#5D50FE" style={styles.buttonIcon} />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Password Requirements */}
                    {/* <View style={styles.requirementsContainer}>
                      <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={formData.newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={formData.newPassword.length >= 6 ? "#2ed573" : "#ccc"} 
                        />
                        <Text style={[styles.requirementText, formData.newPassword.length >= 6 && styles.requirementMet]}>
                          At least 6 characters
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={/[A-Z]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={/[A-Z]/.test(formData.newPassword) ? "#2ed573" : "#ccc"} 
                        />
                        <Text style={[styles.requirementText, /[A-Z]/.test(formData.newPassword) && styles.requirementMet]}>
                          One uppercase letter (recommended)
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <Ionicons 
                          name={/[0-9]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={/[0-9]/.test(formData.newPassword) ? "#2ed573" : "#ccc"} 
                        />
                        <Text style={[styles.requirementText, /[0-9]/.test(formData.newPassword) && styles.requirementMet]}>
                          One number (recommended)
                        </Text>
                      </View>
                    </View> */}
                  </Animated.View>
                )}
              </View>

              {/* Back to Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginPrompt}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
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
    paddingHorizontal: 10,
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
  // OTP Styles
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
    fontSize: 24,
    fontWeight: 'bold',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    color: '#555',
    fontSize: 15,
  },
  resendLink: {
    color: '#5D50FE',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: '#aaa',
  },
  resendTimer: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },
  // Password Section Styles
  passwordLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 15,
    color: '#555',
    marginBottom: 7,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputWrapperFocused: {
    borderColor: '#5D50FE',
    backgroundColor: '#fff',
  },
  inputWrapperError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 4,
  },
  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  strengthBar: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#e9ecef',
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 7,
    borderRadius: 5,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Password Match
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  matchText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '600',
  },
  // Reset Button
  resetButton: {
    marginTop: 10,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#5D50FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resetButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  resetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  resetText: {
    color: '#5D50FE',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#5D50FE',
    borderTopColor: 'transparent',
    marginRight: 8,
    // You can add animation for spinner if needed
  },
  loadingText: {
    color: '#5D50FE',
    fontSize: 15,
    fontWeight: '600',
  },
  // Password Requirements
  requirementsContainer: {
    marginTop: 18,
    backgroundColor: '#f4f6ff',
    borderRadius: 10,
    padding: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D50FE',
    marginBottom: 7,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 7,
  },
  requirementMet: {
    color: '#2ed573',
    fontWeight: '600',
  },
  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  loginPrompt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

});