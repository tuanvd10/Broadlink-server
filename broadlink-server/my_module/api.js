const broadlink = require('../my_module/my_broadlink');
const fs = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

var rmBroadlink = new broadlink();

function sleep(ms){
     return new Promise(resolve=>{
         setTimeout(resolve,ms)
     })
}

/*API use for both REST or MQTT */
function getListRMDevice(){
	return rmBroadlink.devices;
}

async function searchAllRMDevice(){
    rmBroadlink.discover();
    await sleep(10000);
    //console.log("search done!");
	return rmBroadlink.devices;
}

async function startLearning(macAddress, command, client){
    var device = rmBroadlink.devices[macAddress];
    var data;
	device.learingCommand=command;
	device.client = client;
    device.enterLearning();
    await sleep(500);
    data = await checkDataLearned(device);
	await sleep(500);
    device.cancelLearn();
	device.learingCommand=null;
	device.rawData=null;
	device.client = null;
    return data;
}

async function sendData(deviceMAC, command, client){
    var device = rmBroadlink.devices[deviceMAC];
    /* maybe save in file base on MAC, cmd */
    var client = device.cmdHashTable.get(client)
	if(!client)
		return "Error: client not added to device"
	var IRdata = client.get(command);
	//var IRdata = await readFile(deviceMAC, command);
	if(IRdata) {
		//device.sendData(IRdata, true);
		return IRdata;
	}else{
			return "Error: command not learned before"
    }
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
	let path = "./command_store/"+device.mac+"/" +device.client+"/"+device.learingCommand+".txt";
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
	if(result=="err") return result;
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

exports.searchAllRMDevice=searchAllRMDevice;
exports.sendData=sendData;
exports.startLearning=startLearning;
exports.getListRMDevice=getListRMDevice;