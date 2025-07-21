import React, {useState} from 'react';

import {
  Controller,
  useForm,
} from 'react-hook-form';
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

const OtpScreen = ({ navigation, route }) => {
  const { phone, confirm } = route.params || {};
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { otp: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('🔑 Verifying OTP:', data.otp);

      await confirm.confirm(data.otp);

      Alert.alert('✅ Success', 'OTP Verified!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }],
      });

    } catch (error) {
      console.error(error);
      Alert.alert('❌ Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    Alert.alert('🔄', 'Resending OTP...');
    try {
      const newConfirm = await confirm.verifier.signInWithPhoneNumber(phone);
      Alert.alert('✅', `OTP resent to ${phone}`);
      route.params.confirm = newConfirm;
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Error', 'Failed to resend OTP.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Code sent to {phone}</Text>

        <Controller
          control={control}
          name="otp"
          rules={{
            required: 'OTP is required',
            pattern: {
              value: /^[0-9]{4,6}$/,
              message: 'Enter a valid 4–6 digit OTP',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
        />
        {errors.otp && <Text style={styles.error}>{errors.otp.message}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 18,
    textAlign: 'center',
  },
  error: {
    color: '#f8d7da',
    backgroundColor: '#721c24',
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  resendText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
}); 