const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

var receivenum = 0;
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
				// for(let j = 0; j <numCPUs;j++){
				// 	workers[i].send()
				// }
				
				process.exit();
			}
		});
	}
	setTimeout(function(){
		for(let i = 0 ; i < numCPUs;i++){
			console.log("Master: message for the " + i + " sended");
			workers[i].send({id: i+1});
		}
	},3000);

} else{
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["id"]);
		process.send({chat: "hey master worker" + cluster.worker.id + " get the message!"});
	});
	process.on('exit',(m,s)=>{
		console.log("worker" + cluster.worker.id+ ": received msg to die ");
		process.exit();
	})
	console.log("worker"+cluster.worker.id+"started ");
}
