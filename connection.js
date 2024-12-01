// Load from .env  and mongoose for MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

// Establish connection to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Export the mongoose connection
module.exports = mongoose;

