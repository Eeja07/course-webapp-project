import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

function Header({ onToggleSidebar }) {
  return (
    <header className="bg-gradient-to-r from-red-700 to-red-500 h-16 pl-4 md:pl-64 pr-4 flex justify-between items-center text-white fixed top-0 left-0 right-0 z-20">
      
      {/* LEFT: Hamburger */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={onToggleSidebar}
      >
        ☰
      </button>

      {/* RIGHT Content */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 ml-auto">
        
        {/* Button Parameter Penilaian */}
        <button className="bg-white text-red-600 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-100 transition flex items-center gap-1 text-sm whitespace-nowrap">
          <Plus size={16} />
          Parameter Penilaian
        </button>

       {/* User Info*/}
       <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 cursor-pointer hover:bg-red-400 px-2 py-1 rounded-xl transition-all"
        >
          <span className="hidden md:inline text-sm font-medium whitespace-nowrap">
            Halo, user@example.com
          </span>
          <img
            src="/defaultprofile.png"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover bg-white p-1"
          />
        </div>
      </div>

    </header>
  )
}

export default Header
