import Sidebar from './sidebar'
import Header from './header'

function Dashboard() {
  const dummyCourses = Array(4).fill({
    title: 'Basis Data',
    code: 'ABC123',
    grade: 'A',
  })

  return (
    <div className="bg-gray-200 min-h-screen pl-64 pt-16">
      <Sidebar />
      <Header />

      <main className="p-6 space-y-10">
        <section>
          <h2 className="text-xl font-semibold border-2 border-red-600 inline-block px-4 py-1 rounded-full text-red-600 mb-4">
            Your Courses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {dummyCourses.map((course, i) => (
              <div key={i} className="border rounded-md overflow-hidden shadow">
                <div className="h-40 bg-gray-300" />
                <div className="bg-red-600 text-white p-3 text-sm">
                  <div>{course.title}</div>
                  <div>{course.code}</div>
                  <div>{course.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold border-2 border-red-600 inline-block px-4 py-1 rounded-full text-red-600 mb-4">
            Recently Accessed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {dummyCourses.map((course, i) => (
              <div key={i} className="border rounded-md overflow-hidden shadow">
                <div className="h-40 bg-gray-300" />
                <div className="bg-red-600 text-white p-3 text-sm">
                  <div>{course.title}</div>
                  <div>{course.code}</div>
                  <div>{course.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
