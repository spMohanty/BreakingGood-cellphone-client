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
			resultDiv.innerHTML = s;

			example = "https://api.twitter.com/1.1/statuses/show.json";

			info = {
				med_id : s;
			};

			// var xhttp = new XMLHttpRequest();
			// xhttp.onreadystatechange = function() {
			//     if (xhttp.readyState == 4 && xhttp.status == 200) {
			// 	      resultDiv.innerHTML = xhttp.responseText;
			// 	    }
			// 	}
			// }
			// xhttp.open("GET", "http://breaking-good-map.cern.ch:5601/check_validity", true);
			// xhttp.send();

			// $.ajax({
		 //         type: "GET",
		         
		 //         url: "http://breaking-good-map.cern.ch:5601/check_validity",
		         
		 //         data : info,


		 //         success: function (data, status, jqXHR) {
		 //             // do something
		 //             alert("success");
		 //         },

		 //         error: function (jqXHR, status) {
		 //             // error handler
		 //             alert("failure");
		 //         }
 		// 	});
		}, 
		function (error) {
			alert("Scanning failed: " + error);
		}
	);

}