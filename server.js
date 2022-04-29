const express = require('express');
const exphbs = require('express-handlebars');
const http = require('http');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const Handlebars = require('handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const keys = require('./config/keys');
const User = require('./models/User');
const Help = require('./models/Help');
const Post = require('./models/Post');
const Chat = require('./models/Chat');

const { ensureGuest, requireLogin } = require('./helpers/auth');
const { getLastMinute } = require('./helpers/time');
const req = require('express/lib/request');

app.engine('handlebars',exphbs.engine({
    handlebars:allowInsecurePrototypeAccess(Handlebars),
    helpers:{
        getLastMinute
    }
}));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cors());

app.use(cookieParser());
app.use(session({
    secret:'mysecret',
    resave:true,
    saveUninitialized:true
}))
app.use(passport.initialize());
app.use(passport.session());
// make user global
app.use((req,res,next) => {
    res.locals.user = req.user || null;
    next()
})
require('./passport/local');

const port = process.env.PORT || 3000;

// connect server to mongodb
mongoose.connect(keys.MongoURI).then(() => {
    console.log('Connected to MongoDB');
}).catch(e => console.log(e))

app.get('/',ensureGuest,(req, res) => {
    res.render('home',{
        title:'Login'
    });
});
app.get('/signup',ensureGuest, (req, res) => {
    res.render('signup',{
        title:'Register'
    });
});
app.post('/signup',(req,res) => {
    console.log(req.body);
    if (req.body.password !== req.body.confirmPassword) {
        res.render('signup',{
            title:'Error',
            message:'Password Does Not match!'
        })
    }
   User.findOne({email:req.body.email}).then((user) => {
       if (user) {
           res.render('signup',{
               message:'User with email already exist!'
           })
       } else {
        var salt = bcrypt.genSaltSync(10);
        console.log(salt);
        var hash = bcrypt.hashSync(req.body.password, salt);
        console.log(hash);
    
        let newUser = {
            name:req.body.name,
            email:req.body.email,
            password:hash,
            date:new Date(),
            avatar:'images/user-logo.png',
            online:false
        }
        new User(newUser).save().then(() => {
            console.log('User has been created!');
            res.render('home',{
                title:'success',
                message:'Account created. You can login Now'
            })
        }).catch(e => console.log(e))
       }
   })
})
// login POST request
app.post('/login',passport.authenticate('local',{
    failureRedirect:'/errorMsg'
}),(req,res) => {
    res.redirect('/profile')
})
app.get('/errorMsg',ensureGuest,(req,res) => {
    res.render('home',{
        title:'Error',
        message:'Check email and password and try again.'
    })
})
app.get('/profile',requireLogin,(req,res) => {
    User.findById({_id:req.user._id})
    .then((loggedUser) => {
        res.render('profile',{
            loggedUser
        });
    }).catch(e => console.log(e))
});
app.get('/success', (req, res) => {
    res.render('success',{
        title:'Success'
    });
});
app.get('/help',(req,res) => {
    res.render('help',{
        title:'Help'
    })
})
app.post('/help',(req,res) => {
    console.log(req.body);
    let newHelp = {
        name:req.body.name,
        message:req.body.message,
        date:new Date()
    }
    new Help(newHelp).save().then((help) => {
        res.render('helpRequestReceived',{
            title:'Success',
            help
        })
    }).catch(e => console.log(e))
})
app.get('/users',requireLogin,(req,res) => {
    User.find({}).then((users) => {
        res.render('users',{
            users
        })
    }).catch(e => console.log(e))
})
// find user based on _id property
app.get('/userProfile/:id',requireLogin,(req,res) => {
    User.findById({_id:req.params.id}).then((person) => {
        res.render('userProfile',{
            person
        })
    }).catch(e => console.log(e))
})
app.get('/posts',requireLogin,(req,res) => {
    Post.find({}).then((posts) => {
        res.render('posts',{
            posts
        })
    }).catch(e => console.log(e))
})
app.get('/addPost',requireLogin,(req,res) => {
    res.render('postForm')
})
// create a post 
app.post('/createPost',requireLogin,(req,res) => {
    console.log(req.body.title);
    if (!req.body.title || !req.body.body) {
        res.render('postForm',{
            errorMessage:'Please fill out the form!',
            previousTitle:req.body.title,
            previousBody:req.body.body
        })
    } else {
        User.findById({_id:req.user._id})
    .then((user) => {
        let newPost = {
            title:req.body.title,
            body:req.body.body,
            author:req.user._id,
            date:new Date(),
            username:user.name,
            userAvatar:user.avatar ? user.avatar : 'images/user-logo.png',
        }
        new Post(newPost).save().then(() => {
            res.redirect('/posts')
        }).catch(e => console.log(e))
    }).catch(e => console.log(e))
    }
})
// find user and open chat room
app.get('/openChatRoom/:id',requireLogin,(req,res) => {
    Chat.findOne({senderId:req.user._id,receiverId:req.params.id})
    .then((chat) => {
        if (chat) {
            User.findById({_id:req.params.id}).then((otherUser) => {
                res.render('chatRoom',{
                    otherUser,
                    chat,
                    currentUserId:req.user._id
                })
            }).catch(e => console.log(e))
        }else{
            Chat.findOne({senderId:req.params.id,receiverId:req.user._id})
            .then((chat) => {
                if (chat) {
                    User.findById({_id:req.params.id}).then((otherUser) => {
                        res.render('chatRoom',{
                            otherUser,
                            chat,
                            currentUserId:req.user._id
                        });
                    })
                    .catch(e => console.log(e))
                } else {
                    User.findById({_id:req.user._id}).then((currentUser) => {
                        User.findById({_id:req.params.id}).then((otherUser) => {
                            new Chat({
                                sender:currentUser.name,
                                senderId:currentUser._id,
                                receiver:otherUser.name,
                                receiverId:otherUser._id,
                                date: new Date()
                            }).save((err,chat) => {
                                if (err) {
                                    throw err;
                                }
                                if (chat) {
                                    res.render('chatRoom',{
                                        otherUser,
                                        chat,
                                        currentUserId:req.user._id
                                    })
                                }
                            })
                        })
                        .catch(e => console.log(e))
                    })
                    .catch(e => console.log(e))
                }
            }).catch(e => console.log(e))
        }
    }).catch(e => console.log(e))
})
// send message post request


