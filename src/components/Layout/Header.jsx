import React from 'react';
import { useNavigate } from 'react-router-dom';
// PERBAIKAN: Pastikan 'Home' ada di dalam kurung kurawal import ini
import { ChevronLeft, ChevronRight, Home, Search, User, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import useAuthModal from '../../hooks/useAuthModal';

const Header = ({ className, children }) => {
  const navigate = useNavigate();
  const authModal = useAuthModal();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Cek User Login Status
    const checkUser = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       setUser(session?.user ?? null);
    };
    checkUser();

    // Listener jika login/logout berubah
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload(); 
  };

  return (
    <div className={`h-fit bg-gradient-to-b from-emerald-800 p-6 ${className}`}>
      <div className="w-full mb-4 flex items-center justify-between">
        
        {/* --- DESKTOP NAVIGATION (Panah) --- */}
        <div className="hidden md:flex gap-x-2 items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition p-1"
          >
            <ChevronLeft className="text-white" size={28} />
          </button>
          <button 
            onClick={() => navigate(1)} 
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition p-1"
          >
            <ChevronRight className="text-white" size={28} />
          </button>
        </div>

        {/* --- MOBILE NAVIGATION sudah dipindahkan ke MobileBottomBar --- */}

        {/* --- AUTH BUTTONS --- */}
        <div className="flex justify-between items-center gap-x-4">
          {user ? (
            <div className="flex gap-x-4 items-center">
                <button 
                    onClick={handleLogout}
                    className="bg-white px-6 py-2 rounded-full font-bold text-black hover:scale-105 transition"
                >
                    Logout
                </button>
                <button 
                    onClick={() => navigate('/profile')}
                    className="bg-white p-2 rounded-full hover:scale-105 transition"
                >
                    <User size={20} className="text-black"/>
                </button>
            </div>
          ) : (
            <>
              <button 
                onClick={authModal.onOpen} 
                className="bg-transparent text-neutral-300 font-medium hover:text-white transition"
              >
                Sign up
              </button>
              <button 
                onClick={authModal.onOpen} 
                className="bg-white px-6 py-2 rounded-full font-bold text-black hover:scale-105 transition"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default Header;