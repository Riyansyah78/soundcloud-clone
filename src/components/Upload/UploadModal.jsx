import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../services/supabaseClient';
import useUploadModal from '../../hooks/useUploadModal';
import { X } from 'lucide-react';

const UploadModal = () => {
  const { onClose, isOpen } = useUploadModal();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const imageFile = data.image?.[0];
      const songFile = data.song?.[0];
      const user = (await supabase.auth.getUser()).data.user;

      if (!imageFile || !songFile || !user) {
        alert("Mohon lengkapi semua file");
        return;
      }

      // 1. Upload Lagu MP3
      const uniqueID = Date.now();
      const songFileName = `song-${data.title}-${uniqueID}`;
      const { data: songData, error: songError } = await supabase.storage
        .from('songs')
        .upload(songFileName, songFile, { cacheControl: '3600', upsert: false });

      if (songError) throw songError;

      // 2. Upload Cover Image
      const imageFileName = `image-${data.title}-${uniqueID}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imageFileName, imageFile, { cacheControl: '3600', upsert: false });

      if (imageError) throw imageError;

      // 3. Masukkan record ke Database Table
      const { error: supabaseError } = await supabase.from('songs').insert({
        user_id: user.id,
        title: data.title,
        author: data.author,
        image_path: imageData.path,
        song_path: songData.path,
        status: 'approved' // Langsung approved tanpa menunggu konfirmasi admin
      });

      if (supabaseError) throw supabaseError;

      alert('Lagu berhasil diupload!');
      reset();
      onClose();
      window.location.reload(); // Refresh halaman home agar lagu muncul
      
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-800 border border-neutral-700 w-full md:w-[500px] p-6 rounded-md shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-neutral-400 hover:text-white">
          <X size={20}/>
        </button>
        
        <h2 className="text-2xl font-bold text-center mb-4 text-white">Add a song</h2>
        <p className="text-center text-sm text-neutral-400 mb-6">Upload file mp3</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
          <input 
            {...register('title', { required: true })} 
            placeholder="Judul Lagu" 
            className="w-full rounded-md bg-neutral-700 border-transparent px-3 py-3 text-sm focus:outline-none text-white"
          />
          <input 
            {...register('author', { required: true })} 
            placeholder="Nama Artis" 
            className="w-full rounded-md bg-neutral-700 border-transparent px-3 py-3 text-sm focus:outline-none text-white"
          />
          
          <div className="flex flex-col gap-y-2">
            <p className="text-sm text-neutral-400">Pilih File Lagu (mp3)</p>
            <input 
              type="file" 
              accept=".mp3" 
              {...register('song', { required: true })} 
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neutral-700 file:text-white hover:file:bg-neutral-600"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <p className="text-sm text-neutral-400">Pilih Cover Album (Gambar)</p>
            <input 
              type="file" 
              accept="image/*" 
              {...register('image', { required: true })} 
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neutral-700 file:text-white hover:file:bg-neutral-600"
            />
          </div>

          <button disabled={isLoading} className="w-full rounded-full bg-green-500 text-black font-bold py-3 hover:opacity-80 transition mt-4 disabled:opacity-50">
            {isLoading ? 'Uploading...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;