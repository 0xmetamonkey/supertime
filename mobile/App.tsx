import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { THEME_TOKENS, CreatorProfile } from '@supertime/shared';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? THEME_TOKENS.dark : THEME_TOKENS.light;

  // Mock creator profile data for initial mobile stage preview
  const [profile] = useState<CreatorProfile>({
    email: 'creator@supertime.app',
    username: 'alex',
    displayName: 'Alex Rivers',
    bio: 'Product Designer & Live Streamer. 1:1 sessions for design critiques and strategy.',
    videoRate: 150,
    audioRate: 75,
    isAcceptingCalls: true,
    isLive: false,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brandLogo, { color: theme.foreground }]}>
            SUPER<Text style={{ color: THEME_TOKENS.accent.pink }}>TIME</Text>
          </Text>
          <TouchableOpacity
            style={[styles.themeBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
          >
            <Text style={[styles.themeBtnText, { color: theme.foreground }]}>
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>AR</Text>
          </View>
          <Text style={[styles.displayName, { color: theme.foreground }]}>
            {profile.displayName}
          </Text>
          <Text style={[styles.username, { color: theme.muted }]}>
            @{profile.username}
          </Text>
          <Text style={[styles.bio, { color: theme.foreground }]}>
            {profile.bio}
          </Text>

          {/* Rates Badge */}
          <View style={[styles.ratesContainer, { borderColor: theme.border }]}>
            <View style={styles.rateItem}>
              <Text style={[styles.rateLabel, { color: theme.muted }]}>Video Rate</Text>
              <Text style={[styles.rateValue, { color: theme.foreground }]}>
                ₹{profile.videoRate}/min
              </Text>
            </View>
            <View style={[styles.rateDivider, { backgroundColor: theme.border }]} />
            <View style={styles.rateItem}>
              <Text style={[styles.rateLabel, { color: theme.muted }]}>Audio Rate</Text>
              <Text style={[styles.rateValue, { color: theme.foreground }]}>
                ₹{profile.audioRate}/min
              </Text>
            </View>
          </View>

          {/* Call Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: profile.isAcceptingCalls ? THEME_TOKENS.accent.green : theme.muted },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.muted }]}>
              {profile.isAcceptingCalls ? 'Accepting Live Calls' : 'Away / Offline'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.foreground }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: theme.background }]}>
              Start Video Call (₹{profile.videoRate}/min)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.foreground }]}>
              Audio Only (₹{profile.audioRate}/min)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  brandLogo: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ratesContainer: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 14,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateDivider: {
    width: 1,
    height: '100%',
  },
  rateLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
