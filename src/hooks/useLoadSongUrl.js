import { supabase } from "../services/supabaseClient";

const useLoadSongUrl = (song) => {
  if (!song) return '';

  const { data: songData } = supabase
    .storage
    .from('songs')
    .getPublicUrl(song.song_path);

  return songData.publicUrl;
};

export default useLoadSongUrl;