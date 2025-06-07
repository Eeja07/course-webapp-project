import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Send, RefreshCw } from "lucide-react";
import Sidebar from "./sidebar";
import Header from "./header";
import axios from 'axios';

const Grade = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [columns, setColumns] = useState([]);
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
    const [fetched, setFetched] = useState(false);
    const [finalScore, setFinalScore] = useState(null);
    const [predicate, setPredicate] = useState(null);
    const [showAddMainAspectModal, setShowAddMainAspectModal] = useState(false);
    const [newMainAspectName, setNewMainAspectName] = useState("");
    const [addingMainAspect, setAddingMainAspect] = useState(false);

    useEffect(() => {
        fetchGradeData();
        fetchFinalScore(); 
    }, []);
    const fetchGradeData = async () => {
        setLoading(true);
        try {
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

            console.log("API Response:", response.data);

            if (response.data && response.data.data) {
                const { data } = response.data;
                const newColumns = [];
                const newScores = {};

                // Loop setiap section (penguasaan_materi, celah_keamanan, etc)
                Object.entries(data).forEach(([sectionKey, sectionData]) => {
                    // Ubah key jadi Title Case
                    const title = sectionKey
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    const aspects = Object.keys(sectionData)
                        .filter(key => !['id', 'user_id', 'created_at', 'updated_at'].includes(key)) // filter metadata field
                        .map(key => key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')); // Title Case

                    newColumns.push({ title, aspects });

                    // Set nilai awal skor
                    aspects.forEach(aspect => {
                        const aspectKeySnake = aspect.toLowerCase().replace(/\s+/g, "_");
                        newScores[`${title}-${aspect}`] = sectionData[aspectKeySnake]?.toString() || '';
                    });
                });

                setColumns(newColumns);
                setScores(newScores);
            }
        } catch (error) {
            console.error('Error fetching grade data:', error);
            if (error.response && error.response.status !== 404) {
                alert("Error loading data: " + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
        setFetched(true);
        setTimeout(() => setFetched(false), 5000);
    };


    const resetModalState = () => {
        setCurrentColIndex(null);
        setCurrentAspectIndex(null);
        setNewAspectName("");
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

    const closeModal = (modalStateSetter) => {
        modalStateSetter(false);
        resetModalState();
    };

    const handleAddAspect = async () => {
        if (newAspectName.trim() === "" || currentColIndex === null) {
            alert("Please enter a valid name for the sub-aspect.");
            return;
        }

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
            closeModal(setShowAddModal);

            // Success message
            alert(`New sub-aspect "${newAspectName.trim()}" has been added successfully.`);
        } catch (error) {
            console.error('Error adding column:', error);
            alert("Error adding sub-aspect: " + (error.response?.data?.message || error.message));
        } finally {
            setSchemaModificationLoading(false);
        }
    };

    const handleEditAspect = async () => {
        if (newAspectName.trim() === "" || currentColIndex === null || currentAspectIndex === null) {
            alert("Please enter a valid name for the sub-aspect.");
            return;
        }

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

            closeModal(setShowEditModal);

            // Success message
            alert(`Sub-aspect renamed from "${oldAspectName}" to "${newAspectName.trim()}" successfully.`);
        } catch (error) {
            console.error('Error renaming column:', error);
            alert("Error renaming sub-aspect: " + (error.response?.data?.message || error.message));
        } finally {
            setSchemaModificationLoading(false);
        }
    };

    const handleDeleteAspect = async () => {
        if (currentColIndex === null || currentAspectIndex === null) {
            alert("Cannot identify the sub-aspect to delete.");
            return;
        }

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

            closeModal(setShowDeleteModal);

            // Success message
            alert(`Sub-aspect "${aspectName}" has been deleted successfully.`);
        } catch (error) {
            console.error('Error deleting column:', error);
            alert("Error deleting sub-aspect: " + (error.response?.data?.message || error.message));
        } finally {
            setSchemaModificationLoading(false);
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
                } else if (isNaN(parseInt(value, 10))) {
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

        // Create a structured payload from the scores
        const formattedData = {};

        columns.forEach(col => {
            const categoryKey = col.title.toLowerCase().replace(/\s+/g, "_");
            formattedData[categoryKey] = {};

            col.aspects.forEach(aspect => {
                const aspectKey = aspect.toLowerCase().replace(/\s+/g, "_");
                const scoreKey = `${col.title}-${aspect}`;
                formattedData[categoryKey][aspectKey] = parseInt(scores[scoreKey], 10);
            });
        });

        const payload = {
            parameter: "Sistem Manajemen Basis Data",
            data: formattedData,
        };

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.error('No authentication token found');
                alert("You must be logged in to submit grades.");
                setLoading(false);
                return;
            }

            // Submit grades data
            const response = await axios.post('/api/grade-submit', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Submit successful:', response.data);

            // Calculate final grade
            const finalGradeResponse = await axios.get('/api/grades/final', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Final grade calculation:', finalGradeResponse.data);

            const finalScore = await axios.get('/api/final-grades', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Final score:', finalScore.data);


            await fetchFinalScore(); // Refresh final score after submission
            // Optional: Show success message
            alert("Data submitted successfully!");
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 5000);

        } catch (error) {
            console.error('Submit failed:', error);
            alert("Error submitting data: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    // Langkah 3: Panggil fungsi saat komponen dimuat 
    // (letakkan kode ini di dalam useEffect)
    // Helper function to determine if a field is invalid
    const isFieldInvalid = (key) => invalidFields.includes(key);

    // Function to handle score input change
    const handleScoreChange = (key, value) => {
        // Update the scores state
        setScores(prev => ({
            ...prev,
            [key]: value
        }));

        // Remove field from invalidFields if it was previously marked as invalid
        if (invalidFields.includes(key)) {
            setInvalidFields(prev => prev.filter(field => field !== key));
        }
    };
    // Tambahkan fungsi fetchFinalScore setelah fungsi fetchGradeData
    const fetchFinalScore = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await axios.get('/api/final-grades', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Final score data:', response.data);

            if (response.data && response.data.data) {
                // Update state dengan data dari API
                setFinalScore(response.data.data.finalScore);
                setPredicate(response.data.data.predicate);
            }
        } catch (error) {
            console.error('Error fetching final score:', error);
            // Jika error 404, set nilai ke null (belum dihitung)
            if (error.response?.status === 404) {
                setFinalScore(null);
                setPredicate(null);
            }
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

                    {fetched && (
                        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded mb-6">
                            Data has been loaded successfully.
                        </div>
                    )}

                    {finalScore !== null && (
                        <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded mb-6 text-center">
                            Final Score: <span className="font-bold text-2xl">{finalScore}</span> / 100
                            <span className="ml-1 mr-1">with Predicate: <span className="font-bold text-2xl">{predicate}</span></span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Grade Aspects</h2>
                    <button
                        onClick={() => setShowAddMainAspectModal(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition text-sm"
                    >
                        + Add Main Aspect
                    </button>
                    </div>


                    {columns.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            No assessment parameters found. Please refresh or contact administrator.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {columns.map((col, colIndex) => (
                            <div key={colIndex} className="mb-4">
                                <h2 className="text-center font-semibold mb-3">{col.title}</h2>
                                {col.aspects.map((aspect, i) => {
                                    const scoreKey = `${col.title}-${aspect}`;
                                    return (
                                        <div key={i} className="flex items-center mb-3 gap-1 outline outline-gray-200 px-3 py-1 rounded-md">
                                            <div className="flex-1">
                                                <p className="text-sm mb-1">{aspect}</p>
                                                <input
                                                    type="text"
                                                    placeholder="Number of Error(s)"
                                                    className={`w-full px-3 py-2 border-2 rounded shadow-sm my-1 ${isFieldInvalid(scoreKey)
                                                        ? "border-red-500"
                                                        : "border-gray-400"
                                                        }`}
                                                    value={scores[scoreKey] || ""}
                                                    onChange={(e) => handleScoreChange(scoreKey, e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => openEditModal(colIndex, i, aspect)}
                                                    className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-md transition"
                                                    title="Edit"
                                                    disabled={loading}
                                                >
                                                    <Pencil size={15} className="text-gray-700" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(colIndex, i)}
                                                    className="h-8 w-8 flex items-center justify-center hover:bg-red-100 rounded-md transition"
                                                    title="Delete"
                                                    disabled={loading}
                                                >
                                                    <Trash2 size={15} className="text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => openAddModal(colIndex)}
                                    className="flex items-center text-sm text-gray-600 mt-2 hover:text-black hover:underline transition"
                                    disabled={loading}
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
                            disabled={loading || columns.length === 0}
                            className={`flex items-center gap-2 px-6 py-3 ${loading || columns.length === 0
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
                            autoFocus
                        />
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => closeModal(setShowAddModal)}
                                className="px-6 py-2 border border-gray-400 text-gray-800 rounded-md hover:bg-red-100 transition-all"
                                disabled={schemaModificationLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAspect}
                                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                                disabled={schemaModificationLoading || !newAspectName.trim()}
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
                            autoFocus
                        />
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => closeModal(setShowEditModal)}
                                className="px-6 py-2 border border-gray-400 text-gray-800 rounded-md hover:bg-red-100 transition-all"
                                disabled={schemaModificationLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditAspect}
                                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                                disabled={schemaModificationLoading || !newAspectName.trim()}
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
                        <p className="text-gray-800 mb-5">
                            Are you sure? This will permanently remove this field from the database.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => closeModal(setShowDeleteModal)}
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
         {showAddMainAspectModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
      <h2 className="text-xl font-bold text-green-600 mb-4">Add Main Aspect</h2>
      <input
        type="text"
        placeholder="Main Aspect Name"
        value={newMainAspectName}
        onChange={(e) => setNewMainAspectName(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-5 border-gray-500"
        disabled={addingMainAspect}
        autoFocus
      />
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            setShowAddMainAspectModal(false);
            setNewMainAspectName("");
          }}
          className="px-6 py-2 border border-gray-400 text-gray-800 rounded-md hover:bg-red-100 transition-all"
          disabled={addingMainAspect}
        >
          Cancel
        </button>
     <button
  onClick={async () => {
    const trimmed = newMainAspectName.trim();
    const categoryKey = trimmed.toLowerCase().replace(/\s+/g, "_");

    if (!trimmed) return alert("Enter a valid aspect name.");

    setAddingMainAspect(true);

    try {
      const defaultSub = "Sub-aspek 1";

      // SIMULASI TANPA BACKEND: langsung update UI
      setColumns(prev => [...prev, { title: trimmed, aspects: [defaultSub] }]);
      setScores(prev => ({ ...prev, [`${trimmed}-${defaultSub}`]: "" }));

      alert("Main Aspect added (Frontend Only).");
      setShowAddMainAspectModal(false);
      setNewMainAspectName("");
    } catch (error) {
      console.error(error);
      alert("Failed to add main aspect.");
    } finally {
      setAddingMainAspect(false);
    }
  }}
  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all"
  disabled={addingMainAspect}
>
  {addingMainAspect ? (
    <>
      <RefreshCw size={16} className="animate-spin inline mr-2" />
      Adding...
    </>
  ) : (
    "Add"
  )}
</button>
      </div>
    </div>
  </div>
)}
        </div>
    );
};

export default Grade;