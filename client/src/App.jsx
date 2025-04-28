import { Routes, Route } from "react-router-dom";
import Login from "./welcome";
import Register from './register'
import Enter from './login'
import Dashboard from './dashboard'
import Profile from './profile'
import CalendarPage from './calendar'
import HomePage from './home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}

export default App;