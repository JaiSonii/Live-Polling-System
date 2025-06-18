"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSocket } from "../context/SocketContext"
import toast from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const StudentDashboard = ({ studentName, onLogout, onToggleChat }) => {
  const [currentPoll, setCurrentPoll] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [pollResults, setPollResults] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [connectedStudents, setConnectedStudents] = useState(0)

  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    // Socket event listeners
    socket.on("kicked-out", (message) => {
      toast.error(message)
      setTimeout(() => {
        onLogout()
      }, 2000)
    })

    socket.on("new-poll", (poll) => {
      setCurrentPoll(poll)
      setHasAnswered(false)
      setSelectedAnswer("")
      setPollResults(null)
      setTimeRemaining(poll.timeLimit)
      toast.success("New poll started!")
    })

    socket.on("current-poll", (poll) => {
      setCurrentPoll(poll)
      setHasAnswered(poll.hasAnswered || false)
      setTimeRemaining(poll.timeRemaining)

      if (poll.hasAnswered) {
        socket.emit("get-poll-results")
      }
    })

    socket.on("poll-ended", (data) => {
      setCurrentPoll(null)
      setPollResults(data.results)
      setTimeRemaining(null)
      setHasAnswered(false)
      setSelectedAnswer("")
      toast.success("Poll ended!")
    })

    socket.on("poll-time-update", (time) => {
      setTimeRemaining(time)

      // Auto-show results when time expires
      if (time <= 0 && currentPoll && !hasAnswered) {
        socket.emit("get-poll-results")
        setCurrentPoll(null)
        toast("Time expired!", { icon: "⏰" })
      }
    })

    socket.on("poll-results", (results) => {
      setPollResults(results)
    })

    socket.on("response-submitted", () => {
      setIsSubmitting(false)
      setHasAnswered(true)
      toast.success("Response submitted!")
      socket.emit("get-poll-results")
    })

    socket.on("response-error", (message) => {
      setIsSubmitting(false)
      toast.error(message)
    })

    return () => {
      socket.off("kicked-out")
      socket.off("new-poll")
      socket.off("current-poll")
      socket.off("poll-ended")
      socket.off("poll-time-update")
      socket.off("poll-results")
      socket.off("response-submitted")
      socket.off("response-error")
    }
  }, [socket, studentName, onLogout, currentPoll, hasAnswered])

  const handleSubmitResponse = () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer")
      return
    }

    setIsSubmitting(true)
    socket.emit("submit-response", { answer: selectedAnswer })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTimeColor = (seconds) => {
    if (seconds > 30) return "text-green-600"
    if (seconds > 10) return "text-yellow-600"
    return "text-red-600"
  }

  const chartColors = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600">Welcome, {studentName}!</p>
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
                Leave Session
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">Connected</span>
              </div>

              {currentPoll && timeRemaining !== null && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className={`text-sm font-semibold ${getTimeColor(timeRemaining)}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">Session ID: #{studentName.substring(0, 4)}...</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Poll Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {!currentPoll && !pollResults ? (
                /* Waiting State */
                <div className="text-center py-16">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Waiting for Poll</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    The teacher will start a poll soon. You'll be notified when it begins.
                  </p>
                </div>
              ) : currentPoll && !hasAnswered ? (
                /* Active Poll */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Current Poll</h2>
                      {timeRemaining !== null && (
                        <div className={`text-2xl font-bold ${getTimeColor(timeRemaining)}`}>
                          {formatTime(timeRemaining)}
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                      <h3 className="text-lg font-medium text-indigo-900 mb-4">{currentPoll.question}</h3>

                      <div className="space-y-3">
                        {currentPoll.options.map((option, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedAnswer(option)}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                              selectedAnswer === option
                                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  selectedAnswer === option ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                                }`}
                              >
                                {selectedAnswer === option && (
                                  <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                                )}
                              </div>
                              <span className="font-medium">{option}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitResponse}
                    disabled={!selectedAnswer || isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      "Submit Answer"
                    )}
                  </button>
                </motion.div>
              ) : (
                /* Results View */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Poll Results</h2>

                  {pollResults && pollResults.results ? (
                    <div>
                      {/* Results Summary */}
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-800 font-medium">Poll Completed</p>
                            <p className="text-green-600 text-sm">
                              {pollResults.totalResponses} of {pollResults.totalStudents} students responded
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Results Chart */}
                      <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pollResults.results}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="option" angle={-45} textAnchor="end" height={80} />
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
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
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
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading results...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Your Name</span>
                  <span className="font-medium text-gray-900">{studentName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Poll Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentPoll
                        ? "bg-green-100 text-green-800"
                        : pollResults
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {currentPoll ? "Active" : pollResults ? "Completed" : "Waiting"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Your Response</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasAnswered
                        ? "bg-green-100 text-green-800"
                        : currentPoll
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {hasAnswered ? "Submitted" : currentPoll ? "Pending" : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">How it works</h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm text-indigo-800">Wait for the teacher to start a poll</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm text-indigo-800">Select your answer and submit within the time limit</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm text-indigo-800">View live results after submitting or when time expires</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
