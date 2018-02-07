const blob = require('./blob.js');
const stream = require(`./stream`);
const request = require('request');

var nl = new Array();

var blob_url = 'https://financestore.blob.core.windows.net:443/twjcontainer/000024.json?st=2018-02-06T03%3A45%3A00Z&se=2019-02-07T03%3A45%3A00Z&sp=r&sv=2017-04-17&sr=b&sig=yzrX19LXvHCLclzr3d4YWrB7EWHgIsm7WMLAfZeHKmQ%3D';
nl.push({name: 'Tom', git :'www.111.com'});
nl.push({name: 'Jack', git : 'www.222.com'});

request(blob_url,function(err,res,bd){
	nl = nl.concat(bd);
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
});