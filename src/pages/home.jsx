import React, { useEffect, useState } from 'react'; // <-- Make sure this line is complete
import { supabase } from '../services/supabaseClient';
import SongItem from '../components/Song/SongItem';
import usePlayerStore from '../store/usePlayerStore';


const Home = () => {
  const [songs, setSongs] = useState([]);
  const player = usePlayerStore(); // Call global player state

  useEffect(() => {
    // Function to fetch song data from 'songs' table
    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('status', 'approved') // Only get approved songs
        .order('created_at', { ascending: false }); // Newest songs on top

      if (error) {
        console.log(error);
      } else {
        setSongs(data);
      }
    };

    fetchSongs();
  }, []);

  const handlePlay = (id) => {
    // Set active song & set playlist so next/prev buttons work
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
        
        {/* Grid Layout for Songs */}
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