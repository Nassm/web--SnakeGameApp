import {GameState, GameController} from './game.js'
import path from "path"
import reload from "reload"
import express from "express"
import expressWs from "express-ws"

const app = express();
expressWs(app);
const port = 3000;
app.use(express.static("client"));

/* ui */
app.get("/", (req, res) => 
{
    res.sendFile(path.resolve("client/client.html"))
});

var sockets = [];
const maxSockets = 5;
let controller = new GameController(new GameState());

/* websocket */
app.ws('/', (socket, req) => {

    /* if client message */
    socket.on("message", (message) => {
        let msg = JSON.parse(message);

        /* when client open connection */
        if(msg.type === "getState")
        {
            /* check if maximum client not reached and add sock */
            if (sockets.length <= (maxSockets-1)) {
                controller.addSocket(socket);
                sockets.push(socket);
    
                /* if 5 players, launch game */
                if(sockets.length == (maxSockets))
                {
                    controller.startGame(controller.gameState);
                }
                
            } else if (!controller.isSocketGranted(socket)) {
                /* if socket was not added and granted, so new socket*/
                socket.send(`Sorry, maximum of players reached`);
                return;
            }

            /* otherwise send state */
            let json = JSON.stringify({gameState: controller.gameState});
            socket.send(json);

        } else if(msg.type === "play")
        {
            /* check if socket is allowed */
            if (controller.isSocketGranted(socket)) {
                controller.startGame(controller.gameState);
            }

        } else if(msg.type === "restart")
        {
            /* check if maximum client not reached and then add sock */
            if (controller.isSocketGranted(socket)) {
                
                controller.reloadGame(controller.gameState);
            }
        }

        controller.onDirectionChangeReceived(socket, msg);
    });

    socket.on("close", (code) => {
        controller.removeSocket(socket);
        var index = sockets.indexOf(socket);
        sockets.splice(index, 1);
    });

    socket.on("error", (error) => {
        console.log("socket error", error);
    });
});



async function launchServer() {
    try {
        await reload(app);

    } catch (err) {
        console.log("Error when reloading", err);
    }

    app.listen(port, () => {
        console.log('listening at http://localhost:${port}');
    });
}

launchServer();