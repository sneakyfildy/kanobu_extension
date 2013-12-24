/**
 * This script runs after new content is inserted into background.html
 * It lets the extension know, that we can proceed and changes relative url "/sse/"
 * to absolute.
 */
if (Extension.Sub){
    SSE_URL = 'http:/kanobu.ru/sse/';
    setTimeout(function(){
        Extension.Sub.onLoadInjected();
    }, 1000);
}