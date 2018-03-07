const fs = require('fs');

const sblist = JSON.parse(fs.readFileSync('bList.json'));

console.log(sblist.length);
var multiList = new Set();
sblist.forEach((item)=>{
	let cnt = 0 ;
	for(let i = 0; i < sblist.length; i++){
		if(item['name'] == sblist[i]['name'])
			cnt++;
	}
	if(cnt >1)
		multiList.add(item);
});
console.log('multi num = ' + multiList.length);

multiList.forEach((item) => {
	console.log(item['name']);
});