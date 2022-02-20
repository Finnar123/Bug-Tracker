let email = document.getElementById('grabemail').title;
let ticketid = document.getElementById('grabticketid').title;

console.log(ticketid);
console.log(email);

// import {commentsModel } from "../models/Comments";


// async function comment(){

//     let comments = await commentsModel.findOne({ ticketid: ticketid });
//     console.log(comments);
// }

// comment();


// email is passed in


/* 
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

*/