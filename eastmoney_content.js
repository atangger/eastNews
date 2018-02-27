const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');
//const redis = require('./redis.js');
const stream = require(`./stream`);
const crypto = require('crypto');
const cheerio = require('cheerio');

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
  					if(nl.length != 0)
  						freeWorker.send({name:item['name'],id:item['id'],nl:nl});
  					stream.finished('masterQueue');
  				}
  				else{
  					stream.finished('masterQueue');
  					stream.insert('masterQueue',item);
  				}
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
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]+ "pagesnum = " + m['nl'].length);
		wFinCnt = 0;
		let nlc = new Array();
		stream.create('workerQueue' + m['id'],(item) => {
			request(item['Art_Url'],(error,response,body)=>{
				if(!error&& response.statusCode == 200){
					let tmp = item['Art_Url'].split('/');
					let cRecord = new Object();
					let hash = crypto.createHash('sha256');
					hash.update(body);

					cRecord['sha'] = hash.digest('hex');
					cRecord['rawHtml'] = body;

					blob.writeText('twjcontainerhtml',tmp[tmp.length-1],JSON.stringify(cRecord),(err,res)=>{
						if(error){
							console.error('in blob callback error occur!!! for ' + m['name']);
							console.error(error);
							stream.retry('workerQueue' + m['id'],item);
						}
						else{
							//console.log(response);
							wFinCnt++;
							let hto = item;
							hto['Art_Blob'] = res;
							nlc.push(hto);

							if(wFinCnt%100 == 0){
								console.log(`worker ${cluster.worker.id} now interval : ${stream._streams['workerQueue' + m['id']]['interval']}`);
								console.log(`worker ${cluster.worker.id} : finishedNum =  ${wFinCnt}`);
							}
							if(wFinCnt >= 300){ 
								//wFinCnt = 0;
								var Readable = require('stream').Readable;
								var s = new Readable();
								s.push(JSON.stringify(nlc));
								s.push(null);

								blob.writeStream('twjcontainer',m['id'] + '.json',s,(error,response) => {
									if(error){
										console.error('in blob cb error occur!!! for ' + m['name']);
										console.error(error);
									}
									else{
										console.log("worker " + cluster.worker.id + ": finished one job!!!");
										process.send({chat: "hey master, worker" + cluster.worker.id + "one job done! for " + m['name']});
									}
								});
							}
							stream.finished('workerQueue' + m['id']);
						}
					});
				}
				//else
					//stream.retry('workerQueue'+ m['id'],item);
			});
		});
		let tmpCnt = 0;
		m['nl'].forEach((item) =>{
			stream.insert('workerQueue'+ m['id'],item);
		});
	});
	console.log("worker"+cluster.worker.id+"started ");
}


