var URL_PREFIX               = 'http://kanobu.ru'
    ,MIN_HEIGHT_TILL_LOAD   = 250;

$(document).ready(function(){
    Popup = new Popup();
    Popup.init();
});

function Popup(){
    var me = this;

    this.init = function(){
        if (this.inited){
            return;            
        }
        this.renderProfile();
        this.$scroller = $('#scroller');
        this.$loadingIcon = $('.loadingIco');
        initListeners();
        setSelectedTab();
        setTimeout(
        function(){
            loadContent({full:1});
        },500);


        this.inited = true;
    };
    
    this.renderProfile = function(){
        var bg = CommonFn.getBg()
            ,Auth = bg.Auth;
        var $profileButton = $('#profile a.profile');
        if (!Auth || !Auth.user || !Auth.user.name){
            $profileButton.text('Not logged in');
            $profileButton.find('img').hide();
            return;
        }

        $profileButton.find('img').attr('src', Auth.user.avatar);
        $profileButton.attr('href', URL_PREFIX + Auth.user.url);
        $profileButton.html($profileButton.html() + Auth.user.name);
        
        me.setOptionsButtons();
    };
    
    this.setOptionsButtons = function(){
        // TODO refactor        
        var options = CommonFn.getBg().Extension.Sub.options
            ,$optionsItem;
        
        for ( var optionId in options ){
            $optionsItem = $( '[data-option={0}]'.format(optionId) );
            if ( $optionsItem.get(0) ){
                $optionsItem[ options[optionId] ? 'removeClass' : 'addClass' ]('disabled');
            }
        }
        
        $('.kf-button.options a').each(function(){
            var $a = $(this)
                ,titleState = $a.hasClass('disabled') ? '-disabled' : '';
            $a.attr( 'title', $a.attr('data-title' + titleState) );
        });
        
        // @todo remove when unused
        if ( !chrome.notifications ){
            $('.kf-button.visual').hide();
        }
    };
    
    this.onScroll = function(){
        var $this       = me.$scroller
            ,$bottom    = $('.messagesBottomLine')
            ,willLoad;
        
        if ( $this.get(0).scrollHeight - $this.get(0).scrollTop - $this.height() < MIN_HEIGHT_TILL_LOAD ){
            willLoad = !me.loading && loadContent();
        }

        if (willLoad || $this.get(0).scrollHeight - $this.get(0).scrollTop - $this.height() > 0){
            if ( $bottom.get(0) ){
                var $p = $bottom.parent();
                $bottom.css({top: $p.scrollTop() + $p.height() - 28 });
            }
        }
    };

    function initListeners(){
        $(document).on('click', '.kf-button.options a', me.onOptionsClick);
        $(document).on('click', '.kf-button.tool a', me.onToolClick);
        $(document).on('click', 'a', me.onLinkClick);
        $(document).on('click', '.ui-tablist--item', me.onTabClick);
    }
    
    function initScrollListener(){
        me.$scroller.scroll( null, me.onScroll );        
    }
    
    //this - clicked el
    this.onOptionsClick = function(e){
        e.preventDefault();
        e.stopPropagation();
        
        var $optionsEl = $(this);
        
        $optionsEl.toggleClass('disabled');
        
        var optionId = $optionsEl.attr('data-option')
            ,optionValue = !$optionsEl.hasClass('disabled');
            
        CommonFn.getBg().Options.setOneOption(optionId, optionValue);
        
        me.setOptionsButtons();       
    };
    
    //this - clicked el
    this.onToolClick = function(e){
        e.preventDefault();
        e.stopPropagation();
 
        me.doToolAction( $(this).attr('data-action') );
    };
    this.doToolAction = function(action){
        var actions = {
            'reload' : function(){
                CommonFn.getBg().Extension.reload(true);
            }
        };
        
        if (actions[action]){
            actions[action].call();
        }
    };
    this.onTabClick = function(){
        var selectedClass = 'it-is-selected';

        $('.ui-tablist--item').removeClass(selectedClass);
        $(this).addClass(selectedClass);
        setSelectedTab();
        loadContent({full:1});
    };

    function setSelectedTab(){
        me.URL = URL_PREFIX + $('.it-is-selected').attr('data-url');
    }
    
    this.onLinkClick = function(e){
        if ( $(this).hasClass('internal-link') || $(this).hasClass('no-href') ){
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        var href = this.getAttribute('href');

        if ( href.indexOf('http') < 0 ){
            href = 'http://kanobu.ru' + href;
        }

        CommonFn.goToLink(href);

    };
    
    this.onGetNotif = function(data, res){
        me.setStopLoading();
        
        var $appendEl = me.getInsertEl()
            ,appendData = res;
        if ( typeof res === 'string' && res.indexOf('<input id="id_password"') >= 0 ){
            appendData = '<div style="margin-top:100px;padding:20px;color:#fff">Not logged. Please log on to <a href="http://kanobu.ru">kanobu.ru</a> and reload the extension</div>';
            me.$scroller.append(appendData);
            return;
        }

        if ( typeof res === 'string' && res.indexOf('<title>\u041F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435</title>') >= 0 ){
            appendData = '<div style="margin-top:100px;padding:20px;color:#fff"><a href="http://kanobu.ru">kanobu.ru</a> is not available at the moment. Try later. Do not forget to reload an extension!</div>';
            me.$scroller.append(appendData);
            return;
        }

        if ( data.full ){
            $appendEl = me.$scroller;
            $appendEl.html('');
        }else{
            appendData = res.list;
            me.setNextPage(res.nextpage);
        }
        
        $appendEl.append(appendData);        
        this.afterAppend(appendData);
    };

    this.afterAppend = function(appendData){
        initScrollListener();
        this.onScroll();
        if (appendData.length > 0){
            CommonFn.getBg().Extension.Sub.clearNotif();
        }


    };

    this.getInsertEl =function(){
        return me.$scroller.find('ul.activityList');
    };
    this.setNextPage = function(page){
        me.getInsertEl().attr('data-next-page', page);
    };
    this.getNextPage = function(){
        return me.getInsertEl().attr('data-next-page');
    };

    this.onNotifFail = function(){
        me.setStopLoading();
        this.onGetNotif( {full:1}, 'Error getting data from kanobu' );
        console.log('Error getting notif data from kanobu');
    };
    

    function loadContent(data){
        me.setStartLoading();
        var page;
        if (!data){
            var nextPage = me.getNextPage();

            if (!nextPage){
                me.setStopLoading();
                return false;
            }

            page = {
                page       : nextPage
            };
        }
        $.ajax({
            url     : me.URL
            ,data   : data || page
            ,cache  : false
            ,timeout: 10000
            ,headers: {'X-Requested-With': 'XMLHttpRequest'}
            ,success: me.onGetNotif.bind(me, data || page)
            ,failure: me.onNotifFail
        });

        return true;
    }

    this.setStartLoading = function(){
        me.$loadingIcon.show();
        me.loading = true;
    };

    this.setStopLoading = function(){
        me.$loadingIcon.hide();
        me.loading = false;
    };
}