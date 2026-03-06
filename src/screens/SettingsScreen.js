import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { stopSound } from '../helpers/SoundUtility';

const { width } = Dimensions.get('window');

// ── Language pill toggle ──────────────────────────────────────────
const LanguageToggle = ({ value, onChange }) => (
  <View style={styles.langToggle}>
    <TouchableOpacity
      style={[styles.langOption, value === 'HI' && styles.langOptionActive]}
      onPress={() => onChange('HI')}
    >
      <Text style={[styles.langText, value === 'HI' && styles.langTextActive]}>हिन्दी</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.langOption, value === 'EN' && styles.langOptionActive]}
      onPress={() => onChange('EN')}
    >
      <Text style={[styles.langText, value === 'EN' && styles.langTextActive]}>ENG</Text>
    </TouchableOpacity>
  </View>
);

// ── ON/OFF pill toggle ────────────────────────────────────────────
const OnOffToggle = ({ value, onChange }) => (
  <View style={styles.onoffToggle}>
    <TouchableOpacity
      style={[styles.onoffOption, !value && styles.onoffOptionActive]}
      onPress={() => onChange(false)}
    >
      <Text style={[styles.onoffText, !value && styles.onoffTextActive]}>OFF</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.onoffOption, value && styles.onoffOptionActiveOn]}
      onPress={() => onChange(true)}
    >
      <Text style={[styles.onoffText, value && styles.onoffTextActiveOn]}>ON</Text>
    </TouchableOpacity>
  </View>
);

// ── Single row item ───────────────────────────────────────────────
const SettingRow = ({ icon, label, right, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    {right && <View>{right}</View>}
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────
const SettingsScreen = ({ navigation }) => {
  const [language, setLanguage] = useState('EN');
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);

  const handleSoundToggle = async (val) => {
    setSoundOn(val);
    if (!val) await stopSound();
  };

  const handleMusicToggle = (val) => {
    setMusicOn(val);
    if (!val) stopSound();
  };

  const iconProps = { size: 22, color: '#90caf9' };

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings card */}
        <View style={styles.card}>
          <SettingRow
            icon={<Ionicons name="globe-outline" {...iconProps} />}
            label="Language"
            right={<LanguageToggle value={language} onChange={setLanguage} />}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<Ionicons name="volume-medium-outline" {...iconProps} />}
            label="Sound"
            right={<OnOffToggle value={soundOn} onChange={handleSoundToggle} />}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<Ionicons name="musical-notes-outline" {...iconProps} />}
            label="Music"
            right={<OnOffToggle value={musicOn} onChange={handleMusicToggle} />}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<Ionicons name="person-outline" {...iconProps} />}
            label="My Profile"
            onPress={() => Alert.alert('My Profile', 'Coming soon!')}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<MaterialCommunityIcons name="credit-card-outline" {...iconProps} />}
            label="My Balances"
            onPress={() => Alert.alert('My Balances', 'Coming soon!')}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<MaterialCommunityIcons name="dice-5-outline" {...iconProps} />}
            label="How to Play"
            onPress={() => Alert.alert('How to Play', 'Roll the dice and move your pieces to the home triangle!')}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<MaterialCommunityIcons name="face-agent" {...iconProps} />}
            label="Helpdesk"
            onPress={() => Alert.alert('Helpdesk', 'Contact us at support@ludosupreme.com')}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<MaterialCommunityIcons name="help-circle-outline" {...iconProps} />}
            label="FAQ"
            onPress={() => Alert.alert('FAQ', 'Visit our website for FAQs.')}
          />
          <View style={styles.separator} />

          <SettingRow
            icon={<MaterialCommunityIcons name="dots-horizontal" {...iconProps} />}
            label="More"
            onPress={() => Alert.alert('More', 'More options coming soon!')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.rngBadge}>
            <MaterialCommunityIcons name="certificate-outline" size={16} color="#90caf9" />
            <Text style={styles.rngText}>RNG CERTIFIED</Text>
          </View>
          <Text style={styles.footerCopy}>©2024 Ludo Supreme</Text>
          <Text style={styles.footerVersion}>App Version: 1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Language toggle
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 3,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: '#00c853',
  },
  langText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  langTextActive: {
    color: '#fff',
  },

  // ON/OFF toggle
  onoffToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 3,
  },
  onoffOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  onoffOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  onoffOptionActiveOn: {
    backgroundColor: '#00c853',
  },
  onoffText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  onoffTextActive: {
    color: '#fff',
  },
  onoffTextActiveOn: {
    color: '#fff',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 28,
    gap: 4,
  },
  rngBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rngText: {
    color: '#90caf9',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerCopy: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  footerVersion: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
});
