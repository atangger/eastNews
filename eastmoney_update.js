const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');

var workerQueue = new Array();

var sbList =JSON.parse(fs.readFileSync('bList.json'));

var j = request.jar();
var url = "http://so.eastmoney.com/Web/GetSearchList?type=20&pageindex=1&pagesize=10&keyword=%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C";
var rurl = "http://so.eastmoney.com/Web/GetSearchList";

var cookie = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=92133183274583; emshistory=%5B%22%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C%22%5D; HAList=a-sh-600000-%u6D66%u53D1%u94F6%u884C%2Ca-sz-300231-%u94F6%u4FE1%u79D1%u6280; em_hq_fls=js; qgqp_b_id=922b4f747742667eaf846dcbe643fe89");
var cookie2 = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=20587844746725")
j.setCookie(cookie,url);

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

	//var dcnt= 100;
	sbList.forEach((item) =>{
		if(item.pageNum == 0 ) return;
		/*
		if(dcnt ==0) return;
		dcnt--;
		*/
		request(item.url,(error,response,body) =>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
	  			var intl = setInterval(function(){
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					freeWorker.send({name:item.name,pageNum:item.pageNum,nl:nl});
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
		var topDate = Date.parse(nl[0]['Art_CreateTime']);
		var nl_f = new Array();
		var pageNum = parseInt(m['pageNum']);
		while(pageNum >1000)
			pageNum =  Math.floor(pageNum/2);

		var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
		var newsUrlList = new Array();

		var fflag = 0;
		async.reduce(mapArr,0,function(memo,it,callback){ // TODO: see if map works
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
	  				if(nowList == null){
	  					console.log("the body = " + body +"\n" + 'it  = ' + it);
	  					return;
	  				}
	  				nowList.forEach((aitem) =>{
	  					if(Date.parse(aitem['Art_CreateTime']) > topDate)
	  						nl_f.push(aitem);
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

				blob.dump('twjcontainer',m['id'] + '.json',JSON.stringify(nl_f.concat(nl)),(error,response) => {
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

