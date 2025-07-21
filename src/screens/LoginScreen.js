import React, {useState} from 'react';

import {
  Controller,
  useForm,
} from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import auth from '@react-native-firebase/auth';

// ✅ Custom Checkbox stays same
const CustomCheckbox = ({ value, onValueChange }) => (
  <TouchableOpacity
    style={[styles.checkboxBase, value && styles.checkboxChecked]}
    onPress={() => onValueChange(!value)}
  >
    {value && <View style={styles.checkboxInner} />}
  </TouchableOpacity>
);

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      phone: '',
      isAdult: false,
    },
  });

  const onSubmit = async (data) => {
    if (!data.isAdult) {
      Alert.alert('Age Check', 'You must confirm you are older than 18.');
      return;
    }

    setLoading(true);

    try {
      // ✅ Always ensure phone number includes country code!
      const phoneNumber = `+91${data.phone.trim()}`;
      console.log('📲 Sending OTP to:', phoneNumber);

      // ✅ Firebase call
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

      Alert.alert('OTP Sent', `An OTP has been sent to ${phoneNumber}`);

      // ✅ Pass confirm to OtpScreen
      navigation.navigate('OtpScreen', {
        phone: phoneNumber,
        confirm: confirmation,
      });

    } catch (error) {
      console.error('❌ signInWithPhoneNumber error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Login / Register</Text>

          {/* ✅ Phone Field */}
          <Controller
            control={control}
            name="phone"
            rules={{
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Enter a valid 10-digit number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter Mobile Number"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
                maxLength={10}
              />
            )}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

          {/* ✅ Checkbox */}
          <View style={styles.checkboxContainer}>
            <Controller
              control={control}
              name="isAdult"
              render={({ field: { value, onChange } }) => (
                <>
                  <CustomCheckbox value={value} onValueChange={onChange} />
                  <Text style={styles.checkboxLabel}>I’m older than 18</Text>
                </>
              )}
            />
          </View>

          {/* ✅ Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  error: {
    color: '#f8d7da',
    backgroundColor: '#721c24',
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
});
