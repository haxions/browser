const HOME_URL = "http://www.google.co.jp";

onload = function() {
    var panelTabs = document.getElementsByClassName("panel-tabs");
    for (var i=0; i < panelTabs.length; i++) {
	panelTabs[i].addEventListener('click', setSelectedTabEvent);
    }
    
    document.getElementById("add_tab_btn").addEventListener('click', addTabEvent);
    
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type === "UpdateUrl") {
	    document.getElementById(request.id).setAttribute("href", request.url);
	    document.getElementById(request.id).innerText = request.url;
	}
    });
}

function setSelectedTabEvent(event) {
    event.preventDefault();
    resetSelectedTab();
    this.classList.add("selected-tab");
    chrome.runtime.sendMessage({type: "SelectTab", id: this.id}, function(response) {
	console.log(response);
    });
}

function resetSelectedTab() {
    var panelTabs = document.getElementsByClassName("panel-tabs");
    for (var i=0; i < panelTabs.length; i++) {
	panelTabs[i].classList.remove("selected-tab");
    }
}

function addTabEvent(event) {
    event.preventDefault();
    var list = document.getElementById("tab_list");
    var newTab = document.createElement("li");
    var newTabInner = document.createElement("a");
    newTabInner.id = generateTabId();
    newTabInner.className = "panel-tabs";
    newTabInner.href = HOME_URL;
    newTabInner.innerText = HOME_URL;
    newTabInner.addEventListener('click', setSelectedTabEvent);
    newTab.appendChild(newTabInner);
    list.appendChild(newTab);
    chrome.runtime.sendMessage({type: "AddTab", id: newTabInner.id, url: newTabInner.href}, function() {
	// fire event
	var eventTrigger = document.createEvent("MouseEvents");
	eventTrigger.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, newTabInner);
	newTabInner.dispatchEvent(eventTrigger);
    });
    
    
    // new button 再設置
    var tabs = list.getElementsByTagName("li");
    var addTabButton = tabs[tabs.length - 2];
    list.appendChild(addTabButton.cloneNode(true));
    list.lastChild.addEventListener('click', addTabEvent);
    list.removeChild(addTabButton);
}

function generateTabId() {
    var date = new Date();
    var seed = Math.floor(date.getTime() / 1000) + "T" + Math.floor( Math.random() * 1000 );
    return CybozuLabs.MD5.calc(seed);
}