import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function Login() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="w-screen h-screen bg-no-repeat bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/bg-classroom.png')" }}
    >
      <div className="text-center backdrop-blur-sm p-4 rounded-md transform -translate-y-10">
        <h1 className="text-white text-4xl font-bold mb-6 drop-shadow-lg tracking-wide">
          WELCOME TO OUR CLASS
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-semibold shadow-md transition"
            onClick={() => navigate('/enter')}
          >
            ENTER
          </button>
          <button
            className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-full font-semibold shadow-md transition"
            onClick={() => navigate('/register')}
          >
            REGISTER NEW ACCOUNT
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Login
