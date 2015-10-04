// ------------------------------------------------------------
// ircclient.js - Version 1.0 - 9/10/2003
// ------------------------------------------------------------
// JavaScript IRC Client with DCC Send/Chat Support
// by Level Three Solutions
// Version 1.0
// http://www.levelthreesolutions.com
// Released under GNU LESSER GENERAL PUBLIC LICENSE
// (freely distrubtable)
// ------------------------------------------------------------
// ------------------------------------------------------------
// DEPENDANCY: SocketWrench Freeware Edition ActiveX control
// by Catalyst Development Corporation
// Version 3.6
// http://www.catalyst.com/
// Freeware License
// The SocketWrench package is completely free, and may be 
// used to create freeware, shareware or commercial software
// packages without any runtime licensing fees or royalties. 
// (freely distrubtable)
// ------------------------------------------------------------
// DEPENDANCY: EsResolve ActiveX control
// by Brattberg Development
// Version 1.1 Build 6
// http://activex.sourceforge.net/esresolve.html
// released under the GNU LESSER GENERAL PUBLIC LICENSE
// (freely distrubtable)
// ------------------------------------------------------------
// DEPENDANCY: global.js
// by Level Three Solutions 
// Version N/A
// http://www.levelthreesolutions.com
// Released under GNU LESSER GENERAL PUBLIC LICENSE
// Included with EasyTMD
// (freely distrubtable)
// ------------------------------------------------------------

function hostnametoip(sHost) {
	var oDNS = new ActiveXObject("EsRESOLVE.EsResolveCtrl.1");
	oDNS.Address = sHost;
	oDNS.Resolve(sHost);
	return oDNS.IP;
}

aSockets = new Array(); // scoket control array
aDCCChats = new Array(); // dcc chat object array
aDCCSends = new Array(); // dcc send object array

aCommands = [ // recognized commands
		["ping", -1],
		["nick", -2],
		["join", -3],
		["topic", -8],
		["privmsg", -9],
		["notice", -10],
		["error", -11]
	];

