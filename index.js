const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
mongoose = require("mongoose");
const { Schema } = mongoose;

// connection with mongoos
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
});
const excersiceSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercises = mongoose.model('Exercises', excersiceSchema);

// Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, { __v: 0 });
  res.json(users);
});

// Add an exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).send('User not found.');

  const exercises = new Exercises({
    username : user.username,
    description,
    duration,
    date :  date ? new Date(date) : new Date()
  })
  
  const exercise = await exercises.save();
 
  res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
  });
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  console.log(req.query);
  
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  const user = await User.findById(userId);
  if (!user) return res.send('User not found.');

  let dateObj = {};

  if(from){
    dateObj["$gte"] = new Date(from);
  }

  if(to){
    dateObj["$lte"] = new Date(to);
  }

  const filter = {
    username : user.username
  }

  if (from || to) {
      filter.date = dateObj;
  }


  const exercises = await Exercises.find(filter).limit(+limit ?? 500);


  res.json({
      username: user.username,
      count : exercises.length,
      log: exercises.map(log => ({
          description: log.description,
          duration: +log.duration,
          date: log.date.toDateString()
      }))
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
