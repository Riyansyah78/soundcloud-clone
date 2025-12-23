import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom'; 
import { Home, Search, Library, Heart, ShieldCheck, ListMusic } from 'lucide-react'; 
import Box from '../Box';
import SidebarItem from './SidebarItem';
import useAdmin from '../../hooks/useAdmin'; 
import { supabase } from '../../services/supabaseClient';

const Sidebar = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [playlists, setPlaylists] = useState([]);

  // Fetch Playlists User
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (data) setPlaylists(data);
    };

    fetchPlaylists();
    
    
  }, []);

  const routes = useMemo(() => [
    { icon: Home, label: 'Home', active: location.pathname === '/', href: '/' },
    { icon: Search, label: 'Search', active: location.pathname === '/search', href: '/search' },
    { icon: Library, label: 'Your Library', active: location.pathname === '/library', href: '/library' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin Dashboard', active: location.pathname === '/admin', href: '/admin' }] : [])
  ], [location.pathname, isAdmin]);

  return (
    <div className="flex h-full">
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        <Box>
          <div className="flex flex-col gap-y-4 px-5 py-4">
            {routes.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>
        </Box>
        
        <Box className="overflow-y-auto h-full">
           <div className="p-5 flex flex-col gap-y-2">
             <div className="text-neutral-400 font-medium text-sm pl-2 mb-2">Your Library</div>
             
             {/* 1. LIKED SONGS (Hardcoded Item) */}
             <div 
               onClick={() => navigate('/library', { state: { tab: 'liked' } })} 
               className="flex items-center gap-x-3 text-neutral-400 hover:text-white cursor-pointer transition p-2 hover:bg-white/5 rounded-md"
             >
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-sm flex items-center justify-center">
                   <Heart size={16} fill="white" className="text-white"/>
                </div>
                <p className="font-medium truncate">Liked Songs</p>
             </div>

             {/* 2. USER PLAYLISTS (Dynamic) */}
            {playlists.map((playlist) => (
               <div 
                 key={playlist.id}
                 // UPDATE: Arahkan ke halaman playlist spesifik
                 onClick={() => navigate(`/playlist/${playlist.id}`)} 
                 className="flex items-center gap-x-3 text-neutral-400 hover:text-white cursor-pointer transition p-2 hover:bg-white/5 rounded-md"
               >
                  <div className="bg-neutral-800 w-8 h-8 rounded-sm flex items-center justify-center">
                     <ListMusic size={16} />
                  </div>
                  <p className="font-medium truncate">{playlist.name}</p>
               </div>
             ))}

             {playlists.length === 0 && (
                <div className="text-xs text-neutral-500 pl-2 mt-4">
                   No playlists yet. Create one in Library.
                </div>
             )}
           </div>
        </Box>
      </div>
      <main className="h-full flex-1 overflow-y-auto py-2">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;