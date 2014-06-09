var windows = [];
var boundsChangedType = null;

/**
 * Resets the windows and removes
 * any interval that is running
 */
function reset() {

  windows.forEach( function (w) {
    w.contentWindow.close();
  } );

  windows.length = 0;
}

/**
 * Initialise and launch the windows
 * @see http://developer.chrome.com/apps/app.window.html
 */
function launch() {
  // reset everything
  reset();

  // create the original window
  chrome.app.window.create('original.html', {
      id: "mainwin",
      bounds: {
        top: 128,
        left: 128,
	width: 1024,
	height: 768
      }
    },

    // when that is created store it
    // and create the copycat window
    function(originalWindow) {

      windows.push(originalWindow);

      chrome.app.window.create('copycat.html', {
        id: "copywin",
        bounds: {
          top: 128,
          left: 200,
	  width: 300,
	  height: 300
        },
        frame: 'none'
      },

      function(copycatWindow) {

        // store the copycat
        windows.push(copycatWindow);

        // now have the copycat watch the
        // original window for changes
        originalWindow.onClosed.addListener(reset);
        copycatWindow.onClosed.addListener(reset);

	originalWindow.onBoundsChanged.addListener(updateCopycatBounds);
	copycatWindow.onBoundsChanged.addListener(updateOriginalBounds);
	  
        copycatWindow.onRestored.addListener(function() {
          console.log('copy restored');
          if (originalWindow.isMinimized())
            originalWindow.restore();
        })

        originalWindow.onRestored.addListener(function() {
          console.log('copy restored');
          if (copycatWindow.isMinimized())
            copycatWindow.restore();
        })

        originalWindow.focus();
      });
  });
}

/**
 * Minimises both the original and copycat windows
 * @see http://developer.chrome.com/apps/app.window.html
 */
function minimizeAll() {

  windows.forEach( function (w) {
    w.minimize();
  });
}

function updateCopycatBounds() {
    if (boundsChangedType === 'updateOriginal') {
	boundsChangedType = null;
    } else {
	var copycatWindow = chrome.app.window.get('copywin');
	var copycatBounds = copycatWindow.getBounds();
	var originalBounds = chrome.app.window.get('mainwin').getBounds();
	copycatBounds.height = originalBounds.height + 25;
	copycatBounds.top = originalBounds.top;
	copycatBounds.left = originalBounds.left - copycatBounds.width;
	boundsChangedType = 'updateCopyCat';
	copycatWindow.setBounds(copycatBounds);
    }
}

function updateOriginalBounds() {
    if (boundsChangedType === 'updateCopyCat') {
	boundsChangedType = null;
    } else {
	var originalWindow = chrome.app.window.get('mainwin');
	var originalBounds = originalWindow.getBounds();
	var copycatBounds = chrome.app.window.get('copywin').getBounds();
	originalBounds.height = copycatBounds.height - 25;
	originalBounds.top = copycatBounds.top;
	originalBounds.left = copycatBounds.left + copycatBounds.width;
	boundsChangedType = 'updateOriginal';
	originalWindow.setBounds(originalBounds);
    }
}

// @see http://developer.chrome.com/apps/app.runtime.html
chrome.app.runtime.onLaunched.addListener(launch);
