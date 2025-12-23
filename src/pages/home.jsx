import React, { useEffect, useState } from 'react'; // <-- Pastikan baris ini lengkap
import { supabase } from '../services/supabaseClient';
import SongItem from '../components/Song/SongItem';
import usePlayerStore from '../store/usePlayerStore';


const Home = () => {
  const [songs, setSongs] = useState([]);
  const player = usePlayerStore(); // Panggil state global player

  useEffect(() => {
    // Fungsi untuk mengambil data lagu dari tabel 'songs'
    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('status', 'approved') // Hanya ambil lagu yang sudah disetujui
        .order('created_at', { ascending: false }); // Lagu terbaru di atas

      if (error) {
        console.log(error);
      } else {
        setSongs(data);
      }
    };

    fetchSongs();
  }, []);

  const handlePlay = (id) => {
    // Set lagu yang aktif & set playlist agar tombol next/prev berfungsi
    player.setId(id); 
    player.setIds(songs.map((song) => song.id)); 
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <div className="mb-7 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white mt-4">
            Newest Songs
          </h1>
        </div>
        
        {/* Grid Layout untuk Lagu */}
        <div className="
          grid 
          grid-cols-2 
          sm:grid-cols-3 
          md:grid-cols-3 
          lg:grid-cols-4 
          xl:grid-cols-5 
          2xl:grid-cols-8 
          gap-4 
          mt-4
        ">
          {songs.map((song) => (
            <SongItem 
              key={song.id} 
              data={song} 
              onClick={(id) => handlePlay(id)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;