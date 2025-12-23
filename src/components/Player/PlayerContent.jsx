import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import Slider from './Slider'; 
import SeekBar from './SeekBar'; 
import useLoadImage from '../../hooks/useLoadImage';

const PlayerContent = ({ 
  song, 
  songUrl, 
  isPlaying, 
  setIsPlaying, 
  onPlayNext, 
  onPlayPrevious, 
  volume, 
  setVolume,
  currentTime, 
  duration,    
  onSeek       
}) => {
  
  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;
  const imageUrl = useLoadImage(song);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full">
      
      {/* Kiri: Info Lagu */}
      <div className="flex w-full justify-start items-center">
        <div className="flex items-center gap-x-4">
          <div className="relative h-12 w-12 rounded-md overflow-hidden bg-neutral-800">
             <img src={imageUrl || '/images/liked.png'} alt="Cover" className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col gap-y-1 overflow-hidden pr-2">
            <p className="text-white truncate font-semibold text-sm cursor-pointer hover:underline">
              {song.title}
            </p>
            <p className="text-neutral-400 text-xs truncate cursor-pointer hover:underline">
              {song.author}
            </p>
          </div>
        </div>
      </div>

      {/* Tengah: Kontrol Player & SeekBar */}
      <div className="flex flex-col items-center justify-center w-full md:flex gap-y-1">
        
        {/* Tombol Kontrol */}
        <div className="flex items-center justify-center gap-x-6">
          <SkipBack 
            onClick={onPlayPrevious} 
            size={20} 
            className="text-neutral-400 cursor-pointer hover:text-white transition" 
          />
          <div 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white p-1 cursor-pointer hover:scale-110 transition"
          >
            <Icon size={20} className="text-black" fill="black" />
          </div>
          <SkipForward 
            onClick={onPlayNext} 
            size={20} 
            className="text-neutral-400 cursor-pointer hover:text-white transition" 
          />
        </div>

        {/* SeekBar */}
        <div className="hidden md:flex w-full max-w-[400px]">
           <SeekBar 
             value={currentTime}
             max={duration}
             onChange={onSeek}
           />
        </div>

      </div>

      {/* Kanan: Volume Control */}
      <div className="hidden md:flex w-full justify-end items-center pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <VolumeIcon onClick={() => setVolume(volume === 0 ? 1 : 0)} size={20} className="cursor-pointer text-neutral-400 hover:text-white" />
          <Slider value={volume} onChange={(value) => setVolume(value)} />
        </div>
      </div>

    </div>
  );
}

export default PlayerContent;