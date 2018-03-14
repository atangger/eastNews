const redis = require('./redis');
let inqueItem = {
	name: 'Tom',
	code: 10086
};
redis.queue.in('testqueue',inqueItem,(err,res)=>{
	if(err == null)
		console.log('insert uccessfully');
});
redis.queue.out('testqueue',(err,res)=>{
	if(err == null){
		console.log(`out successfully: ${res}`);
	}
});