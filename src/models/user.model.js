const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required. "],
        unique: [true, "Email must be unique"],
        trim: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid email address",
        ]
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: [true, "Name must be unique"],
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "password should contain more than 6 character."],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, {
    timestamps: true
});



userSchema.pre("save", async function (next) {

    //if password is not changed or  not modified --> next()
    if (!this.isModified("password")) {
        return
    }


    // if password is changed then save  the hashed form into this.password
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;


    return
})





userSchema.methods.comparePassword = async function (password) {


    return await bcrypt.compare(password, this.password);
};



const userModel = mongoose.model("User", userSchema);

module.exports = userModel;