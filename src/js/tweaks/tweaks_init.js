// try to set listener on dropDown list in kanobu.ru opened tab (dropDown list is the list with user activity info)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var isKanobu    = tab.url.indexOf('http://kanobu.ru/') >= 0;
    
	if ( isKanobu ){
        chrome.tabs.executeScript(tabId, {
                file: 'js/hack/injectListener.js'
        });
    }
});