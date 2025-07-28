const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🔧</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              DevTools Suite
            </h1>
          </div>
          <div className="hidden sm:block bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-200">
            🔒 No data leaves your browser
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;