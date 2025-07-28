import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import JsonFormatter from './components/tools/JsonFormatter/JsonFormatter';
import JwtDecoder from './components/tools/JwtDecoder/JwtDecoder';
import Base64Tool from './components/tools/Base64Tool/Base64Tool';
import UrlEncoder from './components/tools/UrlEncoder/UrlEncoder';
import AsciiUnicodeConverter from './components/tools/AsciiUnicodeConverter/AsciiUnicodeConverter';
import HashGenerator from './components/tools/HashGenerator/HashGenerator';
import UuidGenerator from './components/tools/UuidGenerator/UuidGenerator';
import TimestampConverter from './components/tools/TimestampConverter/TimestampConverter';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 bg-gray-50">
            <Routes>
              <Route path="/" element={<Navigate to="/json-formatter" replace />} />
              <Route path="/json-formatter" element={<JsonFormatter />} />
              <Route path="/jwt-decoder" element={<JwtDecoder />} />
              <Route path="/base64-tool" element={<Base64Tool />} />
              <Route path="/url-encoder" element={<UrlEncoder />} />
              <Route path="/ascii-unicode-converter" element={<AsciiUnicodeConverter />} />
              <Route path="/hash-generator" element={<HashGenerator />} />
              <Route path="/uuid-generator" element={<UuidGenerator />} />
              <Route path="/timestamp-converter" element={<TimestampConverter />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
