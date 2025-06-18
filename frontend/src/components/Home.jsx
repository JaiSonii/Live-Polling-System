import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSocket } from "../context/SocketContext"
import toast from "react-hot-toast"

const Home = ({ onRoleSelect, onStudentNameSet, existingStudentName }) => {
  const [selectedRole, setSelectedRole] = useState(null)
  const [studentName, setStudentName] = useState(existingStudentName || "")
  const [isLoading, setIsLoading] = useState(false)
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    // Socket event listeners
    socket.on("joined-successfully", (name) => {
      setIsLoading(false)
      onStudentNameSet(name)
      onRoleSelect("student")
      toast.success(`Welcome, ${name}!`)
    })

    socket.on("name-taken", (message) => {
      setIsLoading(false)
      toast.error(message)
    })

    return () => {
      socket.off("joined-successfully")
      socket.off("name-taken")
    }
  }, [socket, onRoleSelect, onStudentNameSet])

  const handleTeacherJoin = () => {
    setIsLoading(true)
    socket.emit("join-as-teacher")
    setTimeout(() => {
      setIsLoading(false)
      sessionStorage.setItem("userRole", "teacher") // Add this line
      onRoleSelect("teacher")
      toast.success("Welcome, Teacher!")
    }, 500)
  }

  const handleStudentJoin = () => {
    if (!studentName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (studentName.trim().length < 2) {
      toast.error("Name must be at least 2 characters long")
      return
    }

    setIsLoading(true)
    sessionStorage.setItem("userRole", "student")
    socket.emit("join-as-student", studentName.trim())
  }

  const handleRoleSelection = (role) => {
    setSelectedRole(role)
  }

  const handleBack = () => {
    setSelectedRole(null)
    setStudentName(existingStudentName || "")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10 xl:p-12">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 lg:mb-6 flex items-center justify-center"
            >
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-white"
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
            </motion.div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 lg:mb-4">
              Live Polling System
            </h1>
            <p className="text-gray-600 lg:text-lg xl:text-xl">Choose your role to get started</p>
          </div>

          {!selectedRole ? (
            /* Role Selection */
            <div className="space-y-4 lg:space-y-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection("teacher")}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 lg:py-6 xl:py-7 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3 lg:space-x-4 text-base lg:text-lg xl:text-xl"
              >
                <svg
                  className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8"
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
                <span>Join as Teacher</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection("student")}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 lg:py-6 xl:py-7 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3 lg:space-x-4 text-base lg:text-lg xl:text-xl"
              >
                <svg
                  className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                <span>Join as Student</span>
              </motion.button>
            </div>
          ) : selectedRole === "teacher" ? (
            /* Teacher Confirmation */
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <div className="text-center mb-6 lg:mb-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-indigo-100 rounded-xl mx-auto mb-4 lg:mb-6 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-indigo-600"
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
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-2 lg:mb-4">
                  Teacher Access
                </h2>
                <p className="text-gray-600 text-sm lg:text-base xl:text-lg">
                  You'll be able to create polls and view results
                </p>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <button
                  onClick={handleTeacherJoin}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 lg:py-4 xl:py-5 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center text-base lg:text-lg xl:text-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    "Continue as Teacher"
                  )}
                </button>

                <button
                  onClick={handleBack}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 lg:py-4 xl:py-5 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
                >
                  Back
                </button>
              </div>
            </motion.div>
          ) : (
            /* Student Name Input */
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <div className="text-center mb-6 lg:mb-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-emerald-100 rounded-xl mx-auto mb-4 lg:mb-6 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-2 lg:mb-4">
                  Student Access
                </h2>
                <p className="text-gray-600 text-sm lg:text-base xl:text-lg">Enter your name to join the session</p>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <div>
                  <label
                    htmlFor="studentName"
                    className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2 lg:mb-3"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-base lg:text-lg xl:text-xl"
                    maxLength={30}
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleStudentJoin()
                      }
                    }}
                  />
                  <p className="mt-1 lg:mt-2 text-xs lg:text-sm xl:text-base text-gray-500">
                    This name will be visible to others in the session
                  </p>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  <button
                    onClick={handleStudentJoin}
                    disabled={isLoading || !studentName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 lg:py-4 xl:py-5 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center text-base lg:text-lg xl:text-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                        <span>Joining...</span>
                      </div>
                    ) : (
                      "Join Session"
                    )}
                  </button>

                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-3 lg:py-4 xl:py-5 px-6 lg:px-8 xl:px-10 rounded-xl font-semibold transition-colors duration-200 text-base lg:text-lg xl:text-xl"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 lg:mt-8">
          <p className="text-sm lg:text-base xl:text-lg text-gray-500">Real-time polling system with live results</p>
        </div>
      </motion.div>
    </div>
  )
}

export default Home
