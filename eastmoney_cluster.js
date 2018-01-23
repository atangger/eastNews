const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if(cluster.isMaster){
	console.log('Master ${process.pid} is running');
	// Fork workers
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();
	}
	setTimeout(function(){
		console.log("get here");
		for(let i = 0 ; i < numCPUs;i++){
			console.log("message for the " + i + " sended");
			workers[i].send({id: i});
		}
	},3000);

} else{
	process.on('message',(m)=>{
		console.log(process.pid + " received msg : " + m["id"]);
	});
	console.log("worker ${process.pid} started ");
}
