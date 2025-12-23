import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import useAdmin from '../hooks/useAdmin';
import { Play, Check, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminRow = ({ song, onApprove, onReject, onPlay }) => {
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
        {new Date(song.created_at).toLocaleDateString()}
      </td>
      <td className="p-4 text-neutral-400 text-sm hidden sm:table-cell">
        <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full text-xs border border-yellow-500/20">
          {song.status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button 
            onClick={() => onApprove(song.id)}
            className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition"
            title="Approve"
          >
            <Check size={18} />
          </button>
          <button 
            onClick={() => onReject(song.id, song.song_path, song.image_path)}
            className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
            title="Reject & Delete"
          >
            <X size={18} />
          </button>
        </div>
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

  const fetchPendingSongs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('status', 'pending') // Hanya ambil yang pending
      .order('created_at', { ascending: false });
    setSongs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchPendingSongs();
  }, [isAdmin]);

  const handlePlay = (id) => {
    player.setId(id);
    player.setIds([id]);
    player.setIsPlaying(true);
  };

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('songs')
      .update({ status: 'approved' })
      .eq('id', id);

    if (!error) {
      // Hapus dari list tampilan (karena sudah tidak pending)
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleReject = async (id, songPath, imagePath) => {
    if(!window.confirm("Are you sure you want to delete this song?")) return;

    // 1. Hapus Data di Tabel
    const { error } = await supabase.from('songs').delete().eq('id', id);

    if (!error) {
      // 2. (Opsional) Hapus File di Storage agar hemat space
      // await supabase.storage.from('songs').remove([songPath]);
      // await supabase.storage.from('images').remove([imagePath]);

      setSongs(prev => prev.filter(s => s.id !== id));
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
            <p className="text-neutral-400">Review incoming song submissions</p>
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
                <tr><td colSpan="4" className="p-8 text-center text-neutral-400">No pending songs to review.</td></tr>
              ) : (
                songs.map(song => (
                  <AdminRow 
                    key={song.id} 
                    song={song} 
                    onApprove={handleApprove}
                    onReject={handleReject}
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