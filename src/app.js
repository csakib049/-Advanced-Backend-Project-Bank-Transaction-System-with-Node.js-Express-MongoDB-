const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth.routes");
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());



app.use("/api/auth", authRouter);




module.exports = app;
