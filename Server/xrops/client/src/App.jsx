import { Routes, Route } from "react-router-dom";
import Home from "./routes/home/home.component";
import Diagram1 from "./routes/diagram/diagram1.component";
import Viewer from "./routes/viewer/viewer-basic.component";
import Demo1 from "./routes/demo1/demo1-main.component";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/platform" element={<Diagram1 />} />
      <Route path="/demo" element={<Demo1 />} />
    </Routes>
  );
};

export default App;
