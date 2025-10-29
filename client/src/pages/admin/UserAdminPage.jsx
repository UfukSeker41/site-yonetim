// Admin - Kullanıcı Yönetimi
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../services/api';

const UserAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'user',
    apartmentNumber: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
      } else {
        if (!formData.password) {
          alert('Yeni kullanıcı için şifre gerekli');
          return;
        }
        await api.post('/users', formData);
      }
      fetchUsers();
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'user',
        apartmentNumber: '',
        phone: ''
      });
      setEditingId(null);
    } catch (error) {
      console.error('Hata:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme işlemi başarısız');
      }
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      apartmentNumber: user.apartmentNumber || '',
      phone: user.phone || ''
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
          <p className="text-zinc-400 mt-1">Toplam {users.length} kullanıcı</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              username: '',
              email: '',
              password: '',
              fullName: '',
              role: 'user',
              apartmentNumber: '',
              phone: ''
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Users Table */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900">
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Kullanıcı Adı</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Ad Soyad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">E-posta</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Daire</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-400">Rol</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-400">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-zinc-400">Yükleniyor...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-zinc-400">Kullanıcı bulunamadı</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-700 hover:bg-zinc-700/50">
                  <td className="px-6 py-4 text-white">{user.username}</td>
                  <td className="px-6 py-4 text-zinc-400">{user.fullName}</td>
                  <td className="px-6 py-4 text-zinc-400 truncate">{user.email}</td>
                  <td className="px-6 py-4 text-zinc-400">{user.apartmentNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`${user.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'} text-white text-xs px-3 py-1 rounded-full`}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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
              {editingId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Kullanıcı Adı</label>
                  <input
                    type="text"
                    required
                    disabled={editingId ? true : false}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600 disabled:opacity-50"
                    placeholder="Kullanıcı adı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">E-posta</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Şifre {editingId && '(Boş bırakırsa değişmez)'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="Şifre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="Ad ve soyad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Daire Numarası</label>
                  <input
                    type="text"
                    value={formData.apartmentNumber}
                    onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="Örn: A-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="+90 555 000 00 00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {editingId ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdminPage;
