import Header from './header'
import Sidebar from './sidebar'
import { Pencil, Save, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import axios from 'axios'

function Profile() {
  const fileInputRef = useRef(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const [profile, setProfile] = useState({
    nama: '',
    nip: '',
    email: '',
    fakultas: '',
    prodi: '',
    photo: '/profile.jpg',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file) // simpan file untuk dikirim ke backend
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile((prev) => ({
          ...prev,
          photo: reader.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleEdit = async () => {
    if (editMode) {
      // ⬇️ Kirim ke backend saat tombol SAVE diklik
      try {
        const formData = new FormData()
        formData.append('nama', profile.nama)
        formData.append('nip', profile.nip)
        formData.append('email', profile.email)
        formData.append('fakultas', profile.fakultas)
        formData.append('prodi', profile.prodi)
        if (selectedFile) {
          formData.append('photo', selectedFile) // kirim file asli
        }

        const res = await axios.put('http://localhost:3000/profile/update', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        console.log('✅ Profil berhasil diperbarui:', res.data)
        alert('Profil berhasil disimpan!')
      } catch (error) {
        console.error('❌ Gagal menyimpan profil:', error)
        alert('Gagal menyimpan. Cek koneksi atau server.')
      }
    }

    setEditMode(!editMode)
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
          {/* FOTO PROFIL */}
          <div
            className="relative w-64 h-64 rounded-3xl border-4 border-red-500 overflow-hidden cursor-pointer"
            onClick={() => editMode && fileInputRef.current.click()}
            title={editMode ? "Klik untuk ganti foto" : ""}
          >
            <img
              src={profile.photo}
              alt="Lecturer"
              className="w-full h-full object-cover"
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
              onChange={handlePhotoChange}
            />
          </div>

          {/* INFORMASI */}
          <div className="flex flex-col gap-4 w-full max-w-xl">
            <ProfileRow label="Nama" name="nama" value={profile.nama} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="NIP" name="nip" value={profile.nip} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Email" name="email" value={profile.email} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Fakultas" name="fakultas" value={profile.fakultas} onChange={handleChange} editMode={editMode} />
            <ProfileRow label="Program Studi" name="prodi" value={profile.prodi} onChange={handleChange} editMode={editMode} />

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
  )
}

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
          placeholder={`Isi ${label}`}
          className="bg-white border border-gray-300 px-4 py-2 rounded-md text-gray-800 w-full max-w-md"
        />
      ) : (
        <span className="bg-gray-300 px-4 py-2 rounded-md text-gray-800 min-w-[250px]">
          {value || <span className="text-gray-400 italic">Belum diisi</span>}
        </span>
      )}
    </div>
  )
}

export default Profile
