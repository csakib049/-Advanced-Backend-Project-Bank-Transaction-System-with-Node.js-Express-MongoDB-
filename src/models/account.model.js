const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");

const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Account must be associated with a user."],
            index: true,
        },

        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "FROZEN", "CLOSED"],
                message: "Status can be either ACTIVE, FROZEN or CLOSED",
            },
            default: "ACTIVE",
        },

        currency: {
            type: String,
            required: [true, "Currency is required for creating an account."],
            default: "BDT",
        },
    },
    {
        timestamps: true,
    },
);

// compound index
accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this.id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0],
                    },
                },
                totalCredit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            }
        }
    ]);

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[0].balance
};

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
