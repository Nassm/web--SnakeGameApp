const cellSize = 30;
const timeBetweenFrames = 40;
const snakeGrowth = 4;
let frame = 0;
let lastFrameTime = 0;
var gameState = null;
let keyDown = null;
const headColor = ["purple", "darkgreen", "darkblue", "cyan", "darkorange"];
const bodyColor = ["pink", "green", "blue", "lightcyan", "orange"];
var sock;


function fillGridCell(ctx, point) 
{
  ctx.fillRect(point.x * cellSize, point.y * cellSize, cellSize, cellSize);
}

/* draw snake*/
function drawSegments(ctx, segments, id) 
{
    // Draw head
    ctx.fillStyle = headColor[id-1];
    fillGridCell(ctx, segments[0]);
  
    // Draw body
    ctx.fillStyle = bodyColor[id-1];
    for (let i = 1; i < segments.length; i++) 
    {
      fillGridCell(ctx, segments[i]);
    }
}

/* draw walls*/
function drawWalls(ctx) 
{
    ctx.fillStyle = "red";
    for (const wall of gameState.walls) 
    {
      fillGridCell(ctx, wall);
    }
}

/* draw apple*/
function drawApple(ctx) 
{
    ctx.fillStyle = "yellow";
    fillGridCell(ctx, gameState.apple);
}

/* draw the canvas, snakes, walls and apple*/
function drawMap(canvas, ctx) 
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillText(`Frame ${frame}`, 10, 10);

    if(gameState != null)
    {
        if (gameState.status === "ready") 
    {
         ctx.fillText("Press any key to start", 500, 300);

     } else if (gameState.status === "over") 
     {
        ctx.fillText("Aïe :(", 500, 300);
    }

    for(const snake of gameState.snakes){
        drawSegments(ctx, snake.segments, snake.id);
    }
    
    drawWalls(ctx);
    drawApple(ctx);
    }
}


/* websocket to get the gameState and update direction*/
function connectWebSocket() {
    const url = `ws:${window.location.host}`;
    const socket = new WebSocket(url);

    /* on open, ask state*/
    socket.onopen = () => {
        socket.send(JSON.stringify({type: "getState"}));
    };

    /* on server message, update state and send direction */
    socket.onmessage = (message) => {
        let msg = JSON.parse(message.data);
        gameState = msg.gameState;
        /* ci dessous a enlever plus tard géré par un event */
        socket.send(JSON.stringify({type: "changeDirection", direction : keyDown}));
    };

    socket.onerror = (error) => console.error("socket error", error);
    return socket;
}

/*  gameloop */
function gameLoop(frameTime) {
    // Don't go too fast!
    if (frameTime - lastFrameTime <= timeBetweenFrames) {
        requestAnimationFrame(gameLoop);
        return;
    }
    //console.log(gameState);

    const canvas = document.getElementsByTagName("canvas")[0];
    const ctx = canvas.getContext("2d");

    // Update
    if(gameState)
    {
        if (gameState.status === "ready") {
            if (keyDown) 
            {
               sock.send(JSON.stringify({type: "play"}));
            }

        } else if (gameState.status === "playing") {

            sock.send(JSON.stringify({type: "changeDirection", direction : keyDown}));

        } else if (gameState.status === "over") {

            if (keyDown){
                sock.send(JSON.stringify({type: "restart"}));
            }
        }
    }

    // Render
    drawMap(canvas, ctx);

    // Prepare for next loop
    frame++;
    keyDown = null;
    lastFrameTime = frameTime;
    requestAnimationFrame(gameLoop);
}

/* callback key event*/
function onKeyDown(event) {
    event.preventDefault();
    console.log("Got keydown", event);
  
    keyDown = event.key;
  }

function launch() 
{
    sock = connectWebSocket();
    const canvas = document.getElementsByTagName("canvas")[0];
    canvas.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(gameLoop);
}

launch();
