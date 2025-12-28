import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import useDebounce from '../hooks/useDebounce';
import SongItem from '../components/Song/SongItem';
import usePlayerStore from '../store/usePlayerStore';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const player = usePlayerStore();
  const [value, setValue] = useState(""); // Input text user
  const debouncedValue = useDebounce(value, 500); // Input text that has been delayed
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Search function to Supabase
    const fetchSongs = async () => {
      if (!debouncedValue) {
        setSongs([]); // Clear if input is empty
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('status', 'approved') // Only get approved songs
        .or(`title.ilike.%${debouncedValue}%,author.ilike.%${debouncedValue}%`) // Search in Title OR Author
        .order('created_at', { ascending: false });

      if (error) console.log(error);
      
      setSongs(data || []);
      setIsLoading(false);
    }

    fetchSongs();
  }, [debouncedValue]); // Re-run every time debouncedValue changes

  // Play Handler
  const handlePlay = (id) => {
    player.setId(id);
    player.setIds(songs.map((song) => song.id));
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <div className="flex flex-col gap-y-6 p-6">
        
        <h1 className="text-white text-3xl font-semibold">
          Search
        </h1>
        
        {/* Input Field */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="text-neutral-400" size={20} />
            </div>
            <input 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What do you want to listen to?"
              className="
                w-full 
                bg-neutral-800 
                text-white 
                p-3 
                pl-10 
                rounded-md 
                focus:outline-none 
                focus:ring-2 
                focus:ring-sc-orange 
                placeholder:text-neutral-400
                transition
              "
            />
        </div>

        {/* Content Area */}
        <div className="w-full">
          {isLoading ? (
            <div className="text-neutral-400 text-center mt-10">Searching...</div>
          ) : songs.length === 0 ? (
            <div className="text-neutral-400 text-center mt-10">
              {value ? "No songs found." : "Type to search for songs."}
            </div>
          ) : (
            <div className="flex flex-col gap-y-2 w-full">
               <h2 className="text-white font-medium text-lg mb-2">
                 Top Results
               </h2>
               {/* Grid Layout (Sama seperti Home) */}
               <div className="
                 grid 
                 grid-cols-2 
                 sm:grid-cols-3 
                 md:grid-cols-3 
                 lg:grid-cols-4 
                 xl:grid-cols-5 
                 gap-4 
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
          )}
        </div>

      </div>
    </div>
  );
};

export default Search;