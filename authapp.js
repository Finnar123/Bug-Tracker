const express = require('express');
const app = express();
require('dotenv').config(); 
const { auth ,  requiresAuth } = require('express-openid-connect');

app.use("/css", express.static('./css/'));
app.use("/scss", express.static('./scss/'));
app.use("/img", express.static('./img/'));
app.use("/js", express.static('./js/'));
app.use("/vendor", express.static('./vendor/'));


app.use (
    auth({
        authRequired: false,
        auth0Logout: true,
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        secret: process.env.SECRET
    })
);


//res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')

app.get('/', (req,res) => {
    res.sendFile(req.oidc.isAuthenticated() ?__dirname + '/index.html' : __dirname + "/login.html")

    
})

app.get('/index', requiresAuth(), (req,res) => {
    res.sendFile(__dirname + "/index.html")
})

app.get('/register', (req,res) => {

    res.sendFile(__dirname + "/register.html")

})


const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

