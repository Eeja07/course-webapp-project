import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

function Sidebar({ isOpen, onClose }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const navigate = useNavigate()

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    localStorage.removeItem('token');
    navigate('/')
  }

  return (
    <>
      {/* Sidebar Utama */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-red-700 to-red-500 text-white 
          z-40 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 w-64 flex flex-col
        `}
      >
        {/* Bagian Logo */}
        <div className="px-3 py-1 flex flex-col items-center">
          <button
            onClick={onClose}
            className="md:hidden self-end text-white text-2xl font-bold mb-2"
          >
            ×
          </button>

          <img
            src="/logoclasspace.png"
            alt="Classpace Logo"
            className="h-25 w-auto max-w-[220px] object-contain"
          />
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 flex flex-col gap-1 px-4 pt-0">
          {['Dashboard', 'Home', 'Calendar', 'Profile'].map((item) => (
            <NavLink
              key={item}
              to={`/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md transform transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-red-600 font-bold'
                    : 'hover:bg-red-500 hover:translate-x-2'
                }`
              }
              onClick={onClose}
            >
              {item}
            </NavLink>
          ))}
        </nav>

        {/* Tombol Log Out */}
        <div
          onClick={handleLogoutConfirm}
          className="m-3 px-4 py-2 flex items-center gap-2 font-bold text-sm rounded-md cursor-pointer transition-all hover:bg-red-700"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Log Out</h2>
            <p className="text-gray-800 mb-5">Are you sure?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-red-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-800 transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
