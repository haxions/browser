window.onresize = doLayout;
var isLoading = false;

onload = function() {
  var webview = document.querySelector('#mainview>webview');
  doLayout();

  document.querySelector('#back').onclick = function() {
    document.querySelector('.selected-view').back();
  };

  document.querySelector('#forward').onclick = function() {
    document.querySelector('.selected-view').forward();
  };

  document.querySelector('#home').onclick = function() {
    navigateTo('http://www.google.com/');
  };

  document.querySelector('#reload').onclick = function() {
    if (isLoading) {
      document.querySelector('.selected-view').stop();
    } else {
      document.querySelector('.selected-view').reload();
    }
  };
  document.querySelector('#reload').addEventListener(
    'webkitAnimationIteration',
    function() {
      if (!isLoading) {
        document.body.classList.remove('loading');
      }
    });

  document.querySelector('#terminate').onclick = function() {
    webview.terminate();
  };

  document.querySelector('#location-form').onsubmit = function(e) {
    e.preventDefault();
    navigateTo(document.querySelector('#location').value);
  };

  webview.addEventListener('exit', handleExit);
  webview.addEventListener('loadstart', handleLoadStart);
  webview.addEventListener('loadstop', handleLoadStop);
  //webview.addEventListener('loadabort', handleLoadAbort);
  //webview.addEventListener('loadredirect', handleLoadRedirect);
  //webview.addEventListener('loadcommit', handleLoadCommit);

  // Test for the presence of the experimental <webview> zoom and find APIs.
  if (typeof(webview.setZoom) == "function" &&
      typeof(webview.find) == "function") {
    var findMatchCase = false;

    document.querySelector('#find').onclick = function() {
      if(document.querySelector('#find-box').style.display == 'block') {
        document.querySelector('#mainview>webview').stopFinding();
        closeFindBox();
      } else {
        openFindBox();
      }
    };

    document.querySelector('#find-text').oninput = function(e) {
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    }

    document.querySelector('#find-text').onkeydown = function(e) {
      if (event.ctrlKey && event.keyCode == 13) {
        e.preventDefault();
        webview.stopFinding('activate');
        closeFindBox();
      }
    }

    document.querySelector('#match-case').onclick = function(e) {
      e.preventDefault();
      findMatchCase = !findMatchCase;
      var matchCase = document.querySelector('#match-case');
      if (findMatchCase) {
        matchCase.style.color = "blue";
        matchCase.style['font-weight'] = "bold";
      } else {
        matchCase.style.color = "black";
        matchCase.style['font-weight'] = "";
      }
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    }

    document.querySelector('#find-backward').onclick = function(e) {
      e.preventDefault();
      webview.find(document.forms['find-form']['find-text'].value,
                   {backward: true, matchCase: findMatchCase});
    }

    document.querySelector('#find-form').onsubmit = function(e) {
      e.preventDefault();
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    }

    webview.addEventListener('findupdate', handleFindUpdate);
    window.addEventListener('keydown', handleKeyDown);
  } else {
    var find = document.querySelector('#find');
    find.style.visibility = "hidden";
    find.style.position = "absolute";
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
     if (request.type === "SelectTab") {
	 switchWebview(request.id);
	 sendResponse({status:"ok"});
     } else if (request.type === "AddTab") {
	 addWebview(request.id, request.url);
	 sendResponse({status:"ok"});
     }
  });
  webview.addEventListener('loadcommit', updateLocation);
};

function navigateTo(url) {
  resetExitedState();
  document.querySelector('.selected-view').src = url;
}

function doLayout() {
  var webview = document.querySelector('.selected-view');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  var webviewWidth = windowWidth;
  var webviewHeight = windowHeight - controlsHeight;

  webview.style.width = webviewWidth + 'px';
  webview.style.height = webviewHeight + 'px';

  var sadWebview = document.querySelector('#sad-webview');
  sadWebview.style.width = webviewWidth + 'px';
  sadWebview.style.height = webviewHeight * 2/3 + 'px';
  sadWebview.style.paddingTop = webviewHeight/3 + 'px';
}

function handleExit(event) {
  console.log(event.type);
  document.body.classList.add('exited');
  if (event.type == 'abnormal') {
    document.body.classList.add('crashed');
  } else if (event.type == 'killed') {
    document.body.classList.add('killed');
  }
}

function resetExitedState() {
  document.body.classList.remove('exited');
  document.body.classList.remove('crashed');
  document.body.classList.remove('killed');
}

