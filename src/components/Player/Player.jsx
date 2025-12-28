import React, { useEffect, useRef, useState } from 'react';
import ReactHowler from 'react-howler';
import usePlayerStore from '../../store/usePlayerStore';
import useLoadSongUrl from '../../hooks/useLoadSongUrl';
import { supabase } from '../../services/supabaseClient';
import PlayerContent from './PlayerContent';

const Player = () => {
  const player = usePlayerStore();
  const [song, setSong] = useState(null);
  const [volume, setVolume] = useState(1);
  
  const [seek, setSeek] = useState(0.0);
  
  // Ref untuk track posisi yang diminta user (saat drag slider)
  const requestedSeekRef = useRef(0.0);
  
  // Ref untuk track apakah user sedang drag slider
  const isSeekingRef = useRef(false);

  const soundRef = useRef(null);
  const urlRef = useRef(''); 
  const songPathUrl = useLoadSongUrl(song);
  
  // Ref to track previous song to prevent double play
  const prevActiveIdRef = useRef(null);

  // 1. Fetch Lagu
  useEffect(() => {
    if (!player.activeId) return;

    // If song changes, reset state
    if (prevActiveIdRef.current !== player.activeId) {
      prevActiveIdRef.current = player.activeId;
      setSeek(0);
      requestedSeekRef.current = 0;
      player.setCurrentTime(0);
    }

    const fetchSong = async () => {
      const { data } = await supabase
        .from('songs')
        .select('*')
        .eq('id', player.activeId)
        .single();
      
      setSong(data);
      if (data) {
        player.setIsPlaying(true);
// Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && data) {
         // Upsert to history table (If exists, update the timestamp)
         await supabase.from('history').upsert({
            user_id: session.user.id,
            song_id: data.id,
            played_at: new Date().toISOString()
         });
      }
      }
    };

    fetchSong();
  }, [player.activeId]);

  // 2. Simpan URL Stabil
  if (songPathUrl) {
    urlRef.current = songPathUrl;
  }

  // 3. Update time position at intervals (lighter than requestAnimationFrame)
  useEffect(() => {
    let intervalId;
    
    if (player.isPlaying) {
      intervalId = setInterval(() => {
        if (soundRef.current && !isSeekingRef.current) {
          const currentSeek = soundRef.current.seek();
          if (typeof currentSeek === 'number') {
            setSeek(currentSeek);
            player.setCurrentTime(currentSeek);
          }
        }
      }, 250); // Update every 250ms instead of every frame
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [player.isPlaying]);

  // 4. Handle Seek (Geser Slider)
  const handleSeek = (value) => {
    // Tandai bahwa user sedang seeking
    isSeekingRef.current = true;
    requestedSeekRef.current = value;
    
    // Update visual
    setSeek(value);
    player.setCurrentTime(value);

    // Seek audio langsung
    if (soundRef.current) {
      soundRef.current.seek(value);
    }

    // Tunggu sebentar baru tandai selesai seeking
    // Ini untuk menghindari race condition
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 100);
  };

  // 5. Toggle Play/Pause
  const togglePlay = () => {
    if (player.isPlaying) {
      player.setIsPlaying(false);
    } else {
      player.setIsPlaying(true);
    }
  };

  // 6. Handle saat audio BENAR-BENAR mulai berbunyi
  const handleOnPlay = () => {
    // Pastikan status global sinkron
    if (!player.isPlaying) {
      player.setIsPlaying(true);
    }

    // If user just finished seeking, audio position is already correct
    // So we don't need to force seek again
    if (soundRef.current && isSeekingRef.current) {
      soundRef.current.seek(requestedSeekRef.current);
    }
  };

  const handleOnEnd = () => {
    player.setIsPlaying(false);
    setSeek(0);
    player.setCurrentTime(0);
    // Auto play next song when current song ends
    onPlayNext();
  };

  // 7. Play Next Song
  const onPlayNext = () => {
    if (player.ids.length === 0) return;
    
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    
    const nextSong = player.ids[currentIndex + 1];
    
    if (nextSong === undefined) {
      // If at the end, go back to first song
      return player.setId(player.ids[0]);
    }
    
    player.setId(nextSong);
  };

  // 8. Play Previous Song
  const onPlayPrevious = () => {
    if (player.ids.length === 0) return;
    
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const previousSong = player.ids[currentIndex - 1];
    
    if (previousSong === undefined) {
      // If at the beginning, go to last song
      return player.setId(player.ids[player.ids.length - 1]);
    }
    
    player.setId(previousSong);
  };

  if (!player.activeId || !urlRef.current || !song) return null;

  return (
    <div className="fixed bottom-0 bg-black w-full py-2 h-[80px] px-4 text-white border-t border-neutral-800 z-50 pointer-events-auto">
      <ReactHowler
        ref={soundRef}
        src={urlRef.current}
        playing={player.isPlaying}
        volume={volume}
        onLoad={() => {
          const dur = soundRef.current?.duration();
          if (dur) player.setDuration(dur);
        }}
        onPlay={handleOnPlay}
        onEnd={handleOnEnd}
        format={['mp3']}
        html5={true}
      />
      
      <PlayerContent
        song={song}
        songUrl={urlRef.current}
        isPlaying={player.isPlaying} 
        setIsPlaying={togglePlay} 
        onPlayNext={onPlayNext}
        onPlayPrevious={onPlayPrevious}
        volume={volume}
        setVolume={setVolume}
        currentTime={seek}
        duration={player.duration}
        onSeek={handleSeek}
      />
    </div>
  );
};

export default Player;