function ircclient(sNick, aAlternateNicks, sUserName, sRealName) {
	this.nick = sNick;
	this.alternateNick = aAlternateNicks;
	this.alternateNickIndex = 0;
	this.userName = sUserName;
	this.realName = sRealName;
	this.hostName = "";
	this.port = 0;
	this.sock = -1;
	this.status = 0;
	this.connected = false;
	this.connectStartTime = 0;

	// internal functions
	this.login = ircclient_login;
	this.processMsg = ircclient_processMsg;
	this.read = ircclient_read;
	this.send = ircclient_send;
	this.isConnected = ircclient_isConnected;

	// public functions
	this.connect = ircclient_connect;
	this.process = ircclient_process;
	this.msg = ircclient_messsage;
	this.messsage = ircclient_messsage;
	this.ctcp = ircclient_ctcp;
	this.disconnect = ircclient_disconnect;
	this.sendCommand = ircclient_sendCommand;
	this.addHandler = ircclient_addHandler;

	// event handlers
	this.onConnect = ircclient_defaultHandler;
	this.onDisconnect = ircclient_defaultHandler;
	this.onUpdate= ircclient_defaultHandler;
	this.onText = ircclient_defaultHandler;
	this.onNotice = ircclient_defaultHandler;
	this.onDCCChat = ircclient_defaultHandler;
	this.onDCCChatConnect = ircclient_defaultHandler;
	this.onDCCSend = ircclient_defaultHandler;
	this.onDCCSendConnect = ircclient_defaultHandler;
}

	function ircclient_addHandler(sName, fFunction) {
		switch (sName) {
		case "onconnect" :
			this.onConnect = fFunction; // welcome message
			break;
		case "ondisconnect" :
			this.onDisconnect = fFunction; // Closing Link or socket disconnected
			break;
		case "onupdate" :
			this.onUpdate = fFunction; // welcome message
			break;
		case "ontext" :
			this.onText = fFunction; // chan|"", nick, message
			break;
		case "onnotice" :
			this.onNotice = fFunction; // chan|"", nick, message
			break;
		case "ondccchat" :
			this.onDCCChat = fFunction; // nick, arguments, address
			break;
		case "ondccchatconnect" :
			this.onDCCChatConnect = fFunction; // dccchat object
			break;
		case "ondccsend" :
			this.onDCCSend = fFunction; // nick, arguments, address, filesize
			break;
		case "ondccsendconnect" :
			this.onDCCSendConnect = fFunction; // nick, arguments, address, filesize
			break;
		}
	}

	function ircclient_defaultHandler(sMsg) {
		
	}


	// **** socket control specific ****
	function ircclient_connect(sHost, iPort) {
		this.hostName = sHost;
		this.hostAddress = hostnametoip(sHost);
		this.port = iPort;
		this.sock = aSockets.length;
		this.connectStartTime = (new Date()).valueOf();
		aSockets[this.sock] = new ActiveXObject("Catalyst.SocketCtrl.1");
		aSockets[this.sock].AddressFamily = 2; // AF_INET
		aSockets[this.sock].Protocol = 0; // IPPROTO_TCP
		aSockets[this.sock].SocketType = 1; // STREAM
		aSockets[this.sock].Binary = false;
		aSockets[this.sock].Blocking = false;
		aSockets[this.sock].BufferSize = 16384;
		aSockets[this.sock].AutoResolve = false;
		aSockets[this.sock].HostAddress = this.hostAddress;
		aSockets[this.sock].HostName = sHost;
		aSockets[this.sock].RemotePort = iPort;
		aSockets[this.sock].Timeout = 500;
		aSockets[this.sock].Action = 2; // SOCKET_CONNECT
		this.status = 1;
	}

	function ircclient_read() {
		//if (aSockets[this.sock].RecvNext > 0) return "";
		aSockets[this.sock].RecvLen = 16384;
		try {
			return aSockets[this.sock].RecvData;
		} catch (e) {
			//inmessage("Client error: read error\n");
			return "";
		}
	}

	function ircclient_send(s) {
		aSockets[this.sock].Blocking = true;
		try {
			aSockets[this.sock].SendLen = s.length;
			aSockets[this.sock].SendData = s;
		} catch (e) {
			inmessage("Client error: write error (" + e.description + "\n");
		}
		aSockets[this.sock].Blocking = false;
	}

	function ircclient_isConnected() {
		try {
			return aSockets[this.sock].Connected;
		} catch (e) {
			return false;
		}
	}

	// **** IRC client functionality ****
	function ircclient_login() {
		if (!this.isConnected) return;
		//Command: NICK
		//Parameters: <nickname>
		this.sendCommand("nick", [this.nick], "");
		//Command: USER
		//Parameters: <user> <mode> <unused> <realname>
		this.sendCommand("user", [this.userName, 8, "*"], this.realName);
	}

	function ircclient_disconnect(sMessage, bDCC) {
		if (this.status > 0 && this.status < 4) {
			aSockets[this.sock].Blocking = true;
			this.sendCommand("QUIT", [], sMessage);
			aSockets[this.sock].Blocking = false;
			if (bDCC) {
				for (var i=0; i<aDCCChats.length; i++) {
					aDCCChats[i].disconnect();
					aSockets[aDCCChats[i].socket] = null;
					aDCCChats[i] = null;
				}
				for (var i=0; i<aDCCSends.length; i++) {
					aDCCChats[i].disconnect();
					aSockets[aDCCChats[i].socket] = null;
					aDCCChats[i] = null;
				}
			}
		}
	}

	function ircclient_process() { // called from app specific timer
		if (aDCCSends.length) for (var i=0; i<aDCCSends.length; i++) if (aDCCSends[i]) aDCCSends[i].process();
		switch (this.status) {
		case 1 : // connecting
			if (this.isConnected()) {
				this.login();
				this.status = 2;
			}
			break;
		case 2 : // connected but not logged in
		case 3 : // connected and logged in
			if (!this.isConnected()) {
				this.onDisconnect("isConnected returned false");
				this.status = 4;
			}
			var sRead = this.read();
			if (sRead.length) {
				this.processMsg(sRead, 0);
			}
			break;
		case 4 : // disconnecting
			try {
				aSockets[this.sock].Action = 7; // SOCKET_CLOSE
			} catch (e) {

			}
			aSockets[this.sock] = null;
			this.connected = false;
			this.status = 0;
			break;
		}
		this.onUpdate(this.status);
	}

	function ircclient_messsage(sNick, sMsg) {
		this.sendCommand("PRIVMSG", [sNick], sMsg);
	}

	function ircclient_ctcp(sNick, sMsg) {
		var s = String.fromCharCode(1);
		this.sendCommand("PRIVMSG", [sNick], s + sMsg + s);
	}


	function ircclient_sendCommand(sCommand, sParams, sMessage) {
		this.send(
			sCommand + " " +
			sParams.join(" ") + " :" +
			sMessage + "\r\n"
			);
	}

	function ircclient_message(sMsg) {
		this.prefix = "";
		this.command = "";
		this.commandCode = 0;
		this.parameters = new Array();
		this.body = "";
		
		if (sMsg.indexOf(":") == 0) {
			this.prefix = sMsg.substring(1, sMsg.indexOf(" "));
			sMsg = sMsg.substring(sMsg.indexOf(" ")+1);
		}
		var aMsg = sMsg.split(" ");
		this.command = aMsg[0];
		this.lccommand = aMsg[0].toLowerCase();
		this.body = sMsg.substring(sMsg.indexOf(":") + 1);
		this.body = this.body.substring(0, this.body.length-2);
		this.parameters = sMsg.substring(sMsg.indexOf(" ")+1);
		this.parameters = this.parameters.substring(0, this.parameters.indexOf(":")).split(" ");

		for (var i=0; i<aCommands.length; i++) {
			if (this.lccommand == aCommands[i][0]) {
				this.commandCode = aCommands[i][1];
				break;
			}
		}
		if (this.commandCode == 0) { // unlisted command
			this.commandCode = this.command * 1;
			if (this.commandCode.isNaN) this.commandCode = 0;
		}
	}

	function ircclient_processMsg(sMsg) {
		oMsg = new ircclient_message(sMsg);
		switch (oMsg.commandCode) {
		case -1 : // PING
			this.sendCommand("PONG", [], "");
			outmessage(".\n");
			break;
		case -2 : // NICK

			break;
		case -3 : // JOIN

			break;
		case -4 : // MODE

			break;
		case -5: // PART

			break;
		case -6 : // QUIT

			break;
		case -7 : // KICK

			break;
		case -8 : // TOPIC

			break;
		case -9 : // PRIVMSG
			if (oMsg.body.charCodeAt(0) == 1) { //ctcp
				oMsg.body = oMsg.body.substring(1, oMsg.body.length-1);
				switch (oMsg.body.split(" ")[0]) {
				case "ACTION" :
					break;
				case "PING" :
					break;
				case "DCC" :
					var sNick = oMsg.prefix.split("!")[0];
					var sType = oMsg.body.split(" ")[1];
					//outmessage("Nick: " + sNick + "\nUser: " + sHost + "\nType:" + sType + "\nPort: " + iPort + "\n");
					if (sType == "CHAT") {
						var sHost = oMsg.body.split(" ")[3];
						var iPort = oMsg.body.split(" ");
						iPort = iPort[iPort.length-1];
						iPort = iPort * 1;
						if (this.onDCCChat(sNick)) {
							var oDCC = new ircclient_dccchat(sNick, sHost, iPort, true);
							oDCC.index = aDCCChats.length;
							aDCCChats[aDCCChats.length] = oDCC;
							oDCC = this.onDCCChatConnect(oDCC);
						}
					} else if (sType == "SEND") {
						var sHost = oMsg.body.split(" ")[3];
						var iPort = oMsg.body.split(" ")[4];
						iPort = iPort * 1;
						var sName = oMsg.body.split(" ")[2];
						var iSize = oMsg.body.split(" ")[5];
						if (this.onDCCSend(sNick, sName, iSize)) {
							var oDCC = new ircclient_dccsend(sNick, sHost, iPort, true, sName, "", iSize);
							oDCC.index = aDCCSends.length;
							aDCCSends[aDCCSends.length] = oDCC;
							this.onDCCSendConnect(oDCC);
							try {
								oDCC.connect();
							} catch (e) {
								inmessage("DCC error: can't connect to " + oDCC.nick + "\n");
							}
						}
					}
					break;
				case "VERSION" :
					var sNick = oMsg.prefix.split("!")[0];
					outmessage(sNick + " " + "VERSION mIRC v6.2 Khaled Mardam-Bey");
					this.ctcp(sNick, "VERSION mIRC v6.2 Khaled Mardam-Bey");
					break;
				}
			} else {
				this.onText(oMsg.parameters[0].toLowerCase(), oMsg.prefix.split("!")[0], oMsg.body);
			}
		case -10 : // NOTICE
			this.onNotice(oMsg.body);
			break;

		case -11 : // ERROR
			if (oMsg.body.indexOf("Closing Link") > -1) {
				this.status = 4;
				this.onDisconnect("Closing Link:" + oMsg.body);
			}
			break;
		case 001 : //server welcome message
			this.connected = true;
			this.onConnect(oMsg.body);
			this.status = 3;
			break;
		case 002 :
		case 003 :
		case 004 :
		case 005 :
			if (!this.connected) {
				this.connected = true;
				this.onConnect();
				this.status = 3;
			}
			break;
		case 433 : // nickname in use
			if (this.alternateNickIndex < this.alternateNick.length) {
				this.sendCommand("nick", [this.alternateNick[this.alternateNickIndex]], "");
				this.alternateNickIndex++;
			}
			break;
		default :
			break;
		}
	}

	// **** DCC chat object ****
	function ircclient_dccchat(sNick, sHost, iPort, bConnect) {
		this.nick = sNick;
		this.hostName = sHost;
		this.port = iPort;
		this.sock = -1;
		this.status = 0;
		this.connected = false;
		this.index = -1;

		this.connect = ircclient_dccchat_connect;
		this.accept = ircclient_dccchat_accept;
		this.disconnect = ircclient_dccchat_disconnect;
		this.read = ircclient_read;
		this.send = ircclient_send;
		this.isConnected = ircclient_isConnected;

		this.process = ircclient_dccchat_process;
		this.msg = ircclient_dccchat_msg;
		this.disconnect = ircclient_dccchat_disconnect;
		this.sendCommand = ircclient_dccchat_sendCommand;
		this.addHandler = ircclient_dccchat_addHandler;

		this.onText = ircclient_defaultHandler;

		if (bConnect) {
			try {
				this.connect();
			} catch (e) {
				outmessage("Couldn't connect to " + this.nick + "\n");
			}
		} else this.accept();
	}

		function ircclient_dccchat_connect() {
			this.sock = aSockets.length;
			aSockets[this.sock] = new ActiveXObject("Catalyst.SocketCtrl.1");
			aSockets[this.sock].AddressFamily = 2; // AF_INET
			aSockets[this.sock].Protocol = 0; // IPPROTO_TCP
			aSockets[this.sock].SocketType = 1; // STREAM
			aSockets[this.sock].Binary = false;
			aSockets[this.sock].Blocking = false;
			aSockets[this.sock].BufferSize = 16384;
			aSockets[this.sock].AutoResolve = true;
			aSockets[this.sock].HostAddress = this.hostName;
			aSockets[this.sock].RemotePort = this.port;
			aSockets[this.sock].Timeout = 500;
			aSockets[this.sock].Action = 2; // SOCKET_CONNECT
			this.status = 1;
		}

		function ircclient_dccchat_accept() {
		}

		function ircclient_dccchat_disconnect() {
			this.onDisconnect(this.nick);
			try {
				aSockets[this.sock].Action = 7; // SOCKET_CLOSE
			} catch (e) {
				inmessage("DCC error: close error\n");
			}
			aSockets[this.sock] = null;
			aDCCChats[this.index] = null;
		}

		function ircclient_dccchat_process() {
			if (!this.isConnected()) return;
			var sRead = this.read();
			if (sRead.length) {
				this.onText(this.nick, sRead.substring(0, sRead.length-1));
			}
		}

		function ircclient_dccchat_msg(sMsg) {
			this.send(sMsg + "\r\n");
		}

		function ircclient_dccchat_sendCommand() {

		}

		function ircclient_dccchat_addHandler(sName, fFunction) {
			switch (sName) {
			case "ontext" :
				this.onText = fFunction; // nick, message
				break;
			case "ondisconnect" :
				this.onDisconnect = fFunction; // nick
				break;
			}
		}

		function ircclient_defaultHandler() {

		}

	// **** DCC send object ****
	function ircclient_dccsend(sNick, sHost, iPort, bReceive, sFileName, sPath, iSize) {
		this.nick = sNick;
		this.hostName = sHost;
		this.port = iPort;
		this.sock = -1;
		this.fileName = sFileName;
		this.path = sPath;
		this.size = iSize;
		this.sizeReceived = 0;
		this.sizeSend = 0;
		this.status = 0;
		this.connected = false;
		this.index = -1;

		this.connect = ircclient_dccsend_connect;
		this.accept = ircclient_dccsend_accept;
		this.disconnect = ircclient_dccsend_disconnect;
		this.complete = ircclient_dccsend_complete;

		this.read = ircclient_read;
		this.isConnected = ircclient_isConnected;

		this.send = ircclient_dccsend_send;
		this.process = ircclient_dccsend_process;
		this.sendPart = ircclient_dccsend_sendPart;
		this.disconnect = ircclient_dccsend_disconnect;
		this.addHandler = ircclient_dccsend_addHandler;

		this.onPartReceived = ircclient_defaultHandler;
		this.onDisconnect = ircclient_defaultHandler;
		this.onComplete = ircclient_defaultHandler;
	}

		function ircclient_dccsend_connect() {
			this.file = oFS.OpenTextFile(this.path + this.fileName, ForWriting, true);
			this.sock = aSockets.length;
			aSockets[this.sock] = new ActiveXObject("Catalyst.SocketCtrl.1");
			aSockets[this.sock].AddressFamily = 2; // AF_INET
			aSockets[this.sock].Protocol = 0; // IPPROTO_TCP
			aSockets[this.sock].SocketType = 1; // STREAM
			aSockets[this.sock].Binary = true;
			aSockets[this.sock].Blocking = false;
			aSockets[this.sock].BufferSize = 16384;
			aSockets[this.sock].AutoResolve = true;
			aSockets[this.sock].HostAddress = this.hostName;
			aSockets[this.sock].RemotePort = this.port;
			aSockets[this.sock].Timeout = 500;
			try {
				aSockets[this.sock].Action = 2; // SOCKET_CONNECT
			} catch (e) {
				outmessage("Couldn't connect to " + this.nick + "\n");
			}
			this.status = 1;
		}

		function ircclient_dccsend_accept() {

		}

		function ircclient_dccsend_disconnect() {
			try {
				aSockets[this.sock].Action = 7; // SOCKET_CLOSE
			} catch (e) {

			}
			aSockets[this.sock] = null;
			aDCCSends[this.index] = null;
		}

		function ircclient_dccsend_send() {
			//aSockets[this.sock].Blocking = true;
			try {
				aSockets[this.sock].SendLen = 32;
				aSockets[this.sock].SendLong = this.sizeReceived;
			} catch (e) {

			}
			//aSockets[this.sock].Blocking = false;
		}

		function ircclient_dccsend_complete() {
			this.disconnect();
		}

		function ircclient_dccsend_process() {
			if ((!this.isConnected() && this.status == 1)) return; //  || aSockets[this.sock].IsBlocking
			else if (this.status == 3) return;
			try {
				aSockets[this.sock].RecvLen = aSockets[this.sock].RecvNext;
				var sRead = aSockets[this.sock].RecvData;
			} catch (e) {
				var sRead = "";
			}
			if (sRead.length) {
				this.status = 2;
				try {
					this.file.Write(sRead);
					this.sizeReceived += aSockets[this.sock].RecvLen;
				} catch (e) {

				}
				this.onPartReceived(this.nick, this.fileName, this.sizeReceived);
				this.send();
			} else if (this.status == 2 && this.sizeReceived == this.size) {
				this.onComplete(this.nick, this.fileName, this.sizeReceived);
				this.complete();
				this.status = 3;
				try {
					this.file.Close();
				} catch (e) {

				}
				return;
			} else if (!this.isConnected()) {
				this.onDisconnect(this.nick, this.fileName, this.sizeReceived);
				this.disconnect();
				this.status = 3;
				try {
					this.file.Close();
				} catch (e) {

				}
				return;
			}
		}

		function ircclient_dccsend_sendPart(iStart) {

		}

		function ircclient_dccsend_addHandler(sName, fFunction) {
			switch (sName) {
			case "onpartreceived" :
				this.onPartReceived = fFunction; // nice, file size
				break;
			case "ondisconnect" :
				this.onDisconnect = fFunction; // nick, file
				break;
			case "oncomplete" :
				this.onComplete = fFunction; // nick, file
				break;
			}
		}

		function ircclient_defaultHandler() {

		}
