// Admin - Toplantı Yönetimi
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../services/api';

const MeetingAdminPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingType: 'chat',
    scheduledAt: '',
    maxParticipants: 100
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meetings');
      setMeetings(response.data?.meetings || []);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/meetings/${editingId}`, formData);
      } else {
        await api.post('/meetings', formData);
      }
      fetchMeetings();
      setShowModal(false);
      setFormData({ title: '', description: '', meetingType: 'chat', scheduledAt: '', maxParticipants: 100 });
      setEditingId(null);
    } catch (error) {
      console.error('Hata:', error.response?.data?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/meetings/${id}`);
        fetchMeetings();
      } catch (error) {
        console.error('Silme hatası:', error);
      }
    }
  };

  const handleEdit = (meeting) => {
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      meetingType: meeting.meetingType,
      scheduledAt: meeting.scheduledAt 
        ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) 
        : '',
      maxParticipants: meeting.maxParticipants ? parseInt(meeting.maxParticipants) : 100
    });
    setEditingId(meeting.id);
    setShowModal(true);
  };

  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    scheduled: 'bg-blue-600',
    ongoing: 'bg-green-600',
    completed: 'bg-gray-600',
    cancelled: 'bg-red-600'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Toplantı Yönetimi</h1>
          <p className="text-zinc-400 mt-1">Toplam {meetings.length} toplantı</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', description: '', meetingType: 'chat', scheduledAt: '', maxParticipants: 100 });
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Yeni Toplantı
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Toplantı ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-green-600"
        />
      </div>

      {/* Meetings Table */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900">
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Başlık</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Tip</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Durum</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Tarih</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-400">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-zinc-400">Yükleniyor...</td>
              </tr>
            ) : filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-zinc-400">Toplantı bulunamadı</td>
              </tr>
            ) : (
              filteredMeetings.map((meeting) => (
                <tr key={meeting.id} className="border-b border-zinc-700 hover:bg-zinc-700/50">
                  <td className="px-6 py-4 text-white truncate">{meeting.title}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    {meeting.meetingType === 'video' ? '🎥 Video' : '💬 Chat'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${statusColors[meeting.status] || 'bg-gray-600'} text-white text-xs px-3 py-1 rounded-full`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(meeting)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(meeting.id)}
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
              {editingId ? 'Toplantı Düzenle' : 'Yeni Toplantı Oluştur'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Başlık</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-600"
                  placeholder="Toplantı başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-600 resize-none"
                  placeholder="Toplantı açıklaması"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Toplantı Tipi</label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-600"
                  >
                    <option value="chat">💬 Chat</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Max Katılımcı</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants || ''}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 100 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Toplantı Tarihi ve Saati</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-600"
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
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
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

export default MeetingAdminPage;
