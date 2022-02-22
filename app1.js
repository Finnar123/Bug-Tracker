const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoDBSession = require('connect-mongodb-session')(session);

const nodemailer = require('nodemailer');

const mongoose = require("mongoose");

const app = express();

const jwt = require('jsonwebtoken')

const mongoURI = "mongodb://localhost:27017/sessions";

const userModel = require('./models/User')
const projectModel = require('./models/Projects')
const ticketModel = require('./models/Tickets')
const joinReqModel = require('./models/JoinRequests')
const archiveticketModel = require('./models/archivedtickets')
const archiveprojectModel = require('./models/archivedprojects')
const commentsModel = require("./models/Comments")

let globalemail = "";
let globalprojectid = "";
let globalticketid = "";

let joinProjMistake = "";
let loginMistake = "";
let createProjMistake = "";
let createTicketMistake = "";
let registerMistake = "";
let forgotMistake = "";


const JWT_SECRET = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY0NDcxOTczMSwiaWF0IjoxNjQ0NzE5NzMxfQ.8ernD8g6Tp214lNOGRT-jSBsZp50wnJU2z5fNcVezo0";


// TASKS


// notification system
// notify user when: project member adds ticket
// a new user joins one of your project(not sure)
// notify when someone sends you a request
// make a database for notifs fields: user email, topic, date


function getToday(){
    var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        return date + " " + time;
}

function getTime(){
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes();
    return time;
}


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
        res.redirect("/login")
    }
}   

app.get("/", async (req,res) => {
    
    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        
        res.redirect("/index")
    }else
    {
        res.redirect("/login")
    }
    
})

app.get('/index', isAuth, async (req,res) => {


    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        let allprojects = await projectModel.find({ members: user.email});

        let alltickets = await ticketModel.find({ members: user.email});

        let types = new Array();
        types[0] = new Array('Bug',0);
        types[1] = new Array('Task',0);
        types[2] = new Array('Subtask',0);
        types[3] = new Array('Change',0);
        types[4] = new Array('Incident',0);
        types[5] = new Array('New feature',0);
        types[6] = new Array('Support',0);
        types[7] = new Array('Problem',0);

    for(let x = 0; x < 8; x++)
    {
        for(let i = 0; i < alltickets.length; i++)
        {
            if(types[x][0] == alltickets[i].type)
            {
                types[x][1]++;
            }
        }
    }
    types.sort((function(index){
        return function(a, b){
            return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
        };})(1)); 


        let allrequests = await joinReqModel.find({ account: globalemail });

        res.render("index.ejs", {name: user.username, projects: allprojects,  pending: allrequests.length, types: types})
    }else
    {
        res.redirect("/login")
    }
    
})

// Projects 


// loads up page of one project
app.get('/project', isAuth, async (req,res) => {

    
    let user = await userModel.findOne({ email: globalemail });

    let project = await projectModel.findOne({ id: globalprojectid });

    let ticket = await ticketModel.find({ projectid: globalprojectid });

    if(ticket == null)
    {
        ticket = "";
    }

    if(user && project)
    {
        res.render("project.ejs", {user: user, email: project.owner, id: globalprojectid, project: project, ticket: ticket})
    }else
    {
        res.redirect("/login")
        // res.render("login.ejs")
    }
    
})

// JOIN PROJECT 

app.get('/joinproject', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        
        res.render("joinproject.ejs", {name: user.username, mistake: joinProjMistake})

    }else
    {
        res.redirect("/login")

    }
    
})

app.post('/joinproject', async (req,res) => {
    let joinId = req.body.projectid;
    joinId = joinId.trim();

    let user = await userModel.findOne({ email: globalemail });
    let project = await projectModel.findOne({ id: joinId });

    if(project.owner == undefined)
    {
        joinProjMistake = "That Project ID does not exist!";
        return res.redirect('/joinproject');
    }

    if(project.members.includes(user.email))
    {
        joinProjMistake = "You are already in that group!";
        return res.redirect('/joinproject');
    }

    if(project.private == true)
    {
        joinProjMistake = "That project is private!";
        return res.redirect('/joinproject');
    }

    let pendrequest = await joinReqModel.findOne({ projectid: project.id, joiner: user.email});


    if(!pendrequest)
    {
        const request = new joinReqModel({
            account: project.owner,
            projectname: project.name,
            projectid: project.id,
            joiner: user.email,
            joinername: user.username,
        })
    
        await request.save();
    
        joinProjMistake = "Success! Sent the join request!";
        return res.redirect('/joinproject');

    }

    joinProjMistake = "You have already sent a request.";
        return res.redirect('/joinproject');

})

