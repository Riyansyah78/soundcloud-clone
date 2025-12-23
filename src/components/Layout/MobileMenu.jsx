import React, { useEffect, useState } from 'react';
import { Home, Search, Library, PlusSquare, X, ShieldCheck } from 'lucide-react'; // Tambah ShieldCheck
import { Link } from 'react-router-dom';
import useMobileMenu from '../../hooks/useMobileMenu';
import useUploadModal from '../../hooks/useUploadModal';
import useAuthModal from '../../hooks/useAuthModal';
import useAdmin from '../../hooks/useAdmin'; // 1. Import Hook
import { supabase } from '../../services/supabaseClient';

const MobileMenu = () => {
  const { isOpen, onClose } = useMobileMenu();
  const uploadModal = useUploadModal();
  const authModal = useAuthModal();
  const { isAdmin } = useAdmin(); // 2. Panggil Hook
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleUploadClick = () => {
    onClose();
    if (!user) return authModal.onOpen();
    return uploadModal.onOpen();
  };

  return (
    <div className={`
      fixed inset-0 z-50 flex transition-colors duration-300
      ${isOpen ? 'bg-black/60 pointer-events-auto' : 'bg-transparent pointer-events-none delay-300'}
    `}>
      <div className={`
        relative bg-neutral-900 h-full w-[280px] p-6 shadow-2xl flex flex-col gap-y-6 transition-transform duration-300 ease-in-out border-r border-neutral-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-bold text-xl">
            Sound<span className="text-sc-orange">Cloud</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-y-6">
          <Link to="/" onClick={onClose} className="flex items-center gap-x-4 text-neutral-400 hover:text-white transition font-medium text-lg">
            <Home size={28} />
            <span>Home</span>
          </Link>
          <Link to="/search" onClick={onClose} className="flex items-center gap-x-4 text-neutral-400 hover:text-white transition font-medium text-lg">
            <Search size={28} />
            <span>Search</span>
          </Link>
          <Link to="/library" onClick={onClose} className="flex items-center gap-x-4 text-neutral-400 hover:text-white transition font-medium text-lg">
            <Library size={28} />
            <span>Your Library</span>
          </Link>
          
          {/* 3. MENU KHUSUS ADMIN DI SINI */}
          {isAdmin && (
            <Link to="/admin" onClick={onClose} className="flex items-center gap-x-4 text-sc-orange hover:text-white transition font-medium text-lg">
              <ShieldCheck size={28} />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <div className="border-t border-neutral-800 my-2"></div>

          <button onClick={handleUploadClick} className="flex items-center gap-x-4 text-neutral-400 hover:text-white transition font-medium text-lg text-left">
            <PlusSquare size={28} />
            <span>Upload Song</span>
          </button>
        </div>

        <div className="mt-auto text-neutral-500 text-xs">
          <p>SoundCloud Clone v1.0</p>
        </div>

      </div>
      <div className="flex-1 h-full" onClick={onClose}></div>
    </div>
  );
};

export default MobileMenu;