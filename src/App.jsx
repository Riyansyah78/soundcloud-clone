import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Home from './pages/home';
import AuthModal from './components/Auth/AuthModal';     
import UploadModal from './components/Upload/UploadModal';
import Player from './components/Player/Player'; 
import MobileMenu from './components/Layout/MobileMenu';
import Search from './pages/Search';
import SongPage from './pages/SongPage';
import AdminDashboard from './pages/Admindashboard';
import Library from './pages/Library';
import PlaylistPage from './pages/PlaylistPage';
import VerifySuccess from './pages/VerifySuccess';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <AuthModal />
      <UploadModal />
      <MobileMenu />
      <div className="flex h-screen bg-sc-dark text-white">
        
        {/* Sidebar: Fixed width di kiri */}
        <Sidebar />

        {/* Main Content Area: Mengisi sisa ruang di kanan */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#1e1e24] to-[#121216] m-2 rounded-lg">
          
          <Header />
          
          <div className="flex-1 overflow-y-auto px-6 py-2 pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/song/:id" element={<SongPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/verify-success" element={<VerifySuccess />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </div>

        </main>
        
        <Player />
      
      </div>
    </Router>
  );
}

export default App;