// Meeting Room Page Component
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingsAPI } from '../services/api';
import {
  joinMeeting,
  leaveMeeting,
  sendMessage,
  onSocketEvent,
  offSocketEvent,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  getSocket
} from '../services/socket';
import {
  getLocalStream,
  stopLocalStream,
  toggleAudio as rtcToggleAudio,
  toggleVideo as rtcToggleVideo,
  createPeerConnection,
  createOffer,
  createAnswer,
  addAnswer,
  addIceCandidate,
  closeAllPeerConnections,
  getPeerConnection,
  getLocalStream_
} from '../services/webrtc';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Send,
  Users,
  MessageSquare,
  Settings,
  AlertCircle
} from 'lucide-react';

const MeetingRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [meeting, setMeeting] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    fetchMeetingData();

    // Socket event listeners - async wait
    const setupSocketListeners = async () => {
      // Socket hazırlanması için biraz bekle
      let attempt = 0;
      while (attempt < 10) {
        try {
          const socketInstance = getSocket();
          if (socketInstance?.connected) {
            console.log('✅ Socket hazırlandı, listeners ekleniyor');
            break;
          }
        } catch (e) {
          // Socket henüz hazır değil
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempt++;
      }
      
      // Listeners ekle
      onSocketEvent('meeting:joined', handleMeetingJoined);
      onSocketEvent('meeting:user-joined', handleUserJoined);
      onSocketEvent('meeting:user-left', handleUserLeft);
      onSocketEvent('meeting:message', handleNewMessage);
      onSocketEvent('meeting:ended', handleMeetingEnded);
      onSocketEvent('webrtc:offer', handleWebRTCOffer);
      onSocketEvent('webrtc:answer', handleWebRTCAnswer);
      onSocketEvent('webrtc:ice-candidate', handleWebRTCIceCandidate);
      
      // Toplantıya katıl
      joinMeetingRoom();
    };

    setupSocketListeners();

    return () => {
      leaveMeetingRoom();
      offSocketEvent('meeting:joined', handleMeetingJoined);
      offSocketEvent('meeting:user-joined', handleUserJoined);
      offSocketEvent('meeting:user-left', handleUserLeft);
      offSocketEvent('meeting:message', handleNewMessage);
      offSocketEvent('meeting:ended', handleMeetingEnded);
      offSocketEvent('webrtc:offer', handleWebRTCOffer);
      offSocketEvent('webrtc:answer', handleWebRTCAnswer);
      offSocketEvent('webrtc:ice-candidate', handleWebRTCIceCandidate);
      
      // Cleanup
      stopLocalStream();
      closeAllPeerConnections();
    };
  }, [roomId]);

  // Video toplantı başladığında kamera başlat
  useEffect(() => {
    if (meeting?.meetingType === 'video' && !loading) {
      // Video element DOM'a mount olması için küçük delay
      const timer = setTimeout(() => {
        console.log('⏱️ Timeout sonrası startLocalStream çağrılıyor');
        startLocalStream();
      }, 500);

      return () => clearTimeout(timer);
    }

    return () => {
      if (meeting?.meetingType === 'video') {
        stopLocalStream();
      }
    };
  }, [meeting?.meetingType, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Remote streams'i video elements'e set et
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      if (stream && remoteVideoRefs.current[userId]) {
        remoteVideoRefs.current[userId].srcObject = stream;
        console.log('✅ Remote stream set to video element:', userId);
      }
    });
  }, [remoteStreams]);

  const fetchMeetingData = async () => {
    try {
      const response = await meetingsAPI.getByRoomId(roomId);
      console.log('📥 Meeting API yanıtı:', response);
      
      if (response.success) {
        console.log('📦 Meeting data:', response.data.meeting);
        console.log('📋 Meeting type:', response.data.meeting?.meetingType);
        setMeeting(response.data.meeting);
        if (response.data.meeting.messages) {
          setMessages(response.data.meeting.messages);
        }
      }
    } catch (error) {
      console.error('❌ Meeting fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinMeetingRoom = () => {
    joinMeeting(roomId);
  };

  const leaveMeetingRoom = () => {
    leaveMeeting(roomId);
  };

  const handleMeetingJoined = useCallback((data) => {
    console.log('✅ Toplantıya başarıyla katıldı:', data);
    if (data.participants) {
      // Kendi kendini filtrele - sadece diğer kullanıcıları ekle
      const otherParticipants = data.participants.filter(p => p.userId !== user.id);
      setParticipants(otherParticipants);
      console.log('📋 Diğer katılımcılar set edildi:', otherParticipants);
    }
  }, [user.id]);

  const startLocalStream = async () => {
    try {
      setCameraError(null);
      console.log('🎥 Kamera başlatılıyor...', { videoEnabled, audioEnabled });
      
      const stream = await getLocalStream(videoEnabled, audioEnabled);
      console.log('✅ Stream alındı:', stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('✅ Video element akışına atandı');
        
        // Oynatmaya başla
        try {
          await localVideoRef.current.play();
          console.log('▶️ Video oynatılıyor');
        } catch (playError) {
          console.warn('⚠️ Otomatik oynatma başarısız:', playError);
        }
      } else {
        console.warn('⚠️ localVideoRef.current undefined');
      }

      // Video toplantıda diğer katılımcılarla WebRTC bağlantı kur
      if (meeting?.meetingType === 'video' && participants.length > 0) {
        console.log('🔗 WebRTC başlatılıyor...');
        await initiateWebRTC();
      }
    } catch (error) {
      console.error('❌ Kamera başlatma hatası:', error);
      
      let errorMsg = 'Kamera erişimi reddedildi';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Kamera erişim izni reddedildi. Tarayıcı ayarlarını kontrol edin.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Bağlı kamera bulunamadı';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Kamera başka bir uygulama tarafından kullanılıyor';
      }
      
      setCameraError(errorMsg);
    }
  };

  const initiateWebRTC = async () => {
    try {
      // Her katılımcı için peer connection oluştur
      for (const participant of participants) {
        if (participant.userId !== user.id) {
          const peerConnection = createPeerConnection(
            participant.userId,
            (peerId, candidate) => {
              sendIceCandidate(roomId, candidate, peerId);
            },
            (peerId, stream) => {
              console.log('📹 Remote stream received (initiateWebRTC), setting state:', peerId);
              setRemoteStreams(prev => ({
                ...prev,
                [peerId]: stream
              }));
            }
          );

          // Offer oluştur ve gönder
          const offer = await createOffer(participant.userId, peerConnection);
          console.log('📤 Offer oluşturuldu, gönderiliyor:', participant.userId);
          sendOffer(roomId, offer, participant.userId);
          console.log('✅ Offer gönderildi:', participant.userId);
        }
      }
    } catch (error) {
      console.error('WebRTC başlatma hatası:', error);
    }
  };

  const handleWebRTCOffer = useCallback(async ({ offer, from, fromName }) => {
    try {
      console.log('📥 WebRTC Offer alındı:', from);
      let peerConnection = getPeerConnection(from);
      
      if (!peerConnection) {
        peerConnection = createPeerConnection(
          from,
          (peerId, candidate) => {
            sendIceCandidate(roomId, candidate, peerId);
          },
          (peerId, stream) => {
            console.log('📹 Remote stream received, setting state:', peerId);
            setRemoteStreams(prev => ({
              ...prev,
              [peerId]: stream
            }));
          }
        );
      }

      // Answer oluştur
      const answer = await createAnswer(from, offer, peerConnection);
      console.log('📤 Answer oluşturuldu, gönderiliyor:', from);
      sendAnswer(roomId, answer, from);
      console.log('✅ Answer gönderildi:', from);
    } catch (error) {
      console.error('WebRTC answer hatası:', error);
    }
  }, [roomId]);

  const handleWebRTCAnswer = useCallback(async ({ answer, from }) => {
    try {
      console.log('📤 WebRTC Answer alındı:', from);
      const peerConnection = getPeerConnection(from);
      if (peerConnection) {
        await addAnswer(from, answer, peerConnection);
      }
    } catch (error) {
      console.error('WebRTC answer işleme hatası:', error);
    }
  }, []);

  const handleWebRTCIceCandidate = useCallback(async ({ candidate, from }) => {
    try {
      const peerConnection = getPeerConnection(from);
      if (peerConnection) {
        await addIceCandidate(from, candidate, peerConnection);
      }
    } catch (error) {
      console.error('ICE candidate hatası:', error);
    }
  }, []);

  const handleUserJoined = useCallback(async (user) => {
    console.log('👤 Kullanıcı katıldı:', user);
    
    // Duplicate kontrol - kullanıcı zaten varsa ekleme
    setParticipants(prev => {
      const exists = prev.some(p => p.userId === user.userId);
      if (exists) {
        console.log('⚠️ Kullanıcı zaten listede var:', user.userId);
        return prev;
      }
      return [...prev, user];
    });
    
    // Sistem mesajı ekle
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: `${user.fullName} toplantıya katıldı`,
      messageType: 'system',
      timestamp: new Date()
    }]);

    // Video toplantıda yeni katılımcı için peer connection kur
    if (meeting?.meetingType === 'video') {
      console.log('🔗 Yeni katılımcı için WebRTC başlatılıyor:', user.userId);
      const peerConnection = createPeerConnection(
        user.userId,
        (peerId, candidate) => {
          sendIceCandidate(roomId, candidate, peerId);
        },
        (peerId, stream) => {
          console.log('📹 Remote stream received (handleUserJoined), setting state:', peerId);
          setRemoteStreams(prev => ({
            ...prev,
            [peerId]: stream
          }));
        }
      );

      const offer = await createOffer(user.userId, peerConnection);
      console.log('📤 Offer oluşturuldu (yeni katılımcı), gönderiliyor:', user.userId);
      sendOffer(roomId, offer, user.userId);
      console.log('✅ Offer gönderildi (yeni katılımcı):', user.userId);
    }
  }, [meeting?.meetingType, roomId, user.id]);

  const handleUserLeft = useCallback((user) => {
    console.log('👋 Kullanıcı ayrıldı:', user);
    setParticipants(prev => prev.filter(p => p.userId !== user.userId));
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[user.userId];
      return updated;
    });
    
    // Sistem mesajı ekle
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: `${user.fullName} toplantıdan ayrıldı`,
      messageType: 'system',
      timestamp: new Date()
    }]);
  }, []);

  const handleNewMessage = useCallback((message) => {
    console.log('💬 Yeni mesaj:', message);
    setMessages(prev => [...prev, message]);
  }, []);

  const handleMeetingEnded = useCallback(() => {
    console.log('⏹️ Toplantı sonlandırıldı');
    alert('Toplantı sonlandırıldı');
    navigate('/meetings');
  }, [navigate]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    sendMessage(roomId, newMessage.trim());
    setNewMessage('');
    messageInputRef.current?.focus();
  };

  const handleLeaveMeeting = () => {
    if (confirm('Toplantıdan ayrılmak istediğinizden emin misiniz?')) {
      leaveMeetingRoom();
      navigate('/meetings');
    }
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    rtcToggleAudio(newState);
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    rtcToggleVideo(newState);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '--:--';
    }
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-zinc-400 mt-4">Toplantıya bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Toplantı Bulunamadı</h2>
        <button
          onClick={() => navigate('/meetings')}
          className="text-blue-400 hover:text-blue-300"
        >
          Toplantılara Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Header */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
            <p className="text-zinc-400">{meeting.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              meeting.meetingType === 'video' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {meeting.meetingType === 'video' ? '📹 Video Toplantı' : '💬 Chat Toplantısı'}
            </span>
            {meeting.status === 'ongoing' && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Devam Ediyor
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video/Main Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Container */}
          <div className="bg-black rounded-lg border border-zinc-700 aspect-video flex items-center justify-center relative overflow-hidden group shadow-2xl">
            {meeting.meetingType === 'video' ? (
              <div className="w-full h-full relative bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
                {/* Local Video */}
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 font-semibold mb-2">Kamera Hatası</p>
                      <p className="text-zinc-400 text-sm max-w-xs">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {!videoEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl ring-4 ring-blue-500/20">
                            <span className="text-white text-6xl font-bold">
                              {user?.fullName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-white text-lg font-semibold">{user?.fullName}</p>
                          <p className="text-zinc-400 text-sm mt-1">📹 Kamera Kapalı</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Remote Videos Grid */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="w-28 h-28 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-lg border-2 border-zinc-600 flex items-center justify-center flex-col shadow-lg overflow-hidden"
                    >
                      {remoteStreams[participant.userId] ? (
                        <video
                          ref={el => remoteVideoRefs.current[participant.userId] = el}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-green-400/30">
                            {participant.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <p className="text-xs text-white mt-2 text-center truncate px-1 font-medium">
                            {participant.fullName || 'Katılımcı'}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Indicator */}
                {meeting.status === 'ongoing' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/30">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400 font-semibold">
                      Canlı Yayın
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
                <div className="text-center z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white text-lg font-semibold">💬 Chat Toplantısı</p>
                  <p className="text-zinc-400 text-sm mt-2">Mesajlaşma üzerinden toplantı</p>
                  <div className="mt-6 flex items-center justify-center gap-2 bg-zinc-800/50 rounded-full px-4 py-2 text-xs text-zinc-300">
                    <Users className="w-4 h-4" />
                    <span>{participants.length} katılımcı</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 p-4 shadow-lg">
            <div className="flex items-center justify-center gap-4">
              {meeting.meetingType === 'video' && (
                <>
                  <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                      audioEnabled 
                        ? 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/50'
                    }`}
                    title={audioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
                  >
                    {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                      videoEnabled 
                        ? 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/50'
                    }`}
                    title={videoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                  >
                    {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </button>
                </>
              )}

              <button
                onClick={handleLeaveMeeting}
                className="p-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/30"
                title="Toplantıdan Ayrıl"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                className="p-4 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white transition-all transform hover:scale-110 shadow-lg"
                title="Ayarlar"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Participants */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 shadow-lg">
            <div className="p-4 border-b border-zinc-700 flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-transparent">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">
                Katılımcılar ({participants.length + 1})
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {/* Current user */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/10 rounded-lg p-3 border border-blue-500/20">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{user?.fullName}</p>
                  <p className="text-blue-400 text-xs font-semibold">Siz (Host)</p>
                </div>
              </div>

              {/* Other participants */}
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-lg p-3 border border-green-500/20 hover:border-green-500/40 transition-all">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                    {participant.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{participant.fullName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 flex flex-col h-[400px] shadow-lg">
            <div className="p-4 border-b border-zinc-700 flex items-center gap-2 bg-gradient-to-r from-green-600/10 to-transparent">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Sohbet</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => {
                if (message.messageType === 'system') {
                  return (
                    <div key={message.id} className="text-center">
                      <p className="text-zinc-500 text-xs italic">{message.content}</p>
                    </div>
                  );
                }

                const isOwn = message.userId === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 shadow-md ${isOwn ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-zinc-700 to-zinc-600'}`}>
                      {!isOwn && (
                        <p className="text-blue-300 text-xs mb-1 font-semibold">{message.fullName}</p>
                      )}
                      <p className="text-white text-sm leading-snug">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-zinc-400'}`}>
                        {formatTime(message.timestamp || message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-700 bg-gradient-to-r from-zinc-700/20 to-transparent">
              <div className="flex gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoomPage;
