import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import Sidebar from './sidebar'
import Header from './header'
import { MessageCircleMore, Info, X } from 'lucide-react'

function TaskDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <main className="p-4 md:p-6 md:pl-64 flex flex-col items-center">
        <div className="w-full max-w-7xl md:ml-8 space-y-6">
          {/* Info Area */}
          <div className="text-gray-700">
            <h2 className="text-2xl font-bold">Basis Data (A)</h2>
            <p className="text-md text-red-600">
              Tugas 1 : Resume Mengenai Basis Data
            </p>
          </div>

          {/* Tabel info tugas */}
          <div className="bg-gray-300 p-6 rounded-xl">
            <div className="bg-red-400 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-white text-sm font-medium">
              <div>
                <p>Nama Mahasiswa</p>
                <p className="font-normal">Defender Artha Widiprasetyo</p>
              </div>
              <div>
                <p>Nrp</p>
                <p className="font-normal">5024221031</p>
              </div>
              <div>
                <p>Submission Status</p>
                <p className="font-normal">Submitted</p>
              </div>
              <div>
                <p>Due Date</p>
                <p className="font-normal">Monday, 14 April 2025, 12.00 AM</p>
              </div>
              <div>
                <p>Submit Date</p>
                <p className="font-normal">Sunday, 13 April 2025, 09.00 AM</p>
              </div>
              <div>
                <p>File Submissions</p>
                <a
  href="https://drive.google.com/file/d/1pDA3h-WS8TnwHswTok3AhwXKLzJtgAvX/view?usp=sharing"
  target="_blank"
  rel="noopener noreferrer"
  className="font-normal flex items-center gap-1 text-yellow-100 text-bold hover:underline"
>
  <span className="text-yellow-300">📁</span> Resume Basis Data_Defender Artha_5024221032.pdf (click here)
</a>
              </div>
            </div>
          </div>

          {/* Button Area */}
          <div className="flex justify-center mt-4">
            {/* <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">
              <MessageCircleMore size={16} />
              Add Comments
            </button> */}
            <button
              onClick={() => navigate("/grade")}
              className="w-full justify-center flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
            >
              <Info size={18} />
              Grade
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TaskDetail
