const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
//Routes
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());




//Use Routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transaction", transactionRoutes);



module.exports = app;
