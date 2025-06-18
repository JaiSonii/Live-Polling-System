import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSocket } from "../context/SocketContext"
import toast from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const TeacherDashboard = ({ onLogout, onToggleChat }) => {
  const [currentPoll, setCurrentPoll] = useState(null)
  const [connectedStudents, setConnectedStudents] = useState([])
  const [pollResults, setPollResults] = useState(null)
  const [pastPolls, setPastPolls] = useState([])
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const [showPastPolls, setShowPastPolls] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [studentsCount, setStudentsCount] = useState(0)

  // Create poll form state
  const [newPoll, setNewPoll] = useState({
    question: "",
    options: ["", ""],
    timeLimit: 60,
  })

  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    // Socket event listeners
    socket.on("poll-status", (data) => {
      setCurrentPoll(data.currentPoll)
      setConnectedStudents(data.connectedStudents || [])
      setStudentsCount(data.studentsCount || 0)
    })

    socket.on("student-joined", (data) => {
      setConnectedStudents(data.connectedStudents || [])
      setStudentsCount(data.studentsCount)
      toast.success(`${data.name} joined the session`)
    })

    socket.on("student-left", (data) => {
      setConnectedStudents(data.connectedStudents || [])
      setStudentsCount(data.studentsCount)
      toast(`${data.name} left the session`, { icon: "👋" })
    })

    socket.on("poll-created", (poll) => {
      setCurrentPoll(poll)
      setShowCreatePoll(false)
      toast.success("Poll created successfully!")
      resetPollForm()
    })

    socket.on("poll-creation-error", (message) => {
      toast.error(message)
    })

    socket.on("poll-results-update", (data) => {
      setPollResults(data)
    })

    socket.on("poll-ended", (data) => {
      setCurrentPoll(null)
      setPollResults(data.results)
      setTimeRemaining(null)
      toast.success("Poll ended!")
    })

    socket.on("poll-time-update", (time) => {
      setTimeRemaining(time)
    })

    socket.on("past-polls", (polls) => {
      setPastPolls(polls)
    })

    return () => {
      socket.off("poll-status")
      socket.off("student-joined")
      socket.off("student-left")
      socket.off("poll-created")
      socket.off("poll-creation-error")
      socket.off("poll-results-update")
      socket.off("poll-ended")
      socket.off("poll-time-update")
      socket.off("past-polls")
    }
  }, [socket])

  const resetPollForm = () => {
    setNewPoll({
      question: "",
      options: ["", ""],
      timeLimit: 60,
    })
  }

  const handleCreatePoll = () => {
    if (!newPoll.question.trim()) {
      toast.error("Please enter a question")
      return
    }

    const validOptions = newPoll.options.filter((option) => option.trim())
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options")
      return
    }

    socket.emit("create-poll", {
      question: newPoll.question.trim(),
      options: validOptions,
      timeLimit: newPoll.timeLimit,
    })
  }

  const handleEndPoll = () => {
    socket.emit("end-poll")
  }

  const handleKickStudent = (studentName) => {
    if (window.confirm(`Are you sure you want to kick ${studentName} from the session?`)) {
      socket.emit("kick-student", studentName)
      toast.success(`${studentName} has been removed from the session`)
    }
  }

  const loadPastPolls = () => {
    socket.emit("get-past-polls")
    setShowPastPolls(true)
  }

  const addOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }))
    }
  }

  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
    }
  }

  const updateOption = (index, value) => {
    setNewPoll((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const chartColors = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-6 xl:p-8">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-gray-900">
                  Teacher Dashboard
                </h1>
                <p className="text-gray-600 lg:text-lg xl:text-xl">Manage polls and view live results</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <button
                onClick={onToggleChat}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 rounded-lg transition-colors duration-200 text-sm lg:text-base xl:text-lg font-medium"
              >
                Chat
              </button>
              <button
                onClick={onLogout}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 rounded-lg transition-colors duration-200 text-sm lg:text-base xl:text-lg font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 mt-6 lg:mt-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 lg:p-6 xl:p-8 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm lg:text-base xl:text-lg">Connected Students</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">{studentsCount}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-blue-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 lg:p-6 xl:p-8 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm lg:text-base xl:text-lg">Poll Status</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">{currentPoll ? "Active" : "None"}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-green-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 lg:p-6 xl:p-8 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm lg:text-base xl:text-lg">Time Remaining</p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">
                    {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-purple-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Column - Controls */}
          <div className="xl:col-span-1">
            {/* Poll Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 lg:mb-6">
                Poll Controls
              </h2>

              {!currentPoll ? (
                <button
                  onClick={() => setShowCreatePoll(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 lg:py-4 xl:py-5 px-4 lg:px-6 xl:px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-base lg:text-lg xl:text-xl"
                >
                  Create New Poll
                </button>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  <div className="p-4 lg:p-6 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm lg:text-base text-green-700 font-medium">Poll is active</p>
                    <p className="text-xs lg:text-sm text-green-600 mt-1">
                      {pollResults ? pollResults.answeredCount : 0} of {studentsCount} students answered
                    </p>
                  </div>

                  <button
                    onClick={handleEndPoll}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 lg:py-4 xl:py-5 px-4 lg:px-6 xl:px-8 rounded-xl font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
                  >
                    End Poll
                  </button>
                </div>
              )}

              <button
                onClick={loadPastPolls}
                className="w-full mt-3 lg:mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 lg:py-4 xl:py-5 px-4 lg:px-6 xl:px-8 rounded-xl font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
              >
                View Past Polls
              </button>
            </div>

            {/* Connected Students */}
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 lg:mb-6">
                Connected Students
              </h2>

              {connectedStudents.length === 0 ? (
                <div className="text-center py-8 lg:py-12">
                  <svg
                    className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 text-gray-400 mx-auto mb-3 lg:mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <p className="text-gray-500 lg:text-lg xl:text-xl">No students connected</p>
                </div>
              ) : (
                <div className="space-y-2 lg:space-y-3 max-h-64 lg:max-h-80 xl:max-h-96 overflow-y-auto">
                  {connectedStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs lg:text-sm xl:text-base font-semibold text-indigo-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 lg:text-lg xl:text-xl">{student.name}</span>
                      </div>

                      <button
                        onClick={() => handleKickStudent(student.name)}
                        className="text-red-600 hover:text-red-800 p-1 lg:p-2 rounded"
                        title="Kick student"
                      >
                        <svg
                          className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 xl:p-10">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6 lg:mb-8">
                Live Poll Results
              </h2>

              {!currentPoll && !pollResults ? (
                <div className="text-center py-12 lg:py-16 xl:py-20">
                  <svg
                    className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-gray-400 mx-auto mb-4 lg:mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="text-lg lg:text-xl xl:text-2xl font-medium text-gray-900 mb-2 lg:mb-4">
                    No Active Poll
                  </h3>
                  <p className="text-gray-600 lg:text-lg xl:text-xl">Create a poll to see live results here</p>
                </div>
              ) : (
                <div>
                  {/* Current Poll Question */}
                  {currentPoll && (
                    <div className="mb-6 lg:mb-8 p-4 lg:p-6 xl:p-8 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h3 className="text-lg lg:text-xl xl:text-2xl font-semibold text-indigo-900 mb-2 lg:mb-4">
                        Current Question
                      </h3>
                      <p className="text-indigo-800 lg:text-lg xl:text-xl">{currentPoll.question}</p>
                    </div>
                  )}

                  {/* Results Chart */}
                  {pollResults && pollResults.results && (
                    <div>
                      <div className="mb-4 lg:mb-6">
                        <p className="text-sm lg:text-base xl:text-lg text-gray-600">
                          Responses: {pollResults.answeredCount || 0} of {pollResults.totalStudents || 0} students
                        </p>
                      </div>

                      <div className="h-64 lg:h-80 xl:h-96 mb-6 lg:mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pollResults.results}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="option" angle={-45} textAnchor="end" height={80} fontSize={12} />
                            <YAxis fontSize={12} />
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
                      <div className="space-y-3 lg:space-y-4">
                        {pollResults.results.map((result, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 lg:p-4 xl:p-6 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3 lg:space-x-4">
                              <div
                                className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded"
                                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                              ></div>
                              <span className="font-medium text-gray-900 lg:text-lg xl:text-xl">{result.option}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">
                                {result.count}
                              </span>
                              <span className="text-sm lg:text-base xl:text-lg text-gray-600 ml-2">
                                ({result.percentage}%)
                              </span>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 lg:p-8"
            onClick={() => setShowCreatePoll(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 xl:p-10 w-full max-w-lg lg:max-w-xl xl:max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-6 lg:mb-8">Create New Poll</h2>

              <div className="space-y-4 lg:space-y-6">
                {/* Question */}
                <div>
                  <label className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2 lg:mb-3">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll((prev) => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question"
                    className="w-full px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base lg:text-lg xl:text-xl"
                    maxLength={200}
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2 lg:mb-3">
                    Options
                  </label>
                  <div className="space-y-2 lg:space-y-3">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 lg:space-x-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base lg:text-lg xl:text-xl"
                          maxLength={100}
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800 p-2 lg:p-3"
                          >
                            <svg
                              className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {newPoll.options.length < 6 && (
                    <button
                      onClick={addOption}
                      className="mt-2 lg:mt-3 text-indigo-600 hover:text-indigo-800 text-sm lg:text-base xl:text-lg font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2 lg:mb-3">
                    Time Limit (seconds)
                  </label>
                  <select
                    value={newPoll.timeLimit}
                    onChange={(e) => setNewPoll((prev) => ({ ...prev, timeLimit: Number.parseInt(e.target.value) }))}
                    className="w-full px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base lg:text-lg xl:text-xl"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 lg:space-x-4 mt-6 lg:mt-8">
                <button
                  onClick={handleCreatePoll}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 lg:py-4 xl:py-5 px-4 lg:px-6 xl:px-8 rounded-lg font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
                >
                  Create Poll
                </button>
                <button
                  onClick={() => setShowCreatePoll(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 lg:py-4 xl:py-5 px-4 lg:px-6 xl:px-8 rounded-lg font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 lg:p-8"
            onClick={() => setShowPastPolls(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 xl:p-10 w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Past Polls</h2>
                <button onClick={() => setShowPastPolls(false)} className="text-gray-500 hover:text-gray-700">
                  <svg
                    className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-96 lg:max-h-[60vh]">
                {pastPolls.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <svg
                      className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 text-gray-400 mx-auto mb-3 lg:mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-gray-500 lg:text-lg xl:text-xl">No past polls found</p>
                  </div>
                ) : (
                  <div className="space-y-4 lg:space-y-6">
                    {pastPolls.map((poll, index) => (
                      <div key={poll._id} className="border border-gray-200 rounded-lg p-4 lg:p-6 xl:p-8">
                        <div className="flex items-start justify-between mb-3 lg:mb-4">
                          <h3 className="font-semibold text-gray-900 lg:text-lg xl:text-xl">{poll.question}</h3>
                          <span className="text-xs lg:text-sm xl:text-base text-gray-500">
                            {new Date(poll.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                          {poll.options.map((option, optionIndex) => {
                            const count = poll.responses.filter((r) => r.answer === option).length
                            const percentage =
                              poll.responses.length > 0 ? ((count / poll.responses.length) * 100).toFixed(1) : 0

                            return (
                              <div
                                key={optionIndex}
                                className="flex items-center justify-between text-sm lg:text-base xl:text-lg"
                              >
                                <span className="text-gray-700">{option}</span>
                                <span className="text-gray-900 font-medium">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="mt-2 lg:mt-3 text-xs lg:text-sm xl:text-base text-gray-500">
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
  )
}

export default TeacherDashboard
