import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, User } from 'lucide-react';
import useUploadModal from '../../hooks/useUploadModal';
import useAuthModal from '../../hooks/useAuthModal';
import { supabase } from '../../services/supabaseClient';

const MobileBottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const uploadModal = useUploadModal();
  const authModal = useAuthModal();
  const [user, setUser] = useState(null);

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
    <nav className="
      md:hidden 
      fixed bottom-0 left-0 right-0 
      z-40
      bg-gradient-to-t from-black via-black/95 to-black/80
      backdrop-blur-lg
      border-t border-white/10
      px-2 pt-2 pb-safe
      safe-area-inset-bottom
    ">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`
              flex flex-col items-center justify-center
              py-2 px-3
              min-w-[60px]
              rounded-xl
              transition-all duration-200
              ${item.active 
                ? 'text-sc-orange scale-105' 
                : 'text-neutral-400 hover:text-white active:scale-95'
              }
            `}
          >
            <div className={`
              relative p-2 rounded-xl transition-all duration-200
              ${item.active 
                ? 'bg-sc-orange/20' 
                : 'hover:bg-white/10'
              }
            `}>
              <item.icon 
                size={22} 
                strokeWidth={item.active ? 2.5 : 2}
                className="transition-all duration-200"
              />
              {item.active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sc-orange rounded-full" />
              )}
            </div>
            <span className={`
              text-[10px] mt-1 font-medium
              transition-all duration-200
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
