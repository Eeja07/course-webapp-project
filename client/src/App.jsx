import { useState } from 'react';

export default function App() {
  const [nama, setName] = useState('');
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    console.log('Submitting:', { nama, email }); // Log the data being sent
  
    try {
      const res = await fetch('http://localhost:4000/api/users', {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-800 to-purple-900 text-white flex items-center justify-center">
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
      </div>
    </div>
  );
}