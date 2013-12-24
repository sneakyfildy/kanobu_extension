/**
 * This script set listener in opened tab with kanobu.ru web-site
 * onto drop-down user activity list (inbox).
 * When inbox is open it transmits the event to our custom element, which is set
 * to have another listener in our extension's content page scope.
 * So, when list is open, we can catch it in the content page script (content.js)
 * 
 * @param {Function} injectedFunctionCode
 */
function inject( injectedFunctionCode ) {
    var t = document.createElement('script');
    t.setAttribute('type', 'application/javascript');
    t.textContent = '(' + injectedFunctionCode + ')();';
    if (document.body){
        document.body.appendChild(t);
        document.body.removeChild(t);
    }
}

// window.h is a flag that insert have been done already, cause of chrome.tabs.onUpdate is async.
if( !window.kanoformerListenersInserted ){
    window.kanoformerListenersInserted = true;
    inject(function (){
            $('.notifyItem.dropDownItem.headerIcon').on('open.dropdown', function(el, data){
                $('#kf-transevent').trigger('click');
            });
        }
    );
}