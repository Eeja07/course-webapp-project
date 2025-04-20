import { Routes, Route } from "react-router-dom";
import Login from "./login";
import Register from './register'
import Enter from './enter'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/enter" element={<Enter />} />
    </Routes>
  );
}

export default App;