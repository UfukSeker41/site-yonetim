// WebRTC Service
let localStream = null;
let peerConnections = {};

const config = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] }
  ]
};

export const getLocalStream = async (videoEnabled = true, audioEnabled = true) => {
  try {
    if (localStream) {
      console.log('⚡ Mevcut stream döndürülüyor');
      return localStream;
    }

    const constraints = {
      video: videoEnabled ? {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false,
      audio: audioEnabled ? {
        echoCancellation: true,
        noiseSuppression: true
      } : false
    };

    console.log('📹 getUserMedia çağrılıyor:', constraints);
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ getUserMedia başarılı, tracks:', {
      video: localStream.getVideoTracks().length,
      audio: localStream.getAudioTracks().length
    });
    return localStream;
  } catch (error) {
    console.error('❌ Kamera/Mikrofon erişimi başarısız:', error);
    throw error;
  }
};

export const stopLocalStream = () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
};

export const toggleAudio = (enabled) => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
};

export const toggleVideo = (enabled) => {
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
};

export const createPeerConnection = (peerId, onIceCandidate, onTrack) => {
  const peerConnection = new RTCPeerConnection({ iceServers: config.iceServers });

  // Add local stream tracks
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(peerId, event.candidate);
    }
  };

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log('Remote track received:', event.track.kind);
    onTrack(peerId, event.streams[0]);
  };

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log(`Connection state with ${peerId}:`, peerConnection.connectionState);
    if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
      closePeerConnection(peerId);
    }
  };

  peerConnections[peerId] = peerConnection;
  return peerConnection;
};

export const createOffer = async (peerId, peerConnection) => {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error('Offer oluşturma hatası:', error);
    throw error;
  }
};

export const createAnswer = async (peerId, offer, peerConnection) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error('Answer oluşturma hatası:', error);
    throw error;
  }
};

export const addAnswer = async (peerId, answer, peerConnection) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Answer ayarlama hatası:', error);
    throw error;
  }
};

export const addIceCandidate = async (peerId, candidate, peerConnection) => {
  try {
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error('ICE candidate ekleme hatası:', error);
  }
};

export const closePeerConnection = (peerId) => {
  if (peerConnections[peerId]) {
    peerConnections[peerId].close();
    delete peerConnections[peerId];
  }
};

export const closeAllPeerConnections = () => {
  Object.keys(peerConnections).forEach(peerId => {
    closePeerConnection(peerId);
  });
};

export const getPeerConnection = (peerId) => {
  return peerConnections[peerId];
};

export const getLocalStream_ = () => {
  return localStream;
};
