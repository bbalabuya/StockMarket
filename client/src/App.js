// App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "./pages/Test.js";
import CompanyMain from "./pages/company/companyMain.js";
import Landing from "./pages/landing.js";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="stockinfo" element={<CompanyMain />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