// PENDING REQUESTS 

app.get('/joinrequests', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(!user)
    {
        res.redirect("/login")
    }
    let allrequests = await joinReqModel.find({ account: globalemail });

    res.render("joinrequests.ejs", {name: user.username, request: allrequests})
    

})

app.post('/joinrequests',  async (req,res) => {

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let pending = array[5].toString();
    let deny = pending.substring(0,4);
    let accept = pending.substring(0,6);


    if(deny == "Deny")
    {

        await joinReqModel.deleteOne({ _id: pending.substring(4) });
    }

    if(accept == "Accept")
    {
        

        let pendrequest = await joinReqModel.findOne({ _id: pending.substring(6)});

        const response = await projectModel.findOneAndUpdate(
            {
                id: pendrequest.projectid,
            },
            {
                $push: {
                    members: pendrequest.joiner,
                }
            }
        )

    
        const response2 = await projectModel.findOneAndUpdate(
            {
                id: pendrequest.projectid,
            },
            {
                $set:{
                    timeupdated: getToday(),
            }
            })


        await joinReqModel.deleteOne({ _id: pending.substring(6) });
    }
    

    res.redirect('/joinrequests');

});

// REMOVE PERSON FROM A PROJECT

app.post('/removeprojectmember', async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let projectid = array[2].toString();
    let memberemail = array[1].toString();

    memberemail = memberemail.substring(0,memberemail.length-1);



    const response = await projectModel.findOneAndUpdate(
        {
            id: projectid,
            owner: user.email,
        },
        {
            $pull: {
                members: memberemail,
            }
        }
    )


    const response2 = await projectModel.findOneAndUpdate(
        {
            id: projectid,
        },
        {
            $set:{
                timeupdated: getToday(),
        }
        })
        
        
        res.redirect('/project');
})

// DELETES THE PROJECT

app.post('/deleteproject', async (req,res) => {

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');


    let projectid = array[1];

    let project = await projectModel.findOne({ id: projectid });


    const response2 = await projectModel.findOneAndUpdate(
        {
            id: projectid,
        },
        {
            $set:{
                timeupdated: getToday(),
        }
        })




    const project1 = new archiveprojectModel({
        name: project.name,
        description: project.description,
        owner: project.owner,
        members: project.owner,
        private: project.private,
        id: project.id,
        timecreated: project.timecreated,
        timeupdated: project.timeupdated,
    })

    await project1.save();

    let alltickets = await ticketModel.find({ projectid: project.id});

    for(var i = 0; i < alltickets.length; i++)
    {

        let ticket1 = new archiveticketModel({
            name: alltickets[i].name,
            projectid: alltickets[i].projectid,
            description: alltickets[i].description,
            owner: alltickets[i].owner,
            members: alltickets[i].owner,
            id: alltickets[i].id,
            status: alltickets[i].status,
            priority: alltickets[i].priority,
            type: alltickets[i].type,
            timecreated: alltickets[i].timecreated,
            timeupdated: alltickets[i].timeupdated,
        })
    
        await ticket1.save();
    
        await ticketModel.deleteOne({ id: alltickets[i].id });

    }

    await projectModel.deleteOne({ id: project.id });


    globalprojectid = "";
    globalticketid = "";


    res.redirect('/index');

})


// takes you to create project page
app.get('/createproj', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        
        res.render("createproj.ejs", {name: user.username, mistake: createProjMistake})
    }else
    {
        res.redirect("/login")
        // res.render("login.ejs")
    }
    
})

//  creates new project and adds to database
app.post('/createproj', async (req,res) => {


    let user = await userModel.findOne({ email: globalemail });

    let private = "";

    const { projname, desc} = req.body;

    private = req.body.private;

    let privateVar = false;

    if(private == "on")
    {
        privateVar = true;
    }

    if(projname == null || projname == "" || desc == null || desc == "")
    {
        createProjMistake = "Please enter a project name and description!";
        res.redirect("/createproj")
        // res.render("createproj.ejs", {name: user.username})
    }

    let sametime = getToday();

    const project1 = new projectModel({
        name: projname,
        description: desc,
        owner: user.email,
        members: user.email,
        private: privateVar,
        id: Date.now() + (Math.floor(Math.random() * 1000)) + 1,
        timecreated: sametime,
        timeupdated: sametime,
    })

    await project1.save();

    globalprojectid = project1.id;
    
    res.redirect("/project");


    
})

