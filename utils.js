dateToReadableString_ = (time) =>
    (('0' + time.getHours()).substr(-2) + ':' +
     ('0' + time.getMinutes()).substr(-2) + ':' +
     ('0' + time.getSeconds()).substr(-2));

exports.printMessage = (message) =>
    '<span style="color:#' + message.color + '">' + message.userID + '@' + dateToReadableString_(message.time) + ' - '  + message.body + '</span>';

exports.printBoldMessage = (message) =>
    '<span style="color:#' + message.color + '"><b>' + message.userID + '@' + dateToReadableString_(message.time) + ' - '  + message.body + '</b></span>';
