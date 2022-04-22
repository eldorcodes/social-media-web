const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    online:{
        type:Boolean,
        default:false
    },
    avatar:{
        type:String,
        default:'images/user-logo.png'
    }
})
module.exports = mongoose.model('User',userSchema)