import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import { Play, Heart, Clock, ListMusic, PlusCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- SMALL COMPONENT: Song Row Item ---
const LibrarySongItem = ({ song, onClick, subtitle, icon: Icon }) => {
  const imageUrl = useLoadImage(song);
  return (
    <div onClick={onClick} className="flex items-center gap-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-md transition group w-full">
      <div className="relative min-w-[48px] min-h-[48px] w-12 h-12 rounded overflow-hidden bg-neutral-800">
        <img src={imageUrl} alt="cover" className="object-cover w-full h-full" />
        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
            <Play size={20} className="text-white" fill="white"/>
        </div>
      </div>
      <div className="flex flex-col gap-y-1 overflow-hidden">
        <p className="text-white truncate font-medium">{song.title}</p>
        <p className="text-neutral-400 text-sm truncate flex items-center gap-1">
          {Icon && <Icon size={12} />} {subtitle || song.author}
        </p>
      </div>
    </div>
  );
};

const Library = () => {
  const player = usePlayerStore();
  const navigate = useNavigate();
    const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [likedSongs, setLikedSongs] = useState([]);
  const [historySongs, setHistorySongs] = useState([]);
  const [myPlaylists, setMyPlaylists] = useState([]); // Playlist State
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchData(user.id);
      }
    });
  }, []);

  const fetchData = async (userId) => {
    // 1. LIKED
    const { data: likesData } = await supabase.from('likes').select('*, songs(*)').eq('user_id', userId).order('created_at', { ascending: false });
    if (likesData) setLikedSongs(likesData.map(item => item.songs).filter(s => s));

    // 2. HISTORY
    const { data: historyData } = await supabase.from('history').select('*, songs(*)').eq('user_id', userId).order('played_at', { ascending: false }).limit(20);
    if (historyData) setHistorySongs(historyData.map(item => item.songs).filter(s => s));

    // 3. PLAYLISTS (NEW)
    const { data: plData } = await supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (plData) setMyPlaylists(plData);
  };

  const handlePlay = (id, songList = []) => {
    // Get all song IDs from the provided list
    const allSongIds = songList.length > 0 ? songList.map(s => s.id) : [id];
    player.setId(id);
    player.setIds(allSongIds);
    player.setIsPlaying(true);
  };

  // CREATE NEW PLAYLIST FUNCTION
  const handleCreatePlaylist = async () => {
     const name = prompt("Enter playlist name:");
     if(!name || !user) return;

     const { data, error } = await supabase.from('playlists').insert({
        name: name,
        user_id: user.id
     }).select();

     if(data) {
        setMyPlaylists([data[0], ...myPlaylists]); // Update UI immediately
     }
  };

  const renderContent = () => {
    if (!user) return <div className="text-neutral-400 p-10">Please login.</div>;

    if (activeTab === 'overview') {
      return (
        <div className="flex flex-col gap-y-8">
           {/* Quick Access Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Liked Card */}
              <div onClick={() => setActiveTab('liked')} className="group relative h-40 bg-gradient-to-br from-indigo-700 to-purple-800 rounded-md p-4 flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2"><Heart fill="white"/> Liked Songs</h3>
                  <p className="text-indigo-200">{likedSongs.length} songs</p>
              </div>
              {/* My Playlists Card */}
              <div onClick={() => setActiveTab('playlists')} className="group relative h-40 bg-neutral-800 rounded-md p-4 flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2"><ListMusic /> My Playlists</h3>
                  <p className="text-neutral-400">{myPlaylists.length} lists</p>
              </div>
           </div>

           {/* History Section */}
           <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Recently Played</h2>
              <button onClick={() => setActiveTab('history')} className="text-neutral-400 hover:text-white text-sm">Show All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
               {historySongs.slice(0,6).map((song, i) => (
                   <LibrarySongItem key={i} song={song} onClick={() => handlePlay(song.id, historySongs)} icon={Clock} subtitle="Recently played"/>
               ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === 'playlists') {
      return (
        <div className="flex flex-col gap-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-white text-3xl font-bold flex items-center gap-3">
                <ListMusic className="text-sc-orange" size={32} /> My Playlists
              </h2>
              <button onClick={handleCreatePlaylist} className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition">
                 <PlusCircle size={20}/> Create New
              </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {myPlaylists.map(pl => (
                 <div 
                    key={pl.id} 
                    // FIX HERE: Navigate to playlist detail page
                    onClick={() => navigate(`/playlist/${pl.id}`)} 
                    className="bg-neutral-800/50 p-4 rounded-md hover:bg-neutral-800 cursor-pointer transition group"
                 >
                    <div className="w-full aspect-square bg-neutral-700 rounded-md mb-3 flex items-center justify-center shadow-lg group-hover:shadow-xl transition relative overflow-hidden">
                       {/* If image_path exists, display it; otherwise use default icon */}
                       {pl.image_path ? (
                         <img 
                           src={supabase.storage.from('images').getPublicUrl(pl.image_path).data.publicUrl} 
                           alt="Playlist cover" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <ListMusic size={40} className="text-neutral-500 group-hover:text-white transition duration-300 transform group-hover:scale-110"/>
                       )}
                       
                       {/* Play Icon Overlay on hover (Optional, for better aesthetics) */}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Play fill="white" className="text-white drop-shadow-lg"/>
                       </div>
                    </div>
                    
                    <div className="font-bold text-white truncate text-lg">{pl.name}</div>
                    <div className="text-sm text-neutral-400">By You</div>
                 </div>
              ))}

              {myPlaylists.length === 0 && (
                <div className="col-span-full text-neutral-500 text-center py-10 border border-dashed border-neutral-800 rounded-lg">
                  No playlists yet. Click "Create New" to start.
                </div>
              )}
           </div>
        </div>
      );
    }

    // Tab Liked & History (Same code as before, shortened here)
    return activeTab === 'liked' ? (
       <div className="flex flex-col gap-1">
          <h2 className="text-white text-3xl font-bold mb-4">Liked Songs</h2>
          {likedSongs.map(s => <LibrarySongItem key={s.id} song={s} onClick={() => handlePlay(s.id, likedSongs)}/>)}
       </div>
    ) : (
       <div className="flex flex-col gap-1">
          <h2 className="text-white text-3xl font-bold mb-4">Listening History</h2>
          {historySongs.map((s,i) => <LibrarySongItem key={i} song={s} onClick={() => handlePlay(s.id, historySongs)}/>)}
       </div>
    );
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-20 border-b border-neutral-800 px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-white mb-6">Your Library</h1>
        <div className="flex items-center gap-x-6">
          {['overview', 'liked', 'playlists', 'history'].map(tab => (
             <button 
               key={tab} onClick={() => setActiveTab(tab)}
               className={`pb-2 text-sm font-medium capitalize border-b-2 transition ${activeTab === tab ? 'text-white border-sc-orange' : 'text-neutral-400 border-transparent'}`}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>
      <div className="p-6">{renderContent()}</div>
    </div>
  );
};

export default Library;