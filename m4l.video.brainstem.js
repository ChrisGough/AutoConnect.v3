autowatch = 1;
outlets = 3;

var DevCallbackArray = new Array();
var callbackIDArray = new Array();
var devListArray = new Array(); //list of devices in tracks and first chain of rack
var prevDevArray = new Array();
var vidDevArray = new Array();
//----------------------------------------------------------

function getprevdevs(args)
{
	var ignoreId = 0;
	devListArray.length = 0;
	prevDevArray.length = 0;
	prevDevArray[1] = 0;
	vidDevArray = args.split(" ");
	iterTracks();
	//post("full devlist:", devListArray, "\n");
	//outlet(0, "bang");
}

//----------------------------------------------------------

function iterTracks()
{
	var Song = new LiveAPI("live_set");
	observe_this(Song.id, "tracks"); //observe for new/deleted/moved tracks
	
	var Tracks = Song.getcount("tracks");
	for (var Track = 0; Track < Tracks; Track++)
		{
		var api = new LiveAPI("live_set tracks " + Track);
		if (!api) {post("Break!\n"); return;}
		iterateDevices(api);	
		}
}
iterTracks.local = 1;

//----------------------------------------------------------

function iterateDevices(api)
{
	observe_this(api.id, "devices");  //observe for new/deleted/moved devices in path
	var parentId = api.id
	var count = api.getcount("devices");
	var apiPath = dequotePath(api);
	var vidDev = 0;
	for (var i = 0; i < count; i++) 
		{
		var deviceApi = new LiveAPI(apiPath + " devices " + i);
		deviceApi.property = "devices";
		var deviceId = deviceApi.id;
		if (!deviceApi) {post("Break!\n"); return;}
			var deviceApiPath = dequotePath(deviceApi);
			var chainsCount;
			var j;
			//---------------------------------------------------
			if (deviceApi.get("can_have_chains") == 1) //if rack
				{
				observe_this(deviceApi.id, "chains"); //observe for new/deleted/moved chains in rack
				chainsCount = deviceApi.getcount("chains");
				if(chainsCount > 0) 
					{
						var chainApi = new LiveAPI(deviceApiPath + " chains 0"); //if there is a chain in rack send chain to iterateDevices()
						if (!chainApi) {post("Break!\n"); return;}
						iterateDevices(chainApi);
						for (var j = 1; j < chainsCount; j++)
						{
						chainApi = new LiveAPI(deviceApiPath + " chains " + j);
						post("OtherChain: ", chainApi.id, "\n");
						var tempprev = prevDevArray[1];
						prevDevArray[1] = chainApi.id;
						iterateDevices(chainApi);
						prevDevArray[1] = tempprev;
						}
					}
				}
			//---------------------------------------------------
			else 
				{
				if (vidDevArray.indexOf(deviceId) != -1)
				{
				vidDev = deviceId;
				devListArray.push(deviceApi.id); //add device id to list
				prevDevArray[0] = deviceId;
				outlet(1,prevDevArray);
				outlet(0, "send viddev" + prevDevArray[0]);
				outlet(0, prevDevArray[1]);
				prevDevArray[1] = prevDevArray[0];}
				}
		}
		outlet(1,parentId + " " + vidDev);
}
iterateDevices.local = 1;

//----------------------------------------------------------

function observe_this(ID, observeProperty)
{
	if (callbackIDArray.indexOf(ID) == -1) //If id not observed...
		{
		callbackIDArray.push(ID);  // ...Add id to observed list
		ignoreId = 1;
		var DevCallback = new LiveAPI(callback, "id " + ID);
		DevCallback.property = observeProperty;
		DevCallbackArray.push(DevCallback);}
}
observe_this.local = 1;

//----------------------------------------------------------

function callback(args)
{
		if (args[0] != "id") 
		{
			if (ignoreId == 1)
			{
				ignoreId = 0;
			}
			else
			{
				outlet(2,"bang");
			}
		}
}
callback.local = 1;
//----------------------------------------------------------

function dequotePath(api)
{
	return api.path.replace(/\"/g, ""); // remove quotes
}
dequotePath.local = 1;

//----------------------------------------------------------