import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const Home = ({ onRoleSelect, onStudentNameSet, existingStudentName }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [studentName, setStudentName] = useState(existingStudentName || '');
  const [isLoading, setIsLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('joined-successfully', (name) => {
      setIsLoading(false);
      onStudentNameSet(name);
      onRoleSelect('student');
      toast.success(`Welcome, ${name}!`);
    });

    socket.on('name-taken', (message) => {
      setIsLoading(false);
      toast.error(message);
    });

    return () => {
      socket.off('joined-successfully');
      socket.off('name-taken');
    };
  }, [socket, onRoleSelect, onStudentNameSet]);

  const handleTeacherJoin = () => {
    setIsLoading(true);
    socket.emit('join-as-teacher');
    setTimeout(() => {
      setIsLoading(false);
      onRoleSelect('teacher');
      toast.success('Welcome, Teacher!');
    }, 500);
  };

  const handleStudentJoin = () => {
    if (!studentName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (studentName.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    setIsLoading(true);
    socket.emit('join-as-student', studentName.trim());
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setStudentName(existingStudentName || '');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Polling System</h1>
            <p className="text-gray-600">Choose your role to get started</p>
          </div>

          {!selectedRole ? (
            /* Role Selection */
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection('teacher')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Join as Teacher</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection('student')}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Join as Student</span>
              </motion.button>
            </div>
          ) : selectedRole === 'teacher' ? (
            /* Teacher Confirmation */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Teacher Access</h2>
                <p className="text-gray-600 text-sm">You'll be able to create polls and view results</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTeacherJoin}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Continue as Teacher'
                  )}
                </button>

                <button
                  onClick={handleBack}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors duration-200"
                >
                  Back
                </button>
              </div>
            </motion.div>
          ) : (
            /* Student Name Input */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Access</h2>
                <p className="text-gray-600 text-sm">Enter your name to join the session</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                    maxLength={30}
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleStudentJoin();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This name will be visible to others in the session
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleStudentJoin}
                    disabled={isLoading || !studentName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Joining...</span>
                      </div>
                    ) : (
                      'Join Session'
                    )}
                  </button>

                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors duration-200"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Real-time polling system with live results
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;