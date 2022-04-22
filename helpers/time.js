const moment = require('moment');

module.exports = {
    getLastMinute:function(date){
        return moment(date).startOf('seconds').fromNow();
    }
}