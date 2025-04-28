import { NavLink } from 'react-router-dom'

function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-red-700 to-red-500 text-white 
        z-40 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 w-64
      `}
    >
      <div>
        <div className="p-4 font-bold text-xl flex justify-between items-center">
          🎓 E-Learning Name
          <button
            onClick={onClose}
            className="md:hidden text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {['Dashboard', 'Home', 'Calendar', 'Profile'].map((item) => (
            <NavLink
              key={item}
              to={`/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md ${
                  isActive
                    ? 'bg-white text-red-600 font-bold'
                    : 'hover:bg-red-500'
                }`
              }
              onClick={onClose}
            >
              {item}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 text-sm">☰ Menu</div>
    </aside>
  )
}

export default Sidebar
