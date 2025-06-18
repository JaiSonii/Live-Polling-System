import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSocket } from "../context/SocketContext"
import toast from "react-hot-toast"

const ChatPopup = ({ isOpen, onClose, userRole, studentName }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !isOpen) return

    // Load chat history when popup opens
    socket.emit("get-chat-history")

    // Socket event listeners
    socket.on("chat-history", (chatHistory) => {
      setMessages(chatHistory)
      setIsLoading(false)
    })

    socket.on("new-chat-message", (message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on("chat-error", (error) => {
      toast.error(error)
      setIsLoading(false)
    })

    return () => {
      socket.off("chat-history")
      socket.off("new-chat-message")
      socket.off("chat-error")
    }
  }, [socket, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    setIsLoading(true)
    socket.emit("send-chat-message", {
      message: newMessage.trim(),
    })

    setNewMessage("")
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }
  }

  const getUserInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2)
  }

  const isMyMessage = (message) => {
    if (userRole === "teacher") {
      return message.role === "teacher"
    } else {
      return message.sender === studentName
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] h-96 lg:h-[32rem] xl:h-[36rem] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm lg:text-base xl:text-lg">Chat</h3>
                <p className="text-xs lg:text-sm xl:text-base text-indigo-200">
                  {userRole === "teacher" ? "Teacher & Students" : "Class Discussion"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 lg:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4">
            {messages.length === 0 ? (
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm lg:text-base xl:text-lg text-gray-500">No messages yet</p>
                <p className="text-xs lg:text-sm xl:text-base text-gray-400 mt-1">Start a conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMine = isMyMessage(message)
                const isTeacher = message.role === "teacher"

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] ${isMine ? "order-2" : "order-1"}`}>
                      <div
                        className={`flex items-end space-x-2 lg:space-x-3 ${isMine ? "flex-row-reverse space-x-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 rounded-full flex items-center justify-center text-xs lg:text-sm xl:text-base font-semibold ${
                            isTeacher ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                          }`}
                        >
                          {getUserInitials(message.sender)}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 max-w-full break-words ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm lg:text-base xl:text-lg">{message.message}</p>
                        </div>
                      </div>

                      {/* Message Info */}
                      <div
                        className={`flex items-center mt-1 lg:mt-2 space-x-1 lg:space-x-2 text-xs lg:text-sm xl:text-base text-gray-500 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className={`font-medium ${isTeacher ? "text-indigo-600" : "text-emerald-600"}`}>
                          {message.sender}
                        </span>
                        <span>•</span>
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 lg:p-6 border-t border-gray-200">
            <div className="flex items-end space-x-2 lg:space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full p-3 lg:p-4 xl:p-5 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base xl:text-lg"
                  rows="1"
                  style={{ minHeight: "44px", maxHeight: "80px" }}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 lg:p-4 xl:p-5 rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 border-b-2 border-white"></div>
                ) : (
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-xs lg:text-sm xl:text-base text-gray-500 mt-2 lg:mt-3">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChatPopup
