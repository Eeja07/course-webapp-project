import React, { useState } from "react";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import Sidebar from "./sidebar";
import Header from "./header";

const Grade = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [columns, setColumns] = useState([
    {
      title: "Penguasaan Materi",
      aspects: ["Materi Basis Data", "Materi Struktur", "Materi Matematika", "Materi Lainnya"],
    },
    {
      title: "Celah Keamanan",
      aspects: ["Sanitasi", "Authorization", "Lainnya"],
    },
    {
      title: "Fitur Utama",
      aspects: ["Create", "Read", "Update", "Delete"],
    },
    {
      title: "Fitur Pendukung",
      aspects: ["Responsive", "Load Time", "Lainnya"],
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newAspectName, setNewAspectName] = useState("");
  const [currentColIndex, setCurrentColIndex] = useState(null);
  const [currentAspectIndex, setCurrentAspectIndex] = useState(null);

  const openAddModal = (colIndex) => {
    setCurrentColIndex(colIndex);
    setNewAspectName("");
    setShowAddModal(true);
  };

  const openEditModal = (colIndex, aspectIndex, currentName) => {
    setCurrentColIndex(colIndex);
    setCurrentAspectIndex(aspectIndex);
    setNewAspectName(currentName);
    setShowEditModal(true);
  };

  const openDeleteModal = (colIndex, aspectIndex) => {
    setCurrentColIndex(colIndex);
    setCurrentAspectIndex(aspectIndex);
    setShowDeleteModal(true);
  };

  const handleAddAspect = () => {
    if (newAspectName.trim() !== "" && currentColIndex !== null) {
      const updatedColumns = [...columns];
      updatedColumns[currentColIndex].aspects.push(newAspectName.trim());
      setColumns(updatedColumns);
      setShowAddModal(false);
    }
  };

  const handleEditAspect = () => {
    if (newAspectName.trim() !== "" && currentColIndex !== null && currentAspectIndex !== null) {
      const updatedColumns = [...columns];
      updatedColumns[currentColIndex].aspects[currentAspectIndex] = newAspectName.trim();
      setColumns(updatedColumns);
      setShowEditModal(false);
    }
  };

  const handleDeleteAspect = () => {
    if (currentColIndex !== null && currentAspectIndex !== null) {
      const updatedColumns = [...columns];
      updatedColumns[currentColIndex].aspects.splice(currentAspectIndex, 1);
      setColumns(updatedColumns);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <main className="p-4 md:p-6 md:ml-64 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-left">Parameter Penilaian</h1>

        <div className="bg-white p-6 rounded-xl shadow-md max-w-7xl w-full mx-auto">
          <div className="bg-red-400 text-white border text-center font-medium p-2 mb-6 rounded-lg">
            Parameter Penilaian Sistem Manajemen Basis Data
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((col, colIndex) => (
              <div key={colIndex}>
                <h2 className="text-center font-semibold mb-3">{col.title}</h2>
                {col.aspects.map((aspect, i) => (
                  <div key={i} className="flex items-center mb-3 gap-2 outline outline-gray-200 px-3 py-1 rounded-md gap-1">
                    <div className="flex-1">
                      <p className="text-sm mb-1">{aspect}</p>
                      <input
                        type="text"
                        placeholder="Jumlah Kesalahan"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded shadow-sm my-1"
                      />
                    </div>
                    {/* Edit button */}
                    <button
                            onClick={() => openEditModal(colIndex, i, aspect)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-blue-50 rounded-md transition"
                            title="Edit"
                        >
                            <Pencil size={15} className="text-[#29166e]" />
                        </button>
                        <button
                            onClick={() => openDeleteModal(colIndex, i)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-red-50 rounded-md transition"
                            title="Hapus"
                        >
                            <Trash2 size={15} className="text-red-500" />
                        </button>
                  </div>
                ))}
                <button
                  onClick={() => openAddModal(colIndex)}
                  className="flex items-center text-sm text-gray-600 mt-2 hover:text-black hover:underline transition"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Tambah Subjek Aspek
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Tambah Aspek */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Tambah Subjek Aspek</h2>
            <input
              type="text"
              placeholder="Nama Subjek Aspek"
              value={newAspectName}
              onChange={(e) => setNewAspectName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-5 border-gray-500"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-red-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAspect}
                className="px-6 py-2 bg-red-400 text-white rounded-md hover:bg-red-500 transition-all"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Aspek */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Edit Subjek Aspek</h2>
            <input
              type="text"
              placeholder="Nama Subjek Aspek"
              value={newAspectName}
              onChange={(e) => setNewAspectName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-5 border-gray-500"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-red-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAspect}
                className="px-6 py-2 bg-red-400 text-white rounded-md hover:bg-red-500 transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Aspek */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Hapus Subjek Aspek</h2>
            <p className="text-gray-800 mb-5">Yakin ingin menghapus subjek aspek ini?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-red-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAspect}
                className="px-6 py-2 bg-red-400 text-white rounded-md hover:bg-red-500 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grade;
