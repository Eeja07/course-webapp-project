import { Routes, Route } from "react-router-dom";
import Login from "./welcome";
import Register from './register'
import Enter from './login'
import Dashboard from './dashboard'
import Profile from './profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;