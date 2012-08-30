/******************************************************************************
 * Copyright 2012 Intel Corporation.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *****************************************************************************/



/*****************************************************************************/

var nfc = window.nfc = {};

nfc.reset = function() {
	nfc.busName = "org.neard";
	nfc.bus = null;
	nfc.uri = null;
	nfc.manager = null;
	nfc.adapter = null;
	nfc.defaultAdapter = null;
};


nfc.init = function(uri, successCB, errorCB) {
	nfc.reset();
	
	function onAdapterPropsOk(props) {
		nfc.adapter.props = props;
		nfc.defaultAdapter = new nfc.NFCAdapter(nfc.adapter);
		if (successCB)
			successCB();		
	}
	
	function onAdapterOk() {
		nfc.adapter.GetProperties(onAdapterPropsOk, errorCB);
	}
	
	function onManagerPropsOk(props) {
		if (props.Adapters.length == 0)
			errorCB("No NFC Adapter found");
		else {
			nfc.adapter = nfc.bus.getObject(nfc.busName, 
					props.Adapters[0], 
					onAdapterOk, 
					errorCB);
		}
	}
	
	function onManagerOk() {
		nfc.manager.GetProperties(onManagerPropsOk, errorCB);
	}
	
	function onConnectOk() {
		nfc.bus = cloudeebus.SystemBus();
		nfc.uri = uri;
		nfc.manager = nfc.bus.getObject(nfc.busName, "/", onManagerOk, errorCB);
	}
	
	cloudeebus.connect(uri, onConnectOk, errorCB);
};


nfc.getDefaultAdapter = function() {
	return nfc.defaultAdapter;
};



/*****************************************************************************/

nfc.NFCAdapter = function(proxy) {
	this.proxy = proxy;
	if (proxy) {
		this.id = proxy.objectPath;
		this.powered = proxy.props.Powered ? true : false;
		this.polling = proxy.props.Polling ? true : false;
	}
	return this;
};


nfc.NFCAdapter.prototype.setPowered = function(state, successCB, errorCB) {

	var self = this;

	function onPoweredOk() {
		self.powered = state;
		if (successCB)
			successCB();
	}

	self.proxy.SetProperty("Powered", state, onPoweredOk, errorCB);
};


nfc.NFCAdapter.prototype.setPolling = function(state, successCB, errorCB) {

	var self = this;

	function onPollingOk() {
		self.polling = state;
		if (successCB)
			successCB();
	}

	if (state)
		self.proxy.StartPoll(onPollingOk, errorCB);
	else
		self.proxy.StopPoll(onPollingOk, errorCB);
};


nfc.NFCAdapter.prototype.setTagListener = function(detectCB, errorCB, tagFilter) {
	
	var self = this;
	
	self.listening = true;
	if (self.connected)
		return;
	
	function onTagFound(tagId) {
		detectCB.onattach(new nfc.NFCTag(nfc.bus.getObject(nfc.busName, tagId)));
	}
	
	function onPropertyChanged(key, table) {
		if (!self.listening)
			return;
		if (key == "Tags") {
			if (table.length == 0) {
				detectCB.ondetach();
				self.setPolling(true);
			}
			else
				onTagFound(table[0]);
		}
	}
	
	self.proxy.connectToSignal("org.neard.Adapter","PropertyChanged",
			onPropertyChanged);
	self.connected = true;
};


nfc.NFCAdapter.prototype.unsetTagListener = function() {
	this.listening = false;
};



/*****************************************************************************/

nfc.NFCTag = function(proxy) {
	this.proxy = proxy;
	this.type = "GENERIC_TARGET";
	if (proxy) {
		this.id = proxy.objectPath;
	}
	return this;
};



