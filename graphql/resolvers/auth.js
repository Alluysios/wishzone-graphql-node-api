const validator = require('validator');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../../middleware/auth');

const sendToken = (user) => {
    // Get user id
    const { _id } = user;

    // JWT Sign for token
    const token = jwt.sign({ _id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Remove password from the output
    user.password = undefined;

    return {
        ...user._doc,
        id: user._id,
        token
    }
}

module.exports = {
    Query: {
        async authorize(_, {}, context) {
            const user = await protect(context);
            
            if(!user) throw new Error('You are not authorized. Please logged in.')
            return {
                id: user._id,
                ...user
            };
        }
    },
    Mutation: {
        async login(_, { loginInput: { email, password }}) {
            // VALIDATE
            if(validator.isEmpty(email) || validator.isEmpty(password)) throw new Error('Incorrect email or password.');
            
            const user = await User.findOne({ email }).select('+password');
            if(!user) throw new Error('Incorrect email or password.');

            if(!user || !await user.comparePassword(password, user.password)) throw new Error('Incorrect email or password.')
            
            return sendToken(user);
        },
        async register(_, {
            registerInput: { firstname, lastname, email, password, passwordConfirm }
        }) {
            // VALIDATE
            const checkUser = await User.findOne({ email });
            if(checkUser) throw new Error('Email already exist.');

            if(!validator.isEmail(email)) throw new Error('Must be an email');

            if(
                validator.isEmpty(firstname) || 
                validator.isEmpty(lastname) || 
                validator.isEmpty(email) || 
                validator.isEmpty(password) || 
                validator.isEmpty(passwordConfirm)
            ) {
                throw new Error('Empty fields are required.')
            }

            if(password !== passwordConfirm) throw new Error('password not the same')

            const user = await User.create({
                firstname,
                lastname,
                email,
                password
            })
            
            return sendToken(user);
        }
    }
}