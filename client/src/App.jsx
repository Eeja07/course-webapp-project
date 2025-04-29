import { Routes, Route } from "react-router-dom";
import Login from "./welcome";
import Register from './register'
import Enter from './login'
import Dashboard from './dashboard'
import Profile from './profile'
import CalendarPage from './calendar'
import HomePage from './home'
import TaskList from './tasklist'
import TaskDetail from './taskdetail'
import StudentList from './studentlist'
import Grade from "./grade";
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/enter" element={<Enter />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/tasklist" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
      <Route path="/taskdetail" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
      <Route path="/studentlist" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
      <Route path="/grade" element={<ProtectedRoute><Grade /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
