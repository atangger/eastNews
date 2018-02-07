const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');
//const redis = require('./redis.js');
const stream = require(`./stream`);

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
	stream.create('masterQueue',(item) =>{
		request(item.url,(error,response,body)=>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
  				var freeWorker = workerQueue.shift();
  				if(typeof(freeWorker) != 'undefined'){
  					freeWorker.send({name:item['name'],nl:nl});
  					stream.finished('masterQueue');
  				}
  				else
  					stream.retry('masterQueue',item);
			}
			else{
				stream.retry('masterQueue',item);
				console.error('Unable to get the newsList on blob');
			}
		});
	});

	sbList.forEach((item) =>{
		stream.insert('masterQueue',item);
	});

} else{
	let wFinCnt = 0; 
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]+ "pagesnum =" + m['nl'].length);
		wFinCnt = 0; 
		stream.create('workerQueue',(item) => {
			request(item['Art_Url'],(error,response,body)=>{
				if(!error&& response.statusCode == 200){
					let tmp = item['Art_Url'].split('/');
					blob.writeText('twjcontainerhtml',tmp[tmp.length-1],body,(err,res)=>{
						if(error){
							console.error('in blob callback error occur!!! for ' + m['name']);
							console.error(error);
							stream.retry('workerQueue',item);
						}
						else{
							//console.log(response);
							wFinCnt++;
							//console.log("worker : finishedNum = " + wFinCnt);
							if(wFinCnt == m['nl'].length){
								//wFinCnt = 0;
								console.log("worker " + cluster.worker.id + ": finished one job!!!");
								process.send({chat: "hey master, worker" + cluster.worker.id + "one job done! for " + m['name']});
							}
							stream.finished('workerQueue');
						}
					});
				}
				else
					stream.retry('workerQueue',item);
			});
		});

		m['nl'].forEach((item) =>{
			stream.insert('workerQueue',item);
		});
	});
	console.log("worker"+cluster.worker.id+"started ");
}


