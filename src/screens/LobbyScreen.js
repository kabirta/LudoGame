import React from 'react';

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

const LobbyScreen = () => {
  const navigation = useNavigation();

const handleHomePress = () => {
  navigation.navigate('HomeScreen');
};



  const gameCards = [
    {
      id: '1',
      title: '1V1 BATTLE',
      prizePool: '₹190',
      entry: '100',
      timer: '8M',
      joined: '0 Joined',
    },
    {
      id: '2',
      title: '1 WINNER',
      prizePool: '₹380',
      entry: '100',
      timer: '10M',
      joined: '0 Joined',
    },
   
  ];

  const handleEntryPress = () => {
    navigation.navigate('LudoBoardScreen')
  };

  const handleWalletPress= () => {
    navigation.navigate("WalletScreen")
  };

  return (
    <View style={styles.container}>
      {/* ✅ Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
  style={styles.balanceContainer}
  onPress={handleWalletPress}   // ✅ Attach here!
>
  <Image
    source={require('../assets/coin_icon.png')}
    style={styles.coinIcon}
  />
  <Text style={styles.balanceText}>₹0</Text>
</TouchableOpacity>

      </View>

      {/* ✅ Game Cards */}
      <ScrollView style={styles.cardList}>
        {gameCards.map((game) => (
          <View key={game.id} style={styles.card}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <View style={styles.cardContent}>
              <View>
                <Text style={styles.prizeLabel}>Prize Pool</Text>
                <Text style={styles.prizeValue}>{game.prizePool}</Text>
                <Text style={styles.joined}>{game.joined}</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>{game.timer}</Text>
              </View>
              <TouchableOpacity
                style={styles.entryButton}
                onPress={handleEntryPress}>
                <Text style={styles.entryText}>{game.entry}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

     <TouchableOpacity style={styles.entryButton} onPress={handleHomePress}>
  <Text style={styles.navIcon}>🏠</Text>
</TouchableOpacity>


    </View>
  );
};

export default LobbyScreen;

const styles = StyleSheet.create({
  // ✅ ... Keep your same styles here, no changes needed
  container: {
    flex: 1,
    backgroundColor: '#003366',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#004080',
    padding: 15,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
  },
  cardList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#004d99',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    color: '#00ffcc',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prizeLabel: {
    color: '#fff',
    fontSize: 12,
  },
  prizeValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 5,
  },
  joined: {
    color: '#fff',
    fontSize: 12,
  },
  timerBox: {
    backgroundColor: '#00264d',
    padding: 8,
    borderRadius: 5,
  },
  timerText: {
    color: '#ff5050',
    fontWeight: 'bold',
    fontSize: 12,
  },
  entryButton: {
    backgroundColor: '#00cc66',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  entryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#003366',
  },
  navIcon: {
    fontSize: 22,
    justifyContent:'center',
    color: '#fff',
  },
});
