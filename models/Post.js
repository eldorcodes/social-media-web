const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title:{
        type:String
    },
    body:{
        type:String
    },
    author: {
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    date:{
        type:Date,
        default:Date.now
    },
    username:{
        type:String
    },
    userAvatar:{
        type:String
    }
})

module.exports = mongoose.model('Post',postSchema);