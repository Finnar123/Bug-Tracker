const mongoURI = "mongodb://localhost:27017/sessions";

import commentsModel from "../models/Comments";


const RENDER_SPEED = 1;
let lastRenderTime = 0;


function main(currentTime)
{

    window.requestAnimationFrame(main)

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000

    if(secondsSinceLastRender < 1 / RENDER_SPEED) return

    console.log("Render")
    lastRenderTime = currentTime
    

}

window.requestAnimationFrame(main)
