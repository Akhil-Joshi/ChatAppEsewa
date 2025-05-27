import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Welcome({navigation}) {
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLoginPress = () => {
    // Add haptic feedback if available
    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Login');
  };

  const handleSignupPress = () => {
    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Signup');
  };

  return (
    <LinearGradient 
      colors={['#667eea', '#764ba2', '#5D50FE']} 
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* <StatusBar barStyle="light-content" backgroundColor="#5D50FE" /> */}
        
        {/* Floating Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <Animated.View style={[styles.floatingCircle, styles.circle1, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle2, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle3, { opacity: fadeAnim }]} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Logo with glow effect */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>Welcome to ChatBox</Text>
            <Text style={styles.subtitle}>
              Connect with your friends instantly and share memorable moments together
            </Text>
            
            {/* Feature highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubbles" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>Instant Messaging</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>Group Chats</Text>
              </View>
              {/* <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>Secure & Private</Text>
              </View> */}
              <View style={styles.featureItem}>
                <Ionicons name="happy" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>Emotion Detection AI</Text>
              </View>
            </View>
          </Animated.View>

          {/* Buttons with animation */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: buttonSlideAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9ff']}
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.loginText}>Login to Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#5D50FE" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignupPress}
              activeOpacity={0.8}
            >
              <View style={styles.signupContent}>
                <Text style={styles.signupText}>Create New Account</Text>
                <Ionicons name="person-add" size={20} color="#ffffff" style={styles.buttonIcon} />
              </View>
            </TouchableOpacity>

            {/* Social login options */}
            {/* <View style={styles.socialContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View> */}
          </Animated.View>
        </View>

        {/* Bottom decorative wave */}
        <View style={styles.bottomWave}>
          <Animated.View style={[styles.wave, { opacity: fadeAnim }]} />
        </View>
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
    width: 120,
    height: 120,
    top: height * 0.1,
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: height * 0.3,
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    bottom: height * 0.2,
    right: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 30,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: -15,
    left: -15,
    zIndex: -1,
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  loginButton: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  loginText: {
    color: '#5D50FE',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  signupButton: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  signupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  socialContainer: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginHorizontal: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  wave: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});