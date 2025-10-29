// Announcements Page Component
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announcementsAPI } from '../services/api';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const AnnouncementsPage = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAnnouncements();

    // Real-time updates
    onSocketEvent('announcement:new', handleNewAnnouncement);
    onSocketEvent('announcement:updated', handleUpdateAnnouncement);
    onSocketEvent('announcement:deleted', handleDeleteAnnouncement);

    return () => {
      offSocketEvent('announcement:new', handleNewAnnouncement);
      offSocketEvent('announcement:updated', handleUpdateAnnouncement);
      offSocketEvent('announcement:deleted', handleDeleteAnnouncement);
    };
  }, [page, filterPriority, filterCategory]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;

      const response = await announcementsAPI.getAll(params);
      
      if (response.success) {
        setAnnouncements(response.data.announcements);
        setPagination(response.data.pagination);
        
        // Kategorileri topla
        const cats = [...new Set(response.data.announcements.map(a => a.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Announcements fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnnouncement = (announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const handleUpdateAnnouncement = (updatedAnnouncement) => {
    setAnnouncements(prev =>
      prev.map(a => a.id === updatedAnnouncement.id ? { ...a, ...updatedAnnouncement } : a)
    );
  };

  const handleDeleteAnnouncement = ({ id }) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'ACİL' },
      high: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'YÜKSEK' },
      medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'ORTA' },
      low: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'DÜŞÜK' }
    };
    return badges[priority] || badges.medium;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-500" />
            Duyurular
          </h1>
          <p className="text-zinc-400 mt-2">Site duyurularını görüntüleyin</p>
        </div>

        {isAdmin() && (
          <Link
            to="/admin/announcements"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Duyuru
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Duyuru ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchAnnouncements}
          className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-zinc-400 mt-4">Yükleniyor...</p>
          </div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Duyuru Bulunamadı</h3>
          <p className="text-zinc-400">Henüz hiç duyuru eklenmemiş</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const priority = getPriorityBadge(announcement.priority);
            
            return (
              <div
                key={announcement.id}
                className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-white">
                        {announcement.title}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                        {priority.label}
                      </span>
                      {announcement.isNew && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                          YENİ
                        </span>
                      )}
                      {announcement.isViewed === false && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    
                    {announcement.category && (
                      <span className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {announcement.category}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-zinc-300 mb-4 leading-relaxed">
                  {announcement.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{announcement.viewCount} görüntülenme</span>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-500">
                    <span>Yazar: {announcement.author?.fullName || 'Bilinmiyor'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
          >
            Önceki
          </button>
          
          <span className="text-zinc-400">
            Sayfa {page} / {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
