const fs = require('fs');

var sl = JSON.parse(fs.readFileSync('sl.json'));
var sNameDic = new Array();
for(var key in sl['sz']){
	sNameDic.push(sl['sz'][key]['name']);
}
for(var key in sl['sh']){
	sNameDic.push(sl['sh'][key]['name']);
}
var result_data = '';
for(let i = 0 ; i < sNameDic.length; i++){
	result_data = result_data.concat(sNameDic[i].toString()+'\n');
}
console.log(result_data);
fs.writeFileSync('sNameDic.txt',result_data);
