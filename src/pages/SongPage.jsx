import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import useLoadImage from '../hooks/useLoadImage';
import { timeAgo } from '../utils/formatDate';
import { Play, Pause, Heart, Share, MessageSquare, User, Trash2 } from 'lucide-react';
import AddToPlaylistModal from '../components/Playlist/AddToPlaylistModal';
import { PlusSquare } from 'lucide-react';

// --- KOMPONEN WAVEFORM ASLI (Real Audio Analysis) ---
const RealWaveform = ({ songUrl, isActive }) => {
  const canvasRef = useRef(null);
  const { currentTime, duration } = usePlayerStore();
  const [peaks, setPeaks] = useState([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. ANALISIS AUDIO (Jalan sekali saat lagu dimuat)
 useEffect(() => {
    if (!songUrl) return;

    const analyze = async () => {
      setIsAnalyzing(true);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(songUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0); 
        const samples = 100; // Jumlah batang (Bisa dinaikkan biar lebih rapat)
        const blockSize = Math.floor(rawData.length / samples);
        const calculatedPeaks = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j]);
          }
          calculatedPeaks.push(sum / blockSize);
        }

        const max = Math.max(...calculatedPeaks);
        const normalized = calculatedPeaks.map(n => n / max);
        setPeaks(normalized);
      } catch (err) {
        console.error("Error generating waveform:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    analyze();
  }, [songUrl]);

  // 2. GAMBAR KE CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    if (isAnalyzing || peaks.length === 0) {
       ctx.fillStyle = 'rgba(255,255,255,0.1)';
       ctx.fillRect(0, height/2 - 1, width, 2);
       return;
    }

    const gap = 2; 
    const barWidth = (width / peaks.length) - gap;
    
    // Hitung lebar area Oranye secara Pixel-Perfect
    const progressRatio = (isActive && duration > 0) ? currentTime / duration : 0;
    const activeWidth = width * progressRatio;

    // --- FUNGSI GAMBAR BATANG (Helper) ---
    const drawBars = (color) => {
      ctx.fillStyle = color;
      peaks.forEach((peak, index) => {
        let barHeight = peak * height * 0.8;
        barHeight = Math.max(barHeight, 4);
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        
        // Menggunakan rounded corner (opsional, biar cantik)
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    };

    // A. GAMBAR LAYER BELAKANG (PUTIH/ABU)
    // Gambar semua batang dengan warna redup dulu
    drawBars('rgba(255, 255, 255, 0.5)');

    // B. GAMBAR LAYER DEPAN (ORANYE) DENGAN CLIPPING
    // Ini rahasia smooth-nya: Kita potong canvas sesuai detik lagu
    ctx.save(); // Simpan kondisi canvas
    ctx.beginPath();
    ctx.rect(0, 0, activeWidth, height); // Kotak area oranye (lebar bertambah pixel demi pixel)
    ctx.clip(); // Potong! Apapun yang digambar setelah ini hanya muncul di dalam kotak tadi.

    // Gambar ulang batang yang sama persis tapi warna oranye
    drawBars('#ff5500');

    ctx.restore(); // Kembalikan canvas ke kondisi normal (biar gak error render berikutnya)

  }, [peaks, isAnalyzing, currentTime, duration, isActive]);

  return (
    <div className="relative w-full h-24 mt-auto">
      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500 animate-pulse">
          Generating Waveform...
        </div>
      )}
      <canvas 
        ref={canvasRef}
        width={800} // Resolusi internal canvas (makin besar makin tajam)
        height={150}
        className="w-full h-full"
      />
    </div>
  );
};


const SongPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const player = usePlayerStore();
  
  const [song, setSong] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const imageUrl = useLoadImage(song);
  
  // URL PUBLIK UNTUK ANALISIS WAVEFORM
  const songPublicUrl = song 
    ? supabase.storage.from('songs').getPublicUrl(song.song_path).data.publicUrl 
    : null;

  const isCurrentSong = player.activeId === Number(id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const getData = async () => {
      const { data: songData } = await supabase.from('songs').select('*').eq('id', id).single();
      if (songData) {
        setSong(songData);
        setPlayCount(songData.play_count || 0); 
      }

      const { data: commentsData } = await supabase.from('comments').select('*').eq('song_id', id).order('created_at', { ascending: false });
      setComments(commentsData || []);

      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('song_id', id);
      setLikeCount(count || 0);

      if (songData) {
        const { data: relatedData } = await supabase.from('songs').select('*').eq('author', songData.author).neq('id', id).limit(5);
        setRelatedSongs(relatedData || []);
      }
    };

    getData();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const checkLike = async () => {
      const { data } = await supabase.from('likes').select('*').eq('user_id', user.id).eq('song_id', id).single();
      if (data) setIsLiked(true);
    };
    checkLike();
  }, [user, id]);

  const handlePlay = async () => {
    if(!song) return;
    if (isCurrentSong) {
      player.togglePlay();
    } else {
      player.setId(song.id);
      player.setIds([song.id]); 
      player.setIsPlaying(true);
      const { error } = await supabase.rpc('increment_play_count', { row_id: id });
      if (!error) setPlayCount(prev => prev + 1);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return alert("Please login to comment");
    setIsLoading(true);
    const { error } = await supabase.from('comments').insert({
      content: newComment,
      song_id: id,
      user_id: user.id,
      user_email: user.email
    });
    if (!error) {
      setNewComment("");
      const { data } = await supabase.from('comments').select('*').eq('song_id', id).order('created_at', { ascending: false });
      setComments(data);
    }
    setIsLoading(false);
  };

  const handleToggleLike = async () => {
    if (!user) return alert("Please login to like");
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('song_id', id);
      setLikeCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, song_id: id });
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
       setComments(comments.filter(c => c.id !== commentId));
    }
  };

  if (!song) return <div className="p-10 text-white animate-pulse">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 -mx-6 -mt-2 pb-10"> 
      
      {/* HERO SECTION */}
      <div className="relative w-full min-h-[340px] bg-gradient-to-r from-neutral-800 to-neutral-900 p-4 md:p-8 flex flex-col-reverse md:flex-row justify-between border-b border-white/10 gap-6">
        
        <div className="flex flex-col h-full justify-between flex-1 mr-0 md:mr-8 relative z-10 w-full">
          <div className="flex items-start gap-x-4 md:gap-x-6">
            <button 
              onClick={handlePlay}
              className="bg-sc-orange w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center hover:scale-105 transition shadow-[0_0_20px_rgba(255,85,0,0.4)] shrink-0"
            >
              {isCurrentSong && player.isPlaying ? <Pause fill="white" size={30}/> : <Play fill="white" className="ml-1" size={30}/>}
            </button>

            <div className="flex flex-col pt-1 gap-y-2 min-w-0">
              <h1 className="text-2xl md:text-4xl bg-black/60 px-3 py-1 text-white font-normal inline-block backdrop-blur-sm truncate max-w-full">
                {song.title}
              </h1>
              <h2 className="text-lg md:text-2xl bg-black/60 px-3 py-1 text-neutral-300 font-light inline-block w-fit backdrop-blur-sm hover:text-white cursor-pointer transition">
                {song.author}
              </h2>
            </div>
            
            <div className="ml-auto hidden md:flex flex-col items-end text-neutral-300 font-medium">
              <span>{timeAgo(song.created_at)}</span>
            </div>
          </div>

          <div className="h-4 md:h-0"></div>

          {/* REAL WAVEFORM COMPONENT */}
          <div className="w-full relative z-10 mt-auto">
            <RealWaveform 
              songUrl={songPublicUrl} 
              isActive={isCurrentSong} 
            />
          </div>
        </div>

        <div className="w-full max-w-[340px] aspect-square mx-auto md:mx-0 bg-neutral-800 shadow-2xl shrink-0 border border-white/10 relative z-10">
           <img 
             src={imageUrl || '/images/liked.png'} 
             className="w-full h-full object-cover" 
             alt="Cover" 
           />
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
        {/* KOLOM KIRI: Comments & Actions */}
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-4">
             <form onSubmit={handlePostComment} className="flex items-center w-full bg-neutral-800 border border-neutral-700 h-10 px-0.5 rounded-sm overflow-hidden">
                <div className="w-10 h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-600">
                   <User className="text-white" size={20}/>
                </div>
                <input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? "Write a comment..." : "Login to comment"}
                  className="bg-transparent flex-1 px-3 text-sm focus:outline-none text-white h-full"
                />
             </form>
             {/* ... Tombol Like/Share ... */}
             <div className="flex flex-wrap justify-between items-center mt-1 gap-2">
                <div className="flex gap-x-2">
                  <button onClick={handleToggleLike} className={`flex items-center gap-x-2 px-3 py-1 border rounded-sm text-sm transition ${isLiked ? 'border-sc-orange text-sc-orange' : 'border-neutral-600 text-neutral-300'}`}>
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {isLiked ? 'Liked' : 'Like'}
                  </button>
                  <button className="flex items-center gap-x-2 px-3 py-1 border border-neutral-600 text-neutral-300 rounded-sm text-sm hover:border-white transition">
                    <Share size={16} /> Share
                  </button>
                  <button 
           onClick={() => setIsPlaylistModalOpen(true)}
           className="flex items-center gap-x-2 px-3 py-1 border border-neutral-600 text-neutral-300 rounded-sm text-sm hover:border-white transition"
        >
           <PlusSquare size={16} /> Add to Playlist
        </button>
                </div>
                <div className="flex gap-x-4 text-neutral-500 text-sm font-medium">
                   <span className="flex items-center gap-1"><Play size={14}/> {playCount.toLocaleString()}</span>
                   <span className="flex items-center gap-1"><Heart size={14}/> {likeCount}</span>
                </div>
             </div>
          </div>
          <hr className="border-neutral-800" />
          <div className="mt-4">
            <h3 className="text-neutral-400 font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={18}/> {comments.length} comments
            </h3>
            <div className="flex flex-col gap-y-4">
               {comments.length === 0 ? <p className="text-neutral-500 text-sm">No comments yet.</p> : comments.map((c) => (
                  <div key={c.id} className="group flex gap-x-3 p-3 hover:bg-neutral-800/50 rounded-md transition">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-b from-purple-500 to-blue-600 flex items-center justify-center shrink-0 text-xs text-white font-bold">
                        {c.user_email?.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-400 text-xs">{c.user_email} • {timeAgo(c.created_at)}</span>
                            {user?.id === c.user_id && (
                              <button onClick={() => handleDeleteComment(c.id)} className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                            )}
                          </div>
                          <p className="text-white text-sm mt-1">{c.content}</p>
                      </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Related */}
        <div className="hidden lg:flex flex-col gap-y-6 border-l border-neutral-800 pl-6">
             <div className="flex flex-col gap-y-2">
                <div className="text-neutral-400 text-sm font-semibold mb-2 uppercase">More from {song.author}</div>
                {relatedSongs.map((related) => (
                  <div key={related.id} onClick={() => navigate(`/song/${related.id}`)} className="cursor-pointer hover:bg-white/5 p-2 rounded flex gap-2 items-center">
                     <div className="w-12 h-12 bg-neutral-800 overflow-hidden shrink-0">
                       <img src={supabase.storage.from('images').getPublicUrl(related.image_path).data.publicUrl} className="w-full h-full object-cover"/>
                     </div>
                     <div className="truncate text-white text-sm font-medium">
                        {related.title}
                        <p className="text-neutral-500 text-xs font-normal">{related.author}</p>
                     </div>
                  </div>
                ))}
             </div>
        </div>
      </div>
      <AddToPlaylistModal 
        isOpen={isPlaylistModalOpen} 
        onClose={() => setIsPlaylistModalOpen(false)} 
        songId={id} // ID lagu dari params URL
     />
    </div>
  );
};

export default SongPage;