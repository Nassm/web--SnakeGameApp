//const Snake = require('./snake.js')
import path from "path"

/*
function add(x, y)
{
    if(typeof x === "undefined"){
        throw new Error("Requires arguments");

    }
    return x+y
}

*/

const add = (x, y) => x + y;

const sayHi =  (name = []) => 
{
    for (const n of name)
    {
        console.log(`hello ${n}`);
    }

    for(let i = 0; i<5; ++i)
    {
        console.log(i, typeof i);
    }
}

const x = 2;
const array = [1, 2, 3];

const obj = {
    name : "elisee",
    town : "burnigham",
    hello : () => 1+2
};

//let snake = new Snake('toto', 4, 1);


/* --------- TEST --------- */

console.log(add(1,3));
console.log(add());
sayHi(["me", "you"]);
console.log("basename", path.posix.basename('/client/client.html'));

try {
    x.hello();
} catch(error){
    console.log(`erreur ${error}`);
}

/*
console.log(obj.name);
console.log(obj.hello());
snake.sayName();7*/