import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import BoardBg from '../assets/images/bg.jpeg';
import RedPile from '../assets/images/piles/red.png';
import BluePile from '../assets/images/piles/blue.png';
import CoinIcon from '../assets/coin_icon.png';
import DiceRoll from '../assets/animation/diceroll.json';
import { resetAndNavigate } from '../helpers/NavigationUtil';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Token collision animation
  const redX = useRef(new Animated.Value(-width * 0.25)).current;
  const blueX = useRef(new Animated.Value(width * 0.25)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const collide = () => {
      // Reset
      redX.setValue(-width * 0.25);
      blueX.setValue(width * 0.25);
      flashOpacity.setValue(0);

      Animated.sequence([
        // Slide toward each other
        Animated.parallel([
          Animated.spring(redX, { toValue: -18, friction: 5, tension: 60, useNativeDriver: true }),
          Animated.spring(blueX, { toValue: 18, friction: 5, tension: 60, useNativeDriver: true }),
        ]),
        // Flash on impact
        Animated.timing(flashOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        // Hold
        Animated.delay(1200),
        // Reset outward
        Animated.parallel([
          Animated.timing(redX, { toValue: -width * 0.25, duration: 400, useNativeDriver: true }),
          Animated.timing(blueX, { toValue: width * 0.25, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ]).start(() => collide());
    };

    collide();
  }, []);

  const handleContinue = () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OtpScreen', { phone: `+91${phone}` });
    }, 500);
  };

  const handleGoogleSignIn = () => {
    // Placeholder — wire up real Google auth when ready
    resetAndNavigate('HomeScreen');
  };

  const handleSkip = () => {
    resetAndNavigate('HomeScreen');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['#040d24', '#0b1e4e', '#0e2a72', '#0b1e4e', '#040d24']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="#040d24" />

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Brand title */}
        <View style={styles.titleContainer}>
          <View>
            <Text style={[styles.ludoText, styles.ludoTextOutline]}>LUDO</Text>
            <Text style={[styles.ludoText, styles.ludoTextFill]}>LUDO</Text>
          </View>
          <Text style={styles.supremeText}>SUPREME</Text>
        </View>

        {/* Board with token collision */}
        <View style={styles.boardContainer}>
          <Image source={BoardBg} style={styles.boardImage} resizeMode="cover" />

          {/* Tokens */}
          <View style={styles.tokensOverlay}>
            <Animated.Image
              source={RedPile}
              style={[styles.token, { transform: [{ translateX: redX }] }]}
              resizeMode="contain"
            />
            {/* Collision flash */}
            <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
            <Animated.Image
              source={BluePile}
              style={[styles.token, { transform: [{ translateX: blueX }] }]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form area */}
        <View style={styles.formArea}>
          <Text style={styles.signupHeading}>Signup to play!</Text>

          {/* Phone input */}
          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Enter Mobile Number"
              placeholderTextColor="rgba(255,255,255,0.45)"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {/* OR separator */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google sign in */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Coins bottom left */}
        <View style={styles.coinsContainer}>
          <Image source={CoinIcon} style={[styles.coin, { bottom: 28, left: 0 }]} resizeMode="contain" />
          <Image source={CoinIcon} style={[styles.coin, { bottom: 44, left: 22 }]} resizeMode="contain" />
          <Image source={CoinIcon} style={[styles.coin, { bottom: 16, left: 40 }]} resizeMode="contain" />
          <Image source={CoinIcon} style={[styles.coin, { bottom: 38, left: 58 }]} resizeMode="contain" />
          <Image source={CoinIcon} style={[styles.coin, { bottom: 8, left: 76 }]} resizeMode="contain" />
        </View>

        {/* Dice bottom right */}
        <View style={styles.diceContainer}>
          <LottieView source={DiceRoll} autoPlay loop speed={0.6} style={styles.dice} />
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By logging in you agree to the{'\n'}
          <Text style={styles.termsLink}>Terms & Conditions</Text>
          <Text style={styles.termsPlain}> and </Text>
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Brand title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ludoText: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 6,
    position: 'absolute',
  },
  ludoTextOutline: {
    color: '#1565c0',
    top: 3,
    left: 3,
  },
  ludoTextFill: {
    color: '#64b5f6',
    position: 'relative',
    textShadowColor: 'rgba(100, 200, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  supremeText: {
    marginTop: 56,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  // Board
  boardContainer: {
    width: width * 0.9,
    height: height * 0.28,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    transform: [{ perspective: 800 }, { rotateX: '18deg' }],
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  tokensOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  token: {
    width: 72,
    height: 92,
  },
  flash: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff9c4',
    shadowColor: '#ffff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },

  // Form
  formArea: {
    width: width * 0.88,
    marginTop: 20,
    alignItems: 'center',
  },
  signupHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 14,
  },
  countryCode: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  divider: {
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
    fontStyle: 'italic',
  },
  googleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Decorations
  coinsContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    width: 120,
    height: 80,
  },
  coin: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  diceContainer: {
    position: 'absolute',
    bottom: 20,
    right: 8,
  },
  dice: {
    width: 80,
    height: 80,
  },

  // Terms
  terms: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 18,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: 'rgba(100,181,246,0.9)',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  termsPlain: {
    color: 'rgba(255,255,255,0.45)',
  },
});
