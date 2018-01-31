const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');
const redis = require('./redis.js');
let inqueueValues = [
{
  url: 'http://123.html',
  fingerprint: '12345'
},
{
  url: 'http://234.html',
  fingerprint: '23445'
}
];

redis.clearAll((err) =>{
	if(!err)
		console.log('clear Done');
});

redis.queue.in('testQueue',JSON.stringify(inqueueValues),(err,res) =>{
	if(err)
		console.error('in: error occur');
	else
		console.log('in: succeddfully done' + res);
});

redis.queue.out('testQueue',(err,res) =>{
	if(err)
		console.error('out: error occur');
	else
		console.log('out: successfully done!' + JSON.parse(res)['fingerprint']);
});

var sbList =JSON.parse(fs.readFileSync('bList.json'));

if(cluster.isMaster){
	console.log('Master: Master is running');
	// Fork workers
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();
		workers[i].on('message',(m)=>{
			console.log("Master: message received " +(i+1) +" chat :" + m['chat']);
			receivenum++;
			if(receivenum == numCPUs){
				process.exit();
			}
		});
	}
	sbList.forEach((item) => {
		if(item.pageNum == 0 ) return;
		if(dcnt ==0) return;
		dcnt--;
		request(item.url,(error,response,body) =>{
			if(!error&& response.statusCode == 200){
				var nl =  itJSON.parse(body);
	  			var intl = setInterval(function(){
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					freeWorker.send({name:item.name,pageNum:item.pageNum,nl:nl});
	  					clearTimeout(intl);
	  				}
	  			},100);
			}
		});
	})
	setTimeout(function(){
		for(let i = 0 ; i < numCPUs;i++){
			console.log("Master: message for the " + i + " sended");
			workers[i].send({id: i+1});
		}
	},3000);

} else{
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]);
		async.map(nl,function(it,done){
			request()
		},function(err,result){

		});
		process.send({chat: "hey master worker" + cluster.worker.id + " get the message!"});

	});
	console.log("worker"+cluster.worker.id+"started ");
}


