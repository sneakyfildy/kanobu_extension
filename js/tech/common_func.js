// common function to use all over extension background, options and popup
var SITE_URL_PATTERN      = '*://*.kanobu.ru/*'
    ,images64 = {    
    };

function updateTabChrome(id, url, selected, oldUrl){
    if ( url !== oldUrl ){
        chrome.tabs.update(id, {
            url         : url,
            selected    : selected
        });
    }else{
        chrome.tabs.reload(id, {});
    }
}

function updateTabOpera(tab, url, selected){
    tab.update({
        url         : url,
        selected    : selected
    });
    
    tab.focus();
}

function checkVersion(){
}

function clearStrg() {
    window.localStorage.clear();
}

function log(txt) {
    console.log(txt);
}

function alertError(err){
    log('Error! ' + err);
}

var global = this,
    objectPrototype = Object.prototype,
    toString = objectPrototype.toString,
    enumerables = true,
    enumerablesTest = {
        toString: 1
    }
    ,emptyFn = function () {}
    ,i;

for (i in enumerablesTest) {
    enumerables = null;
}

if (enumerables){
    enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable',
        'toLocaleString', 'toString', 'constructor'];
}


function _CommonFn(){
    var me = this;
    var chrome = chrome || window.chrome || false;
    var opera = opera || window.opera || false;

    me.isChrome = function(){
        return !!chrome;
    };

    me.isOpera = function(){
        return !!opera;
    };
    // get background
    me.getBg    = function(){
        if ( me.isChrome() ){
            return chrome.extension.getBackgroundPage();
        }else if ( me.isOpera() ){
            return ( window.isBackground ) ? window : opera.extension.bgProcess;
        }else{
            console.log('FATAL ERROR: Cannot identify browser!');
            return false;
        }
    };
    // send msg to background with optional callback
    me.sendReq  = function(data, callbackFn, callbackScope){
        if ( me.isChrome() ){
            chrome.extension.sendRequest(
            data,
            function(response){
                if (callbackFn){
                    callbackFn.call(callbackScope || this, response);
                }
            });
        }else if ( me.isOpera() ){
            opera.extension.postMessage(data);
            if (callbackFn){
                opera.extension.onmessage(function(event){
                    var data = event.data;
                    if ( data.type === 'operaResponse' ){
                        callbackFn.call(callbackScope || this, data);
                    }
                });
            }
            
        }
    };
    
    
    me.objToArr = function(obj){
        var arr = [];
        for (var key in obj){
            arr.push(obj[key]);
        }

        return arr;
    };
    
    me.applyIf =  function(object, config) {
        var property;

        if (object) {
            for (property in config) {
                if (object[property] === undefined) {
                    object[property] = config[property];
                }
            }
        }

        return object;
    };

    me.apply = function(object, config, defaults) {
        if (defaults) {
            me.apply(object, defaults);
        }

        if (object && config && typeof config === 'object') {
            var i, j, k;

            for (i in config) {
                object[i] = config[i];
            }

            if (enumerables) {
                for (j = enumerables.length; j--;) {
                    k = enumerables[j];
                    if (config.hasOwnProperty(k)) {
                        object[k] = config[k];
                    }
                }
            }
        }

        return object;
    };
    
    me.getImgUrl = function(url, id){
        if ( me.isChrome() ){
            return chrome.extension.getURL(url);
        }else if ( me.isOpera() ){
            return images64[id];
        }        
    };

    me.eachKanobuTab = function(fn, args){
        chrome.tabs.query({
            url: SITE_URL_PATTERN
        },
        function(tabs){
            var tab;
            for (var i = 0; i < tabs.length; i++){
                tab = tabs[i];

                if ( fn.apply( me, [tab].concat( args ) ) === false ){
                    break;
                }
            }
        });
    };
    
    this.goToLink = function goToLink(link, forceNew){
        var nameToCheck     = 'kanobu.ru',
            newTabUrlChrome= 'chrome://newtab/',
            newTabUrlOpera = 'opera:speeddial',
            operaTabsBrowser,
            selectedTab,
            currentUrl,
            existingTab,
            newTab;

        var ls = CommonFn.getBg();

        var options = ls.getItem('options');
        try{
            options = options && JSON.parse(options);
        }catch(e){
            console.log('Couldn\'t parse options in goToLink ' + e);
            options = false;
        }

        var smartNav = options && options.smartNav;

        // @todo make possibility to force reload page if URLs are same
        if ( smartNav && !forceNew ){
            if ( CommonFn.isChrome() ){
                chrome.tabs.getSelected(null, function( selectedTab ) {
                    var currentUrl = selectedTab.url;
                    if ( currentUrl.indexOf( nameToCheck ) < 0 ){
                        chrome.tabs.query({
                            url: SITE_URL_PATTERN
                        },
                        function(tabs){
                            var existingTab = tabs && tabs[0]
                                ,tabToUpdate;

                            if ( !existingTab && selectedTab.url !== newTabUrlChrome ){
                                chrome.tabs.create({
                                    url:link
                                });
                            }else{
                                tabToUpdate = existingTab || selectedTab;
                                updateTabChrome( 
                                    tabToUpdate.id, link, true, tabToUpdate.url
                                );
                            }
                        });
                    }else{
                        updateTabChrome(selectedTab.id, link, true, selectedTab.url);
                    }
                });
            }else if ( CommonFn.isOpera() ){
                operaTabsBrowser = CommonFn.getBg().opera.extension.tabs;
                selectedTab = operaTabsBrowser.getSelected();
                currentUrl = selectedTab.url;

                if ( currentUrl.indexOf( nameToCheck ) < 0 ){
                    var allTabs = operaTabsBrowser.getAll();

                    for (var i in allTabs){
                        if ( allTabs[i].url.indexOf( nameToCheck ) > 0 ){
                            existingTab = allTabs[i];
                            break;
                        }
                    }

                    if ( !existingTab && selectedTab.url !== newTabUrlOpera ){
                        newTab = operaTabsBrowser.create({
                            url:link
                        });

                        newTab.focus();
                    }else{
                        updateTabOpera( existingTab || selectedTab, link, true);
                    }

                }else{
                    updateTabOpera(selectedTab, link, true);
                }

            }
        }else{
            if ( CommonFn.isChrome() ){
                chrome.tabs.getSelected(null, function( selectedTab ) {
                    var currentUrl = selectedTab && selectedTab.url;
                    if ( currentUrl === newTabUrlChrome ){
                        updateTabChrome( selectedTab.id, link, true );
                    }else{
                        chrome.tabs.create({
                            url:link
                        });
                    }
                });
            }else if ( CommonFn.isOpera() ){
                operaTabsBrowser = CommonFn.getBg().opera.extension.tabs;
                selectedTab = operaTabsBrowser.getSelected();
                currentUrl = selectedTab.url;

                if ( currentUrl === newTabUrlOpera ){
                    updateTabOpera( selectedTab, link, true );
                }else{
                    newTab = operaTabsBrowser.create({
                        url     : link,
                        selected: true
                    });

                    newTab.focus();
                }
            }
        }

    };
}

var CommonFn = new _CommonFn();