const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const request = require('request');
const blob = require('./blob.js');
const stream = require(`./stream`);

var workerQueue = new Array();
var bList = new Array();

var j = request.jar();
var url = "http://so.eastmoney.com/Web/GetSearchList?type=20&pageindex=1&pagesize=10&keyword=%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C";
var rurl = "http://so.eastmoney.com/Web/GetSearchList";

var cookie = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=92133183274583; emshistory=%5B%22%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C%22%5D; HAList=a-sh-600000-%u6D66%u53D1%u94F6%u884C%2Ca-sz-300231-%u94F6%u4FE1%u79D1%u6280; em_hq_fls=js; qgqp_b_id=922b4f747742667eaf846dcbe643fe89");
var cookie2 = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=20587844746725")
j.setCookie(cookie,url);


if(cluster.isMaster){

	var blobList = new Array();
	var sList = new Object();
	sList['sz'] = new Array();
	sList['sh'] = new Array();
	console.log(`Master ${process.pid} is running`);
	
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
		var sListWhole = new Array();
		sListWhole = sList['sz'].concat(sList['sh']);
		// Fork workers
		var workers = new Array(numCPUs);
		var finNum = 0;
		for(let i = 0; i < numCPUs; i ++){
			workers[i] = cluster.fork();
			workers[i].on('message',(m)=>{
				workerQueue.push(workers[i]);
				finNum++;
				console.log("Master: message received: " + m['chat']);
				console.log("Master: finished job num =" +finNum);
				bList.push(m['br']);
				if(finNum == shnum+sznum){
					fs.writeFileSync('bList.json',JSON.stringify(bList));
					console.log("bList write done!");
					process.exit();
				}
			});
			workerQueue.push(workers[i]);
		}

		stream.create('masterQueue',(item) =>{
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
			
			request(options,(error,response,body)=>{
				if(!error&& response.statusCode == 200){
		  			var msg = new Object();
		  			msg['name'] = item['name'];
		  			msg['id'] = item['id'];
		  			msg['pageNum'] = JSON.parse(body)['TotalPage'];
		  			if(!JSON.parse(body)['IsSuccess'])
		  			{
		  				console.log("DEBUG<<<<Request for firstPage failed. Try again.>>>>");
		  				stream.retry('masterQueue',item);
		  				return;
		  			}
	  				var freeWorker = workerQueue.shift();
	  				if(typeof(freeWorker) != 'undefined'){
	  					console.log('master send message pageNum = ' + msg['pageNum']);
	  					freeWorker.send(msg);
	  					stream.finished('masterQueue');
	  				}
	  				else{
	  					stream.retry('masterQueue',item);
	  				}
				}
				else{
					stream.retry('masterQueue',item);
					console.error('Unable to get the first page');
				}
			});
		});

		sListWhole.forEach((item) =>{
			if(item['name'] == '同辉100A')
				stream.insert('masterQueue',item);
		});


		/*
		//var debugcnt = 300;
		sListWhole.forEach(function(item){
			//debugcnt--;
			//if(debugcnt<0) return;

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

		  	var interval = setInterval(function(){
			  	request(options,function(error,response,body){
			  		//console.log("Master: get response, statusCode = " + response.statusCode);
			  		if(!error&& response.statusCode == 200){
			  			var msg = new Object();
			  			msg['name'] = item['name'];
			  			msg['id'] = item['id'];
			  			msg['pageNum'] = JSON.parse(body)['TotalPage'];
			  			if(!JSON.parse(body)['IsSuccess'])
			  			{
			  				console.log("DEBUG<<<<Request for firstPage failed. Try again.>>>>")
			  				return;
			  			}
			  			clearTimeout(interval);
			  			var intl = setInterval(function(){
			  				var freeWorker = workerQueue.shift();
			  				if(typeof(freeWorker) != 'undefined'){
			  					console.log('master send message pageNum = ' + msg['pageNum']);
			  					freeWorker.send(msg);
			  					clearTimeout(intl);
			  				}
			  			},100);
			  		}
			  	});
		  	},1000)


		});
		*/

	});
} else{
	process.on('message',(m)=>{
		console.log(cluster.worker.id+ " received msg : " + m["name"]);
		var pageNum = parseInt(m['pageNum']);
		var mapArr = Array.apply(null,Array(pageNum+1)).map(function (_, i) {return i;});
		var newsUrlList = new Array();
		var unorderList = new Array();
		var maxReqNum = 60;
		var nowReqNum = 0;

		mapArr.shift();
		var w_interval = setInterval(function(){
			if(nowReqNum < maxReqNum){
				nowReqNum++;
				console.log(`nowReqNum = ${nowReqNum} mapArr.length = ${mapArr.length} `);
				var nowPage = mapArr.shift();
				if(typeof(nowPage) == 'undefined'){
					nowReqNum--;
					return;
				}
				if(typeof(nowPage) == 'undefined' && nowReqNum == 0){
					clearTimeout(w_interval);

					for(let i = 1; i <= pageNum;i++ ){
						if(unorderList[i] != null)
							newsUrlList = newsUrlList.concat(unorderList[i]);
					}

					//fs.writeFileSync("./urlLists/" + m['id'] + ".json",JSON.stringify(newsUrlList));
					console.log("worker " + cluster.worker.id + ": finished one job for " + m['name'] + 'news num = ' + newsUrlList.length);
					var blobrecords = new Object();
					blobrecords['id'] = m['id'];
					blobrecords['name'] = m['name'];
					var Readable = require('stream').Readable;
					var s = new Readable();
					s.push(JSON.stringify(newsUrlList));
					s.push(null);

					blob.writeStream('twjcontainer',m['id'] + '.json',s,(error,response) =>{
						//console.log('the JSON length = ' + JSON.stringify(newsUrlList).length);
						if(error){
							console.log('Blob: error occur!!!');
							console.log(error);
						}
						else
							blobrecords['url'] = response;
						process.send({chat: "hey master, worker " + cluster.worker.id + " one job for " + m['name'] +" done!",br:blobrecords});
					});
					return;
				}
				var params = {
		        "type": "20",
		        "pageindex": nowPage,
		        "pagesize" : "10",
		        "keyword": m["name"]
		    	};

				var options = {
			    url: rurl,
			    jar:j,
			    qs: params,
			    headers:
			    {
			    	connection:'keep-alive'
			    }
			  	};
			  	console.log('<<<<<<<sending request>>>>>>>');
			  	request(options,function(error,response,body){
			  		if(!error&& response.statusCode == 200){
			  			var rb = JSON.parse(body);
		  				if(rb['IsSuccess']){
		  					console.log('<<<<<<<great>>>>>>>');
		  					unorderList[nowPage] = JSON.parse(body)['Data'];
		  				}
		  				else{
		  					console.error('<<<<<<<RETRY :>>>>>>>');
		  					mapArr.push(nowPage);
		  				}
		  			}
		  			else{
		  				mapArr.push(nowPage);
		  				console.error('Error occur : '+ error);
		  			}
  					nowReqNum--;
			  	});
			}
		},100);
	});
	console.log(`worker ${cluster.worker.id} started`);
}