// displays all projects belonging to user 
app.get('/projects', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        let allprojects = await projectModel.find({ members: user.email});

        res.render("projects.ejs", {name: user.username, email: user.email, projects: allprojects})
    }else
    {
        res.redirect("/login")
    }
    
})

app.post('/projects', async (req,res) => {

    // extracted the useful information
    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let projectid = array[5].toString();

    let project = await projectModel.findOne({ id: projectid });

    if(!project)
    {
        res.redirect("/projects");
    }

    globalprojectid = project.id;

    res.redirect("/project")

});

app.get('/editproject', isAuth, async (req,res) => {

    if(globalprojectid == "" || globalemail == "")
    {
        res.redirect('/index');
    }

    let user = await userModel.findOne({ email: globalemail });

    let project = await projectModel.findOne({ id: globalprojectid });

    res.render("editproject.ejs", {user: user, project: project})
    



});

app.post('/editproject', async (req,res) => {

    let projname = req.body.projname;
    let desc = req.body.desc;

    const response2 = await projectModel.findOneAndUpdate(
        {
            id: globalprojectid,
        },
        {
            $set:{
                name: projname,
                description: desc,
                timeupdated: getToday(),
        }
        })



    res.redirect('/project');
});


// goes to one singular ticket
app.get('/ticket', isAuth, async (req,res) => {

    
    let user = await userModel.findOne({ email: globalemail });

    if(!user)
    {
        return res.redirect('/login');
    }

    if(globalticketid == "")
    {
        res.redirect('/index');
    }

    let ticket = await ticketModel.findOne({ id: globalticketid });


    let project = await projectModel.findOne({ id: ticket.projectid})

    if(!(project.members.includes(user.email))){
        return res.redirect('/index');
    }

    let comments = await commentsModel.findOne({ ticketid: ticket.id });

    if(user && ticket)
    {
        res.render("ticket.ejs", {user: user, ticket: ticket, project: project, comments: comments});
    }else
    {
        res.redirect("/login")
    }
    
})


// Comment section for tickets

app.post('/sendcomment', async(req,res) => {

    let thecomment = req.body.thecomment;
    if(thecomment == "")
    {
        return res.redirect("/ticket");
    }

    
    const response = await commentsModel.findOneAndUpdate(
        {
            ticketid: globalticketid,
        },
        {
            $push: {
                user: globalemail,
                comment: thecomment,
                timesent: getTime(),
            }
        }
    )

    const response2 = await projectModel.findOneAndUpdate(
        {
            id: globalticketid,
        },
        {
            $set:{
                timeupdated: getToday(),
        }
        })

    res.redirect('/ticket');

})



// goes to create ticket page ( has to have an project attracted)
app.get('/createtic', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        res.render("createtic.ejs", {name: user.username, mistake: createTicketMistake, id: globalprojectid })
    }else
    {
        res.redirect("/login")
    }
    
})


// allows someone to create a ticket for a project
// note to self: only the owner/members can make ticket for a project 
app.post('/createtic', async (req,res) => {
    let user = await userModel.findOne({ email: globalemail });

    // copy the thing you did in add members ticket

    const { projid, ticname, desc, priority, tickettype} = req.body;

    if(projid == null || desc == null || ticname == null || projid == "" || desc=="" || ticname == "" )
    {
        createTicketMistake = "Please fill all the fields!"
        res.redirect("/createtic");
        // res.render("createtic.ejs", {name: user.username})
    }

    let project = await projectModel.findOne({ id: projid})

    if(project.owner == undefined)
    {
        createTicketMistake = "That project id does not exist!";
        res.redirect('/createtic');
    }
    // checks if the person create the ticket is in the project
    if(!(project.members.includes(user.email))){
        createTicketMistake = "You are not a team member in that project!";
        res.redirect("/createtic");
        // res.render("createtic.ejs", {name: user.username})
    }


    // portalspace

    let sametime = getToday();

    const response2 = await projectModel.findOneAndUpdate(
        {
            id: projid,
        },
        {
            $set:{
                timeupdated: sametime,
        }
        })


    const ticket1 = new ticketModel({
        name: ticname,
        projectid: projid,
        description: desc,
        owner: user.email,
        members: user.email,
        id: Date.now() + (Math.floor(Math.random() * 1000)) + 1,
        status: "Open",
        priority: priority,
        type: tickettype,
        timecreated: sametime,
        timeupdated: sametime,
    })

    await ticket1.save();

    const comment1 = new commentsModel({
        ticketid: ticket1.id,
    })

    await comment1.save();

    globalticketid = ticket1.id;


    res.redirect("/ticket")
    
})


