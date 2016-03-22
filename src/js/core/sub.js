/**
 * define real extension here
 */
var SSE_CONNECTOR_ID    = 'sse_connector'
    ,URL_PREFIX         = 'http://kanobu.ru'
    ,SSE_URL            = 'http:/kanobu.ru/sse/';

function SubExtension( base ){
    var me = this;
    this.unread = 0;
    this.sse = {};
    this.colors = {
        unread      : '#00a305'
        ,connected  : '#0343a3'
        ,connecting : '#999999'
        ,error      : '#ad0000'
    };

    me.base = base;
    me.appData = {
        mainInt                 : 5, //sec
        serverOptionsInt        : 3600 // 1 hour
        ,serverOptionsUrl        : 'http://www.bloknotus.com/extension/kanobu/options/'
    };

    //@@version
    me.version = {
        major   : 2,
        minor   : 0
    };

    me.globals = {
        defaultBadgeTitle  : _txt('Kanobu')
    };

    /**
     * Desktop notification manager.
     */
    me.Notifier = {
        def         : {
            notify          : function( item ){
                me.Notifier.doNotify( {html: item.text, header: item.title || _txt('Notification'), link: item.link} );
            }
        }
        ,doNotify    : function( msg ){
           msg.html = msg.html.replace('&laquo;', '"').replace('&raquo;', '"').replace('&nbsp;', ' ');
           msg.header = msg.header.replace('&laquo;', '"').replace('&raquo;', '"').replace('&nbsp;', ' ');

            var opt = {
                type    : 'basic',
                title   : msg.header,
                message : msg.html,
                iconUrl : '/img/popup-notif-icon.png',
                buttons : msg.link ? [
                    {
                        title       : _txt('Go to')
                        ,iconUrl    : '/icon.ico'
                    }
                ] : null
            };

            if (chrome.notifications){
                chrome.notifications.create('', opt, function(id){
                    me.notifShown = me.notifShown || {};
                    me.notifShown[id] = msg.link;
                });
            }
        }
    };

    /**
     * Set of function to call by setTimeout
     */
    me.initTickers = function(){
        me.Tickers = {
            serverOptionsTicker: new SubTicker({
                fn          : base.Ticker.ajaxTickByTime,
                params      : [me.appData.serverOptionsUrl, null, base.storeServerOptions, 'server_options_ts', me.appData.serverOptionsInt],
                runScope    : base
            })
        };
    };


   me.addChromeListeners   = function(){
        chrome.extension.onRequest.addListener(
            function(request, sender) {
                switch ( request.method ){
                    case  'notif-set'  :
                        me.setNotif(request.data);
                        break;
                    case  'notif-clear'  :
                        me.clearNotif();
                        break;
                }

            });

        if (chrome.notifications){
            chrome.notifications.onButtonClicked.addListener(function(id){
                var url = me.notifShown[id];
                chrome.notifications.clear(id, function(){});
                CommonFn.goToLink(url);
            });

            chrome.notifications.onClosed.addListener(function(id){
                delete me.notifShown[id];
                //me.decreaseUnread();
            });
        }
    };

    /**
     * Set badge text and title according to amount of new messages
     */
    this.setNotif = function(notifData, type){
        var prevTitle           = me.setBadgeTitleByStatus(me.lastStatus)
            ,$notifData          = $(notifData)
            ,link               = $notifData.find('a.notifyLink').attr('href')
            ,titlePreviewText   = me.getPreviewText($notifData, type)
            ,notifTitle         = me.getNotifTitle(type);

        link = link ? (URL_PREFIX + link) : false;
        me.unread++;

        if ( me.unread ){
            titlePreviewText +=  '\n' + _txt('Unread') + ': ' + me.unread;
        }

        me.base.sbt( titlePreviewText + '\n' + prevTitle );
        me.base.sb(me.unread, this.colors.unread);
        me.checkUnreadOnLoadAfterSetBadge(me.unread);

        // @todo refactor options applying
        if (me.options.soundOn){
            me.base.Tech.playInboxSound();
        }

        if (me.options.visualAlertOn){
            me.Notifier.def.notify({
                text    : titlePreviewText
                ,title  : notifTitle
                ,link   : link
            });
        }
    };

    this.clearNotif = function(){
        me.unread = 0;
        me.hasUnreadOnLoad = false;
        me.lastPreviewText = false;
        me.setBadgeTitleByStatus(me.lastStatus);
        me.clearChromNotifications();
        me.clearContentPages();
    };

    this.decreaseUnread = function(amount){
        amount = amount || 1;

        if (me.unread > 0){
            me.unread -= amount;
            me.base.sb(me.unread, false);
        }

        me.checkUnreadOnLoadAfterSetBadge();
        return me.unread;
    };

   /**
     * listeners initialisation
     */
    this.initListeners    = function(){
        this.addChromeListeners();
        this.addCommonListeners();
    };

    this.addCommonListeners = function(){
        // listens for connection status change (not messages)
        $('#' + SSE_CONNECTOR_ID).on('sseconnect', {scope: this}, this.onSseConnectionChange);
    };

    this.onSseConnectionChange = function(e, status){
        me.lastStatus = status;
        me.setBadgeTitleByStatus(status);

        if (me.onSseHandler[status]){
            me.onSseHandler[status].call(me);
        }
    };

    this.onSseHandler = {
        'open'      : function(){
            me.sse.isOk = true;
            if ( me.wasError ){
                me.base.reload();
                me.wasError = false;
            }
        }
        ,'error'     : function(){
            me.wasError = true;
            me.sse.isOk = false;
        }
    };

    this.onSseMessage = function(e, data){
        me.setNotif(data.notif, e.namespace);
    };

    this.setBadgeTitleByStatus = function(statusId){
        var status = this.SSEtext[statusId];
        var text = status
            ,fn;

        if ( status.text && status.fn ){
            text = status.text;
            fn = status.fn;
        }
        text = _txt('Status') + ': ' + text;
        this.base.sbt( text );

        if (fn){
            fn.call(this);
        }

        this.checkUnreadOnLoadAfterSetBadge();
        return text;
    };

    /**
     * This one must check if there were unread messages on extension start (reload)
     * Because we cannot know how many there are (by design), we must place some
     * identifier in a badge.
     */
    this.checkUnreadOnLoadAfterSetBadge = function(){
        var count = me.unread;
        if (me.hasUnreadOnLoad){
            me.base.sb(count ? (count + '+') : '?', false);
            me.base.sbt(
                me.base.lastBadgeTitle +
                    '\n' +
                    '"{0}"='.format(count ? '+' : '?' ) +
                    _txt('Got not counted unread messages!')
                ,true
            );
        }
    };

    /**
     * When new content is written to background.html, we are ready to start
     */
    this.onLoadInjected     = function(){
        this.initTickers();
        this.initListeners();
        this.initInjected(); // all stuff with SSE must be initiated
    };

    this.initInjected = function(){
        this.setVars();
        this.beautifyPage();
        this.setSseListeners();
        triggerWhatWeNeed();
    };

    this.setVars        = function(){
    };

    /**
     * Replace key HTML block. Just for pleasant view in developer tools, nothing more
     */
    this.beautifyPage = function(){
        $('.notifyItem.dropDownItem.headerIcon').appendTo('body');
        //$('header').remove();
    };

    this.setSseListeners    = function(){
        $('#activityNotifs').on('sse.notif', {scope: this}, this.onSseMessage);
        $('#imNotifs').on('sse.im_message', {scope: this}, this.onSseMessage);
        $('#friendsNotifs').on('sse.invite', {scope: this}, this.onSseMessage);
    };

    function triggerWhatWeNeed(){
        me.checkUnreadOnLoad();
        // init eventsource
        if(SSE_URL){
            $.sse({url:SSE_URL,selector:'.sse'});
        }
    }

    this.checkUnreadOnLoad  = function(){
        this.hasUnreadOnLoad = $('li.notifyItem.dropDownItem.headerIcon').hasClass('signalNotify');
    };

    this.setConnecting  = function(){
        this.base.sb('...', this.colors.connecting);
        // already ready to get msg
        this.setReadyForMessage(true);
    };

    this.setConnected   = function(){
        this.base.sb( (this.unread + '') || 0, this.colors.connected);
    };

    this.setError       = function(){
        this.base.sb('err', this.colors.error);
    };

    this.SSEtext        = {
        'start'     : {
            text        : _txt('Connecting to Kanobu server... \nWait or reload the extension.')
            ,fn         : this.setConnecting
        }
        ,'open'     :{
            text        : _txt('Connected to Kanobu server successfully')
            ,fn         : this.setConnected
        }
        ,'error'    :{
            text        :  _txt('Error. Disconnected from Kanobu server')
            ,fn         : this.setError
        }
    };

    this.setReadyForMessage = function(flag){
        this.ready = !!flag;
    };

    this.getPreviewText     = function($notifData, type){
        var text;

        switch (type){
            case 'invite'   :
                $notifData.find('.inviteControls').remove();
                text = $notifData.text();
            break;
            default         :
                text = $notifData.text();
        }

        return text.replace(/\s\s+/gim,' ');
    };

    this.getNotifTitle      = function(type){
        var titles = {
            'im_message'    : _txt('Message')
            ,'notif'        : _txt('Notification')
            ,'invite'       : _txt('Invite')
        };

        return titles[type] || null;
    };

    this.clearContentPages      = function(){
        CommonFn.eachKanobuTab(me.clearContentPageNotif);
    };

    this.clearContentPageNotif =  function(tab){
        chrome.tabs.sendMessage(tab.id, {method: 'notif-clear'}, $.noop);
    };

    this.clearChromNotifications = function(){
        me.notifShown = {};

        function removeNotif(notifsObj){
            for ( var id in notifsObj ){
                chrome.notifications.clear(id, $.noop);
            }
        }
        if ( chrome.notifications ){
            chrome.notifications.getAll(removeNotif);
        }
    };

    this.base.Tech.setBadgeTitle( _txt('Starting extension...') );
}
