import { useState, useEffect } from 'react';

export default function App() {
  const [nama, setName] = useState('');
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAdminPage, setIsAdminPage] = useState(false); // State to toggle between pages

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Submitting:', { nama, email });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nama, email }),
      });

      if (!res.ok) {
        throw new Error('Failed to add user');
      }

      const data = await res.json();
      setResponse(data.message);
      setName('');
      setEmail('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setResponse('Error adding user jsx');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    if (isAdminPage) {
      fetchUsers();
    }
  }, [isAdminPage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {isAdminPage ? (
        // Admin Page
        <div>
          <h1 className="text-3xl font-bold mb-6">Database Admin Page</h1>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4 border-b">Nama</th>
                    <th className="py-2 px-4 border-b">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="py-2 px-4 border-b">{user.nama}</td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No users found.</p>
          )}
          <button
            onClick={() => setIsAdminPage(false)} // Go back to the form page
            className="mt-6 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded"
          >
            Back to Form
          </button>
        </div>
      ) : (
        // Form Page
        <div className="bg-white text-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Form Tambah Data</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Nama</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded border border-gray-300"
                value={nama}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 rounded border border-gray-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-pink-700 hover:bg-pink-800 text-white px-4 py-2 rounded w-full"
            >
              Simpan
            </button>
          </form>

          {response && (
            <div className="mt-4 text-sm text-green-600 bg-green-100 p-2 rounded">
              {response}
            </div>
          )}

          <button
            onClick={() => setIsAdminPage(true)} // Go to the admin page
            className="block text-center mt-6 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded w-full"
          >
            Database Admin
          </button>
        </div>
      )}
    </div>
  );
}