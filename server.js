const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/guests', require('./routes/guestRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/user', require('./routes/userRoutes'));


app.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`)
);
