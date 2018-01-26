const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');

var testj =  {name:'weijie tang'};
var workerQueue = new Array();

var sbList =JSON.stringify(fs.readFileSync('bList.json');

blob.dump('twjcontainer','test.json',JSON.stringify(testj),(error,response) => {
	if(error){
		console.log('error occur!!!');
		console.log(error);
	}
	else
		console.log(response);
});

if(cluster.isMaster){
	console.log('Master: Master is running');
	// Fork workers
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();
		workerQueue.push(workers[i]);

		workers[i].on('message',(m)=>{
			console.log("Master: message received " +(i+1) +" chat :" + m['chat']);
		});
	}

	sbList.forEach((item) =>{
		request(item.url,(error,response,body) =>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
	  			var intl = setInterval(function(){
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					freeWorker.send({name:item.name,pageNum:item.pageNum,nl:nl});
	  					clearTimeout(intl);
	  				}
	  			},1000);
			}
		});
	});
} else{
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]);
		var nl = m['nl'];
		var topDate = Date.parse(nl[0]['Art_CreateTime']);

		var pageNum = parseInt(m['pageNum']);

		var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
		var newsUrlList = new Array();

		var fflag = 0;
		async.map(mapArr,function(it,callback){ // TODO: see if map works
			if(it == 0||fflag==1) return callback(null,it);

			var params = {
	        "type": "20",
	        "pageindex": it,
	        "pagesize" : "10",
	        "keyword": m["name"]
	    	};

			var options = {
		    url: rurl,
		    jar:j,
		    qs: params
		  	};

		  	request(options,function(error,response,body){
	  			if(!error&& response.statusCode == 200){
	  				var nowList = JSON.parse(body)['Data'];
	  				nowList.forEach((aitem) =>{
	  					if(Date.parse(aitem['Art_CreateTime']) > topDate)
	  						nl.ushift(aitem);
	  					else
	  						fflag = 1;
	  				});
	  			}
	  			else{
	  				console.error(error);
	  			}
	  			callback(null,it);	
	  		});
		},function(err,result){
			if(err){
				console.error(err);
				process.send({chat: "hey master, worker" + cluster.worker.id + "had error!!!!"});
			}
			else{
				fs.writeFileSync("./urlLists/" + m['id'] + ".json",JSON.stringify(newsUrlList));

				blob.dump('twjcontainer',m['id'] + '.json',JSON.stringify(nl),(error,response) => {
					if(error){
						console.error('in blob cb error occur!!!');
						console.error(error);
					}
					else{
						//console.log(response);
						console.log("worker " + cluster.worker.id + ": finished one job!!!");
						process.send({chat: "hey master, worker" + cluster.worker.id + "one job done!"});
					}
				});
			}
		});
	});
	console.log("worker"+cluster.worker.id+"started");
}

