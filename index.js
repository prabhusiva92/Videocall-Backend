
  

var app = require("express")();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const bcrypt = require("bcrypt")
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 4040
const mongodb = require("mongodb");
const url =  "mongodb+srv://admin:admin@login.7aoxw.mongodb.net/Login?retryWrites=true&w=majority";



io.on("connection", socket => {

  socket.on("joinRoom", (roomID, userID) => {
    console.log(roomID, userID)
    socket.join(roomID)
    socket.to(roomID).broadcast.emit("userConnected",userID)
  } )

  socket.on("disconnect",(roomID)=>{
    socket.to(roomID).broadcast.emit("userDisconnected",userID)
  })

})


app.post("/", async (req, res) => {

  if(req.body.SubmitType === "Login"){

    try {

      //Creating a client from MongoDB URL & connecting it to it's Collection
      let client = await mongodb.connect(url);
      let db = client.db("login");
  
      //getting user Data by finding it in the collection
      let dataUser = await db.collection("userLogin").find({ name: req.body.name }).toArray();
      await client.close();

      bcrypt.compare(req.body.password, dataUser[0].password, function(err, result) {
          res.send({result,dataUser}); 
        });

  
      //Error Handling
    } catch (err) {
      res.status(500).send('Something broke!')
    }

  }else{
    console.log("User Registering")
    try {

      let salt = await bcrypt.genSalt(10)
      let hash = await bcrypt.hash(req.body.password,salt)

      req.body.password=hash

      let client = await mongodb.connect(url);
      let db = client.db("login");
      let data = await db.collection("userLogin").insertOne({name : req.body.name, password: req.body.password});
      await client.close();

      res.json({
        message: "Registered As User",
      })

      console.log(req.body)

    } catch (error) {

      console.log(err)

    }

  }

});


//opening Port on 4040 or Heroku's Port
http.listen(port, () => {
  console.log("listening on : ",port);
});
