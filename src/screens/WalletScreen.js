import React, {useCallback, useState} from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {getCurrentUserProfile} from '../firebase/auth';
import {getUserWallet} from '../firebase/users';
import {formatCurrencyAmount} from '../helpers/currency';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(() => getUserWallet(null));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncWallet = async () => {
        try {
          const currentProfile = await getCurrentUserProfile();

          if (!isActive) {
            return;
          }

          setWallet(getUserWallet(currentProfile));
        } catch (error) {
          console.warn('Failed to refresh wallet screen.', error);

          if (!isActive) {
            return;
          }

          setWallet(getUserWallet(null));
        }
      };

      syncWallet();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const totalBalance = wallet.totalBalance;
  const winnings = wallet.winnings;
  const addedAmount = wallet.addedAmount;

  return (
    <LinearGradient
      colors={['#040d24', '#0b1e4e', '#0e2a72', '#0b1e4e', '#040d24']}
      locations={[0, 0.2, 0.5, 0.8, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#040d24" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Balances</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Wallet icon floating above card */}
      <View style={styles.walletIconWrapper}>
        <View style={styles.walletIconOuter}>
          {/* Rupee coin */}
          <View style={styles.rupeeCircle}>
            <Text style={styles.rupeeSymbol}>₹</Text>
          </View>
          {/* Wallet body */}
          <View style={styles.walletBody}>
            <MaterialCommunityIcons name="wallet" size={28} color="#fff" />
          </View>
        </View>
      </View>

      {/* Main balance card */}
      <View style={styles.balanceCard}>
        {/* Total balance */}
        <View style={styles.totalSection}>
          <Text style={styles.balanceAmount}>
            {`\u20B9${formatCurrencyAmount(totalBalance)}`}
          </Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
        </View>

        <View style={styles.cardDivider} />

        {/* Added Amount row */}
        <View style={styles.rowSection}>
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.rowLabel}>Added Amount</Text>
              <TouchableOpacity onPress={() => Alert.alert('Added Amount', 'Amount deposited into your wallet.')}>
                <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
            <Text style={styles.rowValue}>
              {`\u20B9${formatCurrencyAmount(addedAmount)}`}
            </Text>
          </View>

          {/* Add button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Add Money', 'Payment gateway coming soon!')}
          >
            <LinearGradient
              colors={['#00c853', '#00897b', '#00695c']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>ADD</Text>
              <View style={styles.actionIconCircle}>
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.thinDivider} />

        {/* Winnings row */}
        <View style={[styles.rowSection, { marginTop: 4 }]}>
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.rowLabel}>Winnings</Text>
              <TouchableOpacity onPress={() => Alert.alert('Winnings', 'Amount won from games.')}>
                <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
            <Text style={styles.rowValue}>
              {`\u20B9${formatCurrencyAmount(winnings)}`}
            </Text>
          </View>

          {/* Withdraw button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Withdraw', 'Minimum withdrawal amount not reached.')}
          >
            <LinearGradient
              colors={['#ffb300', '#f57c00', '#e65100']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.withdrawBtn}
            >
              <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
              <View style={styles.withdrawIconCircle}>
                <MaterialCommunityIcons name="bank-outline" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>

      {/* Transaction History */}
      <TouchableOpacity
        style={styles.historyCard}
        activeOpacity={0.8}
        onPress={() => Alert.alert('Transaction History', 'No transactions yet.')}
      >
        <View style={styles.historyLeft}>
          <View style={styles.historyIconCircle}>
            <MaterialCommunityIcons name="currency-inr" size={20} color="#fff" />
          </View>
          <Text style={styles.historyText}>Transaction History</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    alignItems: 'center',
  },

  // Header
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100,180,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(100,180,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#90caf9',
    fontSize: 22,
    fontWeight: '800',
  },

  // Wallet icon
  walletIconWrapper: {
    marginBottom: -28,
    zIndex: 10,
  },
  walletIconOuter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  rupeeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffd600',
    borderWidth: 3,
    borderColor: '#ff8f00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    zIndex: 2,
    elevation: 4,
  },
  rupeeSymbol: {
    color: '#bf360c',
    fontSize: 20,
    fontWeight: '900',
  },
  walletBody: {
    width: 56,
    height: 44,
    backgroundColor: '#ff8f00',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e65100',
    elevation: 4,
  },

  // Balance card
  balanceCard: {
    width: width - 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 40,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  totalSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
  },
  balanceLabel: {
    color: '#90caf9',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 0,
    marginBottom: 16,
  },
  thinDivider: {
    height: 1,
    backgroundColor: 'rgba(100,200,255,0.2)',
    marginHorizontal: 16,
    marginVertical: 14,
  },

  // Row section (Winnings / Bonus)
  rowSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  // Action buttons (ADD / WITHDRAW)
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 6,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 6,
    gap: 8,
  },
  withdrawBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  withdrawIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Transaction history
  historyCard: {
    width: width - 28,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  historyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100,180,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
