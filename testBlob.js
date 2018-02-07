const blob = require('./blob.js');
const stream = require(`./stream`);
var nl = new Array();

nl.push({name: 'Tom', git :'www.111.com'});
nl.push({look: 'Jack', git : 'www.222.com'});

var Readable = require('stream').Readable;
var s = new Readable();
s.push(JSON.stringify(nl));
s.push(null);

blob.writeStream('twjcontainer', '000024.json',s,(error,response) => {
	if(error){
		console.error('in blob cb error occur!!! for ' + m['name']);
		console.error(error);
	}
	else{
		console.log(response);
	}
});