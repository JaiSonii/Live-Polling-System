import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TeacherDashboard = ({ onLogout, onToggleChat }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [pollResults, setPollResults] = useState(null);
  const [pastPolls, setPastPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showPastPolls, setShowPastPolls] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  
  // Create poll form state
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    timeLimit: 60
  });

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('poll-status', (data) => {
      setCurrentPoll(data.currentPoll);
      setConnectedStudents(data.connectedStudents || []);
      setStudentsCount(data.studentsCount || 0);
    });

    socket.on('student-joined', (data) => {
      setConnectedStudents(data.connectedStudents || []);
      setStudentsCount(data.studentsCount);
      toast.success(`${data.name} joined the session`);
    });

    socket.on('student-left', (data) => {
      setConnectedStudents(data.connectedStudents || []);
      setStudentsCount(data.studentsCount);
      toast(`${data.name} left the session`, { icon: '👋' });
    });

    socket.on('poll-created', (poll) => {
      setCurrentPoll(poll);
      setShowCreatePoll(false);
      toast.success('Poll created successfully!');
      resetPollForm();
    });

    socket.on('poll-creation-error', (message) => {
      toast.error(message);
    });

    socket.on('poll-results-update', (data) => {
      setPollResults(data);
    });

    socket.on('poll-ended', (data) => {
      setCurrentPoll(null);
      setPollResults(data.results);
      setTimeRemaining(null);
      toast.success('Poll ended!');
    });

    socket.on('poll-time-update', (time) => {
      setTimeRemaining(time);
    });

    socket.on('past-polls', (polls) => {
      setPastPolls(polls);
    });

    return () => {
      socket.off('poll-status');
      socket.off('student-joined');
      socket.off('student-left');
      socket.off('poll-created');
      socket.off('poll-creation-error');
      socket.off('poll-results-update');
      socket.off('poll-ended');
      socket.off('poll-time-update');
      socket.off('past-polls');
    };
  }, [socket]);

  const resetPollForm = () => {
    setNewPoll({
      question: '',
      options: ['', ''],
      timeLimit: 60
    });
  };

  const handleCreatePoll = () => {
    if (!newPoll.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const validOptions = newPoll.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    socket.emit('create-poll', {
      question: newPoll.question.trim(),
      options: validOptions,
      timeLimit: newPoll.timeLimit
    });
  };

  const handleEndPoll = () => {
    socket.emit('end-poll');
  };

  const handleKickStudent = (studentName) => {
    if (window.confirm(`Are you sure you want to kick ${studentName} from the session?`)) {
      socket.emit('kick-student', studentName);
      toast.success(`${studentName} has been removed from the session`);
    }
  };

  const loadPastPolls = () => {
    socket.emit('get-past-polls');
    setShowPastPolls(true);
  };

  const addOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chartColors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-gray-600">Manage polls and view live results</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleChat}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Chat
              </button>
              <button
                onClick={onLogout}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Connected Students</p>
                  <p className="text-2xl font-bold">{studentsCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Poll Status</p>
                  <p className="text-2xl font-bold">{currentPoll ? 'Active' : 'None'}</p>
                </div>
                <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Time Remaining</p>
                  <p className="text-2xl font-bold">
                    {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            {/* Poll Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Poll Controls</h2>
              
              {!currentPoll ? (
                <button
                  onClick={() => setShowCreatePoll(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Create New Poll
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">Poll is active</p>
                    <p className="text-xs text-green-600 mt-1">
                      {pollResults ? pollResults.answeredCount : 0} of {studentsCount} students answered
                    </p>
                  </div>
                  
                  <button
                    onClick={handleEndPoll}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200"
                  >
                    End Poll
                  </button>
                </div>
              )}

              <button
                onClick={loadPastPolls}
                className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-colors duration-200"
              >
                View Past Polls
              </button>
            </div>

            {/* Connected Students */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Students</h2>
              
              {connectedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="text-gray-500">No students connected</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {connectedStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                      </div>
                      
                      <button
                        onClick={() => handleKickStudent(student.name)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Kick student"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Poll Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Live Poll Results</h2>
              
              {!currentPoll && !pollResults ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Poll</h3>
                  <p className="text-gray-600">Create a poll to see live results here</p>
                </div>
              ) : (
                <div>
                  {/* Current Poll Question */}
                  {currentPoll && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-2">Current Question</h3>
                      <p className="text-indigo-800">{currentPoll.question}</p>
                    </div>
                  )}

                  {/* Results Chart */}
                  {pollResults && pollResults.results && (
                    <div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          Responses: {pollResults.answeredCount || 0} of {pollResults.totalStudents || 0} students
                        </p>
                      </div>
                      
                      <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pollResults.results}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="option" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {pollResults.results.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Results List */}
                      <div className="space-y-3">
                        {pollResults.results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                              ></div>
                              <span className="font-medium text-gray-900">{result.option}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-900">{result.count}</span>
                              <span className="text-sm text-gray-600 ml-2">({result.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreatePoll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreatePoll(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Poll</h2>
              
              <div className="space-y-4">
                {/* Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    maxLength={200}
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          maxLength={100}
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {newPoll.options.length < 6 && (
                    <button
                      onClick={addOption}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (seconds)
                  </label>
                  <select
                    value={newPoll.timeLimit}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreatePoll}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
                >
                  Create Poll
                </button>
                <button
                  onClick={() => setShowCreatePoll(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Polls Modal */}
      <AnimatePresence>
        {showPastPolls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPastPolls(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Past Polls</h2>
                <button
                  onClick={() => setShowPastPolls(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {pastPolls.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-500">No past polls found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastPolls.map((poll, index) => (
                      <div key={poll._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(poll.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {poll.options.map((option, optionIndex) => {
                            const count = poll.responses.filter(r => r.answer === option).length;
                            const percentage = poll.responses.length > 0 ? ((count / poll.responses.length) * 100).toFixed(1) : 0;
                            
                            return (
                              <div key={optionIndex} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{option}</span>
                                <span className="text-gray-900 font-medium">{count} ({percentage}%)</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Total responses: {poll.responses.length}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherDashboard;