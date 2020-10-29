const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'user'
    },
    firstname: {
        type: String,
        max: 32
    },
    lastname: {
        type: String,
        max: 32
    },
    email: {
        type: String,
        unique: true
    },
    image: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        min: 6,
        max: 16
    },
    date: {
        type: Date,
        default: Date.now
    }
});

userSchema.methods.comparePassword = async function(passwordInput, userPassword) {
    return await bcrypt.compare(passwordInput, userPassword);
}

userSchema.pre('save', async function(next) {
    // Run if password is modified
    if(!this.isModified('password')) return next;
    // Hash the password cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;