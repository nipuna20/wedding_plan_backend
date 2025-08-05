const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const guestRoutes = require('./routes/guestRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // <-- Add this
const reviewRoutes = require('./routes/reviewRoutes')
const chatRoutes = require('./routes/chatRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/bookings', bookingRoutes); 
app.use('/api/reviews',reviewRoutes);
app.use('/api/chat', chatRoutes);

// Remove duplicate: app.use('/api/user', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
);
