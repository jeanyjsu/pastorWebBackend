require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Initialize express and define port
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for cross origin resource sharing and parsing JSON
app.use(cors());
app.use(express.json());

// Define mongoose schemas and model for the collection
const pastorVidSchema = new mongoose.Schema({
    name: String,
    url: String,
}, { collection: 'pastorVid' });

const PastorVid = mongoose.model('PastorVid', pastorVidSchema);

const pastorImgSchema = new mongoose.Schema({
    name: String,
    url: String,
    country:{
        en: String,
        fa: String
    }
});
const PastorImg = mongoose.model('pastorImgss', pastorImgSchema, 'pastorImgs');

const missionDescription = new mongoose.Schema({
    country: String,
    descriptions: {
        en: String,
        fa: String
    }
});

const MissionDescription = mongoose.model('MissionDescription', missionDescription, 'missionCountryDescription');

const eventSchema = new mongoose.Schema({
    title: String,
    date: Date,
    time: String,
    description: String,
    location: String
}, {collection: 'pastorEvent'});

const Event = mongoose.model('Event', eventSchema, 'pastorEvent');

const AdminSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    passWord: { type: String, required: true },
    },{ collection: 'pastorLogin' });

const Admin = mongoose.model('Admin', AdminSchema);

// Various API endpoint to fetch images, videos, descriptions, and password
app.get('/api/getImgs', async (req, res) => {
    const { country } = req.query;

    if (!country) {
        console.log("Country parameter is missing");
        return res.status(400).send('Country parameter is required');
    }
    try {
        const files = await PastorImg.find(
            { "country.en": { $regex: new RegExp(`^${country}$`, 'i')}},
            { url: 1, _id: 0 }
        );

        if (files.length > 0) {
            const urls = files.map(file => file.url);
            console.log(`Sending URLs:`, urls);
            res.status(200).json(urls);
        } else {
            console.log(`No images found for country: ${country}`);
            res.status(404).send(`No images found for country: ${country}`);
        }
    } catch (error) {
        console.error('Error fetching images:', error.message);
        res.status(500).send('Error fetching images');
    }
});

app.get('/api/video', async (req, res) => {
    try {
        const video = await PastorVid.findOne();

        console.log('Video URL:', video?.url);
        console.log('Query result:', video);
        if (video) {
            res.json({ url: video.url });
        } else {
            console.error('No video found in collection pastorVid');
            res.status(404).json({ error: 'No video found' });
        }
    } catch (err) {
        console.error('Error fetching video:', err);
        res.status(500).json({ error: 'Failed to fetch video URL' });
    }
});

app.get('/api/mission-descriptions', async (req, res) => {
    const { country, lng } = req.query;
    console.log(`Received request: country=${country}, lng=${lng}`);

    try {
        const filter = { country };
        const projection = lng
            ? { [`descriptions.${lng}`]: 1, _id: 0, country: 1 }
            : { descriptions: 1 };

        const description = await MissionDescription.findOne(filter, projection);

        if (description) {
            if (lng) {
                const result = description.descriptions?.[lng] || "No description available in the requested language.";
                res.status(200).json({ description: result });
            } else {
                res.status(200).json(description);
            }
        } else {
            res.status(404).json({ error: "No descriptions found for the selected country." });
        }
    } catch (error) {
        res.status(500).send("Error fetching mission descriptions");
    }
});

app.get('/api/event', async (req, res) => {
    try {
        const events = await Event.find();
        console.log('API Response:', events); // Log the events
        res.status(200).json(events); // Ensure events are returned
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).json({ error: 'Error fetching events' });
    }
});


app.post('/api/event', async (req, res) => {
    try {
        const { title, date, time, description, location } = req.body;
        const newEvent = new Event({
            title,
            date: new Date(date),
            time,
            description,
            location,
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error saving event:', error.message);
        res.status(500).json({ error: 'Error saving event' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ userName: username });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.passWord);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.status(200).json({ message: 'Authentication successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/event', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).json({ error: 'Error fetching events' });
    }
});

app.put('/api/event/:id', async (req, res) => {
    const { id } = req.params;
    const { title, date, time, description, location } = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { title, date: new Date(date), time, description, location },
            { new: true, runValidators: true }
        );
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Error updating event' });
    }
});

app.delete('/api/event/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Error deleting event' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

