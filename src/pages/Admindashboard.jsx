import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import useAdmin from '../hooks/useAdmin';
import { Play, Trash2, ShieldAlert, Music, Users, Heart, MessageSquare, TrendingUp, Clock, CheckCircle } from 'lucide-react';
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

// Mini song item for top charts
const TopSongItem = ({ song, rank, stat, statLabel }) => {
  const imageUrl = useLoadImage(song);
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-neutral-800/50 rounded-lg transition">
      <span className="text-2xl font-bold text-neutral-600 w-8">{rank}</span>
      <div className="w-10 h-10 bg-neutral-800 rounded overflow-hidden shrink-0">
        <img src={imageUrl} className="w-full h-full object-cover" alt="cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{song.title}</p>
        <p className="text-neutral-400 text-xs truncate">{song.author}</p>
      </div>
      <div className="text-right">
        <p className="text-sc-orange font-bold">{stat?.toLocaleString() || 0}</p>
        <p className="text-neutral-500 text-xs">{statLabel}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const player = usePlayerStore();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Analytics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalComments: 0,
    pendingSongs: 0,
    approvedSongs: 0
  });
  const [topByPlays, setTopByPlays] = useState([]);
  const [topByLikes, setTopByLikes] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    
    // Fetch all songs
    const { data: songsData } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    setSongs(songsData || []);

    // Calculate stats
    const totalPlays = (songsData || []).reduce((sum, s) => sum + (s.play_count || 0), 0);
    const pendingSongs = (songsData || []).filter(s => s.status === 'pending').length;
    const approvedSongs = (songsData || []).filter(s => s.status === 'approved').length;

    // Fetch counts
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
    const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: usersCount || 0,
      totalPlays,
      totalLikes: likesCount || 0,
      totalComments: commentsCount || 0,
      pendingSongs,
      approvedSongs
    });

    // Top 5 by plays
    const topPlays = [...(songsData || [])]
      .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      .slice(0, 5);
    setTopByPlays(topPlays);

    // Top 5 by likes - need to count likes per song
    const { data: likesData } = await supabase
      .from('likes')
      .select('song_id');
    
    const likeCounts = {};
    (likesData || []).forEach(l => {
      likeCounts[l.song_id] = (likeCounts[l.song_id] || 0) + 1;
    });
    
    const songsWithLikes = (songsData || []).map(s => ({
      ...s,
      likeCount: likeCounts[s.id] || 0
    }));
    
    const topLikes = [...songsWithLikes]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 5);
    setTopByLikes(topLikes);

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const handlePlay = (id) => {
    player.setId(id);
    player.setIds(songs.map(s => s.id));
    player.setIsPlaying(true);
  };

  const handleDelete = async (id, songPath, imagePath) => {
    if(!window.confirm("Are you sure you want to delete this song? This action cannot be undone.")) return;

    const { error } = await supabase.from('songs').delete().eq('id', id);

    if (!error) {
      await supabase.storage.from('songs').remove([songPath]);
      await supabase.storage.from('images').remove([imagePath]);
      setSongs(prev => prev.filter(s => s.id !== id));
    } else {
      alert('Failed to delete song: ' + error.message);
    }
  };

  if (adminLoading) return null;

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/10 rounded-full">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-neutral-400">Analytics & Song Management</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users size={20} className="text-blue-500" />
              </div>
              <span className="text-neutral-400 text-sm">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
          </div>
          
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <span className="text-neutral-400 text-sm">Total Plays</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalPlays.toLocaleString()}</p>
          </div>
          
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Heart size={20} className="text-red-500" />
              </div>
              <span className="text-neutral-400 text-sm">Total Likes</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalLikes.toLocaleString()}</p>
          </div>
          
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare size={20} className="text-purple-500" />
              </div>
              <span className="text-neutral-400 text-sm">Comments</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top by Plays */}
          <div className="bg-neutral-800/30 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" /> Top Songs by Plays
            </h3>
            <div className="space-y-1">
              {topByPlays.length === 0 ? (
                <p className="text-neutral-500 text-sm">No data yet</p>
              ) : (
                topByPlays.map((song, i) => (
                  <TopSongItem key={song.id} song={song} rank={i + 1} stat={song.play_count} statLabel="plays" />
                ))
              )}
            </div>
          </div>

          {/* Top by Likes */}
          <div className="bg-neutral-800/30 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Heart size={20} className="text-red-500" /> Top Songs by Likes
            </h3>
            <div className="space-y-1">
              {topByLikes.length === 0 ? (
                <p className="text-neutral-500 text-sm">No data yet</p>
              ) : (
                topByLikes.map((song, i) => (
                  <TopSongItem key={song.id} song={song} rank={i + 1} stat={song.likeCount} statLabel="likes" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Song Status */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg">
            <Clock size={18} className="text-yellow-500" />
            <span className="text-yellow-500 font-medium">{stats.pendingSongs} Pending</span>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-lg">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-green-500 font-medium">{stats.approvedSongs} Approved</span>
          </div>
          <div className="flex items-center gap-2 bg-sc-orange/10 border border-sc-orange/20 px-4 py-2 rounded-lg">
            <Music size={18} className="text-sc-orange" />
            <span className="text-sc-orange font-medium">{songs.length} Total Songs</span>
          </div>
        </div>

        {/* Songs Table */}
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