
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
//const numCPUs=1;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./finance_data_source/pipeline/lib/blob.js');
const stream = require(`./finance_data_source/pipeline/lib/stream`);
const crypto = require('crypto');
const cheerio = require('cheerio');
const colors = require('colors'); 
const sha256 = require('js-sha256');
const redis = require('../lib/redis');
const config = require(`./eastnews_config.js`);

let col=['bgGreen','bgRed','bgYellow','bgBlue','america','bgMagenta','bgCyan','bgWhite'];

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

			if(m['status']==1){
				console.log("Master: message received " +(i+1) +" chat :" + m['chat']);
			}
			else
			{
				//====================================
				// todo
				console.log('length = '+sbList.length);
				sbList.forEach((item)=>{
					if(item['id']==m['id']){
						console.log(`<<<<<<<<<<<<<<<<<<<<<<${item['name']} will be inserted again}`);
						stream.insert('masterQueue',item);
					}
				});

			}
		});
	}
	stream.create('masterQueue',(item) =>{
		request(item.url,(error,response,body)=>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
				if(nl.length == 0 )
					stream.finished('masterQueue');
				else{
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					freeWorker.send({name:item['name'],id:item['id'],nl:nl});
	  					stream.finished('masterQueue');
	  				}
	  				else{
	  					//stream.finished('masterQueue');
	  					//stream.insert('masterQueue',item);
						stream.retry('masterQueue',item);	
	  				}
  				}
			}
			else{
				stream.retry('masterQueue',item);
				console.error('Unable to get the newsList on blob');
			}
		});
	});

	// let testitem={
 //        "id":"300548",
 //        "name":"博创科技",
 //        "url":"https://financestore.blob.core.windows.net:443/twjcontainer/300548.json?st=2018-02-05T08%3A34%3A25Z&se=2019-02-06T08%3A34%3A25Z&sp=r&sv=2017-04-17&sr=b&sig=bgA4J9CeBVxotBQ8cju3IXnA%2F%2FXiPl1DNK1ydXKMJH8%3D"
 //    };
 //    stream.insert('masterQueue',testitem);

	sbList.forEach((item) =>{
		stream.insert('masterQueue',item);
	});

} else{
	let wFinCnt = 0; 
	let errorcnt=0;
	process.on('message',(m)=>{
		let retl;
		retl = new Object();
		
		errorcnt=0;
		console.log(`worker  ${cluster.worker.id} : received msg : ${m["name"]}  pagesnum =  ${m['nl'].length}`[col[cluster.worker.id-1]]);
		
		wFinCnt = 0;
		let nlc = new Array();
		stream.create('workerQueue' + m['id'],(item) => {
			//console.log(`worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} queueSize = ${stream._streams['workerQueue' + m['id']]['new'].length } retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
			request(item['Art_Url'],(error,response,body)=>{
				if(!error&& response.statusCode == 200){
					//console.log(`position1: worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
					let tmp = item['Art_Url'].split('/');
					let cRecord = new Object();
					let hash = crypto.createHash('sha256');
					hash.update(body);

					cRecord['sha'] = hash.digest('hex');
					cRecord['rawHtml'] = body;

					blob.writeText(config.blob_container,'eastmoney/html/'+tmp[tmp.length-1],JSON.stringify(cRecord),(err,res)=>{
						if(err){
							console.error(`in blob callback error occur!!! for worker ${cluster.worker.id}`[col[cluster.worker.id-1]]);
							console.error(JSON.stringify(err)[col[cluster.worker.id-1]]);

							if(typeof(retl[item['Art_Url']]) == 'undefined'){
								retl[item['Art_Url']] = 1;
								stream.retry('workerQueue'+ m['id'],item);
							}
							else{
								if(retl[item['Art_Url']] < 3){
									retl[item['Art_Url']]++;
									stream.retry('workerQueue'+ m['id'],item);
								}
								else{
									errorcnt++;

									if(wFinCnt >= (tmpList.length-errorcnt)){ 	//m['nl'].length
										//wFinCnt = 0;
										//console.log('wFinCnt = ' + wFinCnt );
										var Readable = require('stream').Readable;
										var s = new Readable();
										s.push(JSON.stringify(nlc));
										s.push(null);

										blob.writeStream(config.blob_container,'eastmoney/list/' + m['id'] + '.json',s,(errb,resb) => {
											if(errb){
												console.error(`in blob cb error occur!!! for  ${m['name']}`[col[cluster.worker.id-1]]);
												//console.error(JSON.stringify(errb)[col[cluster.worker.id-1]]);
												// ===============================================todo
												stream.clear('workerQueue' + m['id']);
												process.send({status:0, id:m['id']});
											}
											else{
												console.log(`worker ${cluster.worker.id} finished one job!!!`[col[cluster.worker.id-1]]);
												stream.clear('workerQueue' + m['id']);
												process.send({status:1, chat: "hey master, worker" + cluster.worker.id + "one job done! for " + m['name']});
											}
										});
									}
									stream.finished('workerQueue'+ m['id']);
								}
							}
						}
						else{
							//console.log(response);
							//console.log(`position2: worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
							let inserItems = new Array();
							inserItems.push(res);
							redis.queue.in('qHtmlBlobUrl',inserItems,(err,res)=>{
								if(err)
									console.log('redis queue insert unsuccessfully');
							});
							wFinCnt++;
							let hto = item; 	
							hto['Art_Blob'] = res;
							nlc.push(hto);

							if(wFinCnt%100 == 0){
								console.log(`worker ${cluster.worker.id} : name ${m["name"]} finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} queueSize = ${stream._streams['workerQueue' + m['id']]['new'].length } retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `[col[cluster.worker.id-1]]);
							}
							if(wFinCnt >= (tmpList.length-errorcnt)){ 	//m['nl'].length
								//wFinCnt = 0;
								var Readable = require('stream').Readable;
								var s = new Readable();
								s.push(JSON.stringify(nlc));
								s.push(null);

								blob.writeStream(config.blob_container,'eastmoney/list/'+m['id'] + '.json',s,(errb,resb) => {
									if(errb){
										console.error(`in blob cb error occur!!! for  ${m['name']}`[col[cluster.worker.id-1]]);
										//console.error(JSON.stringify(errb)[col[cluster.worker.id-1]]);
										stream.clear('workerQueue' + m['id']);
										process.send({status:0, id:m['id']});
									}
									else{
										console.log(`worker ${cluster.worker.id} finished one job!!!`[col[cluster.worker.id-1]]);
										stream.clear('workerQueue' + m['id']);
										process.send({status:1, chat: "hey master, worker" + cluster.worker.id + "one job done! for " + m['name']});
									}
								});
							}
							stream.finished('workerQueue' + m['id']);
						}
					});
				}
				else{
					if(typeof(response) == 'undefined'){
						console.log(`worker ${cluster.worker.id} response undefined`[col[cluster.worker.id-1]]);
						console.log(JSON.stringify(error)[col[cluster.worker.id-1]]);						
					}
					else
					{
						if(response.statusCode!=404)
						{
							console.log(`worker ${cluster.worker.id} error!! statusCode : ${response.statusCode}`[col[cluster.worker.id-1]]);
							console.log(JSON.stringify(error)[col[cluster.worker.id-1]]);	
						}
					}
					if(typeof(retl[item['Art_Url']]) == 'undefined'){
						if(typeof(response) != 'undefined')
							retl[item['Art_Url']] = 1;
						else{
							retl[item['Art_Url']] = 3;					
						}
						stream.retry('workerQueue'+ m['id'],item);
						//console.log(`position3: worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
					}
					else{
						if(retl[item['Art_Url']] < 3){
							//console.log(`position4: worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
							retl[item['Art_Url']]++;
							stream.retry('workerQueue'+ m['id'],item);
						}
						else{
							//console.log(`position5: worker ${cluster.worker.id} : finishedNum =  ${wFinCnt} olength = ${tmpList.length} errorcnt = ${errorcnt} retrySize = ${stream._streams['workerQueue' + m['id']]['retry'].length } curConcurrency = ${stream._streams['workerQueue' + m['id']]['curConcurrency']} `);
							errorcnt++;
							if(wFinCnt >= (tmpList.length-errorcnt)){ 	//m['nl'].length
								//wFinCnt = 0;
								//console.log('wFinCnt = ' + wFinCnt );
								var Readable = require('stream').Readable;
								var s = new Readable();
								s.push(JSON.stringify(nlc));
								s.push(null);

								blob.writeStream(config.blob_container,'eastmoney/list/' +m['id'] + '.json',s,(errb,resb) => {
									if(errb){
										console.error(`in blob cb error occur!!! for  ${m['name']}`[col[cluster.worker.id-1]]);
										//console.error(JSON.stringify(errb)[col[cluster.worker.id-1]]);
										stream.clear('workerQueue' + m['id']);
										process.send({status:0, id:m['id']});
									}
									else{
										console.log(`worker ${cluster.worker.id} finished one job!!!`[col[cluster.worker.id-1]]);
										stream.clear('workerQueue' + m['id']);
										process.send({status:1,chat: "hey master, worker" + cluster.worker.id + " one job done! for " + m['name']});
									}
								});
							}

							stream.finished('workerQueue'+ m['id']);
						}
					}
				}
			});
		});
		let tmpCnt = 0;
		let tmpList = m['nl'];
		//console.log(`List length = ${tmpList.length}`);
		tmpList.forEach((item) =>{
			stream.insert('workerQueue'+ m['id'],item);
		});
	});
	console.log("worker"+cluster.worker.id+"started ");
}