// page to view all the tickets your apart of
app.get('/tickets', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        let alltickets = await ticketModel.find({ members: user.email});

        res.render("tickets.ejs", {name: user.username, ticket: alltickets})
    }else
    {
        res.redirect("/login")
    }
    
})

app.post('/tickets', async (req,res) => {

    // extracted the useful information
    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let ticketid = array[5].toString();

    let ticket = await ticketModel.findOne({ id: ticketid });

    if(!ticket)
    {
        res.redirect("/tickets");
    }

    globalticketid = ticket.id;

    res.redirect("/ticket")

});

app.post('/deleteticket', async (req,res) => {

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let ticketid = array[5];

    let ticket = await ticketModel.findOne({ id: ticketid });


    const ticket1 = new archiveticketModel({
        name: ticket.name,
        projectid: ticket.projectid,
        description: ticket.description,
        owner: ticket.owner,
        members: ticket.owner,
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        timecreated: ticket.timecreated,
        timeupdated: ticket.timeupdated,
    })

    await ticket1.save();

    const response2 = await projectModel.findOneAndUpdate(
        {
            id: ticket.projectid,
        },
        {
            $set:{
                timeupdated: getToday(),
        }
        })


    await ticketModel.deleteOne({ id: ticketid });

    globalticketid = "";


    res.redirect('/project');

})


// EDIT TICKET

app.get('/editticket', isAuth, async (req,res) => {

    if(globalticketid == "" || globalemail == "")
    {
        res.redirect('/index');
    }

    let user = await userModel.findOne({ email: globalemail });

    let ticket = await ticketModel.findOne({ id: globalticketid });

    res.render("editticket.ejs", {user: user, ticket: ticket})
    



});

app.post('/editticket', async (req,res) => {

    let { ticketname, desc, priority1, status1, tickettype } = req.body;



    const response2 = await ticketModel.findOneAndUpdate(
        {
            id: globalticketid,
        },
        {
            $set:{
                name: ticketname,
                description: desc,
                priority: priority1,
                status: status1,
                type: tickettype,
                timeupdated: getToday(),
        }
        })


    // res.redirect('/ticket');
    res.redirect('/ticket');
})

// REMOVE TICKET MEMBER 

app.post('/removeticketmember', async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let ticketid = array[2].toString();
    let memberemail = array[1].toString();

    memberemail = memberemail.substring(0,memberemail.length-1);

    const response = await ticketModel.findOneAndUpdate(
        {
            id: ticketid,
            owner: user.email,
        },
        {
            $pull: {
                members: memberemail,
            },
            $set:{
                timeupdated: getToday(),
            }
        }
    )

    res.redirect('/ticket');
})

// ADD TICKET MEMBER
app.post('/addticketmember', async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');

    let addemail = array[3];
    let ticketid = array[1];

    let ticket = await ticketModel.findOne({ id: ticketid  });
    
    if(ticket.members.includes(addemail))
    {
        return res.redirect('/ticket');
    }

    const response = await ticketModel.findOneAndUpdate(
        {
            id: ticket.id,
            owner: user.email,
        },
        {
            $push: {
                members: addemail,
            }
        }
    )

    const response2 = await ticketModel.findOneAndUpdate(
        {
            id: ticketid,
        },
        {
            $set:{
                timeupdated: getToday(),
        }
        })


    res.redirect('/ticket');

})


// Authentication 

app.get('/register', (req,res) => {

    return res.render("register.ejs", {mistake: registerMistake});

})


