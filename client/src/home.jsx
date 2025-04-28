import Header from './header'
import Sidebar from './sidebar'
import { useEffect, useState } from 'react'

function HomePage() {
  const [quote, setQuote] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const quotesList = [
    "“Collaboration is the key to innovation.”",
    "“Great teams build great things.”",
    "“Empowered minds, united goals.”",
    "“Every day is a chance to learn and grow.”",
  ]

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotesList.length)
    setQuote(quotesList[randomIndex])
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      {/* Main Content */}
      <main className="p-4 md:p-6 md:pl-64 flex flex-col">
        <div className="flex flex-col items-center md:ml-8">
          {/* Welcome Section */}
          <div className="bg-red-400 text-black py-8 px-6 rounded-2xl w-full max-w-7xl shadow-md mb-6">
            <h1 className="text-2xl font-semibold mb-2">Hi, Welcome to Classpace</h1>
            <p className="italic text-md">{quote}</p>
          </div>

          {/* Hero Image */}
          <div className="w-full max-w-7xl">
            <img
              src="/heropicture.png"
              alt="Collaboration"
              className="w-full h-[480px] md:h-[480px] object-cover rounded-2xl shadow-md"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage
