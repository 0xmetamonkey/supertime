import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  AppState,
  Linking,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';
import {
  Video,
  Mic,
  ArrowRight,
  Zap,
  RefreshCw,
  Settings,
  ShieldAlert,
  Volume2,
  Check,
  X,
} from 'lucide-react-native';
import { nativeSignaling, MatchedEvent } from './src/services/NativeSignaling';
import { NativeWebRTCStream, NativeWebRTCStreamRef } from './src/components/NativeWebRTCStream';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Direct local PC signaling URL for instant testing
const SIGNALING_URL = 'http://192.168.0.102:3001';

type ScreenState = 'home' | 'searching' | 'matched';

export default function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [talkMode, setTalkMode] = useState<'video' | 'audio'>('video');
  const [screenState, setScreenState] = useState<ScreenState>('home');
  const [onlineCount, setOnlineCount] = useState<number>(1420);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to Talk');

  // Call / Matched States
  const [matchData, setMatchData] = useState<MatchedEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioRoute, setAudioRoute] = useState<'speaker' | 'earpiece'>('speaker');
  const [incomingTimeRequest, setIncomingTimeRequest] = useState<{ cost: number; seconds: number } | null>(null);
  const [hasRequestedTime, setHasRequestedTime] = useState<boolean>(false);
  const [timeToast, setTimeToast] = useState<string | null>(null);
  const peerIdRef = useRef<string>(`peer_mobile_${Math.random().toString(36).substring(2, 9)}`);
  const webRTCStreamRef = useRef<NativeWebRTCStreamRef>(null);

  // Radar Animation values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  // 1. Proactive Camera & Microphone Permission Flow
  const requestAllPermissions = async () => {
    try {
      const camRes = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(camRes.status === 'granted');
      setCanAskAgain(camRes.canAskAgain);

      try {
        await Camera.requestMicrophonePermissionsAsync();
      } catch (mErr) {
        console.log('[Native App] Mic permission note:', mErr);
      }
    } catch (err) {
      console.error('[Native App] Permission request error:', err);
    }
  };

  useEffect(() => {
    requestAllPermissions();

    // Re-verify when user switches back from Android Settings
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          const check = await Camera.getCameraPermissionsAsync();
          setHasCameraPermission(check.status === 'granted');
          setCanAskAgain(check.canAskAgain);
        } catch (e) {
          console.log('[Native App] Permission check error:', e);
        }
      }
    });

    return () => sub.remove();
  }, []);

  // 2. Radar Animation Loop when searching
  useEffect(() => {
    if (screenState !== 'searching') return;

    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    pulseAnim1.setValue(0);
    pulseAnim2.setValue(0);
    pulseAnim3.setValue(0);

    const anim1 = createPulse(pulseAnim1, 0);
    const anim2 = createPulse(pulseAnim2, 700);
    const anim3 = createPulse(pulseAnim3, 1400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [screenState]);

  // 3. Connect directly to custom signaling server on mount
  useEffect(() => {
    nativeSignaling.connect(SIGNALING_URL, {
      onOnlineCount: (count) => {
        setOnlineCount(count);
      },
      onQueued: () => {
        setScreenState('searching');
        setStatusMessage('Scanning pool for live creators...');
      },
      onMatched: (data) => {
        console.log('[Native App] Matched:', data);
        setMatchData(data);
        setScreenState('matched');
        setTimeLeft(30);
        setIncomingTimeRequest(null);
        setHasRequestedTime(false);
        setStatusMessage(`Connected with ${data.partnerMeta?.displayName || 'Stranger'}`);
      },
      onSignal: (signal) => {
        console.log('[Native App] Incoming WebRTC signal:', signal.type);
        webRTCStreamRef.current?.handleRemoteSignal(signal);
      },
      onPeerSkipped: () => {
        setScreenState('searching');
        setStatusMessage('Partner skipped. Finding next match...');
        setIncomingTimeRequest(null);
        nativeSignaling.joinQueue({
          peerId: peerIdRef.current,
          mode: talkMode,
          isCreator: false,
          username: 'Mobile User',
        });
      },
      onPeerLeft: () => {
        setScreenState('searching');
        setStatusMessage('Partner left. Finding someone new...');
        setIncomingTimeRequest(null);
        nativeSignaling.joinQueue({
          peerId: peerIdRef.current,
          mode: talkMode,
          isCreator: false,
          username: 'Mobile User',
        });
      },
      onPeerRequestedTime: (payload) => {
        console.log('[Native App] onPeerRequestedTime received:', payload);
        Vibration.vibrate([0, 80, 100, 80]);
        setIncomingTimeRequest({
          cost: payload.cost || 0,
          seconds: payload.seconds || 30,
        });
      },
      onTimeExtended: (payload) => {
        const added = payload.addedSeconds || 30;
        setTimeLeft((prev) => prev + added);
        setIncomingTimeRequest(null);
        setHasRequestedTime(false);
        setTimeToast(`+${added}s Added!`);
        setTimeout(() => setTimeToast(null), 2500);
      },
    });

    return () => {
      nativeSignaling.disconnect();
    };
  }, [talkMode]);

  // 4. Ticking Timer during Call
  useEffect(() => {
    if (screenState !== 'matched') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screenState]);

  // Actions
  const handleStartSupertalk = async () => {
    Vibration.vibrate(40);
    if (talkMode === 'video' && !hasCameraPermission) {
      const camRes = await Camera.requestCameraPermissionsAsync();
      if (camRes.status !== 'granted') {
        if (!camRes.canAskAgain) {
          Linking.openSettings();
        }
        return;
      }
      setHasCameraPermission(true);
    }

    setScreenState('searching');
    setStatusMessage('Searching for a live conversation...');
    nativeSignaling.joinQueue({
      peerId: peerIdRef.current,
      mode: talkMode,
      isCreator: false,
      username: 'Mobile User',
    });
  };

  const handleCancelSearch = () => {
    Vibration.vibrate(30);
    nativeSignaling.leaveQueue();
    setScreenState('home');
    setStatusMessage('Ready to Talk');
  };

  const handleSkip = () => {
    Vibration.vibrate(60);
    nativeSignaling.skip(matchData?.roomId);
    setScreenState('searching');
    setStatusMessage('Finding next match...');
    setIncomingTimeRequest(null);
    nativeSignaling.joinQueue({
      peerId: peerIdRef.current,
      mode: talkMode,
      isCreator: false,
      username: 'Mobile User',
    });
  };

  const handleAddTime = () => {
    if (hasRequestedTime) return;
    Vibration.vibrate([0, 35, 50, 35]);
    setHasRequestedTime(true);
    if (matchData?.roomId) {
      nativeSignaling.requestTimeExtension(matchData.roomId, 10, 30);
    }
  };

  const handleAcceptExtension = () => {
    Vibration.vibrate([0, 40, 60, 40]);
    if (matchData?.roomId && incomingTimeRequest) {
      nativeSignaling.acceptTimeExtension(matchData.roomId, incomingTimeRequest.cost, incomingTimeRequest.seconds);
      setIncomingTimeRequest(null);
    }
  };

  const handleDeclineExtension = () => {
    Vibration.vibrate(30);
    setIncomingTimeRequest(null);
  };

  const toggleCameraFacing = () => {
    Vibration.vibrate(25);
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const toggleAudioRoute = () => {
    Vibration.vibrate(25);
    setAudioRoute((prev) => (prev === 'speaker' ? 'earpiece' : 'speaker'));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ============================================================== */}
      {/* SCREEN 1: FULL SCREEN CAMERA HOME                             */}
      {/* ============================================================== */}
      {screenState === 'home' && (
        <View style={StyleSheet.absoluteFill}>
          {talkMode === 'video' ? (
            hasCameraPermission ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing={facing}
                onMountError={(err) => console.log('[CameraView] mount error:', err)}
              />
            ) : (
              <View style={styles.permissionScreen}>
                <View style={styles.permissionIconBadge}>
                  <ShieldAlert size={36} color="#f59e0b" />
                </View>
                <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                <Text style={styles.permissionSubtitle}>
                  Supertime uses your camera for live video conversations with creators.
                </Text>

                <TouchableOpacity
                  onPress={requestAllPermissions}
                  style={styles.permissionPrimaryBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permissionPrimaryBtnText}>Allow Camera Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Linking.openSettings()}
                  style={styles.permissionSecondaryBtn}
                  activeOpacity={0.8}
                >
                  <Settings size={16} color="#a3a3a3" />
                  <Text style={styles.permissionSecondaryBtnText}>Open Device Settings</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.audioOnlyScreen}>
              <View style={styles.audioOrbOuter} />
              <View style={styles.audioOrbCore}>
                <Mic size={36} color="#000000" />
              </View>
              <Text style={styles.audioOrbTitle}>Audio Mode Active</Text>
              <Text style={styles.audioOrbSub}>Camera is off · Ready to connect via voice</Text>
            </View>
          )}

          {/* Floating Top Flip Camera Button */}
          {talkMode === 'video' && hasCameraPermission && (
            <View style={styles.topActionsContainer}>
              <TouchableOpacity
                onPress={toggleCameraFacing}
                style={styles.flipGlassButton}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Floating Control Bar */}
          <View style={styles.bottomOverlay}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Talk live in Supertime.</Text>
              <Text style={styles.heroSub}>
                Spontaneous 1-on-1 conversations with real creators. 30-second rounds.
              </Text>
            </View>

            {/* Mode Switcher Pill */}
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(20);
                  setTalkMode('video');
                }}
                style={[styles.modeButton, talkMode === 'video' && styles.modeButtonActive]}
                activeOpacity={0.8}
              >
                <Video size={14} color={talkMode === 'video' ? '#000000' : '#888888'} />
                <Text style={[styles.modeButtonText, talkMode === 'video' && styles.modeButtonTextActive]}>
                  Video Mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(20);
                  setTalkMode('audio');
                }}
                style={[styles.modeButton, talkMode === 'audio' && styles.modeButtonActive]}
                activeOpacity={0.8}
              >
                <Mic size={14} color={talkMode === 'audio' ? '#000000' : '#888888'} />
                <Text style={[styles.modeButtonText, talkMode === 'audio' && styles.modeButtonTextActive]}>
                  Audio Only
                </Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleStartSupertalk}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaButtonText}>
                {talkMode === 'audio' ? 'Start Audio Supertalk' : 'Start a Supertalk'}
              </Text>
              <ArrowRight size={18} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: RADAR SEARCHING STATE                                */}
      {/* ============================================================== */}
      {screenState === 'searching' && (
        <View style={styles.searchingContainer}>
          {/* Concentric Sonar Radar Animation */}
          <View style={styles.radarWrapper}>
            {[pulseAnim1, pulseAnim2, pulseAnim3].map((anim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.6],
                        }),
                      },
                    ],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.7, 0.35, 0],
                    }),
                  },
                ]}
              />
            ))}

            <View style={styles.radarCenterOrb}>
              <Zap size={32} color="#000000" />
            </View>
          </View>

          <View style={styles.searchMeta}>
            <Text style={styles.searchingTitle}>{statusMessage}</Text>
            <Text style={styles.searchingSub}>
              {talkMode === 'video' ? 'Matching with video creators' : 'Matching with voice callers'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCancelSearch}
            style={styles.cancelSearchButton}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelSearchText}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: NATIVE MATCHED CALL STAGE                           */}
      {/* ============================================================== */}
      {screenState === 'matched' && (
        <SafeAreaView style={styles.matchedStage}>
          {/* Top Bar: Timer, Toast, +30s CTA */}
          <View style={styles.timerBar}>
            <View
              style={[
                styles.timerBadge,
                timeLeft <= 10 && timeLeft > 5 && styles.timerBadgeWarning,
                timeLeft <= 5 && styles.timerBadgeUrgent,
              ]}
            >
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>

            {timeToast ? (
              <View style={styles.timeToastBadge}>
                <Text style={styles.timeToastText}>{timeToast}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleAddTime}
              style={[styles.extendButton, hasRequestedTime && styles.extendButtonDisabled]}
              activeOpacity={0.8}
              disabled={hasRequestedTime}
            >
              <Text style={styles.extendButtonText}>
                {hasRequestedTime ? 'Requested...' : '+30s (10 Tokens)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Incoming Time Request Prompt Banner */}
          {incomingTimeRequest && (
            <View style={styles.incomingRequestBanner}>
              <View style={styles.incomingRequestInfo}>
                <Text style={styles.incomingRequestTitle}>Partner requested +{incomingTimeRequest.seconds}s</Text>
                <Text style={styles.incomingRequestSub}>Extend this conversation?</Text>
              </View>
              <View style={styles.incomingRequestActions}>
                <TouchableOpacity
                  onPress={handleAcceptExtension}
                  style={styles.acceptRequestBtn}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#000000" />
                  <Text style={styles.acceptRequestBtnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeclineExtension}
                  style={styles.declineRequestBtn}
                  activeOpacity={0.8}
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Dual Split Stage (Live WebRTC Streams) */}
          <View style={styles.splitStage}>
            {matchData ? (
              <NativeWebRTCStream
                ref={webRTCStreamRef}
                roomId={matchData.roomId}
                role={matchData.role}
                mode={matchData.mode || talkMode}
                partnerName={matchData.partnerMeta?.displayName || 'Stranger'}
                onSendSignal={(type, data) => {
                  nativeSignaling.sendSignal(matchData.roomId, type, data);
                }}
              />
            ) : null}
          </View>

          {/* Bottom Call Controls */}
          <View style={styles.callControls}>
            {/* Mute Mic */}
            <TouchableOpacity
              onPress={() => {
                const newMuted = !isAudioMuted;
                setIsAudioMuted(newMuted);
                webRTCStreamRef.current?.toggleMute(newMuted);
              }}
              style={[styles.controlCircle, isAudioMuted && styles.controlCircleMuted]}
              activeOpacity={0.8}
            >
              <Mic size={20} color={isAudioMuted ? '#ef4444' : '#ffffff'} />
            </TouchableOpacity>

            {/* Audio Route (Speaker vs Earpiece) */}
            <TouchableOpacity
              onPress={toggleAudioRoute}
              style={[styles.controlCircle, audioRoute === 'speaker' && styles.controlCircleActive]}
              activeOpacity={0.8}
            >
              <Volume2 size={20} color={audioRoute === 'speaker' ? '#10b981' : '#a3a3a3'} />
            </TouchableOpacity>

            {/* Camera Flip (during call) */}
            {talkMode === 'video' && (
              <TouchableOpacity
                onPress={toggleCameraFacing}
                style={styles.controlCircle}
                activeOpacity={0.8}
              >
                <RefreshCw size={18} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.85}
            >
              <Text style={styles.skipButtonText}>Skip ➔</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topActionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) + 16 : 54,
    right: 20,
    zIndex: 20,
  },
  flipGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1f1a0e',
    borderWidth: 1,
    borderColor: '#78350f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionSubtitle: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionPrimaryBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPrimaryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  permissionSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  permissionSecondaryBtnText: {
    color: '#a3a3a3',
    fontSize: 13,
    fontWeight: '600',
  },
  audioOnlyScreen: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  audioOrbOuter: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  audioOrbCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  audioOrbTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  audioOrbSub: {
    color: '#737373',
    fontSize: 13,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'android' ? 30 : 42,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 18,
  },
  heroTextContainer: {
    gap: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSub: {
    color: '#a3a3a3',
    fontSize: 13,
    lineHeight: 18,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#262626',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeButtonText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  radarWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  radarCenterOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  searchMeta: {
    alignItems: 'center',
    gap: 6,
  },
  searchingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchingSub: {
    color: '#737373',
    fontSize: 13,
    textAlign: 'center',
  },
  cancelSearchButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelSearchText: {
    color: '#d4d4d4',
    fontSize: 13,
    fontWeight: '600',
  },
  matchedStage: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timerBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timerBadgeWarning: {
    backgroundColor: '#f59e0b',
  },
  timerBadgeUrgent: {
    backgroundColor: '#dc2626',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  timeToastBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  timeToastText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  extendButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  extendButtonDisabled: {
    backgroundColor: '#332a15',
    opacity: 0.7,
  },
  extendButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  incomingRequestBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  incomingRequestInfo: {
    gap: 2,
  },
  incomingRequestTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  incomingRequestSub: {
    color: '#a3a3a3',
    fontSize: 11,
  },
  incomingRequestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptRequestBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  declineRequestBtn: {
    backgroundColor: '#262626',
    padding: 6,
    borderRadius: 8,
  },
  splitStage: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  remoteTile: {
    flex: 1,
    backgroundColor: '#171717',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  voiceTileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  voiceAvatarText: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '900',
  },
  remoteName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  remoteSub: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  localTile: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  localAudioText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  callControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  controlCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCircleActive: {
    borderColor: '#10b981',
    borderWidth: 1,
  },
  controlCircleMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  skipButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
