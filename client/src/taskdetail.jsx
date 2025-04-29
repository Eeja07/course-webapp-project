import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import { MessageCircleMore, Info, X } from 'lucide-react'

function TaskDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState(false)

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
                <p className="font-normal flex items-center gap-1">
                  <span className="text-yellow-300">📁</span> Resume Basis Data_Defender Artha_5024221032.pdf
                </p>
              </div>
            </div>
          </div>

          {/* Button Area */}
          <div className="flex justify-between">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">
              <MessageCircleMore size={16} />
              Add Comments
            </button>
            <button
              onClick={() => setShowGradeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            >
              <Info size={16} />
              Grade
            </button>
          </div>
        </div>
      </main>

      {/* Modal Grading */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
             {/* CLOSE BUTTON */}
             <button
  onClick={() => setShowGradeModal(false)}
  className="absolute top-3 right-3 bg-white text-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-red-100 transition"
  aria-label="Close"
>
  <X size={28} />
</button>
            <div className="relative bg-gray-200 w-full max-w-5xl p-6 rounded-xl flex flex-col md:flex-row">
            {/* Left section (12 input fields) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700">Materi Basis Data</label>
                  <input
                    type="number"
                    placeholder="Jumlah Kesalahan"
                    className="mt-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none"
                  />
                </div>
              ))}
              {/* Total for each column */}
              {Array(4).fill(0).map((_, i) => (
                <div key={`total-${i}`} className="flex flex-col">
                  <label className="text-sm font-semibold text-red-600">Total Kesalahan</label>
                  <input
                    type="text"
                    readOnly
                    className="mt-1 px-3 py-2 rounded-md border border-gray-300 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* Right summary section */}
            <div className="w-full md:w-64 mt-6 md:mt-0 md:ml-6 bg-red-600 text-white p-4 rounded-lg space-y-4">
              {['Total Kesalahan', 'Nilai', 'Predikat', 'Status'].map((label, i) => (
                <div key={i}>
                  <p className="font-semibold">{label}</p>
                  <input
                    type="text"
                    readOnly
                    className="w-full mt-1 px-3 py-2 rounded-md text-black bg-white"
                  />
                </div>
              ))}
              <button className="bg-white text-red-600 px-4 py-2 rounded-full mt-2 flex items-center justify-center w-full font-semibold">
                ➕ Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
