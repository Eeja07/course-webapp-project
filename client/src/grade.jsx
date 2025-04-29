import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Send, RefreshCw } from "lucide-react";
import Sidebar from "./sidebar";
import Header from "./header";
import axios from 'axios';

const Grade = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [columns, setColumns] = useState([
    {
      title: "Penguasaan Materi",
      aspects: ["Materi Basis Data", "Materi Struktur", "Materi Matematika", "Materti Lainnya"],
    },
    {
      title: "Celah Keamanan",
      aspects: ["Sanitasi", "Authorizatio", "Lainnya"],
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

  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newAspectName, setNewAspectName] = useState("");
  const [currentColIndex, setCurrentColIndex] = useState(null);
  const [currentAspectIndex, setCurrentAspectIndex] = useState(null);
  const [invalidFields, setInvalidFields] = useState([]);
  const [schemaModificationLoading, setSchemaModificationLoading] = useState(false);

  // Fetch existing grade data when component mounts
  useEffect(() => {
    fetchGradeData();
  }, []);

  const fetchGradeData = async () => {
    setLoading(true);
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/grades', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.data) {
        const { penguasaan_materi, celah_keamanan, fitur_utama, fitur_pendukung } = response.data.data;
        
        // Map the database values to the scores state
        const newScores = {};
        
        // Map Penguasaan Materi
        if (penguasaan_materi) {
          Object.entries(penguasaan_materi).forEach(([key, value]) => {
            // Skip non-data fields like id, user_id, created_at, etc.
            if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
              // Convert snake_case to Title Case for display
              const displayName = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              newScores[`Penguasaan Materi-${displayName}`] = value?.toString() || '';
            }
          });
        }
        
        // Map Celah Keamanan
        if (celah_keamanan) {
          Object.entries(celah_keamanan).forEach(([key, value]) => {
            if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
              const displayName = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              newScores[`Celah Keamanan-${displayName}`] = value?.toString() || '';
            }
          });
        }
        
        // Map Fitur Utama
        if (fitur_utama) {
          Object.entries(fitur_utama).forEach(([key, value]) => {
            if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
              const displayName = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              newScores[`Fitur Utama-${displayName}`] = value?.toString() || '';
            }
          });
        }
        
        // Map Fitur Pendukung
        if (fitur_pendukung) {
          Object.entries(fitur_pendukung).forEach(([key, value]) => {
            if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
              const displayName = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              newScores[`Fitur Pendukung-${displayName}`] = value?.toString() || '';
            }
          });
        }
        
        setScores(newScores);
        setSubmitted(Object.keys(newScores).length > 0);
        
        // Update columns based on the received data
        const newColumns = [...columns];
        
        // Helper function to extract aspects from scores
        const getAspectsForCategory = (categoryTitle) => {
          return Object.keys(newScores)
            .filter(key => key.startsWith(`${categoryTitle}-`))
            .map(key => key.split('-')[1]);
        };
        
        // Update each category's aspects
        newColumns.forEach((col, index) => {
          const aspects = getAspectsForCategory(col.title);
          if (aspects.length > 0) {
            newColumns[index].aspects = aspects;
          }
        });
        
        setColumns(newColumns);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
      // If it's a 404, the user doesn't have data yet - this is expected for new users
      if (error.response && error.response.status !== 404) {
        alert("Error loading data: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddAspect = async () => {
    if (newAspectName.trim() !== "" && currentColIndex !== null) {
      setSchemaModificationLoading(true);
      
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          alert("You must be logged in to modify the schema.");
          setSchemaModificationLoading(false);
          return;
        }
        
        // Call the API to add a new column to the database
        const response = await axios.post(
          '/api/schema/add-column',
          {
            categoryTitle: columns[currentColIndex].title,
            aspectName: newAspectName.trim()
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('Add column response:', response.data);
        
        // Update the local state
        const updatedColumns = [...columns];
        updatedColumns[currentColIndex].aspects.push(newAspectName.trim());
        setColumns(updatedColumns);
        setShowAddModal(false);
        
        // Success message
        alert(`New sub-aspect "${newAspectName.trim()}" has been added successfully.`);
      } catch (error) {
        console.error('Error adding column:', error);
        alert("Error adding sub-aspect: " + (error.response?.data?.message || error.message));
      } finally {
        setSchemaModificationLoading(false);
      }
    }
  };

  const handleEditAspect = async () => {
    if (newAspectName.trim() !== "" && currentColIndex !== null && currentAspectIndex !== null) {
      setSchemaModificationLoading(true);
      
      const oldAspectName = columns[currentColIndex].aspects[currentAspectIndex];
      
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          alert("You must be logged in to modify the schema.");
          setSchemaModificationLoading(false);
          return;
        }
        
        // Call the API to rename the column in the database
        const response = await axios.put(
          '/api/schema/rename-column',
          {
            categoryTitle: columns[currentColIndex].title,
            oldAspectName: oldAspectName,
            newAspectName: newAspectName.trim()
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('Rename column response:', response.data);
        
        // Update the local state
        const updatedColumns = [...columns];
        updatedColumns[currentColIndex].aspects[currentAspectIndex] = newAspectName.trim();
        setColumns(updatedColumns);
        
        // Update scores if there's an existing score for this aspect
        const oldKey = `${columns[currentColIndex].title}-${oldAspectName}`;
        const newKey = `${columns[currentColIndex].title}-${newAspectName.trim()}`;
        
        if (scores[oldKey] !== undefined) {
          const updatedScores = { ...scores };
          updatedScores[newKey] = updatedScores[oldKey];
          delete updatedScores[oldKey];
          setScores(updatedScores);
        }
        
        setShowEditModal(false);
        
        // Success message
        alert(`Sub-aspect renamed from "${oldAspectName}" to "${newAspectName.trim()}" successfully.`);
      } catch (error) {
        console.error('Error renaming column:', error);
        alert("Error renaming sub-aspect: " + (error.response?.data?.message || error.message));
      } finally {
        setSchemaModificationLoading(false);
      }
    }
  };

  const handleDeleteAspect = async () => {
    if (currentColIndex !== null && currentAspectIndex !== null) {
      setSchemaModificationLoading(true);
      
      const aspectName = columns[currentColIndex].aspects[currentAspectIndex];
      
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          alert("You must be logged in to modify the schema.");
          setSchemaModificationLoading(false);
          return;
        }
        
        // Call the API to delete the column from the database
        const response = await axios.delete(
          '/api/schema/delete-column',
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            data: {
              categoryTitle: columns[currentColIndex].title,
              aspectName: aspectName
            }
          }
        );
        
        console.log('Delete column response:', response.data);
        
        // Update the local state
        const updatedColumns = [...columns];
        updatedColumns[currentColIndex].aspects.splice(currentAspectIndex, 1);
        setColumns(updatedColumns);
        
        // Remove the score if it exists
        const key = `${columns[currentColIndex].title}-${aspectName}`;
        if (scores[key] !== undefined) {
          const updatedScores = { ...scores };
          delete updatedScores[key];
          setScores(updatedScores);
        }
        
        setShowDeleteModal(false);
        
        // Success message
        alert(`Sub-aspect "${aspectName}" has been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting column:', error);
        alert("Error deleting sub-aspect: " + (error.response?.data?.message || error.message));
      } finally {
        setSchemaModificationLoading(false);
      }
    }
  };

  const validateScores = () => {
    // Check all scores are provided and valid
    const emptyFields = [];
    
    columns.forEach(col => {
      col.aspects.forEach(aspect => {
        const key = `${col.title}-${aspect}`;
        const value = scores[key];
        
        if (value === undefined || value === '') {
          emptyFields.push(key);
        } else if (isNaN(parseInt(value))) {
          emptyFields.push(key);
        }
      });
    });
    
    return emptyFields;
  };

  const handleSubmit = async () => {
    // Validate the form data
    const emptyFields = validateScores();
  
    if (emptyFields.length > 0) {
      setInvalidFields(emptyFields);
      alert("All fields must be filled with valid numbers before submitting!");
      return;
    }
  
    setInvalidFields([]);
    setLoading(true);
    
    const payload = {
      parameter: "Sistem Manajemen Basis Data",
      data: scores,
    };
  
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        alert("You must be logged in to submit grades.");
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/grade-submit', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      console.log('Submit successful:', response.data);
      alert("Data successfully submitted!");
      setSubmitted(true);
    } catch (error) {
      console.error('Submit failed:', error);
      alert("Error submitting data: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <main className="p-4 md:p-6 md:ml-64 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-left">Assessment Parameter</h1>
          
          {loading ? (
            <div className="flex items-center text-gray-500">
              <RefreshCw size={18} className="animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <button 
              onClick={fetchGradeData} 
              className="flex items-center text-sm gap-1 text-gray-600 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              <RefreshCw size={16} />
              Refresh Data
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md max-w-7xl w-full mx-auto">
          <div className="bg-red-400 text-white border text-center font-medium p-2 mb-6 rounded-lg">
            Assessment Parameter: Sistem Manajemen Basis Data / Task 1
          </div>

          {submitted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-6">
              Data has been submitted. You can make changes and resubmit if needed.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((col, colIndex) => (
              <div key={colIndex}>
                <h2 className="text-center font-semibold mb-3">{col.title}</h2>
                {col.aspects.map((aspect, i) => (
                  <div key={i} className="flex items-center mb-3 gap-1 outline outline-gray-200 px-3 py-1 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm mb-1">{aspect}</p>
                      <input
                        type="text"
                        placeholder="Number of Error(s)"
                        className={`w-full px-3 py-2 border-2 rounded shadow-sm my-1 ${
                          invalidFields.includes(`${col.title}-${aspect}`)
                            ? "border-red-500"
                            : "border-gray-400"
                        }`}
                        value={scores[`${col.title}-${aspect}`] || ""}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [`${col.title}-${aspect}`]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => openEditModal(colIndex, i, aspect)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-md transition"
                        title="Edit"
                      >
                        <Pencil size={15} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(colIndex, i)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-red-100 rounded-md transition"
                        title="Delete"
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openAddModal(colIndex)}
                  className="flex items-center text-sm text-gray-600 mt-2 hover:text-black hover:underline transition"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Sub-aspect
                </button>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-red-500 hover:bg-red-700"
              } text-white rounded-lg font-semibold transition`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} className="text-white" />
                  Submit Grade
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Add Aspect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Add Sub-aspect</h2>
            <input
              type="text"
              placeholder="Sub-aspect Name"
              value={newAspectName}
              onChange={(e) => setNewAspectName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-5 border-gray-500"
              disabled={schemaModificationLoading}
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-400 text-gray-800 rounded-md hover:bg-red-100 transition-all"
                disabled={schemaModificationLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAspect}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                disabled={schemaModificationLoading}
              >
                {schemaModificationLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin inline mr-2" />
                    Adding...
                  </>
                ) : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Aspect Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Edit Sub-aspect</h2>
            <input
              type="text"
              placeholder="Sub-aspect Name"
              value={newAspectName}
              onChange={(e) => setNewAspectName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-5 border-gray-500"
              disabled={schemaModificationLoading}
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-400 text-gray-800 rounded-md hover:bg-red-100 transition-all"
                disabled={schemaModificationLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditAspect}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                disabled={schemaModificationLoading}
              >
                {schemaModificationLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Aspect Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Delete Sub-aspect</h2>
            <p className="text-gray-800 mb-5">Are you sure? This will permanently remove this field from the database.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-red-100 transition-all"
                disabled={schemaModificationLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAspect}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                disabled={schemaModificationLoading}
              >
                {schemaModificationLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin inline mr-2" />
                    Deleting...
                  </>
                ) : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grade;