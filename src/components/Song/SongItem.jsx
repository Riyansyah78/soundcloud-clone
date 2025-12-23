import React from 'react';
import useLoadImage from '../../hooks/useLoadImage';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);
  const navigate = useNavigate();

  const handleClick = () => {
     // Arahkan ke halaman detail lagu
     navigate(`/song/${data.id}`); 
  };
  
  // Update tombol Play (lingkaran oranye) agar memutar lagu TANPA pindah halaman
  const handlePlayBtn = (e) => {
    e.stopPropagation(); // Mencegah klik tembus ke parent div
    onClick(data.id); // Putar lagu
  };

  return (
    <div
      onClick={handleClick}
      className="
        relative 
        group 
        flex 
        flex-col 
        items-center 
        justify-center 
        rounded-md 
        overflow-hidden 
        gap-x-4 
        bg-neutral-400/5 
        cursor-pointer 
        hover:bg-neutral-400/10 
        transition 
        p-3
      "
    >
      {/* 1. Bagian Gambar (Sekarang bersih tanpa tombol) */}
      <div className="relative aspect-square w-full h-full rounded-md overflow-hidden">
        <img
          className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
          src={imagePath || '/images/liked.png'}
          alt="Image"
        />
      </div>

      {/* 2. Bagian Info & Tombol (Layout Baru) */}
      <div className="flex items-center justify-between w-full pt-4">
        
        {/* Kiri: Judul & Artis */}
        <div className="flex flex-col items-start w-full gap-y-1 overflow-hidden pr-2">
          <p className="font-semibold truncate w-full text-white">
            {data.title}
          </p>
          <p className="text-neutral-400 text-sm w-full truncate">
            By {data.author}
          </p>
        </div>

        {/* Kanan: Tombol Play (Muncul saat hover card) */}
       <div 
        onClick={handlePlayBtn}
        className="
          transition 
          opacity-0 
          translate-y-2
          group-hover:opacity-100 
          group-hover:translate-y-0
          rounded-full 
          flex 
          items-center 
          justify-center 
          bg-sc-orange 
          p-3 
          drop-shadow-md 
          hover:scale-110
          flex-shrink-0
        ">
          <Play className="text-black" fill="black" size={20} />
        </div>

      </div>
    </div>
  );
};

export default SongItem;