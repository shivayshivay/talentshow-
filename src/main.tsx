import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Admin from "./pages/Admin";
import Scanner from "./pages/Scanner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/scanner" element={<Scanner />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
