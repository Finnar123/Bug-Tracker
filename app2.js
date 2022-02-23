const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoDBSession = require('connect-mongodb-session')(session);

const mongoose = require("mongoose");

const app = express();

const mongoURI = "mongodb://localhost:27017/sessions";

const userModel = require('./models/User')

mongoose.connect(mongoURI).then((res) => {
    console.log("MongoDB Connected");
});

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mySessions',

})

app.set("view-engine", "ejs")

app.use("/css", express.static('./css/'));
app.use("/scss", express.static('./scss/'));
app.use("/img", express.static('./img/'));
app.use("/js", express.static('./js/'));
app.use("/vendor", express.static('./vendor/'));

app.use(express.urlencoded({ extended: true }))




app.use(session({
    secret: 'oihubknjnknbybyj',
    resave: false,
    saveUninitialized: false,
    store: store,
})
)

const isAuth = (req, res, next) => {
    if(req.session.isAuth)
    {
        next()
    }else {
        res.sendFile(__dirname + "/login.html");
    }
}   

app.get("/", (req,res) => {
    
    if(req.session.isAuth)
    {
        res.sendFile(__dirname + "/index.html")
    }else
    {
        res.sendFile(__dirname + "/login.html")
    }
    
})

app.get('/index', isAuth, (req,res) => {

    
    res.sendFile(__dirname + "/index.html")
    
    
    
})

app.get('/register', (req,res) => {

    res.sendFile(__dirname + "/register.html")

})


app.post("/register", async (req,res) => {
    const { username, email, password } = req.body;

    let user = await userModel.findOne({email});

    if(user){
        return res.sendFile(__dirname + "/register.html")
    }

    const hashedPsw = await bcrypt.hash(password, 12);

    user = new userModel({
        username,
        email,
        password: hashedPsw
    })

    await user.save();

    res.sendFile(__dirname + "/login.html")
})

app.get('/login', (req,res) => {

    res.sendFile(__dirname + "/login.html")
    

})

app.post('/login', async (req,res) => {

    const { email, password } = req.body;

    const user = await userModel.findOne({email});

    if(!user)
    {
        return res.sendFile(__dirname + "/login.html");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.sendFile(__dirname + "/login.html");
    }

    req.session.isAuth = true;

    res.locals = user;
    console.log(res.locals);


    res.sendFile(__dirname + "/index.html")
})

app.post('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.sendFile(__dirname + "/login.html")
    })
})

process.on('uncaughtException', function (err) {
    console.log(err);
}); 


app.listen(5000, console.log("Server Running on http://localhost:5000"))
