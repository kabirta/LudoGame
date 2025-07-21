import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const WalletScreen = () => {
  return (
    <View style={styles.container}>

      {/* ✅ Top header */}
      <Text style={styles.header}>My Balances</Text>

      {/* ✅ Total Balance Box */}
      <View style={styles.balanceBox}>
        <View style={styles.balanceIconWrapper}>
          <Image
            source={require('../assets/wallet.png')} // Replace with your wallet icon
            style={styles.balanceIcon}
          />
        </View>
        <Text style={styles.balanceAmount}>₹10</Text>
        <Text style={styles.balanceLabel}>Total Balance</Text>
      </View>

      {/* ✅ Added Amount Section */}
      <View style={styles.section}>
        <View>
          <Text style={styles.sectionLabel}>Added Amount</Text>
          <Text style={styles.sectionValue}>₹9</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Winnings Section */}
      <View style={styles.section}>
        <View>
          <Text style={styles.sectionLabel}>Winnings</Text>
          <Text style={styles.sectionValue}>₹0</Text>
        </View>
        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawButtonText}>WITHDRAW</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Bonus Section */}
      <View style={styles.section}>
        <View>
          <Text style={styles.sectionLabel}>Bonus</Text>
          <Text style={styles.sectionValue}>₹1</Text>
        </View>
      </View>

      {/* ✅ Transaction History */}
      <TouchableOpacity style={styles.historyButton}>
        <Text style={styles.historyText}>Transaction History</Text>
      </TouchableOpacity>

    </View>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceBox: {
    backgroundColor: '#004080',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    width: '90%',
    marginBottom: 20,
  },
  balanceIconWrapper: {
    backgroundColor: '#ffa500',
    padding: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  balanceIcon: {
    width: 30,
    height: 30,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#0059b3',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
  },
  sectionValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#00cc99',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  withdrawButton: {
    backgroundColor: '#ff9933',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  withdrawButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#004080',
    borderRadius: 10,
    width: '90%',
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  historyText: {
    color: '#fff',
    fontSize: 16,
  },
});
