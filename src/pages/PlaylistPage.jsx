import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import { Play, Clock, Trash2, Music, ImagePlus } from 'lucide-react';
import { timeAgo } from '../utils/formatDate';

const PlaylistPage = () => {
  const { id } = useParams();
  const player = usePlayerStore();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Compute playlist image URL
  const playlistImageUrl = playlist?.image_path 
    ? supabase.storage.from('images').getPublicUrl(playlist.image_path).data.publicUrl 
    : null;

  useEffect(() => {
    const fetchPlaylistData = async () => {
      // 1. Get Playlist Info
      const { data: plData } = await supabase.from('playlists').select('*').eq('id', id).single();
      setPlaylist(plData);

      // 2. Get Songs in this Playlist (Join)
      const { data: songData, error } = await supabase
        .from('playlist_songs')
        .select('*, songs(*)') // Join to songs table
        .eq('playlist_id', id)
        .order('added_at', { ascending: true });

      if (songData) {
         // Filter if any songs have been deleted (null)
         setSongs(songData.map(item => item.songs).filter(Boolean));
      }
    };

    fetchPlaylistData();
  }, [id]);

  const handlePlay = (songId) => {
    // Get all song IDs from this playlist
    const allSongIds = songs.map(s => s.id);
    player.setId(songId);
    player.setIds(allSongIds);
    player.setIsPlaying(true);
  };

  // Play all songs starting from the first one
  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const allSongIds = songs.map(s => s.id);
    player.setId(allSongIds[0]);
    player.setIds(allSongIds);
    player.setIsPlaying(true);
  };

  // Handle image upload for playlist cover
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `playlist_${id}_${Date.now()}.${fileExt}`;
      const filePath = `playlists/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update playlist record with image path
      const { error: updateError } = await supabase
        .from('playlists')
        .update({ image_path: filePath })
        .eq('id', Number(id));

      if (updateError) throw updateError;

      // Update local state
      setPlaylist(prev => ({ ...prev, image_path: filePath }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    // Delete from junction table
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
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* HEADER */}
      <div className="bg-gradient-to-b from-neutral-700 to-neutral-900 p-8 flex flex-col md:flex-row gap-6 items-end">
        {/* Clickable image container */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-40 h-40 bg-neutral-800 shadow-2xl flex items-center justify-center rounded-md cursor-pointer group relative overflow-hidden hover:opacity-90 transition"
        >
          {playlistImageUrl ? (
            <img src={playlistImageUrl} alt="Playlist cover" className="w-full h-full object-cover" />
          ) : (
            <Music size={64} className="text-neutral-500" />
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            {isUploading ? (
              <span className="text-white text-sm animate-pulse">Uploading...</span>
            ) : (
              <ImagePlus size={32} className="text-white" />
            )}
          </div>
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
            <button 
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="bg-sc-orange w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
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