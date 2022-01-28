const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoDBSession = require('connect-mongodb-session')(session);

const mongoose = require("mongoose");

const app = express();

const mongoURI = "mongodb://localhost:27017/sessions";

const userModel = require('./models/User')
const projectModel = require('./models/Projects')
const ticketModel = require('./models/Tickets')
const joinReqModel = require('./models/JoinRequests')
const archiveticketModel = require('./models/archivedtickets')
const archiveprojectModel = require('./models/archivedprojects')

let globalemail = "";
let globalprojectid = "";
let globalticketid = "";

let joinProjMistake = "";
let loginMistake = "";

// TASKS

// make a comment section for tickets ( hardest ) 
//  updates ( make an update page pass in ticket id or project id ) 
// add times projects and tickets are created
// ticket priority
// add create project and create ticket mistakes



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

        let allrequests = await joinReqModel.find({ account: globalemail });


        res.render("index.ejs", {name: user.username, projects: allprojects.length, ticketcompleted: user.ticketscompleted, pending: allrequests.length})
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

    res.redirect('/project');
})

// DELETES THE PROJECT

app.post('/deleteproject', async (req,res) => {

    let holder = req.body;
    let stringholder = JSON.stringify(holder);
    let array = stringholder.split('"');


    let projectid = array[1];

    let project = await projectModel.findOne({ id: projectid });


    const project1 = new archiveprojectModel({
        name: project.name,
        description: project.description,
        owner: project.owner,
        members: project.owner,
        private: project.private,
        id: project.id,
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
        
        res.render("createproj.ejs", {name: user.username})
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

    if(projname == null || desc == null)
    {
        res.redirect("/createproj")
        // res.render("createproj.ejs", {name: user.username})
    }

    const project1 = new projectModel({
        name: projname,
        description: desc,
        owner: user.email,
        members: user.email,
        private: privateVar,
        id: Date.now() + (Math.floor(Math.random() * 1000)) + 1,
    })

    await project1.save();

    globalprojectid = project1.id;
    
    // let ticket = await ticketModel.findOne({ projectid: globalprojectid });


    // if(ticket == null)
    // {
    //     ticket = "";
    // }
    
    res.redirect("/project");

    // return res.render("project.ejs", {name: user.username, email: project1.owner, id: project1.id, project: project1, ticket: ticket})

    
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

    let user = await userModel.findOne({ email: globalemail });

    let project = await projectModel.findOne({ id: projectid });

    if(!project)
    {
        res.redirect("/projects");
    }

    globalprojectid = project.id;

    res.redirect("/project")

});


//  allows users to go to any project thats on the list
// app.post('/projects', async (req,res) => {
    
//     let enterid = req.body.enterid;
    

//     let user = await userModel.findOne({ email: globalemail });

//     let project = await projectModel.findOne({ id: enterid });

//     if(!project)
//     {
//         res.redirect("/projects");
//     }

//     if(project.owner != user.email && !(project.members.includes(user.email))){

//         return res.redirect("/projects");
//     }


//     globalprojectid = project.id;

//     res.redirect("/project")

    
// })


// Tickets 

// tasks for tickets: make checks so people can't go to other peoples tickets


// goes to one singular ticket
app.get('/ticket', isAuth, async (req,res) => {

    
    let user = await userModel.findOne({ email: globalemail });

    if(!user)
    {
        return res.redirect('/login');
    }


    let ticket = await ticketModel.findOne({ id: globalticketid });

    let project = await projectModel.findOne({ id: ticket.projectid})

    if(!(project.members.includes(user.email))){
        return res.redirect('/index');
    }


    if(user && ticket)
    {
        res.render("ticket.ejs", {user: user, ticket: ticket, project: project});
    }else
    {
        res.redirect("/login")
    }
    
})


// goes to create ticket page ( has to have an project attracted)
app.get('/createtic', isAuth, async (req,res) => {

    let user = await userModel.findOne({ email: globalemail });

    if(user)
    {
        res.render("createtic.ejs", {name: user.username})
    }else
    {
        res.redirect("/login")
    }
    
})


// allows someone to create a ticket for a project
// note to self: only the owner/members can make ticket for a project 
app.post('/createtic', async (req,res) => {
    let user = await userModel.findOne({ email: globalemail });


    const { projid, ticname, desc} = req.body;

    if(projid == null || desc == null || ticname == null)
    {
        res.redirect("/createtic");
        // res.render("createtic.ejs", {name: user.username})
    }

    let project = await projectModel.findOne({ id: projid})

    // checks if the person create the ticket is in the project
    if(!(project.members.includes(user.email))){
        res.redirect("/createtic");
        // res.render("createtic.ejs", {name: user.username})
    }



    const ticket1 = new ticketModel({
        name: ticname,
        projectid: projid,
        description: desc,
        owner: user.email,
        members: user.email,
        id: Date.now() + (Math.floor(Math.random() * 1000)) + 1,
    })

    await ticket1.save();

    globalticketid = ticket1.id;


    res.redirect("/ticket")
    // return res.render("ticket.ejs", {name: user.username, ticket: ticket1, project: project })
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
    })

    await ticket1.save();

    await ticketModel.deleteOne({ id: ticketid });

    globalticketid = "";


    res.redirect('/project');

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

    res.redirect('/ticket');

})

// // allows users to go to tickets in the list
// app.post('/tickets', async (req,res) => {
    
//     let enterid = req.body.enterid;
//     enterid = enterid.toString();

//     let user = await userModel.findOne({ email: globalemail });
//     // let alltickets = await ticketModel.find({ owner: user.email});

//     let ticket = await ticketModel.findOne({ id: enterid });

//     console.log(enterid);
//     console.log(ticket);

//     // let project = await projectModel.findOne({ id: ticket.id})

//     if(ticket.owner == user.email || ticket.members.includes(user.email))
//     {
//         if(ticket)
//         {
//             globalticketid = ticket.id;
//             return res.redirect("/ticket")
//             
//         }else{
//             return res.redirect("/tickets")
//             
//         }
//     }else
//     {
//         return res.redirect("/tickets")
//         
//     }
// })

// Authentication 

app.get('/register', (req,res) => {

    return res.render("register.ejs")

})


app.post("/register", async (req,res) => {
    const { username, email, password } = req.body;

    let user = await userModel.findOne({email: email});

    if(user){
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
    // res.render("index.ejs", { name: res.locals.username})
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

})

process.on('uncaughtException', function (err) {
    console.log(err);
}); 


app.listen(5000, console.log("Server Running on http://localhost:5000"))