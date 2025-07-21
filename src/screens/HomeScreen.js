import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation(); // ✅ hook for navigation

  const handleWalletPress = () => {
    navigation.navigate('WalletScreen'); // ✅ replace with your Wallet route name
  };

  const handleLobbyPress = () => {
    navigation.navigate('LobbyScreen'); // ✅ your Lobby screen
  };

  return (
    <View style={styles.container}>

      {/* ✅ Top Profile Bar */}
      <View style={styles.profileBar}>
        <Image
          source={require('../assets/profile_placeholder.png')}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Mintajul</Text>
        </View>

        {/* ✅ Balance box is now Touchable */}
        <TouchableOpacity
          style={styles.balanceBox}
          activeOpacity={0.7}
          onPress={handleWalletPress} // ✅ navigate to wallet
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹ 41.5</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Online Status */}
      <View style={styles.onlineStatus}>
        <Text style={styles.onlineText}>Online :</Text>
        <Text style={styles.onlinePing}>72 ms | 0.15 Mb/s</Text>
      </View>

      {/* ✅ Ludo Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleLobbyPress}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.cardIcon}
        />
        <Text style={styles.cardTitle}>LUDO</Text>
        <Text style={styles.cardDescription}>
          Ludo fun, now just a tap away!
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8e44ad',
    paddingTop: 50,
  },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceBox: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 12,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  onlineText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  onlinePing: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    alignItems: 'center',
  },
  cardIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  cardDescription: {
    color: '#333',
    textAlign: 'center',
  },
});
