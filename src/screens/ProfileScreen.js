import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';

import ProfilePlaceholder from '../assets/profile_placeholder.png';
import {
  ensureSignedIn,
  getCurrentUser,
  getCurrentUserProfile,
  signOutCurrentUser,
  updateCurrentUserProfile,
} from '../firebase/auth';
import {getFirebaseSetupErrorMessage} from '../firebase/errorMessages';
import {resetAndNavigate} from '../helpers/NavigationUtil';

const getDisplayName = user => {
  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user?.email) {
    return user.email.trim();
  }

  return 'Guest Player';
};

const getProviderLabel = user => {
  if (!user || user.isAnonymous) {
    return 'Guest';
  }

  const providerId = user.providerData?.[0]?.providerId ?? '';

  if (providerId === 'google.com') {
    return 'Google';
  }

  if (providerId === 'phone') {
    return 'Phone';
  }

  if (providerId === 'password') {
    return 'Email';
  }

  return 'Firebase';
};

const formatJoinDate = user => {
  const createdAt = user?.metadata?.creationTime;

  if (!createdAt) {
    return 'Just now';
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Just now';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getAvatarInitials = name => {
  const safeName = `${name ?? ''}`.trim() || 'Guest Player';
  return safeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
};

const ProfileScreen = ({navigation}) => {
  const [user, setUser] = useState(() => getCurrentUser());
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState(() =>
    getDisplayName(getCurrentUser()),
  );
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncProfile = async () => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
          if (isActive) {
            setUser(null);
            setProfile(null);
            setDisplayName(getDisplayName(null));
          }
          return;
        }

        try {
          const storedProfile =
            (await updateCurrentUserProfile({})) ||
            (await getCurrentUserProfile());

          if (!isActive) {
            return;
          }

          const nextUser = getCurrentUser() || currentUser;
          setUser(nextUser);
          setProfile(storedProfile);
          setDisplayName(storedProfile?.displayName || getDisplayName(nextUser));
        } catch (error) {
          console.warn('Profile refresh failed.', error);

          if (!isActive) {
            return;
          }

          setUser(currentUser);
          setProfile(null);
          setDisplayName(getDisplayName(currentUser));
        }
      };

      syncProfile();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const effectiveDisplayName = profile?.displayName || getDisplayName(user);
  const baseDisplayName = profile?.baseDisplayName || getDisplayName(user);
  const hasUsedNameChange = (profile?.nameChangeCount ?? 0) >= 1;
  const canEditDisplayName = !hasUsedNameChange;
  const nameHint = hasUsedNameChange
    ? 'Your one display-name change has already been used. This name is now locked.'
    : `Base name: ${baseDisplayName}. You can change it one time.`;

  const avatarSource = useMemo(() => {
    if (user?.photoURL) {
      return {uri: user.photoURL};
    }

    return ProfilePlaceholder;
  }, [user?.photoURL]);

  const heroStats = useMemo(
    () => [
      {
        label: 'Provider',
        value: getProviderLabel(user),
        icon: 'shield-checkmark',
      },
      {
        label: 'Verified',
        value: user?.emailVerified ? 'Yes' : 'No',
        icon: 'mail-open',
      },
      {
        label: 'Joined',
        value: formatJoinDate(user),
        icon: 'sparkles',
      },
    ],
    [user],
  );

  const saveProfile = async () => {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a display name before saving.');
      return;
    }

    if (hasUsedNameChange && trimmedName !== effectiveDisplayName) {
      Alert.alert(
        'Name locked',
        'Your display name can only be changed once.',
      );
      return;
    }

    setSaving(true);

    try {
      const previousNameChangeCount = profile?.nameChangeCount ?? 0;
      let nextUser = user;
      let nextProfile = null;

      if (user) {
        nextProfile = await updateCurrentUserProfile({displayName: trimmedName});
        nextUser = getCurrentUser();
      } else {
        nextUser = await ensureSignedIn(trimmedName);
        nextProfile = await getCurrentUserProfile();
      }

      const resolvedUser = nextUser || getCurrentUser();
      const resolvedDisplayName =
        nextProfile?.displayName || getDisplayName(resolvedUser);
      const consumedNameChange =
        previousNameChangeCount === 0 &&
        (nextProfile?.nameChangeCount ?? 0) === 1 &&
        nextProfile?.displayName !== nextProfile?.baseDisplayName;

      setUser(resolvedUser);
      setProfile(nextProfile);
      setDisplayName(resolvedDisplayName);
      Alert.alert(
        'Profile updated',
        consumedNameChange
          ? 'Your display name has been saved. This was your one allowed change.'
          : 'Your display name has been saved.',
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Profile update failed',
        getFirebaseSetupErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOutCurrentUser();
      resetAndNavigate('LoginScreen');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Sign out failed',
        'Could not sign out right now. Try again.',
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <LinearGradient
      colors={['#031126', '#0a1c48', '#10317b', '#10234d', '#040d24']}
      locations={[0, 0.18, 0.5, 0.82, 1]}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#031126" />

      <View style={styles.glowOrbLeft} />
      <View style={styles.glowOrbRight} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="home-outline" size={20} color="#d6e7ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)']}
          style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarFrame}>
              <Image source={avatarSource} style={styles.avatarImage} />
              <View style={styles.initialBadge}>
                <Text style={styles.initialBadgeText}>
                  {getAvatarInitials(effectiveDisplayName)}
                </Text>
              </View>
            </View>

            <View style={styles.identityBlock}>
              <View style={styles.providerPill}>
                <MaterialCommunityIcons
                  name="badge-account-horizontal-outline"
                  size={16}
                  color="#ffe08a"
                />
                <Text style={styles.providerPillText}>
                  {getProviderLabel(user)} account
                </Text>
              </View>
              <Text style={styles.heroName}>{effectiveDisplayName}</Text>
              <Text style={styles.heroSubtitle}>
                {user?.email || 'Personalize your player card for online matches'}
              </Text>
              <Text style={styles.heroUid}>
                Player ID {user?.uid ? user.uid.slice(0, 12) : 'Not linked yet'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {heroStats.map(item => (
              <View key={item.label} style={styles.statCard}>
                <Ionicons name={item.icon} size={18} color="#9bd2ff" />
                <Text style={styles.statValue} numberOfLines={1}>
                  {item.value}
                </Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Edit identity</Text>
          <Text style={styles.panelTitle}>How other players will see you</Text>
          <Text style={styles.panelBody}>
            Google sign-in starts with your email as the permanent base name.
            You can replace it once for room hosting and future multiplayer
            matches.
          </Text>

          <View
            style={[
              styles.inputShell,
              !canEditDisplayName && styles.inputShellLocked,
            ]}>
            <Ionicons
              name="person-circle-outline"
              size={20}
              color="#8ebcff"
            />
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor="rgba(214,231,255,0.38)"
              style={styles.input}
              editable={canEditDisplayName && !saving}
              maxLength={40}
            />
          </View>
          <Text style={styles.nameHint}>{nameHint}</Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (saving || !canEditDisplayName) && styles.buttonDisabled,
            ]}
            onPress={saveProfile}
            disabled={saving || !canEditDisplayName}>
            <LinearGradient
              colors={['#fdbb2d', '#ff7b00']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.primaryButtonFill}>
              <Text style={styles.primaryButtonText}>
                {saving
                  ? 'Saving...'
                  : canEditDisplayName
                    ? 'Save profile'
                    : 'Name change used'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#1b0f00" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {user?.email || 'Not connected to email'}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base name</Text>
            <Text style={styles.infoValue}>{baseDisplayName}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name changes left</Text>
            <Text style={styles.infoValue}>
              {hasUsedNameChange ? '0 remaining' : '1 remaining'}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Photo</Text>
            <Text style={styles.infoValue}>
              {user?.photoURL ? 'Connected' : 'Using default avatar'}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session mode</Text>
            <Text style={styles.infoValue}>
              {user?.isAnonymous ? 'Guest mode' : 'Signed in'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('HomeScreen')}>
            <Ionicons name="game-controller-outline" size={18} color="#d7e6ff" />
            <Text style={styles.secondaryButtonText}>Back to lobby</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOutButton, signingOut && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={signingOut}>
            <Ionicons name="log-out-outline" size={18} color="#fff3f3" />
            <Text style={styles.signOutText}>
              {signingOut ? 'Signing out...' : 'Sign out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowOrbLeft: {
    position: 'absolute',
    top: 110,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(24, 145, 255, 0.18)',
  },
  glowOrbRight: {
    position: 'absolute',
    top: 240,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 166, 38, 0.12)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 34,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#eef5ff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrame: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,199,117,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  initialBadge: {
    position: 'absolute',
    right: -4,
    bottom: -6,
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: '#fdbb2d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#112451',
  },
  initialBadgeText: {
    color: '#2b1600',
    fontSize: 12,
    fontWeight: '900',
  },
  identityBlock: {
    flex: 1,
    marginLeft: 16,
  },
  providerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,224,138,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerPillText: {
    color: '#ffe08a',
    fontSize: 12,
    fontWeight: '700',
  },
  heroName: {
    marginTop: 12,
    color: '#f7fbff',
    fontSize: 28,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 6,
    color: 'rgba(222,236,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  heroUid: {
    marginTop: 10,
    color: 'rgba(172,205,255,0.68)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(5,16,42,0.38)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginRight: 10,
  },
  statValue: {
    marginTop: 10,
    color: '#f6fbff',
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
    color: 'rgba(175,203,246,0.66)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  panel: {
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(9,18,43,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  panelEyebrow: {
    color: '#8dbdff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  panelTitle: {
    marginTop: 8,
    color: '#f7fbff',
    fontSize: 23,
    fontWeight: '900',
  },
  panelBody: {
    marginTop: 8,
    color: 'rgba(214,231,255,0.74)',
    fontSize: 14,
    lineHeight: 21,
  },
  inputShell: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(157,197,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputShellLocked: {
    opacity: 0.56,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 14,
  },
  nameHint: {
    marginTop: 10,
    color: 'rgba(214,231,255,0.64)',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButtonFill: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButtonText: {
    color: '#1b0f00',
    fontSize: 16,
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    color: '#eef5ff',
    fontSize: 18,
    fontWeight: '900',
  },
  infoRow: {
    paddingVertical: 14,
  },
  infoLabel: {
    color: 'rgba(160,194,243,0.72)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    marginTop: 6,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  actionRow: {
    marginTop: 18,
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,188,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: '#d7e6ff',
    fontSize: 15,
    fontWeight: '800',
  },
  signOutButton: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,95,95,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,128,128,0.24)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signOutText: {
    color: '#fff3f3',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