app.post("/register", async (req,res) => {
    const { username, email, password, repeatpassword } = req.body;

    let user = await userModel.findOne({email: email});

    if(user){
        registerMistake = "This user already exists.";
        return res.redirect("/register");
    }

    if(password != repeatpassword)
    {
        registerMistake = "Repeated password does not match password.";
        return res.redirect("/register");
    }

    const hashedPsw = await bcrypt.hash(password, 12);

    user = new userModel({
        username,
        email,
        password: hashedPsw
    })

    await user.save();

    loginMistake = "";
    return res.redirect("/login")
})

app.get('/login', (req,res) => {

    registerMistake = "";
    res.render("login.ejs", {mistake: loginMistake})
})

app.post('/login', async (req,res) => {

    const { email, password } = req.body;

    const user = await userModel.findOne({email: email});

    if(!user)
    {
        loginMistake = "You entered an incorrect email or password!"
        return res.redirect("/login")
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        loginMistake = "Wrong password!"
        return res.redirect("/login")
        // return res.render("login.ejs")
    }

    req.session.isAuth = true;

    globalemail = user.email;
    loginMistake = "";

    res.redirect("/index");
    
})

app.post('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect("/login")
    })

    globalemail = "";
    globalprojectid = "";
    globalticketid = "";
    loginMistake = "";
    joinProjMistake = "";
    createProjMistake = "";
    createTicketMistake = "";

})


// FORGOT PASSWORD 


app.get('/forgot-password', async (req,res) => {
    return res.render("forgot-password.ejs", {mistake: forgotMistake});
})



app.post('/forgot-password', async (req,res) => {
    
    const { email2 } = req.body;


    const user = await userModel.findOne({email: email2});

    if(!user)
    {
        forgotMistake = "That email does not exist!"
        return res.redirect('/forgot-password');
    }
    

    const secret = JWT_SECRET + user.password;
    const payload = {
        email: user.email,
    }

    const token = jwt.sign(payload, secret, {expiresIn: '15m'});
    const link = `http://localhost:5000/reset-password/${user.email}/${token}`


    let transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: 'bugtracker89@hotmail.com', 
        pass: 'itbebugging78', 
        },
        tls:{
            rejectUnauthorized: false,
        }
    });

    try{

    let info = await transporter.sendMail({
        from: 'bugtracker89@hotmail.com', // sender address
        to: `${user.email}`, // list of receivers
        subject: "Bug Tracker Reset Password", // Subject line
        text: `${link}`, // plain text body
        html: `<b>Here is the link to reset your password: ${link} 
        It expires in 15 minutes.</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    forgotMistake = "Success! The link has been sent to your email!";
    res.redirect('/forgot-password')

    }catch(err){

        console.log(err);

        forgotMistake = "Something went wrong sending the email!";
        res.redirect('/forgot-password')
    }


})



app.get('/reset-password/:useremail/:token', async (req,res) => {

    const { useremail, token } = req.params;

    
    // Check if this user exist in database
    const user = await userModel.findOne({email: useremail});

    if(!user)
    {

        return res.redirect('/forgot-password');
    }


    const secret = JWT_SECRET + user.password;

    try{

        const payload = jwt.verify(token, secret)

        return res.render('reset-password.ejs', {email: user.email, token: token});

    }catch(err)
    {
        console.log(err);


        forgotMistake = "The link has expired."
        res.redirect('/forgot-password');
    }


})


app.post('/reset-password/:useremail/:token', async (req,res) => {
    

    const { useremail, token } = req.params;

    const { password1 , password2} = req.body;


    const user = await userModel.findOne({email: useremail});

    if(!user)
    {
        
        return res.redirect('/forgot-password');
    }

    const secret = JWT_SECRET + user.password;

    try {    

        const payload = jwt.verify(token, secret);

        if(password1 != password2)
        {
            return res.redirect('/reset-password/:useremail/:token');
        }

        const hashedPsw = await bcrypt.hash(password1, 12);

        const response = await userModel.findOneAndUpdate(
            {
                email: user.email,
            },
            {
                $set: {
                    password: hashedPsw
                }
            }
        )

        loginMistake = "";
        res.redirect('/login');

    }catch(err){

        console.log(err);
    }

})


process.on('uncaughtException', function (err) {
    console.log(err);
}); 


app.listen(5000, console.log("Server Running on http://localhost:5000"))
