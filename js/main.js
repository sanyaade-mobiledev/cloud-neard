	// HTML DOM elements
	var outLog, writeLog, recordContentText;
	
	// NFC global objects
	var adapter;
	
	// HTML page management
	function initPage() {
		// init HTML DOM elements
		outLog = document.getElementById("outLog");
		writeLog = document.getElementById("writeLog");
		recordContentText = document.getElementById("recordContentText");
		// init NFC global objects
		adapter = nfc.getDefaultAdapter();
		adapter.setPowered(true);
		// initial state with tag reading disabled
		readNFCTag(false);
	}
	
	function clearResults() {
		outLog.innerHTML='';
		writeLog.innerHTML='';
		recordContentText.value='';		
	}

	// NDEF Message log
    function logRecord(rec) {
		if (rec.text)
			outLog.innerHTML += "<li>" + rec.text + " ("
			+ rec.encoding + " / "
			+ rec.languageCode + ")</li>";
		else if (rec.uri)
			outLog.innerHTML += "<li><a href='" + rec.uri + "'>"
					+ rec.uri + "</a></li>";
    }

    function logMessage(msg) {
		outLog.innerHTML +=  "<ul>";
		for (var index=0; index < msg.records.length; index++) {
			logRecord(msg.records[index]);
		}
		outLog.innerHTML += "</ul>";
	}
   
    // NFC Tag read callback
	function readOnAttach(nfcTag) {
		outLog.innerHTML += "<hr><b>Tag found</b><br>";
		outLog.innerHTML += "Tag type:" + nfcTag.type + "<br>";
		nfcTag.readNDEF(logMessage);
	}
	

    // Manage NFC Tag reading
	function readNFCTag(enabled) {
		adapter.setPolling(enabled);
		if (enabled) {
			adapter.setTagListener({onattach: readOnAttach, ondetach: function(){outLog.innerHTML += "<br><b>Tag was read, detached</b><br>";}});
			document.tagManagement.tagListener.selectedIndex=1;
		}
		else {
			adapter.unsetTagListener();
			document.tagManagement.tagListener.selectedIndex=0;
		}
	}


    // NFC Tag write callback
    var messageToWrite;
	function writeOnAttach(nfcTag) {
		if (!messageToWrite)
			alert("No message to write");
		nfcTag.writeNDEF(messageToWrite, function() {
			if (messageToWrite.records[0].text)
				writeLog.innerHTML = "<b>Wrote text message:</b> " + 
									messageToWrite.records[0].text;
			else if (messageToWrite.records[0].uri)
				writeLog.innerHTML = "<b>Wrote URI:</b> " + 
									messageToWrite.records[0].uri;
			else
				writeLog.innerHTML = "<b>Wrote undefined content</b> ";
		},
		function(err) {
			writeLog.innerHTML = "<b>Writing failed</b><br>";
			writeLog.innerHTML += err;
		});
	}    

	function writeOnDetach() {
		outLog.innerHTML += "<br><b>Tag detached</b><br>";
		adapter.unsetTagListener();
	}
	
    // Manage NFC Tag writing
    function writeRecordURL(content) {
		readNFCTag(false);
		writeLog.innerHTML = "Approach Tag to write URI...";
		var record = new NDEFRecordURI(content);
		messageToWrite = new NDEFMessage([record]);
		adapter.setTagListener({onattach: writeOnAttach, ondetach: writeOnDetach});
		adapter.setPolling(true);
    }
    function writeRecordText(content) {
		readNFCTag(false);
		writeLog.innerHTML = "Approach Tag to write Text...";
		var record = new NDEFRecordText(content,"en-US","UTF-8");
		messageToWrite = new NDEFMessage([record]);
		adapter.setTagListener({onattach: writeOnAttach, ondetach: writeOnDetach});
		adapter.setPolling(true);
    }

	//
	// Debug log function
	//

	function debugLog(msg) {
		alert(msg);
	}
	
	//
	// Cloudeebus manifest
	//

	var manifest = {
			name: "cloud-neard",
			version: "development",
			key: "Neard",
			permissions: [
				"org.neard"
			]
	};
	
	//
	// Main Init function
	//

	var init = function () {
		var cloudeebusHost = "localhost";
		var cloudeebusPort = "9000";
		var queryString = window.location.toString().split("\?")[1];
		if (queryString) {
			var getVars = queryString.split("\&");
			for (var i=0; i<getVars.length; i++) {
				var varVal = getVars[i].split("\=");
				if (varVal.length == 2) {
					if (varVal[0] == "host")
						cloudeebusHost = varVal[1];
					else if (varVal[0] == "port")
						cloudeebusPort = varVal[1];
				}
			}
		}
		var cloudeebusURI = "ws://" + cloudeebusHost + ":" + cloudeebusPort;
		nfc.init(cloudeebusURI, 
				manifest,
				initPage,
				debugLog);
	};
	// window.onload can work without <body onload="">
	window.onload = init;

