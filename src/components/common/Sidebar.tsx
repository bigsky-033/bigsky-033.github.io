import { NavLink } from 'react-router-dom';

interface Tool {
  id: string;
  name: string;
  icon: string;
  priority: 'P0' | 'P1' | 'P2';
}

const tools: Tool[] = [
  { id: 'json-formatter', name: 'JSON Formatter', icon: '{ }', priority: 'P0' },
  { id: 'jwt-decoder', name: 'JWT Decoder', icon: '🔐', priority: 'P0' },
  { id: 'base64-tool', name: 'Base64 Encoder/Decoder', icon: '📝', priority: 'P0' },
  { id: 'url-encoder', name: 'URL Encoder/Decoder', icon: '🔗', priority: 'P1' },
  { id: 'ascii-unicode-converter', name: 'ASCII/Unicode Converter', icon: '🔤', priority: 'P0' },
  { id: 'hash-generator', name: 'Hash Generator', icon: '#️⃣', priority: 'P1' },
  { id: 'uuid-generator', name: 'UUID Generator', icon: '🆔', priority: 'P1' },
  { id: 'timestamp-converter', name: 'Unix Timestamp', icon: '⏰', priority: 'P1' },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-81px)] overflow-y-auto shadow-sm">
      <nav className="p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-6 px-2">
          Developer Tools
        </h2>
        <ul className="space-y-1">
          {tools.map((tool) => (
            <li key={tool.id}>
              <NavLink
                to={`/${tool.id}`}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-xl mr-3 flex-shrink-0">{tool.icon}</span>
                <span className="font-medium text-sm">{tool.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;