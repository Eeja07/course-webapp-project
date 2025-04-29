import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import { useNavigate } from 'react-router-dom'

function TaskList() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Dummy data Materi dan Tugas
  const tasks = [
    {
      week: 'Week 1',
      title: 'Introduction of Databases',
      materials: ['Tugas 1: Resume Mengenai Basis Data'],
    },
    {
      week: 'Week 2',
      title: 'Implementation of SQL and NoSQL',
      materials: ['Tugas 2: Instalasi XAMPP', 'Tugas 3: Instalasi MongoDB'],
    },
    {
      week: 'Week 3',
      title: 'MySQL and PostgreSQL',
      materials: ['Tugas 4: Pembuatan Tabel Sederhana Pada MySQLadmin'],
    },
  ]

  const [expandedWeeks, setExpandedWeeks] = useState([])

  const toggleExpand = (week) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <main className="p-4 md:p-6 md:pl-64 flex flex-col items-center">
        <div className="flex flex-col w-full max-w-7xl md:ml-8">

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Sistem Manajemen Basis Data</h2>

          {/* Task List Container */}
          <div className="bg-gray-300 p-8 rounded-xl shadow-md">
            <h3 className="text-center font-semibold mb-6 text-gray-700">Task List</h3>

            {/* List Mingguan */}
            {tasks.map((task, idx) => (
              <div key={idx} className="mb-6">
                {/* Week Header */}
                <button
                  onClick={() => toggleExpand(task.week)}
                  className="w-full text-left bg-white p-3 rounded-md font-bold text-gray-700 shadow-md hover:bg-gray-100 transition"
                >
                  {task.week} - {task.title}
                  <span className="float-right">
                    {expandedWeeks.includes(task.week) ? '▲' : '▼'}
                  </span>
                </button>

                {/* List Materi */}
                {expandedWeeks.includes(task.week) && (
                  <div className="mt-3 space-y-2 ml-4">
               {task.materials.map((material, i) => {
  const isClickable = material.includes('Resume Mengenai Basis Data')
  return (
    <div
      key={i}
      onClick={() => {
        if (isClickable) navigate('/studentlist')
      }}
      className={`px-4 py-2 rounded-md shadow-sm transition ${
        isClickable
          ? 'bg-white text-gray-600 hover:bg-gray-50 cursor-pointer'
          : 'bg-white text-gray-400 cursor-not-allowed'
      }`}
    >
      {material}
    </div>
  )
})}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}

export default TaskList
