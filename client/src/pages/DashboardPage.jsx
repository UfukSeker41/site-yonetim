// Dashboard Page Component
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { announcementsAPI, meetingsAPI } from '../services/api';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import {
  Megaphone,
  Video,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    totalMeetings: 0,
    upcomingMeetings: 0,
    urgentAnnouncements: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Socket event listeners
    onSocketEvent('announcement:new', handleNewAnnouncement);
    onSocketEvent('meeting:created', handleNewMeeting);

    return () => {
      offSocketEvent('announcement:new', handleNewAnnouncement);
      offSocketEvent('meeting:created', handleNewMeeting);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [announcementsRes, meetingsRes] = await Promise.all([
        announcementsAPI.getAll({ limit: 5 }),
        meetingsAPI.getAll({ status: 'scheduled' })
      ]);

      if (announcementsRes.success) {
        const announcements = announcementsRes.data.announcements;
        setRecentAnnouncements(announcements);
        
        const urgentCount = announcements.filter(a => a.priority === 'urgent' || a.priority === 'high').length;
        
        setStats(prev => ({
          ...prev,
          totalAnnouncements: announcementsRes.data.pagination.total,
          urgentAnnouncements: urgentCount
        }));
      }

      if (meetingsRes.success) {
        const meetings = meetingsRes.data.meetings;
        setUpcomingMeetings(meetings.slice(0, 5));
        
        setStats(prev => ({
          ...prev,
          totalMeetings: meetings.length,
          upcomingMeetings: meetings.filter(m => m.status === 'scheduled').length
        }));
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnnouncement = (announcement) => {
    setRecentAnnouncements(prev => [announcement, ...prev.slice(0, 4)]);
    setStats(prev => ({
      ...prev,
      totalAnnouncements: prev.totalAnnouncements + 1
    }));
    
    // Bildirim gönder
    addNotification({
      type: 'info',
      title: 'Yeni Duyuru',
      message: announcement.title,
      autoClose: true
    });
  };

  const handleNewMeeting = (meeting) => {
    setUpcomingMeetings(prev => [meeting, ...prev.slice(0, 4)]);
    setStats(prev => ({
      ...prev,
      totalMeetings: prev.totalMeetings + 1,
      upcomingMeetings: prev.upcomingMeetings + 1
    }));
    
    // Bildirim gönder
    addNotification({
      type: 'warning',
      title: 'Yeni Toplantı Planlandı',
      message: meeting.title,
      autoClose: true
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-500 bg-red-500/10',
      high: 'text-orange-500 bg-orange-500/10',
      medium: 'text-yellow-500 bg-yellow-500/10',
      low: 'text-green-500 bg-green-500/10'
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-zinc-400 mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Hoş Geldiniz, {user?.fullName}!
        </h1>
        <p className="text-blue-100">
          {isAdmin() ? 'Yönetici Paneline Hoş Geldiniz' : `Daire: ${user?.apartmentNumber || 'N/A'}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-lg p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">Toplam Duyuru</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.totalAnnouncements}</p>
            </div>
            <Megaphone className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-green-600/20 rounded-lg p-6 border border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Yaklaşan Toplantı</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.upcomingMeetings}</p>
            </div>
            <Video className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-600/20 rounded-lg p-6 border border-red-500/30 hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm font-medium">Acil Duyurular</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.urgentAnnouncements}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/20 rounded-lg p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Aktif Durum</p>
              <p className="text-green-400 text-xl font-bold mt-2">Çevrimiçi</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Recent Announcements and Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <div className="p-6 border-b border-zinc-700 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-blue-400" />
              Son Duyurular
            </h2>
            <Link
              to="/announcements"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentAnnouncements.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Henüz duyuru yok</p>
            ) : (
              recentAnnouncements.map((announcement) => (
                <Link
                  key={announcement.id}
                  to={`/announcements/${announcement.id}`}
                  className="block bg-gradient-to-r from-zinc-700/50 to-zinc-700/20 hover:from-zinc-700 hover:to-zinc-700/40 rounded-lg p-4 transition-all border border-zinc-600/30 hover:border-zinc-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium flex-1 line-clamp-1">{announcement.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-2 ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm line-clamp-2 mb-3 leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <div className="p-6 border-b border-zinc-700 flex items-center justify-between bg-gradient-to-r from-green-600/10 to-transparent">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-green-400" />
              Yaklaşan Toplantılar
            </h2>
            <Link
              to="/meetings"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {upcomingMeetings.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Yaklaşan toplantı yok</p>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-gradient-to-r from-zinc-700/50 to-zinc-700/20 hover:from-zinc-700 hover:to-zinc-700/40 rounded-lg p-4 transition-all border border-zinc-600/30 hover:border-zinc-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium flex-1 line-clamp-1">{meeting.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-2 ${
                      meeting.meetingType === 'video' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {meeting.meetingType === 'video' ? '📹' : '💬'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm line-clamp-1 mb-3">{meeting.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(meeting.scheduledAt)}</span>
                    </div>
                    <Link
                      to={`/meetings/${meeting.roomId}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                    >
                      Katıl →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (Admin Only) */}
      {isAdmin() && (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/announcements"
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-white transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Yeni Duyuru</span>
            </Link>
            <Link
              to="/admin/meetings"
              className="flex items-center gap-3 bg-green-600 hover:bg-green-700 rounded-lg p-4 text-white transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Yeni Toplantı</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-white transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">Yeni Kullanıcı</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
