// App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "./pages/Test.js";
import CompanyMain from "./pages/company/companyMain.js";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CompanyMain />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
