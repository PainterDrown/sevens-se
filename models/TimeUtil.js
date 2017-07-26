var moment = require('moment');

var TimeUtil = {
	now: function() {
		return Date.now();
	},

    zero: function() {
    	return 0;  // Date.parse("1970-01-01")
    },

    toTimeString: function (date) {
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    },

    toDateString: function (date) {
        return moment(date).format('YYYY-MM-DD');
    },
};

module.exports = TimeUtil;
