const { default: mongoose } = require("mongoose");

let Schema = mongoose.Schema;

let helpSchema = new Schema({
    name:{
        type:String
    },
    message:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Help',helpSchema)