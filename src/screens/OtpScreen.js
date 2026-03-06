import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { resetAndNavigate } from '../helpers/NavigationUtil';

const PURPLE = '#4B0082';

const OtpScreen = ({ navigation, route }) => {
  const { phone } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (otp.length < 4 || otp.length > 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4–6 digit OTP.');
      return;
    }
    setLoading(true);
    // Replace with real OTP verification when backend is ready
    setTimeout(() => {
      setLoading(false);
      resetAndNavigate('HomeScreen');
    }, 500);
  };

  const handleResend = () => {
    Alert.alert('OTP Resent', `A new OTP has been sent to ${phone}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>LUDO</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Code sent to {phone}</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <TouchableOpacity onPress={handleResend} style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive it?  </Text>
            <Text style={styles.resendLink}>RESEND OTP</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, otp.length < 4 && styles.continueBtnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
    width: 36,
  },
  backArrow: {
    fontSize: 36,
    color: PURPLE,
    lineHeight: 36,
  },
  brand: {
    fontSize: 26,
    fontWeight: '900',
    color: PURPLE,
    letterSpacing: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: PURPLE,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    fontSize: 22,
    color: '#111',
    paddingVertical: 14,
    paddingHorizontal: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#444',
  },
  resendLink: {
    fontSize: 14,
    color: PURPLE,
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  continueBtn: {
    backgroundColor: PURPLE,
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#ccc',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
