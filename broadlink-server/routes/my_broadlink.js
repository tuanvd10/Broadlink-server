var express = require('express');
const broadlink = require('../my_module/my_broadlink');
var HashTable = require('hashmap');
const fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;

// get the reference of EventEmitter class of events module
var router = express.Router();
var rmBroadlink = new broadlink();

function sleep(ms){
     return new Promise(resolve=>{
         setTimeout(resolve,ms)
     })
}

router.get('/testServer/', function (req, res){
    res.end("Hello");
});

router.get('/getListRMDevice/', function (req, res){
    res.end(JSON.stringify(rmBroadlink.devices));
});

router.get('/searchAllRMDevice/', function (req, res){

    searchAllRMDevice().then(()=>
        res.end("Search Done: " + JSON.stringify(rmBroadlink.devices))
    );
});

router.get('/startLearning/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
	startLearning(deviceMAC, command).then((data) => {
        if(data!="Timeout" || data!="err") 
            data = data.toString('hex');
        res.end(data);
    })
});

router.get('/checkdata/:macAddress', function (req, res){
    var deviceMAC = req.params.macAddress;
    rmBroadlink.devices[deviceMAC].checkData();
    res.end();
});

router.get('/sendData/:macAddress/:command', function (req, res){
    var deviceMAC = req.params.macAddress;
    var command = req.params.command;
    sendData(deviceMAC,command).then((result) => res.end(result!="err"?result.toString('hex'):result));
});

/*API use for both REST or MQTT */
async function searchAllRMDevice(){
    rmBroadlink.discover();
    await sleep(10000);
    console.log("search done!");
}

async function startLearning(macAddress, command){
    var device = rmBroadlink.devices[macAddress];
    var data;
	device.learingCommand=command;
    device.enterLearning();
    await sleep(500);
    data = await checkDataLearned(device);
	await sleep(500);
    device.cancelLearn();
	device.learingCommand=null;
	device.rawData=null;
    return data;
}

async function sendData(deviceMAC, command){
    var device = rmBroadlink.devices[deviceMAC];
    /* maybe save in file base on MAC, cmd */
    var IRdata = device.cmdHashTable.get(command);
	//var IRdata = await readFile(deviceMAC, command);
	if(IRdata !="err") 
		device.sendData(IRdata, true);
    return IRdata;
}

async function checkDataLearned(device){
    var timeout = 10;
	var result;
    while(!device.rawData && timeout>0){
        device.checkData();
        await sleep(1000);
		timeout-=1;
    }
    if(timeout==0) return "Timeout";
    else {
		result = await writeFile(device);
		if(result =="err")
			return result;
		return device.rawData;
    }
}

async function writeFile(device){
	let result;
	let path = "./command_store/"+device.mac+"/" +device.learingCommand+".txt";
	result = await new Promise((resolve,reject) => {
		mkdirp(getDirName(path), function (err) {
			if (err) {
				console.log(err);
				resolve("err");
			}
			else 
				resolve("done");
		});	
	});
	if(result==="err") return result;
	result = await new Promise((resolve, reject) => {
		fs.writeFile(path, device.rawData, {flag: "w"},function(err){
			if(err) {
				console.log(err);
				resolve("err");
			} else {
				resolve("done")
			}
		});
	});
	return result;
}

async function readFile(mac, cmd){
	let result;
	let path = "./command_store/"+mac+"/"+cmd+".txt";
	result = await new Promise((resolve,reject) => {
		mkdirp(getDirName(path), function (err) {
			if (err) {
				console.log(err);
				resolve("err");
			}
			else 
				resolve("done");
		});	
	});
	if(result==="err") return result;
	result = await new Promise((resolve, reject) => {
		fs.readFile(path, function(err, data){
			if(err) {
				console.log(err);
				resolve("err");
			} else {
				resolve(data)
			}
		});
	});
	return result;
}
module.exports = router;