function handleFindUpdate(event) {
  var findResults = document.querySelector('#find-results');
  if (event.searchText == "") {
    findResults.innerText = "";
  } else {
    findResults.innerText =
        event.activeMatchOrdinal + " of " + event.numberOfMatches;
  }

  // Ensure that the find box does not obscure the active match.
  if (event.finalUpdate && !event.canceled) {
    var findBox = document.querySelector('#find-box');
    findBox.style.left = "";
    findBox.style.opacity = "";
    var findBoxRect = findBox.getBoundingClientRect();
    if (findBoxObscuresActiveMatch(findBoxRect, event.selectionRect)) {
      // Move the find box out of the way if there is room on the screen, or
      // make it semi-transparent otherwise.
      var potentialLeft = event.selectionRect.left - findBoxRect.width - 10;
      if (potentialLeft >= 5) {
        findBox.style.left = potentialLeft + "px";
      } else {
        findBox.style.opacity = "0.5";
      }
    }
  }
}

function findBoxObscuresActiveMatch(findBoxRect, matchRect) {
  return findBoxRect.left < matchRect.left + matchRect.width &&
      findBoxRect.right > matchRect.left &&
      findBoxRect.top < matchRect.top + matchRect.height &&
      findBoxRect.bottom > matchRect.top;
}

function handleKeyDown(event) {
  if (event.ctrlKey) {
    switch (event.keyCode) {
      // Ctrl+F.
      case 70:
        event.preventDefault();
        openFindBox();
        break;

      // Ctrl++.
      case 107:
      case 187:
        event.preventDefault();
        increaseZoom();
        break;

      // Ctrl+-.
      case 109:
      case 189:
        event.preventDefault();
        decreaseZoom();
    }
  }
}

function handleLoadCommit(event) {
  resetExitedState();
    document.querySelector('#location').value = document.querySelector(".selected-view").src;
  if (!event.isTopLevel) {
    return;
  }

  var webview = document.querySelector('.selected-view');
  document.querySelector('#back').disabled = !webview.canGoBack();
  document.querySelector('#forward').disabled = !webview.canGoForward();
  closeBoxes();
}

function handleLoadStart(event) {
  document.body.classList.add('loading');
  isLoading = true;

  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.url;
}

function handleLoadStop(event) {
  // We don't remove the loading class immediately, instead we let the animation
  // finish, so that the spinner doesn't jerkily reset back to the 0 position.
  isLoading = false;
}

function handleLoadAbort(event) {
  console.log('LoadAbort');
  console.log('  url: ' + event.url);
  console.log('  isTopLevel: ' + event.isTopLevel);
  console.log('  type: ' + event.type);
}

function handleLoadRedirect(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.newUrl;
}

function openFindBox() {
  document.querySelector('#find-box').style.display = 'block';
  document.forms['find-form']['find-text'].select();
}

function closeFindBox() {
  var findBox = document.querySelector('#find-box');
  findBox.style.display = 'none';
  findBox.style.left = "";
  findBox.style.opacity = "";
  document.querySelector('#find-results').innerText= "";
}

function closeBoxes() {
  closeFindBox();
}

function doLayout() {
  var webview = document.querySelector('.selected-view');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  var webviewWidth = windowWidth;
  var webviewHeight = windowHeight - controlsHeight;

  webview.style.width = webviewWidth + 'px';
  webview.style.height = webviewHeight + 'px';

  var sadWebview = document.querySelector('#sad-webview');
  sadWebview.style.width = webviewWidth + 'px';
  sadWebview.style.height = webviewHeight * 2/3 + 'px';
  sadWebview.style.paddingTop = webviewHeight/3 + 'px';
}

function switchWebview(selectedId) {
    var views = document.querySelectorAll("webview");
    for (var i=0; i < views.length; i++) {
	if (views[i].id === selectedId) {
	    views[i].classList.add("selected-view");
	    views[i].addEventListener('loadcommit', updateLocation);
	} else {
	    views[i].classList.remove("selected-view");
	    views[i].removeEventListener('loadcommit', updateLocation);
	}
    }
    doLayout();
            updateLocation();
}


function addWebview(id, url) {
    var mainView = document.querySelector("#mainview");
    var webview = document.createElement("webview");
    webview.id = id;
    webview.src = url;
    mainView.appendChild(webview);
}
function updateLocation(event) {
    handleLoadCommit(event);
    var id = document.querySelector(".selected-view").id;
    var url = document.querySelector(".selected-view").src;
    chrome.runtime.sendMessage({type: "UpdateUrl", id: id, url: url});
}