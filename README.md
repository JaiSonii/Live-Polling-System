# Live Polling System 🗳️

A real-time polling application that enables teachers to create polls and students to participate with live results visualization. Built with modern web technologies and featuring real-time communication through WebSockets.

## 🌟 Features

### Teacher Dashboard

- **Create Polls**: Design custom polls with multiple choice options
- **Live Results**: View real-time polling results with interactive charts
- **Poll Management**: Configure time limits (30s to 5 minutes) for each poll
- **Student Management**: View connected students and kick disruptive participants
- **Poll History**: Access past poll results stored in database
- **Real-time Chat**: Communicate with students during sessions


### Student Interface

- **Unique Identity**: Enter name once per tab session with persistence on refresh
- **Real-time Participation**: Receive instant notifications when new polls start
- **Timed Responses**: Submit answers within configurable time limits
- **Live Results**: View poll results immediately after submission or timeout
- **Interactive Chat**: Communicate with teacher and other students
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices


## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel](https://live-polling-system-psi.vercel.app/)
- **Backend**: [Deployed on Render]


## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive charts for poll results
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Beautiful notifications


### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - Database for storing polls and results
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing


## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)


## 🔧 Installation & Setup

### 1. Clone the Repository

```shellscript
git clone https://github.com/yourusername/live-polling-system.git
cd live-polling-system
```

### 2. Backend Setup

```shellscript
cd backend
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:

```plaintext
PORT=5000
MONGODB_URI=mongodb://localhost:27017/polling-system
# or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/polling-system
CORS_ORIGIN=http://localhost:5173
```

Start the backend server:

```shellscript
npm run dev
```

### 3. Frontend Setup

```shellscript
cd frontend
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:

```plaintext
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend development server:

```shellscript
npm run dev
```

## 🌐 Deployment

### Backend Deployment (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables:

1. `MONGODB_URI`: Your MongoDB connection string
2. `PORT`: Will be set automatically
3. `CORS_ORIGIN`: Your frontend URL





### Frontend Deployment (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variable:

1. `VITE_BACKEND_URL`: Your backend URL





## 📱 Usage

### For Teachers

1. Visit the application and select "Join as Teacher"
2. Create polls with custom questions and options
3. Set time limits for student responses
4. Monitor live results and manage students
5. Access chat for real-time communication
6. View historical poll data


### For Students

1. Visit the application and select "Join as Student"
2. Enter your unique name (persisted per tab)
3. Wait for teacher to start a poll
4. Submit your answer within the time limit
5. View live results after submission
6. Participate in chat discussions


## 🏗️ Project Structure

```plaintext
live-polling-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── ChatPopup.jsx
│   │   ├── context/
│   │   │   └── SocketContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/
│   │   ├── Poll.js
│   │   └── Response.js
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Socket Events

#### Teacher Events

- `join-as-teacher` - Join as teacher
- `create-poll` - Create a new poll
- `end-poll` - End current poll
- `kick-student` - Remove student from session
- `get-past-polls` - Retrieve poll history


#### Student Events

- `join-as-student` - Join as student with name
- `submit-response` - Submit poll answer
- `get-poll-results` - Request current results


#### Shared Events

- `send-chat-message` - Send chat message
- `get-chat-history` - Retrieve chat history


## 🎨 Design System

The application follows a modern design system with:

- **Color Palette**: Indigo and purple gradients with emerald accents
- **Typography**: Responsive text scaling across devices
- **Spacing**: Consistent padding and margins using Tailwind's spacing scale
- **Components**: Reusable UI components with hover states and animations
- **Responsive Design**: Mobile-first approach with desktop enhancements


## 🧪 Testing

```shellscript
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Design inspiration from [Figma Design](https://www.figma.com/design/uhinheFgWssbxvlI7wtf59/Intervue-Assigment--Poll-system)
- Icons from [Lucide React](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Animations by [Framer Motion](https://www.framer.com/motion/)


## 📞 Support

If you have any questions or need help with setup, please open an issue or contact [jaiusoni2003@gmail.com](mailto:jaiusoni2003@gmail.com)].

---

**Built with ❤️ for interactive learning experiences**