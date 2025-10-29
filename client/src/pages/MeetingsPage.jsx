// Meetings List Page Component
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingsAPI } from '../services/api';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import {
  Video,
  Plus,
  Clock,
  Users,
  MessageSquare,
  Play,
  Calendar,
  Filter
} from 'lucide-react';

const MeetingsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchMeetings();

    // Real-time updates
    onSocketEvent('meeting:created', handleNewMeeting);
    onSocketEvent('meeting:started', handleMeetingStarted);
    onSocketEvent('meeting:ended', handleMeetingEnded);

    return () => {
      offSocketEvent('meeting:created', handleNewMeeting);
      offSocketEvent('meeting:started', handleMeetingStarted);
      offSocketEvent('meeting:ended', handleMeetingEnded);
    };
  }, [filterStatus]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const response = await meetingsAPI.getAll(params);
      
      if (response.success) {
        setMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error('Meetings fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMeeting = (meeting) => {
    setMeetings(prev => [meeting, ...prev]);
  };

  const handleMeetingStarted = (data) => {
    setMeetings(prev =>
      prev.map(m => m.id === data.id ? { ...m, status: 'ongoing' } : m)
    );
  };

  const handleMeetingEnded = (data) => {
    setMeetings(prev =>
      prev.map(m => m.id === data.id ? { ...m, status: 'completed' } : m)
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'PLANLI' },
      ongoing: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'DEVAM EDİYOR' },
      completed: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'TAMAMLANDI' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'İPTAL' }
    };
    return badges[status] || badges.scheduled;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-green-500" />
            Toplantılar
          </h1>
          <p className="text-zinc-400 mt-2">Site toplantılarını görüntüleyin ve katılın</p>
        </div>

        {isAdmin() && (
          <Link
            to="/admin/meetings"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Toplantı
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-zinc-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tüm Toplantılar</option>
            <option value="scheduled">Planlanmış</option>
            <option value="ongoing">Devam Eden</option>
            <option value="completed">Tamamlanmış</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-zinc-400 mt-4">Yükleniyor...</p>
          </div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-12 text-center">
          <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Toplantı Bulunamadı</h3>
          <p className="text-zinc-400">Henüz hiç toplantı planlanmamış</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((meeting) => {
            const status = getStatusBadge(meeting.status);
            const canJoin = meeting.status === 'ongoing' || meeting.status === 'scheduled';

            return (
              <div
                key={meeting.id}
                className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        meeting.meetingType === 'video' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {meeting.meetingType === 'video' ? 'Video' : 'Chat'}
                      </span>
                    </div>
                  </div>
                </div>

                {meeting.description && (
                  <p className="text-zinc-400 text-sm mb-4">{meeting.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(meeting.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>Host: {meeting.host?.fullName || 'Bilinmiyor'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Room ID: {meeting.roomId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
                  {canJoin ? (
                    <button
                      onClick={() => navigate(`/meetings/${meeting.roomId}`)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Toplantıya Katıl
                    </button>
                  ) : (
                    <span className="text-zinc-500 text-sm">
                      {meeting.status === 'completed' ? 'Tamamlandı' : 'Katılım Kapalı'}
                    </span>
                  )}

                  {meeting.status === 'ongoing' && (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Canlı
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
