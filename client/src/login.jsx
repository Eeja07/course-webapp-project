function Login() {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg-classroom.png')",
        }}
      >
        <div className="text-center backdrop-blur-sm p-4 rounded-md transform -translate-y-10">
          <h1 className="text-white text-4xl font-bold mb-6 drop-shadow-lg tracking-wide">
            WELCOME TO OUR CLASS
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-semibold shadow-md transition">
              ENTER
            </button>
            <button className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-full font-semibold shadow-md transition">
              REGISTER NEW ACCOUNT
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  export default Login
  