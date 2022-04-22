
$(document).ready(function(){
    let socket = io()
    // write jquery code
    // jquery ends here

    let otherUserId = $('#otherUserId').val();
    let currentUserId = jQuery('#currentUserId').val();

    console.log(otherUserId);
    console.log(currentUserId);

    let chatRoom = $('#chatroom');

    socket.on('connect',function(){
        console.log('client is connected');
    })
    socket.on('messages',function(data){
        console.log('SOCKET MESSAGES', data);

        let senderChat = data.filter(chat => {
            return chat.senderId === currentUserId && chat.receiverId === otherUserId
        })

        let receiverChat = data.filter(chat => {
            return chat.senderId === otherUserId  && chat.receiverId === currentUserId
        })

       // console.log(senderChat);
        if (senderChat.length !== 0) {
           // console.log('CURRENT USER IS SENDER',senderChat);
            senderChat[0].messages.forEach(message => {
                //console.log('SENDER IS CURRENT USER',message);
                // create div element with class of right-message
                let rightMessageDiv = $('<div></div>');
                rightMessageDiv.addClass('right-message');
                
               // create div for date
               let rightMessageDiv2 = $('<div></div>');
               rightMessageDiv2.addClass('right-message');
               // create paragraph element for message
               let messagePtag = $('<p></p>');
               messagePtag.addClass('right-msg');
               if (message.senderMessage !== '') {
                messagePtag.text(message.senderMessage);
                messagePtag.css('backgroundColor','blue')
                messagePtag.css('color','white')
               }
               // create small tag for date
               let date = $('<small></small>');
               date.addClass('date');
               if (message.senderMessage !== '') {
                date.text(moment(message.date).startOf('seconds').fromNow());
               } else{
                   date.text('')
               }
               // setup condition
               // append div and p
               rightMessageDiv.append(messagePtag);
               rightMessageDiv2.append(date);
                
                // create div for receiver message 
                let leftMessageDiv = $('<div></div>');
                leftMessageDiv.addClass('left-message');

                  // create left message p element
                  let leftMessageTag = $('<p></p>');
                  
                  leftMessageTag.addClass('left-msg');

                  // create left div for receiver date
                  let leftDateDiv = $('<div></div>');
                  leftDateDiv.addClass('left-message');
                  // create small tag for receiver date
                 let smallTag = $('<small></small>');
                 smallTag.addClass('date');

                if (message.receiverMessage !== '') {
                    leftMessageTag.text(message.receiverMessage);
                    leftMessageTag.css('backgroundColor','purple')
                    leftMessageTag.css('color','white')
                    smallTag.text(moment(message.date).startOf('seconds').fromNow());
                }else{
                    smallTag.text('')
                }

                leftMessageDiv.append(leftMessageTag);
                leftDateDiv.append(smallTag)
                // append main chat room
                chatRoom.append(rightMessageDiv);
                chatRoom.append(rightMessageDiv2);
                chatRoom.append(leftMessageDiv);
                chatRoom.append(leftDateDiv);

            });
        } 
        if (receiverChat.length !== 0) {
           // console.log('CURRENT USER IS RECEIVER',receiverChat);
            receiverChat[0].messages.forEach(message => {
               // console.log('RECEIVER IS CURRENT USER', message);
                 // create div element with class of right-message
                 let rightMessageDiv = $('<div></div>');
                 rightMessageDiv.addClass('right-message');
                
                // create div for date
                let rightMessageDiv2 = $('<div></div>');
                rightMessageDiv2.addClass('right-message');
                // create paragraph element for message
                let messagePtag = $('<p></p>');
                messagePtag.text(message.receiverMessage);
                messagePtag.addClass('right-msg');

                if (message.receiverMessage !== '') {
                    messagePtag.text(message.receiverMessage);
                    messagePtag.css('backgroundColor','blue')
                    messagePtag.css('color','white')
                   }
                // create small tag for date
                let date = $('<small></small>');
                date.addClass('date');
                date.text(message.date);

                if (message.receiverMessage !== '') {
                    date.text(moment(message.date).startOf('seconds').fromNow());
                   } else{
                       date.text('')
                   }
                // append div and p
                rightMessageDiv.append(messagePtag);
                rightMessageDiv2.append(date);
                 


                 // create div for receiver message 
                 let leftMessageDiv = $('<div></div>');
                 leftMessageDiv.addClass('left-message');

                   // create left message p element
                   let leftMessageTag = $('<p></p>');
                   leftMessageTag.addClass('left-msg');

                   // create left div for receiver date
                   let leftDateDiv = $('<div></div>');
                   leftDateDiv.addClass('left-message');
                   // create small tag for receiver date
                  let smallTag = $('<small></small>');
                  smallTag.text(message.date);
                  smallTag.addClass('date');

                  if (message.senderMessage !== '') {
                    leftMessageTag.text(message.senderMessage);
                    leftMessageTag.css('backgroundColor','purple')
                    leftMessageTag.css('color','white')
                    smallTag.text(moment(message.date).startOf('seconds').fromNow());
                }else{
                    smallTag.text('')
                }

                 leftMessageDiv.append(leftMessageTag);
                 leftDateDiv.append(smallTag)
                 // append main chat room
                 chatRoom.append(rightMessageDiv);
                 chatRoom.append(rightMessageDiv2);
                 chatRoom.append(leftMessageDiv);
                 chatRoom.append(leftDateDiv);
            })
        }
        $('#chatroom').animate({scrollTop:100000},800)
    })

    // get data from server
    $.ajax({
        type:'POST',
        url:'/chatData',
        dataType:'json',
        success:function(data){
           console.log('jquery messages',data);
        }
    })

    // sends button
    let btn = $('#send-btn');
    btn.on('click',function(){
        let input = $('#message').val()
        socket.emit('newMessage',{
            message:input,
            currentUserId,
            otherUserId
        })
        $('#message').val('')
    })
})