const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");


/**
 * * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 *   1. Validate request
 *   2. Validate idempotency key
 *   3. Check account status
 *   4. Derive sender balance from ledger
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry
 *   7. Create CREDIT ledger entry
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *   10. Send email notification
 */





async function createTransaction(req, res) {


    //1.valid request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body


    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAcccount , toAcccount , Amount and idempotencyKey is required"
        })
    }


    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })



    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }



    //2.Validate idempotency key 

    
    const isTransacrionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey  //A unique key sent with a request to ensure the same operation isn't applied twice.
    })


    if (isTransacrionAlreadyExists) {

        if (isTransacrionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransacrionAlreadyExists
            })
        }


        if (isTransacrionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",

            })
        }


        if (isTransacrionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed previously , please try again."
            })
        }


        if (isTransacrionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed , please retry. "
            })
        }


    }



    //3. check account status 

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both FromAccount or ToAccount must be Active for transaction."
        })
    }


    //4.Derive sender balance from ledger

    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficcient balance.Current balance is ${balance}.Requested amount is ${amount}.`
        })
    }


    let transaction;

    try {



        //5. Create transaction (PENDING)

        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = await transactionModel.create({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }, { session })



        const debitLedgerEntry = await ledgerModel.create({
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }, { session })



        const creditLedgerEntry = await ledgerModel.create({
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }, { session })


        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )


        transaction.status = "COMPLETED"
        await transaction.save({ session })



        await session.commitTransaction()
        session.endSession()

    } catch (error) {
        return res.status(400).json({
            message: "Transaction is Pending due to some issue , please try after some time.",

        })

    }

    //10. Send email notification

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)


    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction
    })

}


async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount , amount and idempotencyKey are requried"
        })
    }


    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })


    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }



    const fromUserAccount = await accountModel.findOne({
        systemUser: true,
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found."
        })
    }



    const session = await mongoose.startSession()
    session.startTransaction()


    const transaction = (await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session }))[0]


    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })


    await (() => {
        return new Promise((resolve) =>
            setTimeout(resolve, 100 * 1000)
        );
    })();



    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })



    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()


    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })



}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}