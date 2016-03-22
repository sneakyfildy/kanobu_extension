/**
 * Main extension object
 */
function Extension(){
    var me = this;
    me.msgToShow = [];

    me.init             =  function(){
	// rewrite backfound.html with new content from parent site (kanobu.ru)
        me.rewriteBackground();
        me.Sub.options = Options.getOptions();
        me.initListeners();
        me.checkVersion();
        window.setTimeout(me.startUpdate, 0);

        if ( !!getItem('reloadOnStartup') ){
            setItem('reloadOnStartup', '');
            CommonFn.eachKanobuTab(
                function(tab){
                    if (tab && tab.id){
                        chrome.tabs.reload(tab.id);
                    }
                }
            );
        }
    };

    /**
     * Starts polling funcitons if have any.
     * Basically there's at least one ticker - server options. (Once per hour)
     **/
    me.startUpdate      = function(){
        for ( var i in me.Sub.Tickers ){
            me.Sub.Tickers[i].run();
        }

        me.scheduleRequest();
    };

    me.scheduleRequest  = function(){
        window.setTimeout(me.startUpdate, 1000 * me.Sub.appData.mainInt);
    };

    me.appData  = {
        debug   : false //true
    };

    /**
     * listeners initialisation
     */
    me.initListeners    = function(){
        if ( CommonFn.isChrome() ){
            me.addChromeListeners();
        }else if (CommonFn.isOpera()){
            me.addOperaListeners();
        }
    };

    me.Tech = {
        /**
         *play sound
         */
        playInboxSound  : function(id){
            id = id || 'inboxSound';
            if (document.getElementById(id) ){
                document.getElementById(id).play();
            }
        },
        /**
         * alert error to console with possible custom text
         */
        errorAlert     : function(e, customText){
            var txt = e.errorText || e.responseText || e.statusText;

            if ( me.appData.debug ){
                console.log(['Error probably in base.js, error text: ' + txt, e, 'Custom: ' + customText]);
            }

        /*if ( e.status && e.status == 401 )
                type = 'not_logged';
            else
                type = 'connection_error';

            me.Tech.setBadge( type );*/
        },
        /**
         * set extension badge text
         */
        setBadge       : function( badgeText, color ){
            var text = (badgeText + '') || '';

            if ( CommonFn.isChrome() ){
                chrome.browserAction.setBadgeText({
                    text : String(text)
                });

                if ( color !== false ){
                    chrome.browserAction.setBadgeBackgroundColor({
                        color: color || '#960000'
                    });
                }
            }else if ( CommonFn.isOpera() ){
                Extension.opera.badge.badge.textContent = text;
            }

            me.lastBadgeText = text;
        }
        ,setBadgeTitle       : function( text, noStore ){
            text = (text + '') || '';

            if ( CommonFn.isChrome() ){
                chrome.browserAction.setTitle({
                    title : text
                });
            }else if ( CommonFn.isOpera() ){
                Extension.opera.badge.title = text;
            }

            me.lastBadgeTitle = noStore ? me.lastBadgeTitle : text;
        }
    };

    me.Ticker = {
        /**
         * base ticker stuff
         */
        ajaxTick            : function( url, params, callback ){
            $.ajax({
                url         : url,
                type        : 'GET',
                data        : params,
                timeout     : 30000,
                contentType : 'application/json; charset=utf-8',
                dataType    : 'html',
                context     : me,
                success     : function (response) {
                    if (response && callback){
                        callback(response);
                    }
                },
                error       : me.Tech.errorAlert
            });
        },

        /**
         * complex ajax ticker, calls base ticker if time is good
         */
        ajaxTickByTime    : function( url, params, callback, type, interval ){
            var lastTime = getItem(type);

            if ( !lastTime ) {
                var lastTickTime = new Date().getTime();

                setItem(type, lastTickTime);
                me.Ticker.ajaxTick(url, params, callback);
            }else{
                var nowTime = new Date().getTime(),
                    diff;
                try{
                    diff = (parseInt( nowTime, 10 ) - parseInt( lastTime, 10 )) / 1000;
                }catch(e){
                    diff = -1;
                }

                if (diff >= interval || diff < 0) {
                    me.Ticker.ajaxTick(url, params, callback);
                    setItem(type, nowTime);
                }
            }
        },

        /**
         * calls custom callback by time supplied
         */
        tickByTime    : function( fn, type, interval ){
            var lastTime = getItem(type);

            if ( !lastTime ) {
                var lastTickTime = new Date().getTime();

                setItem(type, lastTickTime);
                setTimeout(fn, interval);
            }else{
                var nowTime = new Date().getTime(),
                diff;
                try{
                    diff = (parseInt( nowTime, 10 ) - parseInt( lastTime, 10 )) / 1000;
                }catch(e){
                    diff = -1;
                }

                if (diff >= interval || diff < 0) {
                    setTimeout(function(){
                        fn.call();
                    }, interval);
                    setItem(type, nowTime);
                }
            }
        }
    };

    /*
     * Overrides user options if needed.
     * Basically it is used when got new version or found bugs
     */
    me.storeServerOptions   = function(resp){
        var curOpts = Options.getOptions() || {}
            ,newOpts;

        try{
            newOpts = resp && resp.length > 0 && JSON.parse(resp) || {};
        }catch(e){
            return true;
        }

        curOpts = CommonFn.apply(curOpts, newOpts);

        setItem( 'options', JSON.stringify(curOpts) );
        setItem( 'server_options', JSON.stringify(newOpts) );

        me.checkVersion();
    };

    me.checkVersion         = function(){
        var lastVersion = getItem('last_version', true)
            ,curVersion = me.Sub.version
            ,changed    = false;

        if (lastVersion){
            var lMajor  = parseInt(lastVersion.major, 10)
                ,lMinor = parseInt(lastVersion.minor, 10)
                ,cMajor = parseInt(curVersion.major, 10)
                ,cMinor = parseInt(curVersion.minor, 10);

            if ( lMajor < cMajor || ( lMajor === cMajor && lMinor < cMinor ) ){
                changed = true;
                lastVersion = curVersion;
                console.log('reset');
            }
        }else{
            changed = true;
            lastVersion = curVersion;
        }

        setItem('last_version', lastVersion, true);
        return changed;
    };

//@@TODO collapse listeners
    me.addChromeListeners   = function(){
        chrome.extension.onRequest.addListener(
            function(request, sender, sendResponse) {
                var resp;
                switch ( request.method ){
                    case  'getOptions'  :
                        resp = Options.getOptions();
                        sendResponse(resp);
                        break;
                    case  'setOptions'  :
                        Options.setOptions(request.options);
                        break;
                    case 'getOptionsById'   :
                        var res = Options.getOptionsById( request.optionIds );
                        sendResponse( res );
                        break;
                    case 'updateBgOptions'  :
                        me.Sub.options = Options.getOptions();
                        sendResponse();
                        break;
                    case 'setOption'        :
                        Options.setOneOption(request.id, request.val);
                        sendResponse();
                        break;
                    case 'playSound'        :
                        me.Tech.playInboxSound(request.soundId);
                        break;
                }

            });
    };

    // shortcut
    this.sbt = this.Tech.setBadgeTitle;
    this.sb = this.Tech.setBadge;

    this.reload = function(forced){
        if ( me.Sub.options.autoReloadOn || forced ){
            setItem('reloadOnStartup', 'on');
            chrome.runtime.reload();
        }
    };


    this.rewriteBackground = function(){
	// the main goal is to set background page with server-side event stuff as on parent site (kanobu.ru)
        function rewritePage(h){
            // clear text, we need only html blocks
            //h = h.replace(/[\u0430-\u044F\u0410-\u042F]|^\s+\s$/gim, '');
            h = h.replace(/^<.DOCT[\sa-zA-Z0-9]+>/im, '');
            h = h.replace(/^\s\s\s\s/gim, '\t');


            //css
            h = h.replace(/<link.+>|<title>\s+.+<\/title>/gim, '');

            //meta
            h = h.replace(/<meta.+>/gim, '');


            var auth = h.match(/<script>(.|\n)+var auth(.|\n)+ <\/script>/im, '')[0];
            //h = h.replace(/\n/gim, '');
            h = h.replace(/<script.+>/gim, '');

            // cut
            // we need to cut only <header> block, connot turn to jQuery, cause we don't want to execute it yet
//            var cutStart = h.indexOf('<div class="b-topbar__obj">')
//                ,h1 = h.substring(0, cutStart)
//                ,head
//                ,body;
            var head, body;
           // h = h1 + '</div></body></html>';

            //head = h.substring(h.indexOf('<head>') + 6, h.indexOf('</head>'));

            head = '';
            // add parent site required scripts if in dev mode
            if (window.devmode === 1){
                //head = '<script type="text/javascript" src="js/kanobu_vendor/apimin.js"></script>' + head;
                head = '<script type="text/javascript" src="js/kanobu_vendor/auth.js"></script>' + head;
                head = '<script type="text/javascript" src="js/kanobu_vendor/knbauth.js"></script>' + head;
                head = '<script type="text/javascript" src="js/kanobu_vendor/sse.js"></script>' + head;
                head = '<script type="text/javascript" src="js/kanobu_vendor/window_controller.js"></script>' + head;
                head = '<script type="text/javascript" src="js/kanobu_vendor/eventsource.js"></script>' + head;
            }else{
                // ... and minifed if not
                head = '<script type="text/javascript" src="js/vendor.js"></script>' + head;
            }

            body = h.match(/<body(.|\r|\S|\n)+<\/body>/gim)[0];
            body = body.replace(/<body [^>]+>|<\/body>/gim,'');
            body += auth;
            //body = body.match(/<header(.|\n)+<\/header>/gim)[0];
            //body += '<audio id="inboxSound" src="success.wav" controls preload="auto" autobuffer></audio>';
            //body += '<div id="' + SSE_CONNECTOR_ID + '"></div>';

            // after this HTML is rendered we can launch our extension
            body += '<script type="text/javascript" src="js/hack/afterinsert.js"></script>';

            return {h: head, b: body};
        }

        $.ajax({
            url         : 'http://kanobu.ru/contact'
            ,cache      : false
            ,success    : function (resp) {
                resp = rewritePage(resp);
                $('head').html(resp.h);
                $('body').html(resp.b);
            }
        });
    };

    me.Sub = new SubExtension( me );
}


function SubTicker( args ){
    var me = this;

    me.run = function() {
        args.fn.apply( args.runScope || this, args.params );
    };

    me.isDisabled =  function(){
        return false;
    };
}

function setItem(key, value, isObject) {
    value = isObject ? JSON.stringify(value) : value;
    try {
        window.localStorage.removeItem(key);
        window.localStorage.setItem(key, value);
    }catch(e) {
        log('Error inside setItem');
        log(e);
    }
}

function getItem(key, asObject) {
    var value;
    try {
        value = window.localStorage.getItem(key);
    }catch(e) {
        log('Error inside getItem() for key:' + key);
        value = 'null';
    }
    return asObject ? JSON.parse(value) : value ;
}


function clearStorage() {
    window.localStorage.clear();
}

function log(txt) {
    console.log(txt);
}

$(document).ready(function(){
    window.Options = new window.Options();
    window.Extension = new window.Extension();
    window.Extension.init();
});