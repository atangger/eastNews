const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if(cluster.isMaster){
	console.log('Master: Master is running');
	// Fork workers
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();

		workers[i].on('message',(m)=>{
			console.log("Master: message received" + m['chat']);
		});
	}
	setTimeout(function(){
		for(let i = 0 ; i < numCPUs;i++){
			console.log("Master: message for the " + i + " sended");
			workers[i].send({id: i});
		}
	},3000);

} else{
	process.on('message',(m)=>{
		console.log("worker" + process.pid + ": received msg : " + m["id"]);
		process.send({chat: "hey master worker"+process.pid +" get the message!"});
	});
	console.log("worker ${process.pid}: started ");
}
