import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Music, CheckCircle, PlusCircle, Loader2 } from 'lucide-react';

const AddToPlaylistModal = ({ isOpen, onClose, songId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState([]); // Menyimpan ID playlist yang sudah berisi lagu ini
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // Loading per tombol

  useEffect(() => {
    if (isOpen && songId) {
       fetchData();
    }
  }, [isOpen, songId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Ambil semua Playlist User
    const { data: myPlaylists } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (myPlaylists) setPlaylists(myPlaylists);

    // 2. Cek di playlist mana lagu ini SUDAH ada
    // Kita cari di tabel playlist_songs berdasarkan song_id
    const { data: existingData } = await supabase
      .from('playlist_songs')
      .select('playlist_id')
      .eq('song_id', songId);

    if (existingData) {
      // Buat array ID: contoh [12, 15]
      const ids = existingData.map(item => item.playlist_id);
      setAddedPlaylistIds(ids);
    }
    setLoading(false);
  };

  const handleTogglePlaylist = async (playlistId) => {
    setProcessingId(playlistId);
    
    // Cek apakah lagu sudah ada di playlist ini?
    const isAlreadyAdded = addedPlaylistIds.includes(playlistId);

    if (isAlreadyAdded) {
      // LOGIC: REMOVE (Hapus dari playlist)
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (!error) {
        // Update UI: Hapus ID dari state
        setAddedPlaylistIds(prev => prev.filter(id => id !== playlistId));
      }
    } else {
      // LOGIC: ADD (Tambah ke playlist)
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
           playlist_id: playlistId,
           song_id: songId
        });

      if (!error) {
        // Update UI: Tambah ID ke state
        setAddedPlaylistIds(prev => [...prev, playlistId]);
      }
    }
    setProcessingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl">
        
        {/* Header */}
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition">
           <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <PlusCircle className="text-sc-orange"/> Add to Playlist
        </h2>

        {/* List Playlist */}
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
           {loading ? (
             <div className="flex justify-center py-8 text-neutral-500"><Loader2 className="animate-spin"/></div>
           ) : playlists.length === 0 ? (
             <p className="text-neutral-500 text-center py-6 border border-dashed border-neutral-700 rounded-md">
               No playlists found. <br/> Create one in your Library.
             </p>
           ) : (
             playlists.map(pl => {
               const isAdded = addedPlaylistIds.includes(pl.id); // Cek status
               const isProcessing = processingId === pl.id;

               return (
                 <button 
                   key={pl.id}
                   disabled={isProcessing}
                   onClick={() => handleTogglePlaylist(pl.id)}
                   className={`
                     flex items-center justify-between w-full p-3 rounded-md transition border
                     ${isAdded 
                        ? 'bg-sc-orange/10 border-sc-orange/50 text-white' // Style jika SUDAH ada (Hijau/Orange)
                        : 'bg-neutral-800/50 border-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white' // Style jika BELUM ada
                     }
                   `}
                 >
                   <div className="flex items-center gap-3 overflow-hidden">
                     <div className={`
                        w-10 h-10 flex items-center justify-center rounded shrink-0 transition
                        ${isAdded ? 'bg-sc-orange text-white' : 'bg-neutral-700 text-neutral-400'}
                     `}>
                        <Music size={20}/>
                     </div>
                     <span className="font-medium truncate">{pl.name}</span>
                   </div>

                   {/* Indikator Status (Kanan) */}
                   <div className="pl-3">
                      {isProcessing ? (
                        <Loader2 size={20} className="animate-spin text-neutral-500"/>
                      ) : isAdded ? (
                        <div className="flex items-center gap-1 text-sc-orange text-sm font-bold bg-black/20 px-2 py-1 rounded-full">
                           <CheckCircle size={16} fill="currentColor" className="text-sc-orange"/> 
                           <span className="hidden sm:inline">Added</span>
                        </div>
                      ) : (
                        <PlusCircle size={20} className="text-neutral-500 hover:text-white"/>
                      )}
                   </div>
                 </button>
               );
             })
           )}
        </div>

        <div className="mt-6 text-center">
            <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm font-medium">
               Done
            </button>
        </div>

      </div>
    </div>
  );
};

export default AddToPlaylistModal;