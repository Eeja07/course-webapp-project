import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from './header';
import Sidebar from './sidebar';
import { Pencil, Save, Upload } from 'lucide-react';

const ProfilePage = () => {
  const fileInputRef = useRef(null); // Defining the ref for file input
  const [editMode, setEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profile, setProfile] = useState({
    nama: '',
    nip: '',
    email: '',
    fakultas: '',
    program_studi: '',
    profile_photo: '',
  });
  const [loading, setLoading] = useState(true); // To manage loading state
  const [error, setError] = useState(null); // To manage error state
  // Fetch profile data when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token'); // Get JWT token from localStorage
      console.log('Token:', token); // Debug log

      if (!token) {
        setError('You need to be logged in to view your profile');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Profile data received:', res.data.user);
        setProfile(res.data.user); // Update profile state with fetched data
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error.response || error.message || error);
        setError('Failed to fetch profile. Please log in again.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length[0]) {
      setSelectedFile(e.target.files[0]); // Set the selected file

      const reader = new FileReader();
      reader.onloadend = () => {
      };
      reader.readAsDataURL(e.target.files[0]); // Read the file as a data URL
    }
  };

  const toggleEdit = async () => {
    if (editMode) {
      try {
        const token = localStorage.getItem('token'); // Get JWT token from localStorage
        if (!token) {
          console.error('No token found. User might not be logged in.');
          alert('You need to be logged in to save changes.');
          return;
        }

        const formData = new FormData();
        formData.append('nama', profile.nama);
        formData.append('nip', profile.nip);
        formData.append('email', profile.email);
        formData.append('fakultas', profile.fakultas);
        formData.append('program_studi', profile.program_studi);
        if (selectedFile) {
          formData.append('profile_photo', selectedFile); // Append the selected file
          console.log('Attached file:', selectedFile.name);
        }

        const res = await axios.post('/api/profile/update', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(res.data.user); // Update profile state with the new data
        console.log('Profile updated successfully:', res.data);
        alert('Profile updated successfully!');
        setSelectedFile(null); // Reset selected file after upload
      } catch (error) {
        console.error('Error updating profile:', error.response || error.message || error);
        alert('Failed to update profile. Please try again.');
      }
    }
    setEditMode(!editMode); // Toggle edit mode
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen pl-64 pt-16">
      <Sidebar />
      <Header />

      <main className="p-10">
        <h2 className="text-2xl font-bold text-red-600 border-2 border-red-600 inline-block px-6 py-1 rounded-full mb-10">
          Lecturer Profile
        </h2>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Profile Photo */}
          <div
            className="relative w-64 h-64 rounded-3xl border-4 border-red-500 overflow-hidden cursor-pointer"
            onClick={() => editMode && fileInputRef.current.click()}
            title={editMode ? 'Click to change photo' : ''}
          >
            <img
              src={profile.profile_photo ? '/uploads/${profile.profile_photo}': '/default-avatar.png'}
              alt="Lecturer Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load image:', e.target.src);
                // Directly use default image on error
                e.target.src = '/default-avatar.png';
                // Prevent infinite error loop
                e.target.onerror = null;
              }}
            />
            {editMode && (
              <div className="absolute bottom-2 right-2 bg-white text-red-600 p-1 rounded-full shadow">
                <Upload size={18} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Profile Information */}
          <div className="flex flex-col gap-4 w-full max-w-xl">
            <ProfileRow label="Nama" name="nama" value={profile.nama} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="NIP" name="nip" value={profile.nip} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Email" name="email" value={profile.email} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Fakultas" name="fakultas" value={profile.fakultas} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Program Studi" name="program_studi" value={profile.program_studi} onChange={handleChange} editMode={editMode} />

            <button
              className="mt-6 flex items-center gap-2 text-red-600 hover:underline font-semibold"
              onClick={toggleEdit}
            >
              {editMode ? <Save size={18} /> : <Pencil size={18} />}
              {editMode ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Profile Row Component to display profile information in both edit and view mode
function ProfileRow({ label, name, value, onChange, editMode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="min-w-[130px] font-semibold text-gray-700">{label} :</span>
      {editMode ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label}`}
          className="bg-white border border-gray-300 px-4 py-2 rounded-md text-gray-800 w-full max-w-md"
        />
      ) : (
        <span className="bg-gray-300 px-4 py-2 rounded-md text-gray-800 min-w-[250px]">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </span>
      )}
    </div>
  );
}

export default ProfilePage;