const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");


async function authMiddleware(req, res, next) {

    //This line is trying to get a JWT token from either cookies or headers.
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];


    if (!token) {
        return res.status(401).json({
            message: "Unathorized access, token is missing."
        })
    }
                   


    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await userModel
            .findById(decoded.userID);
            

        req.user = user;

        next()


    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}


module.exports = {
    authMiddleware
}