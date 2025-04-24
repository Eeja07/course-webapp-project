import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'

function Enter() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNext = async (e) => {
    e.preventDefault()

    if (step === 'email') {
      setStep('password')
    } else {
      // Kirim data ke backend saat di step password
      try {
        const response = await axios.post('http://localhost:3000/login', formData)
        console.log('Login berhasil:', response.data)

        // TODO: Simpan token jika ada → localStorage.setItem("token", ...)
        navigate('/dashboard')
      } catch (error) {
        console.error('Login gagal:', error)
        alert('Email atau password salah!')
      }
    }
  }

  const handleReturn = () => {
    if (step === 'password') {
      setStep('email')
    } else {
      navigate('/')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-no-repeat bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: "url('/register-bg.png')",
      }}
    >
      <div className="text-center backdrop-blur-sm px-4 py-6 rounded-md transform -translate-y-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-white text-2xl font-semibold mb-6 tracking-wider">ENTER EMAIL</h2>
              <form onSubmit={handleNext} className="flex flex-col items-center gap-4">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="EMAIL"
                  className="px-4 py-2 w-64 rounded-full text-center bg-red-400 placeholder-white text-white font-medium focus:outline-none"
                  required
                />
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-md transition"
                    onClick={handleReturn}
                  >
                    RETURN
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold shadow-md transition"
                  >
                    NEXT
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-white text-2xl font-semibold mb-6 tracking-wider">ENTER PASSWORD</h2>
              <form onSubmit={handleNext} className="flex flex-col items-center gap-4">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="PASSWORD"
                  className="px-4 py-2 w-64 rounded-full text-center bg-red-400 placeholder-white text-white font-medium focus:outline-none"
                  required
                />
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-md transition"
                    onClick={handleReturn}
                  >
                    RETURN
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold shadow-md transition"
                  >
                    LOGIN
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default Enter
