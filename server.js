// @ts-check
//save in devDependencies
//npm install  --save-dev @types/express
const express = require("express");
const app = express();



app.use("/", (req, res, next) => {
    res.send("express server");
});

app.get("/hello", (req, res, next) => {
    res.send("hello response");
});

// Server setup 
app.listen(3000, () => { 
    console.log("Server is Running"); 
})
// Serve everything inside the "public" folder at the root URL
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

//if i wanted an auth check for a directory of sites i just add a middleware function for each request in a specific path