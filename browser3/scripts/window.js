onload = function() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log(request);
	document.querySelector('h1').innerText = request.name;
	var response = {data: "ツェペリの魂！！"};
	sendResponse(response);
    });
    
    document.querySelector('#yahoo').addEventListener('click', function() {
	chrome.runtime.sendMessage({name: "Joseph"}, function(response) {
	    console.log(response);
	});
    });
}