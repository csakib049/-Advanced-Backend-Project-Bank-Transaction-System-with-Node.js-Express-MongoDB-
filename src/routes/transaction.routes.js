const { Router } = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");



const transactionRoutes = Router();


/*
- POST /api/transaction/
- Create a new transaction 
*/

transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction);

/**
 * -POST /api/transaction/system/initial-funds
 * -Create initial funds transaction from system use 
 */

transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)




module.exports = transactionRoutes;