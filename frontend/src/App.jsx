import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import './App.css';

// Components
import Home from './components/Home';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ChatPopup from './components/ChatPopup';

// Context
import { SocketProvider } from './context/SocketContext';

function App() {
  const [socket, setSocket] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Initialize socket connection - Use Vite env variable
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Check if student name exists in session storage
    const savedStudentName = sessionStorage.getItem('studentName');
    if (savedStudentName) {
      setStudentName(savedStudentName);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleRoleSelection = (role) => {
    setUserRole(role);
  };

  const handleStudentNameSet = (name) => {
    setStudentName(name);
    sessionStorage.setItem('studentName', name);
  };

  const handleLogout = () => {
    setUserRole(null);
    setStudentName('');
    sessionStorage.removeItem('studentName');
    if (socket) {
      socket.disconnect();
      const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
      setSocket(newSocket);
    }
  };

  if (!socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to server...</h2>
          <p className="text-gray-600">Please wait while we establish a connection</p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider socket={socket}>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          
          <Routes>
            <Route 
              path="/" 
              element={
                userRole ? (
                  userRole === 'teacher' ? (
                    <Navigate to="/teacher" replace />
                  ) : (
                    <Navigate to="/student" replace />
                  )
                ) : (
                  <Home 
                    onRoleSelect={handleRoleSelection} 
                    onStudentNameSet={handleStudentNameSet}
                    existingStudentName={studentName}
                  />
                )
              } 
            />
            
            <Route 
              path="/teacher" 
              element={
                userRole === 'teacher' ? (
                  <TeacherDashboard 
                    onLogout={handleLogout}
                    onToggleChat={() => setShowChat(!showChat)}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/student" 
              element={
                userRole === 'student' && studentName ? (
                  <StudentDashboard 
                    studentName={studentName}
                    onLogout={handleLogout}
                    onToggleChat={() => setShowChat(!showChat)}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Chat Popup */}
          {(userRole === 'teacher' || userRole === 'student') && (
            <ChatPopup 
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              userRole={userRole}
              studentName={studentName}
            />
          )}

          {/* Chat Toggle Button - Responsive positioning */}
          {(userRole === 'teacher' || userRole === 'student') && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
              title="Toggle Chat"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              
              {/* Tooltip for larger screens */}
              <span className="absolute bottom-full right-0 mb-2 px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block">
                {showChat ? 'Close Chat' : 'Open Chat'}
              </span>
            </button>
          )}
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;