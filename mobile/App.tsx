import React, { useRef, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';

const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_APP_URL || 'https://nongerminating-amir-unextravasated.ngrok-free.dev';

// Standard mobile Chrome User-Agent to ensure Clerk & Google OAuth load directly in-app
const WebViewAny = WebView as any;

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36';

const INJECTED_JAVASCRIPT = `
(function() {
  // Intercept window.open so all navigation stays inside the app
  window.open = function(url) {
    if (url) {
      window.location.href = url;
    }
    return window;
  };

  // Automatically bypass ngrok warning interstitial if present
  try {
    document.cookie = "ngrok-skip-browser-warning=true; path=/; max-age=31536000";
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].innerText && buttons[i].innerText.toLowerCase().indexOf('visit site') !== -1) {
        buttons[i].click();
        break;
      }
    }
  } catch (e) {}
})();
true;
`;

export default function App() {
  const [currentUri, setCurrentUri] = useState<string>(DEFAULT_BASE_URL);
  const webViewRef = useRef<any>(null);
  const canGoBackRef = useRef<boolean>(false);

  // Request native camera & microphone permissions via Expo Camera module
  useEffect(() => {
    async function requestExpoPermissions() {
      try {
        await Camera.requestCameraPermissionsAsync();
        await Camera.requestMicrophonePermissionsAsync();
      } catch (err) {
        console.warn('[Mobile] Error requesting Expo camera/mic permissions:', err);
      }
    }
    requestExpoPermissions();
  }, []);

  // Handle hardware Android back button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Listen to deep link redirects (e.g. from OAuth callbacks or magic links)
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      let incomingUrl = event.url;
      if (!incomingUrl) return;

      if (incomingUrl.startsWith('supertime://')) {
        const path = incomingUrl.replace('supertime://', '');
        incomingUrl = `${DEFAULT_BASE_URL}/${path.replace(/^\//, '')}`;
      }

      if (incomingUrl.startsWith('http://') || incomingUrl.startsWith('https://')) {
        setCurrentUri(incomingUrl);
        webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(incomingUrl)}; true;`);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  const isInternalOrAuthUrl = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.includes('ngrok-free.dev') ||
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('supertime.wtf') ||
      lower.includes('clerk.accounts.dev') ||
      lower.includes('clerk.com') ||
      lower.includes('accounts.google.com') ||
      lower.includes('google.com') ||
      lower.includes('gstatic.com') ||
      lower.includes('appleid.apple.com') ||
      lower.includes('github.com') ||
      lower.startsWith('/') ||
      lower.startsWith('about:blank') ||
      lower.startsWith('data:')
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <WebViewAny
            ref={webViewRef}
            source={{
              uri: currentUri,
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            }}
            style={styles.webView}
            originWhitelist={['*']}
            // Hardware acceleration & high performance 60fps rendering
            androidLayerType="hardware"
            overScrollMode="never"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            mediaCapturePermissionGrantType="grant"
            setSupportMultipleWindows={false}
            injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
            userAgent={MOBILE_USER_AGENT}
            onShouldStartLoadWithRequest={(request: any) => {
              const url = request.url;
              // Keep all internal routes, Clerk, Google & OAuth flows inside the app
              if (isInternalOrAuthUrl(url)) {
                return true;
              }
              // External links (social media, third-party sites) open via system browser
              Linking.openURL(url).catch((err) => console.warn('[Mobile] Could not open URL:', err));
              return false;
            }}
            onNavigationStateChange={(navState: any) => {
              canGoBackRef.current = navState.canGoBack;
            }}
            pullToRefreshEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Loading Supertime...</Text>
              </View>
            )}
            renderError={(errorDomain: any, errorCode: any, errorDesc: any) => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to connect to Supertime</Text>
                <Text style={styles.errorSubText}>{errorDesc || errorCode}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => webViewRef.current?.reload()}
                >
                  <Text style={styles.retryText}>Tap to Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  permBanner: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ef4444',
  },
  permText: {
    color: '#fecaca',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  permButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  permButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#a3a3a3',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorSubText: {
    color: '#737373',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
