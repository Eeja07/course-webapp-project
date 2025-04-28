import Header from './header'
import Sidebar from './sidebar'
import { useEffect, useState } from 'react'

function HomePage() {
  const [quote, setQuote] = useState('')

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
    <div className="bg-gray-100 min-h-screen pl-64 pt-16">
      <Sidebar />
      <Header />

      <main>
        {/* Header Section */}
        <div className="bg-red-400 text-black py-10 px-10">
          <h1 className="text-2xl font-semibold mb-2">Hi, Welcome to Classpace</h1>
          <p className="italic text-md">{quote}</p>
        </div>

        {/* Image Section */}
        <div className="w-full">
  <img
    src="/heropicture.png"
    alt="Collaboration"
    className="w-full h-[550px] object-cover"
  />
</div>
      </main>
    </div>
  )
}

export default HomePage
