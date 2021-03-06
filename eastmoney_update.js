const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
//const numCPUs = 1;

const fs = require('fs');
const request = require('request');
const async = require('async');
const blob = require('./blob.js');
const stream = require(`./stream`);
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
	var finNum = 0;
	var workers = new Array(numCPUs);
	for(let i = 0; i < numCPUs; i ++){
		workers[i] = cluster.fork();
		workerQueue.push(workers[i]);

		workers[i].on('message',(m)=>{
			finNum++;
			workerQueue.push(workers[i]);
			console.log("Master: finished job num =" +finNum);
			console.log("Master: message received " +(i+1) +" chat :" + m['chat']);
			if(finNum == sbList.length){
				console.log("Update finished!");
				process.exit();
			}
		});
	}
	stream.create('masterQueue',(item) =>{
		request(item.url,(error,response,body) =>{
			if(!error&& response.statusCode == 200){
				var nl =  JSON.parse(body);
  				var freeWorker = workerQueue.shift();
  				if(typeof(freeWorker) != 'undefined'){

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

  					request(options,function(err,res,bd){
  						if(!error&& response.statusCode == 200){
				  			var rb = JSON.parse(bd);
			  				if(rb['IsSuccess']){
			  					var TotalPage = rb['TotalPage'];
			  					console.log("now the TotalPage = " + TotalPage);
			  					freeWorker.send({name:item['name'],id:item['id'],pageNum:TotalPage,nl:nl});
  								stream.finished('masterQueue');
			  				}
			  				else{
			  					stream.retry('masterQueue',item);
			  				}
			  			}
			  			else{
			  				stream.retry('masterQueue',item);
			  				console.error('Error occur : '+ error);
			  			}
  					});
  				}
  				else{
  					//console.log("get news list for" + item.name + "");
  					stream.retry('masterQueue',item);
  				}
			}
		});
	});
	sbList.forEach((item) =>{
		stream.insert('masterQueue',item);
	});
} else{
	process.on('message',(m)=>{
		console.log("worker" + cluster.worker.id+ ": received msg : " + m["name"]);
		var nl = m['nl'];
		var topDate = 0;
		if(nl.length > 0)
			topDate = Date.parse(nl[0]['Art_CreateTime']);

		var nl_f = new Array();
		var pageNum = parseInt(m['pageNum']);
		var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
		var newsUrlList = new Array();

		var maxReqnum = 1;
		var nowReqnum = 0;
		mapArr.shift();
		var nl_f = new Array();
		var Readable = require('stream').Readable;
		var s = new Readable();
		s.push(JSON.stringify(nl));
		s.push(null);

		var w_interval = setInterval(function(){
			if(nowReqnum < maxReqnum){
				nowReqnum++;
				nowPage = mapArr.shift();
				if(typeof(nowPage) == 'undefined'){
					clearTimeout(w_interval);

					var Readable = require('stream').Readable;
					var s = new Readable();
					s.push(JSON.stringify(nl_f.concat(nl)));
					s.push(null);
					console.log(`mapArr empty!! : worker :${process.pid} + ${(nl_f.concat(nl)).length}`);

					blob.writeStream('twjcontainer',m['id'] + '.json',s,(error,response) => {
						console.log('nl : ' + nl.length +" nl_f : " + nl_f.length);
						if(error){
							console.error('in blob cb error occur!!! for ' + m['name']);
							console.error(error);
						}
						else{
							//console.log(response);
							console.log("worker " + cluster.worker.id + ": finished one job!!!");
							process.send({chat: "hey master, worker" + cluster.worker.id + "one job done! for " + m['name']});
						}
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

			  	request(options,function(error,response,body){
			  		if(!error&& response.statusCode == 200){
			  			var rb = JSON.parse(body);
		  				if(rb['IsSuccess']){
		  					if(rb['Data'] != null){
			  					for(let i = 0; i < rb['Data'].length;i++){
			  						if(Date.parse(rb['Data'][i]['Art_CreateTime']) > topDate){
			  							//console.log("now the date = " +Date.parse(rb['Data'][i]['Art_CreateTime']) + " and topdate = " + topDate);
			  							nl_f.push(rb['Data'][i]);
			  						}
			  						else{
			  							mapArr.splice(0,mapArr.length);
			  						}	
			  					}
		  					}
		  				}
		  				else
		  					mapArr.unshift(nowPage);
		  			}
		  			else{
		  				mapArr.unshift(nowPage);
		  				console.error('Error occur : '+ error);
		  			}
  					nowReqnum--;
			  	});
			}
		},100);
	});
	console.log("worker"+cluster.worker.id+"started");
}

