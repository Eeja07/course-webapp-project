import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import Header from './header'
import Sidebar from './sidebar'

function CalendarPage() {
  const [value, setValue] = useState(new Date())
  const [quote, setQuote] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const quotesList = [
    "Perjalanan menuju dewasa kok cek angel e su, ngertio ngunu tak dadi rengginang wae #CidroPerson",
    "“Success is not in what you have, but who you are.” – Bo Bennett",
    "“Do not wait for the perfect moment, take the moment and make it perfect.”",
    "“A little progress each day adds up to big results.”",
    "“Your limitation—it’s only your imagination.”",
    "“Great things never come from comfort zones.”",
  ]

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotesList.length)
    setQuote(quotesList[randomIndex])
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen pt-16">
      {/* Sidebar dan Header */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      {/* Konten utama */}
      <main className="p-6 md:pl-64 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-700 mb-6 self-start w-full md:pl-8">Calendar</h2>

        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl">
          <Calendar
            onChange={setValue}
            value={value}
            locale="en-GB"
            className="w-full"
          />
        </div>

        {/* Quotes */}
        <div className="mt-10 w-full max-w-3xl">
          <div className="bg-white px-8 py-6 rounded-xl shadow-md text-center text-gray-700 text-lg italic leading-relaxed">
            {quote}
          </div>
        </div>
      </main>
    </div>
  )
}

export default CalendarPage
