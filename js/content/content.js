/**
 * This script sets up listeners for:
 * 1) user inbox open event (see injectListener.js)
 * 2) background message to cleare "unread" status of the inbox
 */

var teId = 'kf-transevent'              // id of transmitter element
    ,ContentPage = new ContentPage();   // redeclaration is ok, we need it once
$(document).ready(ContentPage.onStart);


function ContentPage(){
    this.onStart = function(){
        var $transmitter = getTransmitter();
        setTransmitter($transmitter);
        setListeners();
    };

    function setTransmitter($comp){
        $comp.click(onTeClick);
    }

    /**
     * Let background process know that it's time to clear unread status
     */
    function onTeClick(){
        CommonFn.sendReq({method:'notif-clear'});
    }

    /**
     * Return or create and return transmitter element
     */
    function getTransmitter(){
        var $buffer = $(teId);

        if ($buffer.length <= 0){
            $('body').append('<div id="' + teId + '" style="display:none;"></div>');
            $buffer = $('#' + teId);
        }

        return $buffer;
    }

    // @deprecated
    function resetTransmitter(){
        getTransmitter().html('');
    }

    /**
     * Listen to background and clear "unread" status, when needed
     */
    function setListeners(){
        var listenerObject = chrome.runtime.onMessage || chrome.extension.onMessage;
        
        listenerObject.addListener(
            function(request, sender, sendResponse) {
                if (!request.method){
                    return;
                }
                switch(request.method){
                    case 'notif-clear':
                        $('li.notifyItem.dropDownItem.headerIcon').removeClass('signalNotify');
                        break;
                }
                sendResponse();
            }
        );
    }

    /**
     * Cut text to needed length
     */
    function doLimText(text, lim, addDots){
        return (text.length > lim) ? ( text.replace(/\s\s+/gim, '').slice(0, lim) + ( addDots ? '...' : '' ) ) : text;
    }

    /**
     * Schedule some function.
     * not used atm
     */
    function schedule(fn, msec){
        if ( window.abortSchedule ){
            return;
        }

        window.abortSchedule = true;

        setTimeout(function(){fn.call();}, msec);
    }
}
