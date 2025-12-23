import { supabase } from "../services/supabaseClient";

const useLoadImage = (song) => {
  if (!song) {
    return null;
  }

  // Mengambil Public URL dari bucket 'images'
  const { data: imageData } = supabase
    .storage
    .from('images')
    .getPublicUrl(song.image_path);

  return imageData.publicUrl;
};

export default useLoadImage;