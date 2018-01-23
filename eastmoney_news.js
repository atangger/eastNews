var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');
var pinyin = require('pinyin');

var sList = new Object();
sList['sz'] = new Array();
sList['sh'] = new Array();

var j = request.jar();

var url = "http://so.eastmoney.com/Web/GetSearchList?type=20&pageindex=1&pagesize=10&keyword=%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C";
var rurl = "http://so.eastmoney.com/Web/GetSearchList";

var cookie = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=92133183274583; emshistory=%5B%22%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C%22%5D; HAList=a-sh-600000-%u6D66%u53D1%u94F6%u884C%2Ca-sz-300231-%u94F6%u4FE1%u79D1%u6280; em_hq_fls=js; qgqp_b_id=922b4f747742667eaf846dcbe643fe89");
var cookie2 = request.cookie("emstat_bc_emcount=7130645612331980324; st_pvi=84819361064589; emstat_ss_emcount=190_1513101205_2585311130; st_si=20587844746725")
j.setCookie(cookie,url);
//var urlcodedname =  encodeURIComponent('浦发银行');
//console.log(urlcodedname);

var readList = function(callback){
	fs.readFile('sl.json',function(err,data){
		if(err) return console.error(err);
		var sl = JSON.parse(data);

		var sznum = 0, shnum = 0;
		for(var key in sl['sz']){
			sznum++;
			sList['sz'].push(sl['sz'][key]['name']);
		}

		for(var key in sl['sh']){
			shnum++;
			sList['sh'].push(sl['sh'][key]['name']);
		}
		console.log('sz num = ' + sznum);
		console.log('sh num = ' + shnum);
		callback(null,'readList');
	});
}

var startSeek = function(callback){
	var params = {
        "type": "20",
        "pageindex": 1,
        "pagesize" : "10",
        "keyword": "启明信息"
    	};

	var options = {
    url: rurl,
    jar:j,
    qs: params
  	};

	request(options,function(error,response,body){
		if(!error&& response.statusCode == 200){
			console.log("get response!!");
			var newslist = JSON.parse(body);
			
			console.log("the TotalPage = " + newslist["TotalPage"]);

			var pageNum = newslist["TotalPage"];
			var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
			var newsUrlList = new Array();	
			async.reduce(mapArr,0,function(memo,it,cabk){
					if(it ==0)
					  return cabk(null, it);
					
					console.log('request for' + it);
					var params_ = {
			        "type": "20",
			        "pageindex": it,
			        "pagesize" : "10",
			        "keyword": "启明信息"
			    	};

					var options_ = {
				    url: rurl,
				    jar:j,
				    qs: params_
				  	};
				  	setTimeout(function(){
					  	request(options_,function(err,res,body){
					  		if(!error&& response.statusCode == 200){
					  			try{
					  				console.log("get here length = " + JSON.parse(body)['Data'].length);
					  				newsUrlList = newsUrlList.concat(JSON.parse(body)['Data']);
					  			}
					  			catch(err){
					  				console.log(body);
					  				console.error(err);
					  			}
					  		}
					  		cabk(null,it);
					  	})
				  	},3000);
				},function(err,res){
					console.log("done");
					callback(null,"startSeek");
					console.log("UrlList Length = " + newsUrlList.length);
				});
			
			/*fs.writeFile('eastmoney_news.html',body.toString(),function(err){
			if(err)
					return console.error(err);
			});
			*/

		}
		else
			callback(null,"startSeek");
	})
}

var startSeekG = function(callback_){
	async.reduce(sList['sz'],0,function(memo,it,callback){
		var params = {
        "type": "20",
        "pageindex": 1,
        "pagesize" : "10",
        "keyword": it
    	};

		var options = {
	    url: rurl,
	    jar:j,
	    qs: params
	  	};
	  	console.log("now finding for the key word : " + it);

		request(options,function(error,response,body){
			if(!error&& response.statusCode == 200){
				console.log("get response!!");
				var newslist = JSON.parse(body);
				
				console.log("the TotalCount = " + newslist["TotalCount"]);

				var pageNum = newslist["TotalPage"];
				var mapArr = Array.apply(null, Array(pageNum+1)).map(function (_, i) {return i;});
				var newsUrlList = new Array();	

				async.reduce(mapArr,0,function(memo_,it_,cabk){
						if(it_ ==0)
						  return cabk(null, it_);
						
						console.log('request for ' + it_);
						var params_ = {
				        "type": "20",
				        "pageindex": it_,
				        "pagesize" : "10",
				        "keyword": it
				    	};

						var options_ = {
					    url: rurl,
					    jar:j,
					    qs: params_
					  	};
					  	console.log("keyword = " + it +" Index = " + it_);

					  	setTimeout(function(){
						  	request(options_,function(err,res,body){
						  		if(!error&& response.statusCode == 200){
						  			try{
							  			console.log("get here length = " + JSON.parse(body)['Data'].length);
							  			newsUrlList = newsUrlList.concat(JSON.parse(body)['Data']);
						  			}
						  			catch(err){
						  				//console.log(body.toString());
						  				console.error(err);
						  			}
						  		}
						  		cabk(null,it_);
						  	})
					  	},3000);
					},function(err,res){
						console.log("done");
						callback(null,it);
						console.log("UrlList Length = " + newsUrlList.length);
					});
				
				/*fs.writeFile('eastmoney_news.html',body.toString(),function(err){
				if(err)
						return console.error(err);
				});
				*/
			}
			else
				callback(null,it);
		})

	},function(error,result){
		if(error) return console.error(error);
		callback_(null,"startSeekG");
	});	
}

async.series([readList,startSeekG],function(err,result){
	console.log("series");
	if(err){
		console.error(err);
	}
})
