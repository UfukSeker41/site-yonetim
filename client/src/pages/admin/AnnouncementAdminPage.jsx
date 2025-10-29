// Admin - Duyuru Yönetimi
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../services/api';

const AnnouncementAdminPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/announcements?limit=50');
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, formData);
      } else {
        await api.post('/announcements', formData);
      }
      fetchAnnouncements();
      setShowModal(false);
      setFormData({ title: '', content: '', priority: 'medium', category: '', expiresAt: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Hata:', error.response?.data?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (error) {
        console.error('Silme hatası:', error);
      }
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      category: announcement.category,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
    });
    setEditingId(announcement.id);
    setShowModal(true);
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityColors = {
    urgent: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-green-600'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Duyuru Yönetimi</h1>
          <p className="text-zinc-400 mt-1">Toplam {announcements.length} duyuru</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', content: '', priority: 'medium', category: '', expiresAt: '' });
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Yeni Duyuru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Duyuru ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600"
        />
      </div>

      {/* Announcements Table */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900">
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Başlık</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Kategori</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Öncelik</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Tarih</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-400">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-zinc-400">Yükleniyor...</td>
              </tr>
            ) : filteredAnnouncements.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-zinc-400">Duyuru bulunamadı</td>
              </tr>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <tr key={announcement.id} className="border-b border-zinc-700 hover:bg-zinc-700/50">
                  <td className="px-6 py-4 text-white truncate">{announcement.title}</td>
                  <td className="px-6 py-4 text-zinc-400">{announcement.category || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`${priorityColors[announcement.priority]} text-white text-xs px-3 py-1 rounded-full`}>
                      {announcement.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Başlık</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600"
                  placeholder="Duyuru başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">İçerik</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600 resize-none"
                  placeholder="Duyuru içeriği"
                  rows="6"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Öncelik</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600"
                    placeholder="Kategori (opsiyonel)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  {editingId ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementAdminPage;
