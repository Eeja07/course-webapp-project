import { Routes, Route } from "react-router-dom";
import Login from "./login"; // pastikan case-nya match

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;