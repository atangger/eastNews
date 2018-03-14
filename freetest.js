const request = require('request')
const cheerio = require('cheerio')
function SendRequest(url,callback){
	request(url,(err,res,body)=>{
		let innerurl = 'http://guba.eastmoney.com/news,cjpl,748967104.html';
		if(!err){
			request(innerurl,(ierr,ires,ibody)=>{
				if(!ierr)
					callback(null,ibody);
				else
					callback(ierr,'');
			});
		}
		else
			callback(err,'');
	})
}
var testUrl = 'http://stock.eastmoney.com/news/1405,20180313842591475.html';
SendRequest(testUrl ,(err,body)=>{
	console.log(body);
})