// Phonegap Barcode scanner
// Author: Umer Pasha
// Date: 8/26/14

var resultDiv;

document.addEventListener("deviceready", init, false);


function init() {
	document.querySelector("#startScan").addEventListener("touchend", startScan, false);
	resultDiv = document.querySelector("#results");
}



function startScan() {
	cordova.plugins.barcodeScanner.scan(
		function (result) {
			var s = "Result: " + result.text + "<br/>" +
			"Format: " + result.format + "<br/>" +
			"Cancelled: " + result.cancelled;
			//$('#results').load('test.html');
			//resultDiv.innerHTML = s;
			medid = "http://breaking-good-map.cern.ch:5000/check_validity?med_id=" + result.text;


			resultDiv.innerHTML = "Welcome" + result.text + "!";

			$.support.cors=true;
			$.get(medid, function(data){
				resultDiv.innerHTML += "Working !!";
			})

		}, 
		function (error) {
			alert("Scanning failed: " + error);
		}
	);
}

$(document).ready(function(){
			medid = "http://breaking-good-map.cern.ch:5000/check_validity?med_id=BLEH !!!"


			resultDiv.innerHTML += "<br/>TEST CALL Welcome" + result.text + "!";

			$.support.cors=true;
			$.get(medid, function(data){
				resultDiv.innerHTML += "TEST CALL Working !!";
			})
});