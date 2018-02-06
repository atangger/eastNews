const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');
const redis = require('./redis.js');

const sha256 = require('js-sha256');

var workerQueue = new Array();

var sbList =JSON.parse(fs.readFileSync('bList.json'));

if(cluster.isMaster){
	console.log('Master: Master is running');
	// Fork workers
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();
		workerQueue.push(workers[i]);

		workers[i].on('message',(m)=>{
			workerQueue.push(workers[i]);
			console.log("Master: message received " +(i+1) +" chat :" + m['chat']);
		});
	}
	sbList.forEach((item) => {
		if(item.pageNum == 0 ) return;
		request(item.url,(error,response,body) =>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
	  			var intl = setInterval(function(){
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					freeWorker.send({name:item.name,id:item.id,pageNum:item.pageNum,nl:nl});
	  					clearTimeout(intl);
	  				}
	  			},100);
			}
		});
	});	
} else{
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]);
		var nl = m['nl'];
		async.reduce(nl,0,function(memo,it,done){
			if(it == null) 
				return done();
			request(it['Art_Url'],(error,response,body)=>{
				blob.dump('twjhtmlcontainer', m['id']+it['Art_CreateTime'] + '.html',body,(error,response) =>{
					if(error){
						console.log('error occur!!!');
						console.log(error);
					}
					done();
				});
			});
		},function(err,result){
			if(err){
				console.error("in the map error occur!!!");
				process.send({chat: "hey master, worker" + cluster.worker.id + "one job error occur!!!!!"});
			}
			else
				process.send({chat: "hey master, worker" + cluster.worker.id + "one job done for"+ m['name']});
		});
		process.send({chat: "hey master, worker" + cluster.worker.id + "one job done!"});
	});
	console.log("worker"+cluster.worker.id+"started ");
}


