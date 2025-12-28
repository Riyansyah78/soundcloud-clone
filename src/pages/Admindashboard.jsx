import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import useAdmin from '../hooks/useAdmin';
import { Play, Trash2, ShieldAlert, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminRow = ({ song, onDelete, onPlay }) => {
  const imageUrl = useLoadImage(song);
  
  return (
    <tr className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-neutral-800 rounded overflow-hidden relative group">
            <img src={imageUrl} className="w-full h-full object-cover" alt="cover" />
            <div 
              onClick={() => onPlay(song.id)}
              className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer"
            >
              <Play size={20} className="text-white" fill="white" />
            </div>
          </div>
          <div>
            <div className="font-bold text-white">{song.title}</div>
            <div className="text-sm text-neutral-400">{song.author}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-neutral-400 text-sm hidden md:table-cell">
        {new Date(song.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}
      </td>
      <td className="p-4 text-neutral-400 text-sm hidden sm:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs border ${
          song.status === 'approved' 
            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        }`}>
          {song.status}
        </span>
      </td>
      <td className="p-4">
        <button 
          onClick={() => onDelete(song.id, song.song_path, song.image_path)}
          className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
          title="Delete Song"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const player = usePlayerStore();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Redirect jika bukan admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchAllSongs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false }); // Ambil semua lagu, urutkan terbaru
    setSongs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAllSongs();
  }, [isAdmin]);

  const handlePlay = (id) => {
    player.setId(id);
    player.setIds(songs.map(s => s.id));
    player.setIsPlaying(true);
  };

  const handleDelete = async (id, songPath, imagePath) => {
    if(!window.confirm("Are you sure you want to delete this song? This action cannot be undone.")) return;

    // 1. Hapus Data di Tabel
    const { error } = await supabase.from('songs').delete().eq('id', id);

    if (!error) {
      // 2. Hapus File di Storage
      await supabase.storage.from('songs').remove([songPath]);
      await supabase.storage.from('images').remove([imagePath]);

      setSongs(prev => prev.filter(s => s.id !== id));
    } else {
      alert('Gagal menghapus lagu: ' + error.message);
    }
  };

  if (adminLoading) return null; // Tunggu cek admin

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/10 rounded-full">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-neutral-400">Manage all uploaded songs</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-sc-orange/10 rounded-full">
              <Music size={24} className="text-sc-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{songs.length}</p>
              <p className="text-neutral-400 text-sm">Total Songs</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/30 rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-800 text-neutral-300 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Song Details</th>
                <th className="p-4 hidden md:table-cell">Uploaded At</th>
                <th className="p-4 hidden sm:table-cell">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-white">Loading...</td></tr>
              ) : songs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-neutral-400">No songs uploaded yet.</td></tr>
              ) : (
                songs.map(song => (
                  <AdminRow 
                    key={song.id} 
                    song={song} 
                    onDelete={handleDelete}
                    onPlay={handlePlay}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;