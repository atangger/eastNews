const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
var request = require('request');
var async = require('async');


if(cluster.isMaster){


	var sList = new Object();
	sList['sz'] = new Array();
	sList['sh'] = new Array();

	var j = request.jar();

	var workerQueue = new Array();

	var url = "http://so.eastmoney.com/Web/GetSearchList?type=20&pageindex=1&pagesize=10&keyword=%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C";
	var rurl = "http://so.eastmoney.com/Web/GetSearchList";

	var cookie = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=92133183274583; emshistory=%5B%22%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C%22%5D; HAList=a-sh-600000-%u6D66%u53D1%u94F6%u884C%2Ca-sz-300231-%u94F6%u4FE1%u79D1%u6280; em_hq_fls=js; qgqp_b_id=922b4f747742667eaf846dcbe643fe89");
	var cookie2 = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=20587844746725")
	j.setCookie(cookie,url);
	console.log('Master ${process.pid} is running');
	
	fs.readFile('sl.json',function(err,data){

		if(err) return console.error(err);
		var sl = JSON.parse(data);

		var sznum = 0, shnum = 0;
		for(var key in sl['sz']){
			sznum++;
			var stkRec = new Object();
			stkRec['name'] = sl['sz'][key]['name'];
			stkRec['id'] = key;
			sList['sz'].push(stkRec);
		}

		for(var key in sl['sh']){
			shnum++;
			var stkRec = new Object();
			stkRec['name'] = sl['sh'][key]['name'];
			stkRec['id'] = key;
			sList['sh'].push(stkRec);
		}
		console.log('sz num = ' + sznum);
		console.log('sh num = ' + shnum);
		// Fork workers
		var workers = new Array(numCPUs);
		for(let i = 0; i < numCPUs; i ++){
			workers[i] = cluster.fork();
			workers[i].on('message',(m)=>{
				workerQueue.push(workers[i]);
				console.log("Master: message received" + m['chat']);
			});
			workerQueue.push(workers[i]);
		}

		setTimeout(function(){
			console.log("get here");
			for(let i = 0 ; i < numCPUs;i++){
				console.log("message for the " + i + " sended");
				workers[i].send({id: i});
			}
		},3000);

		sList['sz'].forEach(function(item){
			var params = {
	        "type": "20",
	        "pageindex": 1,
	        "pagesize" : "10",
	        "keyword": item['name']
	    	};

			var options = {
		    url: rurl,
		    jar:j,
		    qs: params
		  	};

		  	request(options,function(error,response,body){
		  		console.log("get response!!!");
		  		if(!error&& response.statusCode == 200){
		  			var msg = new Object();
		  			msg['name'] = item['name'];
		  			msg['id'] = item['id'];
		  			msg['pageNum'] = JSON.parse(body)['TotalPage'];
		  			var intl = setInterval(function(){
		  				var freeWorker = workerQueue.shift();
		  				if(typeof(freeWorker) != 'undefined'){
		  					freeWorker.send(msg);
		  					clearTimeout(intl);
		  				}
		  			},1000);
		  		}
		  	});

		});

	});
} else{
	process.on('message',(m)=>{
		console.log(cluster.worker.id+ " received msg : " + m["name"]);
		var pageNum = parseInt(m['pageNum']);
		var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
		var newsUrlList = new Array();
		async.reduce(mapArr,0,function(memo,it,callback){
			if(it == 0) return callback(null,it);

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
	  				newsUrlList = newsUrlList.concat(JSON.parse(body)['Data']);
	  			}
	  			callback(null,it);	
	  		});
		},function(error,result){
			fs.writeFileSync("./urlLists/" + m['id'] + ".json",JSON.stringify(newsUrlList));
			process.send({chat: "hey master, worker" + cluster.worker.id + "one job done!"});
		});
	});
	console.log("worker ${process.pid} started ");
}
