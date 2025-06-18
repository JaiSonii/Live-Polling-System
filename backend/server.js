const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB Schemas
const pollSchema = new mongoose.Schema({
  question: String,
  options: [String],
  responses: [{
    studentName: String,
    answer: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  timeLimit: { type: Number, default: 60 }, // in seconds
  createdAt: { type: Date, default: Date.now },
  endedAt: Date
});

const chatMessageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  role: { type: String, enum: ['teacher', 'student'] },
  timestamp: { type: Date, default: Date.now }
});

const Poll = mongoose.model('Poll', pollSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// In-memory storage for real-time data
let connectedStudents = new Map(); // socketId -> {name, socketId}
let currentPoll = null;
let pollTimer = null;
let teacherSocket = null;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Teacher connection
  socket.on('join-as-teacher', () => {
    teacherSocket = socket;
    socket.join('teachers');
    
    // Send current poll status
    socket.emit('poll-status', {
      currentPoll,
      connectedStudents: Array.from(connectedStudents.values()),
      studentsCount: connectedStudents.size
    });
    
    console.log('Teacher connected');
  });

  // Student connection
  socket.on('join-as-student', (studentName) => {
    // Check if name already exists
    const existingStudent = Array.from(connectedStudents.values())
      .find(student => student.name === studentName);
    
    if (existingStudent) {
      socket.emit('name-taken', 'This name is already taken by another student');
      return;
    }

    connectedStudents.set(socket.id, {
      name: studentName,
      socketId: socket.id
    });
    
    socket.join('students');
    
    // Notify teacher about new student
    if (teacherSocket) {
      teacherSocket.emit('student-joined', {
        name: studentName,
        studentsCount: connectedStudents.size,
        connectedStudents: Array.from(connectedStudents.values())
      });
    }
    
    // Send current poll to student
    if (currentPoll) {
      const hasAnswered = currentPoll.responses.some(
        response => response.studentName === studentName
      );
      
      socket.emit('current-poll', {
        ...currentPoll,
        hasAnswered,
        timeRemaining: currentPoll.timeRemaining || 60
      });
    }
    
    socket.emit('joined-successfully', studentName);
    console.log(`Student ${studentName} connected`);
  });

  // Create new poll
  socket.on('create-poll', async (pollData) => {
    try {
      // Check if there's an active poll with unanswered responses
      if (currentPoll && currentPoll.isActive) {
        const answeredCount = currentPoll.responses.length;
        const totalStudents = connectedStudents.size;
        
        if (answeredCount < totalStudents && totalStudents > 0) {
          socket.emit('poll-creation-error', 'Cannot create new poll. Current poll is still active and not all students have answered.');
          return;
        }
      }

      // End previous poll if exists
      if (currentPoll) {
        await Poll.findByIdAndUpdate(currentPoll._id, {
          isActive: false,
          endedAt: new Date()
        });
      }

      // Clear previous timer
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }

      // Create new poll
      const newPoll = new Poll({
        question: pollData.question,
        options: pollData.options,
        timeLimit: pollData.timeLimit || 60,
        responses: []
      });

      await newPoll.save();

      currentPoll = {
        _id: newPoll._id,
        question: newPoll.question,
        options: newPoll.options,
        responses: [],
        isActive: true,
        timeLimit: newPoll.timeLimit,
        createdAt: newPoll.createdAt,
        timeRemaining: newPoll.timeLimit
      };

      // Start poll timer
      let timeRemaining = currentPoll.timeLimit;
      const pollInterval = setInterval(() => {
        timeRemaining--;
        currentPoll.timeRemaining = timeRemaining;
        
        // Broadcast time remaining to all participants
        io.emit('poll-time-update', timeRemaining);
        
        if (timeRemaining <= 0) {
          clearInterval(pollInterval);
          endCurrentPoll();
        }
      }, 1000);

      pollTimer = pollInterval;

      // Broadcast new poll to all students
      io.to('students').emit('new-poll', currentPoll);
      
      // Confirm to teacher
      socket.emit('poll-created', currentPoll);
      
      console.log('New poll created:', currentPoll.question);
    } catch (error) {
      console.error('Error creating poll:', error);
      socket.emit('poll-creation-error', 'Failed to create poll');
    }
  });

  // Submit poll response
  socket.on('submit-response', async (responseData) => {
    try {
      if (!currentPoll || !currentPoll.isActive) {
        socket.emit('response-error', 'No active poll');
        return;
      }

      const student = connectedStudents.get(socket.id);
      if (!student) {
        socket.emit('response-error', 'Student not found');
        return;
      }

      // Check if student already answered
      const existingResponse = currentPoll.responses.find(
        response => response.studentName === student.name
      );

      if (existingResponse) {
        socket.emit('response-error', 'You have already answered this poll');
        return;
      }

      // Add response
      const newResponse = {
        studentName: student.name,
        answer: responseData.answer,
        timestamp: new Date()
      };

      currentPoll.responses.push(newResponse);

      // Update database
      await Poll.findByIdAndUpdate(currentPoll._id, {
        $push: { responses: newResponse }
      });

      // Check if all students have answered
      const totalStudents = connectedStudents.size;
      const answeredCount = currentPoll.responses.length;

      if (answeredCount >= totalStudents) {
        endCurrentPoll();
      } else {
        // Broadcast updated results to teacher
        if (teacherSocket) {
          teacherSocket.emit('poll-results-update', {
            responses: currentPoll.responses,
            answeredCount,
            totalStudents
          });
        }
      }

      // Send confirmation to student
      socket.emit('response-submitted');
      
      console.log(`Response submitted by ${student.name}: ${responseData.answer}`);
    } catch (error) {
      console.error('Error submitting response:', error);
      socket.emit('response-error', 'Failed to submit response');
    }
  });

  // End poll manually
  socket.on('end-poll', () => {
    if (currentPoll && currentPoll.isActive) {
      endCurrentPoll();
    }
  });

  // Get poll results
  socket.on('get-poll-results', () => {
    if (currentPoll) {
      const results = calculatePollResults(currentPoll);
      socket.emit('poll-results', results);
    }
  });

  // Get past polls
  socket.on('get-past-polls', async () => {
    try {
      const pastPolls = await Poll.find({ isActive: false })
        .sort({ createdAt: -1 })
        .limit(50);
      
      socket.emit('past-polls', pastPolls);
    } catch (error) {
      console.error('Error fetching past polls:', error);
      socket.emit('past-polls-error', 'Failed to fetch past polls');
    }
  });

  // Chat functionality
  socket.on('send-chat-message', async (messageData) => {
    try {
      const student = connectedStudents.get(socket.id);
      const isTeacher = socket.id === teacherSocket?.id;
      
      if (!student && !isTeacher) {
        socket.emit('chat-error', 'Not authorized to send messages');
        return;
      }

      const chatMessage = new ChatMessage({
        sender: isTeacher ? 'Teacher' : student.name,
        message: messageData.message,
        role: isTeacher ? 'teacher' : 'student'
      });

      await chatMessage.save();

      // Broadcast message to all participants
      io.emit('new-chat-message', {
        sender: chatMessage.sender,
        message: chatMessage.message,
        role: chatMessage.role,
        timestamp: chatMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending chat message:', error);
      socket.emit('chat-error', 'Failed to send message');
    }
  });

  // Get chat history
  socket.on('get-chat-history', async () => {
    try {
      const messages = await ChatMessage.find()
        .sort({ timestamp: -1 })
        .limit(50);
      
      socket.emit('chat-history', messages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chat-history-error', 'Failed to fetch chat history');
    }
  });

  // Kick student
  socket.on('kick-student', (studentName) => {
    const studentEntry = Array.from(connectedStudents.entries())
      .find(([socketId, student]) => student.name === studentName);
    
    if (studentEntry) {
      const [studentSocketId] = studentEntry;
      const studentSocket = io.sockets.sockets.get(studentSocketId);
      
      if (studentSocket) {
        studentSocket.emit('kicked-out', 'You have been removed from the session by the teacher');
        studentSocket.disconnect();
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove student from connected list
    const student = connectedStudents.get(socket.id);
    if (student) {
      connectedStudents.delete(socket.id);
      
      // Notify teacher
      if (teacherSocket) {
        teacherSocket.emit('student-left', {
          name: student.name,
          studentsCount: connectedStudents.size,
          connectedStudents: Array.from(connectedStudents.values())
        });
      }
      
      console.log(`Student ${student.name} disconnected`);
    }
    
    // Handle teacher disconnect
    if (socket.id === teacherSocket?.id) {
      teacherSocket = null;
      console.log('Teacher disconnected');
    }
  });
});

// Helper function to end current poll
async function endCurrentPoll() {
  if (!currentPoll) return;

  try {
    // Clear timer
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }

    // Update database
    await Poll.findByIdAndUpdate(currentPoll._id, {
      isActive: false,
      endedAt: new Date()
    });

    currentPoll.isActive = false;
    currentPoll.endedAt = new Date();

    // Calculate and broadcast final results
    const results = calculatePollResults(currentPoll);
    
    io.emit('poll-ended', {
      results,
      poll: currentPoll
    });

    console.log('Poll ended:', currentPoll.question);
  } catch (error) {
    console.error('Error ending poll:', error);
  }
}

// Helper function to calculate poll results
function calculatePollResults(poll) {
  const optionCounts = {};
  poll.options.forEach(option => {
    optionCounts[option] = 0;
  });

  poll.responses.forEach(response => {
    if (optionCounts.hasOwnProperty(response.answer)) {
      optionCounts[response.answer]++;
    }
  });

  const totalResponses = poll.responses.length;
  const results = poll.options.map(option => ({
    option,
    count: optionCounts[option],
    percentage: totalResponses > 0 ? ((optionCounts[option] / totalResponses) * 100).toFixed(1) : 0
  }));

  return {
    results,
    totalResponses,
    totalStudents: connectedStudents.size
  };
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Polling system backend is running' });
});

app.get('/api/polls/history', async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: false })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll history' });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});