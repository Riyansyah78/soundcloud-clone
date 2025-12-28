import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, User } from 'lucide-react';
import useUploadModal from '../../hooks/useUploadModal';
import useAuthModal from '../../hooks/useAuthModal';
import usePlayerStore from '../../store/usePlayerStore';
import { supabase } from '../../services/supabaseClient';

const MobileBottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const uploadModal = useUploadModal();
  const authModal = useAuthModal();
  const player = usePlayerStore();
  const [user, setUser] = useState(null);
  
  // Check if player is active (has a song loaded)
  const isPlayerActive = !!player.activeId;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUploadClick = () => {
    if (!user) {
      return authModal.onOpen();
    }
    return uploadModal.onOpen();
  };

  const handleProfileClick = () => {
    if (!user) {
      return authModal.onOpen();
    }
    navigate('/profile');
  };

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      active: location.pathname === '/', 
      onClick: () => navigate('/') 
    },
    { 
      icon: Search, 
      label: 'Search', 
      active: location.pathname === '/search', 
      onClick: () => navigate('/search') 
    },
    { 
      icon: PlusSquare, 
      label: 'Upload', 
      active: false, 
      onClick: handleUploadClick 
    },
    { 
      icon: Library, 
      label: 'Library', 
      active: location.pathname === '/library', 
      onClick: () => navigate('/library') 
    },
    { 
      icon: User, 
      label: 'Profile', 
      active: location.pathname === '/profile', 
      onClick: handleProfileClick 
    },
  ];

  return (
    <nav className={`
      md:hidden 
      fixed left-0 right-0 
      z-[60]
      bg-black
      px-2 py-2
      transition-all duration-300 ease-in-out
      ${isPlayerActive 
        ? 'bottom-[80px] border-b border-neutral-800' 
        : 'bottom-0 border-t border-neutral-800'
      }
    `}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`
              flex flex-col items-center justify-center
              py-1 px-2
              min-w-[50px]
              rounded-lg
              transition-all duration-200
              ${item.active 
                ? 'text-sc-orange' 
                : 'text-neutral-400 hover:text-white active:scale-95'
              }
            `}
          >
            <item.icon 
              size={20} 
              strokeWidth={item.active ? 2.5 : 2}
              className="transition-all duration-200"
            />
            <span className={`
              text-[9px] mt-0.5 font-medium
              ${item.active ? 'opacity-100' : 'opacity-70'}
            `}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
