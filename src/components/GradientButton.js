import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {RFValue} from 'react-native-responsive-fontsize';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {playSound} from '../helpers/SoundUtility';

const iconsSize = RFValue(20); 

const GradientButton = ({ title, onPress, iconColor = '#d5be3e' }) => {
  return (
    <View style={styles.maincontainer}>
      <TouchableOpacity activeOpacity={0.8} 
      style={styles.btnContainer} 
      onPress={() =>{
        playSound('ui');
        onPress();

      }}>
      <LinearGradient
  colors={['#4c669f', '#3b5998', '#192f6a']}
  style={styles.button}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
>
  {
    title === "RESUME" ? (
      <MaterialIcons name="play-arrow" size={iconsSize} color={iconColor} />
    ) : title === "NEW GAME" ? (
      <MaterialIcons name="play-circle" size={iconsSize} color={iconColor} />
    ) : title === "VS CPU" ? (
      <MaterialIcons name="airplay" size={iconsSize} color={iconColor} />
    ) : title === "HOME" ? (
      <MaterialIcons name="home" size={iconsSize} color={iconColor} />
    ) : (
      <MaterialIcons name="person-4" size={iconsSize} color={iconColor} />
    )
  }

  <Text style={styles.buttontText}>{title}</Text>
</LinearGradient>

      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
    maincontainer: {
      width: 230, // Ensure consistent width (slightly increased for padding effect)
      height: 55, // Make sure it matches button height
      borderRadius: 10,
      borderWidth: 5,
      borderColor: '#000',
      marginVertical: 10,
      alignSelf: 'center',
      backgroundColor: 'white', // Ensure it looks the same
    },
    btnContainer: {
      width: 230, // Same as maincontainer
      height: 55, // Same height for equal look
      borderRadius: 10, // Matching radius
      borderWidth: 5, // Same border
      borderColor: '#000',
      elevation: 5,
      backgroundColor: 'white',
      shadowColor: '#d5be3e',
      shadowOffset: { width: 1, height: 1 },
      shadowRadius: 10,
      alignSelf: 'center',
    },
    buttontText: {
      fontSize: RFValue(16),
      color: 'white',
      width: '100%', // Ensure full text width
      textAlign: 'center',
      fontFamily: 'Poppins-Bold',
    },
    button: {
      width: '100%', // Full width
      height: '100%', // Make sure it fills btnContainer
      borderRadius: 10, // Same as container
      borderWidth: 2,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: 'transparent', // Ensure it looks the same
      borderColor: '#000',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  
  
export default GradientButton;
