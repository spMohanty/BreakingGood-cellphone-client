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
			// info = {
			// 	med_id : s;
			// };
			
			$.get(medid, function(){
				alert("working");
			})
  		// 	$.ajax({
		  //        type: "GET",		         
		  //        url: "http://breaking-good-map.cern.ch:5000/check_validity?med_id=" + result.text,
		  //        data : info,
		  //        success: function (data, status, jqXHR) {
		  //            // do something
		  //            resultDiv.innerHTML = "Welcome" + s;
		  //            //resultDiv.html(data);
		  //            alert("success");
		  //        },
		  //        error: function (jqXHR, status) {
		  //            // error handler
		  //            alert("failure");
		  //        }
 			// });
 			// alert("returned from ajax");
 			// //resultDiv.innerHTML = "Welcome" + result.text + "!";

		}, 
		function (error) {
			alert("Scanning failed: " + error);
		}
	);
}