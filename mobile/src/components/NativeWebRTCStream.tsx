import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface NativeWebRTCStreamRef {
  handleRemoteSignal: (signal: { type: 'offer' | 'answer' | 'candidate'; data: any }) => void;
  toggleMute: (isMuted: boolean) => void;
}

interface NativeWebRTCStreamProps {
  roomId: string;
  role: 'initiator' | 'receiver';
  mode: 'video' | 'audio';
  partnerName?: string;
  onSendSignal: (type: 'offer' | 'answer' | 'candidate', data: any) => void;
  onConnected?: () => void;
}

const WEBRTC_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #0a0a0a; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .split-wrapper { display: flex; flex-direction: column; width: 100%; height: 100%; gap: 10px; padding: 4px; }
    .tile { flex: 1; border-radius: 20px; overflow: hidden; background: #141414; position: relative; border: 1px solid #262626; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.65); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; backdrop-filter: blur(4px); letter-spacing: 0.3px; }
    .status-overlay { position: absolute; color: #a3a3a3; font-size: 13px; font-weight: 600; text-align: center; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="split-wrapper">
    <!-- Top Tile: Remote Partner -->
    <div class="tile" id="remoteTile">
      <video id="remoteVideo" autoplay playsinline></video>
      <div class="status-overlay" id="remoteStatus">
        <div class="spinner"></div>
        Connecting media stream...
      </div>
      <div class="badge" id="remoteLabel">Partner</div>
    </div>

    <!-- Bottom Tile: Local Self View -->
    <div class="tile" id="localTile">
      <video id="localVideo" autoplay playsinline muted></video>
      <div class="badge">You (Live)</div>
    </div>
  </div>

  <script>
    let pc = null;
    let localStream = null;
    const pendingCandidates = [];

    const ICE_CONFIG = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    };

    function sendToNative(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    async function initWebRTC(role, mode, partnerName) {
      try {
        if (partnerName) {
          document.getElementById('remoteLabel').innerText = partnerName;
        }

        // Ensure navigator.mediaDevices compatibility
        if (!navigator.mediaDevices) {
          navigator.mediaDevices = {};
        }
        if (!navigator.mediaDevices.getUserMedia) {
          const legacyGUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          if (legacyGUM) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
              return new Promise(function(resolve, reject) {
                legacyGUM.call(navigator, constraints, resolve, reject);
              });
            };
          }
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device access API is not available on this webview context.');
        }

        const isAudioOnly = mode === 'audio';
        localStream = await navigator.mediaDevices.getUserMedia({
          video: isAudioOnly ? false : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });

        const localVid = document.getElementById('localVideo');
        localVid.srcObject = localStream;
        await localVid.play().catch(() => {});

        pc = new RTCPeerConnection(ICE_CONFIG);

        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            sendToNative({ type: 'candidate', data: e.candidate });
          }
        };

        pc.ontrack = (e) => {
          const remoteVid = document.getElementById('remoteVideo');
          if (e.streams && e.streams[0]) {
            remoteVid.srcObject = e.streams[0];
          } else {
            if (!remoteVid.srcObject) {
              remoteVid.srcObject = new MediaStream();
            }
            remoteVid.srcObject.addTrack(e.track);
          }
          remoteVid.play().catch(() => {});
          document.getElementById('remoteStatus').style.display = 'none';
          sendToNative({ type: 'connected' });
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            document.getElementById('remoteStatus').style.display = 'none';
            sendToNative({ type: 'connected' });
          }
        };

        // Drain any pending candidates
        while (pendingCandidates.length > 0) {
          const c = pendingCandidates.shift();
          pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }

        if (role === 'initiator') {
          setTimeout(async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendToNative({ type: 'offer', data: offer });
            } catch (err) {
              console.error('Error creating offer:', err);
            }
          }, 300);
        }
      } catch (err) {
        console.error('getUserMedia / WebRTC error:', err);
        document.getElementById('remoteStatus').innerText = 'Camera error: ' + err.message;
      }
    }

    window.handleRemoteSignal = async (signal) => {
      try {
        if (!pc) {
          if (signal.type === 'candidate') {
            pendingCandidates.push(signal.data);
          }
          return;
        }

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendToNative({ type: 'answer', data: answer });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        } else if (signal.type === 'candidate') {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
          } else {
            pendingCandidates.push(signal.data);
          }
        }
      } catch (err) {
        console.error('Error handling remote signal:', err);
      }
    };

    window.toggleMute = (isMuted) => {
      if (localStream) {
        localStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
      }
    };
  </script>
</body>
</html>
`;

export const NativeWebRTCStream = forwardRef<NativeWebRTCStreamRef, NativeWebRTCStreamProps>(
  ({ roomId, role, mode, partnerName, onSendSignal, onConnected }, ref) => {
    const webViewRef = useRef<any>(null);
    const RNCWebView = WebView as any;

    useImperativeHandle(ref, () => ({
      handleRemoteSignal: (signal) => {
        const js = `window.handleRemoteSignal && window.handleRemoteSignal(${JSON.stringify(signal)}); true;`;
        webViewRef.current?.injectJavaScript(js);
      },
      toggleMute: (isMuted) => {
        const js = `window.toggleMute && window.toggleMute(${isMuted}); true;`;
        webViewRef.current?.injectJavaScript(js);
      },
    }));

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'candidate') {
          onSendSignal(msg.type, msg.data);
        } else if (msg.type === 'connected') {
          onConnected?.();
        }
      } catch (e) {
        console.log('[NativeWebRTCStream] Message parse error:', e);
      }
    };

    const onLoadEnd = () => {
      const initJs = `initWebRTC("${role}", "${mode}", "${partnerName || 'Stranger'}"); true;`;
      webViewRef.current?.injectJavaScript(initJs);
    };

    return (
      <View style={styles.container}>
        <RNCWebView
          ref={webViewRef}
          source={{
            html: WEBRTC_HTML,
            baseUrl: 'https://localhost',
          }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          androidHardwareAccelerationDisabled={false}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
