import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    nama: '',
    email: '',
    profile_photo: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      try {
        const res = await axios.get('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const user = res.data.user;
        setUserProfile({
          nama: user.nama || '',
          email: user.email || '',
          profile_photo: user.profile_photo || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error.response || error.message || error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <header className="bg-gradient-to-r from-red-700 to-red-500 h-16 fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:pl-64 z-20 text-white">
      
      {/* LEFT: Hamburger for mobile */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={onToggleSidebar}
      >
        ☰
      </button>

      {/* RIGHT: User Info */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 ml-auto">
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 cursor-pointer hover:bg-red-400 px-2 py-1 rounded-full transition-all"
        >
          <span className="hidden md:inline text-sm font-medium whitespace-nowrap">
            Halo, {userProfile.nama || userProfile.email || 'User'}!
          </span>
          <img
            src={userProfile.profile_photo ? `http://localhost:4000${userProfile.profile_photo}` : '/defaultprofile.png'}
            alt="Profile"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover bg-white p-1"
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