// send chat data to the client
app.post('/chatData',(req,res) => {
    Chat.find({}).then((chats) => {
        res.json(chats)
    }).catch(e => console.log(e))
})

io.on('connection',function(socket){

    Chat.find({}).then((chats) => {
        socket.emit('messages',chats)
    }).catch(e => console.log(e))

    socket.on('newMessage',function(message){
        console.log(message);
        Chat.findOne({senderId:message.currentUserId,receiverId:message.otherUserId})
        .then((chat) => {
            if (chat) {
                chat.messages.push({
                    senderMessage:message.message,
                    receiverMessage:'',
                    senderId:chat.senderId,
                    receiverId:chat.receiverId,
                    sender:chat.sender,
                    receiver:chat.receiver,
                    date:new Date()
                })
                chat.save((err,chat) => {
                    if (err) {
                        throw err;
                    }
                    if (chat) {
                        Chat.find({}).then((chats) => {
                        socket.emit('messages',chats)
                    }).catch(e => console.log(e))
                    }
                })
            } else {
                Chat.findOne({senderId:message.otherUserId,receiverId:message.currentUserId})
                .then((chat) => {
                    chat.messages.push({
                        senderMessage:'',
                        receiverMessage:message.message,
                        sender:chat.sender,
                        receiver:chat.receiver,
                        senderId:chat.senderId,
                        receiverId:chat.receiverId,
                        date:new Date()
                    })
                    chat.save((err,chat) => {
                        if (err) {
                            throw err
                        }
                        if (chat) {
                            Chat.find({}).then((chats) => {
                                socket.emit('messages',chats)
                            }).catch(e => console.log(e))
                        }
                    })
                }).catch(e => console.log(e))
            }
        }).catch(e => console.log(e))
    })
})
app.get('/logout',(req,res) => {
    req.logOut()
    res.redirect('/')
})
server.listen(port,function(){
    console.log(`Server started on port ${port}`);
});