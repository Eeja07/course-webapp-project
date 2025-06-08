import Sidebar from './sidebar'
import Header from './header'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StudentList() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const students = [
    { name: 'Defender Artha Widiprasetyo', nrp: '5024221032', due: 'Monday, 14 April 2025' },
    { name: 'Raditya Rakha Renanda', nrp: '5024221031', due: 'Monday, 14 April 2025' },
    { name: 'Mahija Ibad Pradipta', nrp: '5024221026', due: 'Monday, 14 April 2025' },
    { name: 'Cedric Anthony Edysa', nrp: '5024221015', due: 'Monday, 14 April 2025' },
    { name: 'Natania Christin Agustina', nrp: '5024231014', due: 'Monday, 14 April 2025' },
  ]

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nrp.includes(searchTerm)
  )

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      <main className="p-4 md:p-6 md:pl-64 flex flex-col items-center">
        <div className="w-full max-w-7xl md:ml-8">

          {/* Search*/}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border-2 border-red-400 rounded-full outline-none placeholder:text-gray-500"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Student</h2>

          {/* Table */}
          <div className="overflow-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">NRP</th>
                  <th className="p-4 font-medium">Due date</th>
                  <th className="p-4 font-medium">Project</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-4 flex items-center gap-2">
                      <input type="checkbox" />
                      {student.name}
                    </td>
                    <td className="p-4">{student.nrp}</td>
                    <td className="p-4">{student.due}</td>
                    <td className="p-4">
                      {student.name === 'Defender Artha Widiprasetyo' ? (
                        <span
                          onClick={() => navigate('/taskdetail')}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          See Project
                        </span>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed">See Project</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}

export default StudentList
