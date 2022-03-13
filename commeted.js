
// var App = {
//     globals: {
//         globalemail: "say something",
//         globalprojectid: "",
//         globalticketid:  "",
//     },
//     mistakes: {
//     joinProjMistake:"",
//     loginMistake: "",
//     createProjMistake: "",
//     createTicketMistake: "",
//     registerMistake: "",
//     forgotMistake: "",
//     }
// }


// console.log(App.globals.globalemail);


// console.log(App.globals.globalemail);

// legacy
// let App.globals.globalemail = "";
// let App.globals.globalprojectid = "";
// let App.globals.globalticketid = "";

// let App.mistakes.joinProjMistake = "";
// let App.mistakes.loginMistake = "";
// let App.mistakes.createProjMistake = "";
// let App.mistakes.createTicketMistake = "";
// let App.mistakes.registerMistake = "";
// let App.mistakes.forgotMistake = "";


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
