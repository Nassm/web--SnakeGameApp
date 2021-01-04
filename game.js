/* Sorry M. Pierre Grabolosa for the code architecture  */
//      import * as client from './client/client.js'
let idSocket = 1; // idSocket for each client connected
const snakeGrowth = 4;
const cellSize = 30;
let stateFromSnake;


/* Snake class*/
class Snake {
    constructor(ID = 0, SEGMENTS = [], DIRECTION = "right", COLOR = "#FFFFF") {
        this.id = ID;
        this.segments = SEGMENTS;
        this.direction = DIRECTION;
        this.color = COLOR;
    }

    changeDirection(DIRECTION, state){
        this.direction = DIRECTION;
        this.move();

        
        if (this.hitsApple(state)) {
            this.grow(snakeGrowth);
            state.moveApple();
        }

        if (this.hitsObstacle(state)) {
            state.status = "over";
        }
        return state.status
    }

    move(){
        // Copy each element to the previous one
        for (let i = this.segments.length - 1; i > 0; i--) {
            this.segments[i] = this.segments[i - 1].clone();
        }

        // Advance the head in the current direction
        if (this.direction === "left") {
            this.segments[0].x = (this.segments[0].x + gridSize.x - 1) % gridSize.x;

        } else if (this.direction === "right") {
            this.segments[0].x = (this.segments[0].x + gridSize.x + 1) % gridSize.x;

        } else if (this.direction === "up") {
            this.segments[0].y = (this.segments[0].y + gridSize.y - 1) % gridSize.y;

        } else if (this.direction === "down") {
            this.segments[0].y = (this.segments[0].y + gridSize.y + 1) % gridSize.y;

        } else {
            throw new Error("Invalid direction");
        };
    }

    grow(amount){
        // Add a bunch of dummy segments to the end
        const lastSegment = this.segments[this.segments.length - 1];
        for (let i = 0; i < amount; i++) {
            this.segments.push(lastSegment.clone());
        }
    }

    hitsObstacle(state) {
        const head = this.segments[0];

        // Check the head of the snake against the walls
        for (const wall of state.walls) {
            if (head.equals(wall)) return true;
        }

        // Check the head against other segments of the snake
        for (let i = 1; i < this.segments.length; i++) {
            if (head.equals(this.segments[i])) return true;
        }
        return false;
    }

    hitsApple(state) {
        const head = this.segments[0];
        if (head.equals(state.apple)) return true;
        return false;
    }
}

/* Point class */
class Point {
    constructor(X = 0, Y = 0) {
        this.x = X;
        this.y = Y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    equals(POINT) {
        return POINT.x === this.x && POINT.y === this.y;;
    }
}

const gridSize = new Point(960 / cellSize, 540 / cellSize);

/* GameState class*/
class GameState {
    constructor(status = "ready") 
    {
        this.status = status, // ready, playing, over
        this.snakes = [],
        this.walls = [];
        this.apple = new Point(10, 10);
        this.sens = ["H", "V"];
        this.appleSet = 0;
    }

    moveApple() {
        this.apple = new Point(Math.floor(Math.random() * gridSize.x), Math.floor(Math.random() * gridSize.y));
        this.appleSet ++;

        if(this.appleSet > 2 && (this.appleSet % 2) === 0)
        {
            this.addWall(this.sens[Math.floor(Math.random() * this.sens.length)], Math.floor(Math.random() * gridSize.x), Math.floor(Math.random() * gridSize.y));
        }
    }

    addWall(sens, x, y){
        if(sens === "H")
        {
            this.walls.push(new Point(x, y), new Point((x+1), y), new Point((x+2), y));

        } else if (sens === "V")
        {
            this.walls.push(new Point(x, y), new Point(x, (y+1)), new Point(x, (y+2)));
        }
    }

    playGame() {
        console.log("the game starting ");
        this.status = "playing";
        this.snakes.move();
    }

    overGame() {
        if (this.status === "playing") {
            this.status = "over";
        }
    }

    restartGame() {
        if (this.status === "over") {
            this.status = "ready";
        }
    }

    findSnakeById(id) {
        for (const snake of this.snakes) {
            if (id === snake.id) {
                return snake;
            }
        }
    }
}

/* Gamecontroller class */
class GameController {

    /* main function */
    constructor(state) {
        this.gameState = state;
        this.intervalId = 0;
        this.socketToId = new Map();
    }
    
      /* add socket add relatve snake */
    addSocket(socket) {
        if(!this.socketToId.has(socket)){
            this.socketToId.set(socket, idSocket);
            this.gameState.snakes.push(new Snake(idSocket, [new Point(5, (3+(2*idSocket))), new Point(4, (3+(2*idSocket))), new Point(3, (3+(2*idSocket))), new Point(2, (3+(2*idSocket)))], "right"));
            idSocket++;
        }
    }

    /* check if socket allowed */
    isSocketGranted(socket)
    {
        return this.socketToId.has(socket);
    }

    /* get socket id */
    getSocketId(socket)
    {
        return this.socketToId.get(socket)
    }

    /* remove socket and relative snake*/
    removeSocket(socket) {
        const socketIndex = this.socketToId.get(socket);
        this.socketToId.delete(socket);
        for(const snake of this.gameState.snakes){
            if (snake.id === socketIndex){
                const index = this.gameState.snakes.indexOf(snake);
                this.gameState.snakes.splice(index, 1);
                console.log("RemoveSocket ==> socket with SnakeId " + socketIndex + "removed. Now how many snakes = " +  this.gameState.snakes.length);
            }
        }
    }

    /* check opposite direction */
    areOppositeDirections(a, b) {
        return (
            (a === "left" && b === "right") ||
            (a === "right" && b === "left") ||
            (a === "up" && b === "down") ||
            (a === "down" && b === "up")
            );
        }
        
    /* update direction according with keyDown */
    updateDirection(snake, direction) {
        if (!direction) return;
        
        const keyToDirection = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
        };
        
        if (direction in keyToDirection) {
            let nextDirection = keyToDirection[direction];
            if (!this.areOppositeDirections(snake.direction, nextDirection)) 
            {
                /* copie of game state to update snake event | not good :( */
                this.gameState.status = snake.changeDirection(nextDirection, this.gameState);
            }
        }
    }

    
    /* whhen direction received, get snake and update direction */
    onDirectionChangeReceived(socket, message, state) {
        if(this.isSocketGranted(socket) && message.type === "changeDirection"){
            const snake = this.gameState.findSnakeById(this.socketToId.get(socket));
            this.updateDirection(snake, message.direction);
        }
    }

    /* loop */
    Loop() {
        if (this.gameState.status === "playing") {
            this.BroadcastGameState();
        }

        if (this.gameState.status === "ready") {
            this.BroadcastGameState();
        }

        if (this.gameState.status === "over") {
            this.BroadcastGameState()
            this.stopGame();
        }
    }


    /* broadcast gamestate for UI update*/
    BroadcastGameState() {
        for (const [socket, id] of this.socketToId) {
            socket.send(JSON.stringify({gameState: this.gameState}));
        }
    }

    startGame(gameState) {
        this.gameState.status = "playing";
        this.intervalId = setInterval(() => this.Loop(), 100);
    }

    reloadGame(gameState) {
        this.gameState.status = "ready";
        this.intervalId = setInterval(() => this.Loop(), 100);
    }

    stopGame(gameState) {
        this.gameState.status = "over";
        clearInterval(this.intervalId);
    }
}

export {GameState, GameController, Point};