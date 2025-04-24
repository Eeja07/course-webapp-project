function Header() {
    return (
      <header className="bg-gradient-to-r from-red-700 to-red-500 h-16 pl-64 pr-6 flex justify-between items-center text-white fixed top-0 left-0 right-0 z-10">
        <div className="font-semibold text-lg">Lecturer Guide</div>
        <div className="flex items-center gap-6">
          <button>➕ Parameter Penilaian</button>
          <button>🔔</button>
          <div className="flex items-center gap-2">
            <span>Lecturer Name</span>
            <span>👤</span>
          </div>
        </div>
      </header>
    )
  }
  
  export default Header
  