import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-red-700 to-red-500 text-white fixed left-0 top-0 flex flex-col justify-between">
      <div>
        <div className="p-4 font-bold text-xl border-b border-white">
          🎓 E-Learning Name
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {['Dashboard', 'Home', 'Calendar', 'Profile'].map((item) => (
            <NavLink
              key={item}
              to={`/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md ${
                  isActive ? 'bg-white text-red-600 font-bold' : 'hover:bg-red-500'
                }`
              }
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
