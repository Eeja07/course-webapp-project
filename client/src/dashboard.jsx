import Sidebar from './sidebar'
import Header from './header'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false) 
  const navigate = useNavigate()
  const dummyCourses = [
    {
      title: 'Sistem Manajemen Basis Data',
      code: 'ABC123',
      grade: 'A',
      image: '/basdat.png',
    },
    {
      title: 'Algoritma dan Pemrograman',
      code: 'DEF456',
      grade: 'A',
      image: '/alprog.png',
    },
    {
      title: 'Matematika Diskrit',
      code: 'GHI789',
      grade: 'B',
      image: '/matdis.png',
    },
    {
      title: 'Sistem Operasi',
      code: 'JKL012',
      grade: 'B',
      image: '/sisop.png',
    },
  ]
  
  return (
    <div className="bg-gray-100 min-h-screen pt-16 overflow-x-hidden">
       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
       <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      <main className="p-4 md:p-6 md:pl-64 flex flex-col items-center">
        <div className="flex flex-col space-y-10 w-full max-w-7xl md:ml-8">
          
          {/* Your Courses */}
          <section>
            <h2 className="text-xl font-semibold border-2 border-red-600 inline-block px-4 py-1 rounded-full text-red-600 mb-4">
              Your Courses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {dummyCourses.map((course, i) => {
    const isBasdat = course.title === 'Sistem Manajemen Basis Data'
    return (
      <div
        key={i}
        onClick={() => isBasdat && navigate('/tasklist')}
        className={`cursor-pointer border rounded-xl overflow-hidden shadow bg-white transform transition-transform duration-300 hover:scale-105 hover:shadow-lg ${
          isBasdat ? 'hover:ring-2 hover:ring-red-400' : ''
        }`}
      >
        <img
          src={course.image}
          alt={course.title}
          className="h-40 w-full object-cover"
        />
        <div className="bg-red-600 text-white p-3 text-sm">
          <div>{course.title}</div>
          <div>{course.code}</div>
          <div>{course.grade}</div>
        </div>
      </div>
    )
  })}
</div>
          </section>

          {/* Recently Accessed */}
          <section>
            <h2 className="text-xl font-semibold border-2 border-red-600 inline-block px-4 py-1 rounded-full text-red-600 mb-4">
              Recently Accessed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {dummyCourses.map((course, i) => {
    const isBasdat = course.title === 'Sistem Manajemen Basis Data'
    return (
      <div
        key={i}
        onClick={() => isBasdat && navigate('/tasklist')}
        className={`cursor-pointer border rounded-xl overflow-hidden shadow bg-white transform transition-transform duration-300 hover:scale-105 hover:shadow-lg ${
          isBasdat ? 'hover:ring-2 hover:ring-red-400' : ''
        }`}
      >
        <img
          src={course.image}
          alt={course.title}
          className="h-40 w-full object-cover"
        />
        <div className="bg-red-600 text-white p-3 text-sm">
          <div>{course.title}</div>
          <div>{course.code}</div>
          <div>{course.grade}</div>
        </div>
      </div>
    )
  })}
</div>
          </section>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
