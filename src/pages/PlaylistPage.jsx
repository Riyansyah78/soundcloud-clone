import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import { Play, Clock, Trash2, Music } from 'lucide-react';
import { timeAgo } from '../utils/formatDate';

const PlaylistPage = () => {
  const { id } = useParams();
  const player = usePlayerStore();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      // 1. Ambil Info Playlist
      const { data: plData } = await supabase.from('playlists').select('*').eq('id', id).single();
      setPlaylist(plData);

      // 2. Ambil Lagu-lagu dalam Playlist ini (Join)
      const { data: songData, error } = await supabase
        .from('playlist_songs')
        .select('*, songs(*)') // Join ke tabel songs
        .eq('playlist_id', id)
        .order('added_at', { ascending: true });

      if (songData) {
         // Filter jika ada lagu yang terhapus (null)
         setSongs(songData.map(item => item.songs).filter(Boolean));
      }
    };

    fetchPlaylistData();
  }, [id]);

  const handlePlay = (songId) => {
    player.setId(songId);
    player.setIds([songId]);
    player.setIsPlaying(true);
  };

  const handleDeleteSong = async (songId) => {
    // Hapus dari tabel penghubung
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', id)
      .eq('song_id', songId);
      
    if (!error) {
       setSongs(songs.filter(s => s.id !== songId));
    }
  };

  const handleDeletePlaylist = async () => {
      const confirm = window.confirm("Are you sure you want to delete this playlist?");
      if(confirm) {
          await supabase.from('playlists').delete().eq('id', id);
          navigate('/library');
      }
  }

  if (!playlist) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="bg-neutral-900 min-h-full rounded-lg overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-b from-neutral-700 to-neutral-900 p-8 flex flex-col md:flex-row gap-6 items-end">
        <div className="w-40 h-40 bg-neutral-800 shadow-2xl flex items-center justify-center rounded-md">
           <Music size={64} className="text-neutral-500" />
        </div>
        <div className="flex flex-col gap-2 w-full">
           <p className="text-sm font-bold uppercase text-white">Playlist</p>
           <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">{playlist.name}</h1>
           <div className="flex items-center gap-2 text-sm text-neutral-300 font-medium">
              <span>By You</span>
              <span>•</span>
              <span>{songs.length} songs</span>
           </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
         {/* Action Bar */}
         <div className="flex items-center justify-between mb-8">
            <button className="bg-sc-orange w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg">
               <Play fill="white" className="ml-1 text-white" size={28}/>
            </button>
            <button onClick={handleDeletePlaylist} className="text-neutral-400 hover:text-red-500 transition text-sm font-bold flex items-center gap-2">
               <Trash2 size={18}/> Delete Playlist
            </button>
         </div>

         {/* Song List */}
         <div className="flex flex-col gap-y-2">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-neutral-400 border-b border-neutral-800 text-sm mb-2">
               <span>#</span>
               <span>Title</span>
               <Clock size={16}/>
            </div>
            
            {songs.map((song, index) => (
               <div key={song.id} className="group grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 hover:bg-white/10 rounded-md items-center transition cursor-pointer">
                  <div className="w-4 text-neutral-400 text-sm">{index + 1}</div>
                  
                  <div onClick={() => handlePlay(song.id)} className="flex items-center gap-3 overflow-hidden">
                     <div className="w-10 h-10 bg-neutral-800 shrink-0">
                        <img src={useLoadImage(song)} className="w-full h-full object-cover"/>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <p className="text-white truncate font-medium">{song.title}</p>
                        <p className="text-neutral-400 text-sm truncate">{song.author}</p>
                     </div>
                  </div>

                  <button onClick={() => handleDeleteSong(song.id)} className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition">
                     <Trash2 size={16}/>
                  </button>
               </div>
            ))}
            
            {songs.length === 0 && (
                <div className="text-neutral-400 text-center py-10">This playlist is empty.</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default PlaylistPage;