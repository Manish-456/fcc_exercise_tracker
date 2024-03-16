const express = require('express')
const app = express()
const cors = require('cors')
const { default: mongoose } = require('mongoose')
const User = require('./models/user.model.js')
const Exercise = require('./models/exercise.model.js')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to Database"));

app.use(cors())
app.use(express.static('public'))

app.use(express.json());

app.use(express.urlencoded({
  extended: false
}))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post(`/api/users`, async function(req, res){
  try {
    const { username } = req.body;

    if(!username) return res.status(400).json({
      error: "Username is required"
    })

   const newUser =  new User({
      username
    });

   const savedNewUser = await newUser.save();

   return res.status(201).json(
    savedNewUser
   )

  } catch (error) {
    return res.sendStatus(500);
  }
})

app.get(`/api/users`, async function(req, res){
  try {
     const users = await User.find({});

     return res.json(users);
  } catch (error) {
    return res.sendStatus(500);
  }
})

// test_id => 65f564ad642d2eac19b7be65
app.post(`/api/users/:_id/exercises`, async function(req, res){
 try {
   const {_id} = req.params;
   const { description, duration, date } = req.body;
   if(!_id){
    return res.status(400).json({
      error: "User Id is required"
    })
   }

   const existingUser = await User.findById(_id);

   if(!existingUser) return res.status(400).json({
    error: "user not found"
   })

   const exercise = new Exercise({
    user: _id,
    description,
    duration,
    date : date ? new Date(date) : new Date()
   })

  const newExercise = await exercise.save();
   
  return res.status(201).json({
    _id: existingUser._id,
    username: existingUser.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: new Date(newExercise.date).toDateString()
  })

 } catch (error) {
  return res.sendStatus(500);
 }
})

app.get(`/api/users/:_id/logs`, async function(req, res){
  try {
    const {_id} = req.params;
    const {from, to, limit} = req.query;
    
    const user = await User.findById(_id);

    if(!user) return res.status(400).json({
      error: "Invalid ID"
    })

    const query = {
      user: user._id
    };
   
    const dateObj = {};

    if(from){
      dateObj["$gte"] = new Date(from);
    }

    if(to){
      dateObj["$lte"] = new Date(to);
    }

    if(from || to){
      query.date = dateObj;
    }



    const exercises = await Exercise.find(query).select("-_id -__v -user").limit(limit);

  const count = exercises.length;

  const formattedExercises = exercises.map(exercise => ({
    ...exercise._doc,
  date: new Date(exercise.date).toDateString(),
  duration: Number(exercise.duration)
  }))
  
    return res.json({
      _id: user._id,
      username: user.username,
      log: formattedExercises,
      count
    })

  } catch (error) {
    console.error(error)

    return res.sendStatus(500);
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
