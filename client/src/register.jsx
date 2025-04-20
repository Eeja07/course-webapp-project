import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/enter') 
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-no-repeat bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/register-bg.png')" }}
    >
      <div className="text-center backdrop-blur-sm px-4 py-6 rounded-md transform -translate-y-10">
        <h2 className="text-white text-2xl font-semibold mb-6 tracking-wider">
          REGISTER NEW ACCOUNT
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
          <input
            type="email"
            placeholder="EMAIL"
            className="px-4 py-2 w-64 rounded-full text-center bg-red-300 placeholder-white text-white"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="px-4 py-2 w-64 rounded-full text-center bg-red-300 placeholder-white text-white"
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold mt-2 transition"
          >
            SAVE
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Register
