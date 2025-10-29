// Admin Panel Main Page
import { Link } from 'react-router-dom';
import { Users, Megaphone, Video, Settings, TrendingUp, BarChart } from 'lucide-react';

const AdminPage = () => {
  const adminCards = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Yeni kullanıcı ekle, düzenle veya sil',
      icon: Users,
      color: 'bg-blue-600',
      link: '/admin/users'
    },
    {
      title: 'Duyuru Yönetimi',
      description: 'Duyuru oluştur ve yönet',
      icon: Megaphone,
      color: 'bg-purple-600',
      link: '/admin/announcements'
    },
    {
      title: 'Toplantı Yönetimi',
      description: 'Toplantı planla ve yönet',
      icon: Video,
      color: 'bg-green-600',
      link: '/admin/meetings'
    },
    {
      title: 'Sistem Ayarları',
      description: 'Genel sistem ayarları',
      icon: Settings,
      color: 'bg-orange-600',
      link: '/admin/settings'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Paneli</h1>
        <p className="text-blue-100">Site yönetim araçlarına erişin</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Toplam Kullanıcı</p>
              <p className="text-white text-3xl font-bold mt-2">45</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Aktif Duyurular</p>
              <p className="text-white text-3xl font-bold mt-2">12</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Bu Ay Toplantı</p>
              <p className="text-white text-3xl font-bold mt-2">8</p>
            </div>
            <BarChart className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <Link
              key={index}
              to={card.link}
              className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-all hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-zinc-400 text-sm">{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Son Aktiviteler</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-zinc-400">Yeni kullanıcı eklendi:</span>
            <span className="text-white">Mehmet Yılmaz</span>
            <span className="text-zinc-500 ml-auto">2 saat önce</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-zinc-400">Yeni duyuru yayınlandı:</span>
            <span className="text-white">Aidat Hatırlatması</span>
            <span className="text-zinc-500 ml-auto">5 saat önce</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-zinc-400">Toplantı planlandı:</span>
            <span className="text-white">Aylık Site Toplantısı</span>
            <span className="text-zinc-500 ml-auto">1 gün önce</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
