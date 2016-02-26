/*! Kanobu_chrome 26-02-2016 */
function WindowController(){this.becomeMaster(),$(window).on("storage",$.proxy(this.onStorageEvent,this)).on("unload",$.proxy(this.destroy,this))}!function(a,b){a.extend(a.ajaxSettings.accepts,{stream:"text/event-stream"});var c={defaults:{label:null,url:null,events:null,retry:500,open:a.noop,message:a.noop,error:a.noop},setup:{stream:{},lastEventId:0,hasNativeSupport:!1,retry:500,history:[],options:{}},cache:{}},d={"public":{close:function(a){var b={};if(!a||"*"===a){for(var d in c.cache)c.cache[d].hasNativeSupport&&c.cache[d].stream.close();return c.cache={},c.cache}for(var d in c.cache)a!==d?b[d]=c.cache[d]:c.cache[d].hasNativeSupport&&c.cache[d].stream.close();return c.cache=b,c.cache},streams:function(a){return a&&"*"!==a?c.cache[a]||{}:c.cache}},_private:{openEventSource:function(b){var d=b.label;return c.cache[d].stream.addEventListener("open",function(a){c.cache[d]&&(this.label=d,c.cache[d].options.open.call(this,a))},!1),c.cache[d].stream.addEventListener("error",function(a){c.cache[d]&&(this.label=d,c.cache[d].options.error.call(this,a))},!1),c.cache[d].stream.addEventListener("message",function(e){var f,g=null;c.cache[d]&&(f="json"===b.dataType?a.parseJSON(e.data):e.data,g=f,this.label=d,c.cache[d].lastEventId=e.lastEventId,c.cache[d].history.push([e,g]),c.cache[d].options.message.call(this,g?g:null,e))},!1),c.cache[d].stream},openPollingSource:function(b){var e,f=b.label;if(c.cache[f]){var g=c.cache[f].lastEventId?c.cache[f].lastEventId:null;e=a.ajax({type:"GET",url:b.url,data:b.data,beforeSend:function(a){null!==g&&a.setRequestHeader("Last-Event-Id",g),c.cache[f]&&(this.label=f,c.cache[f].options.open.call(this))},error:function(a){c.cache[f]&&(this.label=f,c.cache[f].options.error.call(this,a))},success:function(e){var f=b.label,g=e.split("\n\n");for(i in g){var h=g[i];if(""!==h){rows=h.split("\n"),lines=a.grep(rows,function(a){return""!==a});var j={lastEventId:null,data:null,retry:null,type:"message",timeStamp:(new Date).getTime()},k=[],l=null,m={id:/^id:/,event:/^event:/,retry:/^retry:/,data:/^data:/};a.isArray(lines)&&(a.each(lines,function(b,c){m.event.test(c)?(content=a.trim(c.split(":").slice(1).join(":")),content.length&&(j.eventType=content)):m.id.test(c)?(content=a.trim(c.split(":").slice(1).join(":")),content.length&&(j.lastEventId=content)):m.retry.test(c)?(content=a.trim(c.split(":").slice(1).join(":")),content&&/^\d+$/.test(content)&&(j.retry=parseInt(content))):m.data.test(c)&&(content=c.split(":").slice(1).join(":"),content.length&&k.push(a.trim(content)))}),k.length&&(h=k.join("\n"),j.data=h,l="json"===b.dataType?a.parseJSON(h):h)),c.cache[f]&&(this.label=f,c.cache[f].retry=c.cache[f].options.retry=j.retry,j.lastEventId&&(c.cache[f].lastEventId=c.cache[f].options.lastEventId=j.lastEventId),c.cache[f].history.push([j,l]),c.cache[f].options.message.call(this,l,j))}}c.cache[f]&&setTimeout(function(){d._private.openPollingSource.call(this,b)},c.cache[f]&&c.cache[f].retry||b.retry)},cache:!1,timeout:5e4})}return e}}},e=b.EventSource?!0:!1;a.eventsource=function(b){var f,g;if(b&&!a.isPlainObject(b)&&d.public[b])return d.public[b](arguments[1]?arguments[1]:"*");if(b.data=b.data&&a.isPlainObject(b.data)?a.param(b.data):b.data,!b.url||"string"!=typeof b.url)throw new SyntaxError("Not enough arguments: Must provide a url");return b.label=b.label?b.label:b.url+"?"+b.data,g=a.extend({},c.defaults,b),c.cache[g.label]={options:g},f=e?new EventSource(g.url+(g.data?"?"+g.data:"")):d._private.openPollingSource(g),c.cache[g.label]=a.extend({},c.setup,{stream:f,hasNativeSupport:e,options:g}),e&&d._private.openEventSource(g),c.cache},a.each(["close","streams"],function(b,c){a.eventsource[c]=function(b){return a.eventsource(c,b||"*")}})}(jQuery,window),WindowController.prototype={isMaster:!0,onStorageEvent:function(a){var b,c=a.originalEvent.key,d=0;if("ping"===c){try{d=+localStorage.getItem("ping")||0}catch(e){}d?this.loseMaster():(clearTimeout(this._ping),this._ping=setTimeout($.proxy(this.becomeMaster,this),~~(1e3*Math.random())))}else if("broadcast"===c)try{b=JSON.parse(localStorage.getItem("broadcast")),this[b.type](b.data)}catch(e){}},destroy:function(){if(this.isMaster)try{localStorage.setItem("ping",0)}catch(a){}$(window).off("storage unload",this.handleEvent)},becomeMaster:function(){try{localStorage.setItem("ping",Date.now())}catch(a){}clearTimeout(this._ping),this._ping=setTimeout($.proxy(this.becomeMaster,this),2e4+~~(1e4*Math.random()));var b=this.isMaster;this.isMaster=!0,b||this.masterDidChange()},loseMaster:function(){clearTimeout(this._ping),this._ping=setTimeout($.proxy(this.becomeMaster,this),35e3+~~(2e4*Math.random()));var a=this.isMaster;this.isMaster=!1,a&&this.masterDidChange()},broadcast:function(a,b){try{localStorage.setItem("broadcast",JSON.stringify({id:"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=0|16*Math.random(),c="x"==a?b:8|3&b;return c.toString(16)}),type:a,data:b}))}catch(c){}},masterDidChange:function(){$(window).trigger("masterChange.wc")}},window.wc=new WindowController;var SseController=function(a){var b={url:"/sse/",selector:".sse",channelAttr:"data-sse-channels",eventAttr:"data-sse-events",debug:!1,label:"default",type:"json",eventPrefix:"sse.",maxErrors:50};return this.init=function(a){return $.eventsource?(this.options=$.extend(b,a),this._errors=0,this.channels=[],this.handlers=$(this.options.selector),this.compliance={},0===this.handlers.length&&this.options.debug===!0&&console.log("no eventsource handlers found on page"),this.collectChannels(),this.initController(),this):(console.log("jquery eventsource polyfill not found"),void 0)},this.initController=function(){$("#"+SSE_CONNECTOR_ID).trigger("sseconnect","start"),this.wc=window.wc,this.wc.sseMessage=$.proxy(function(a){this._onEventSourceMessage(a)},this),window.localStorage.removeItem("ping"),$(window).on("masterChange.wc",$.proxy(function(){this.wc.isMaster?this.initEventSource():$.eventsource("close")},this)),this.wc.masterDidChange()},this.collectChannels=function(){this.handlers.each($.proxy(function(a,b){var c=$(b);if(handler_channels=c.attr(this.options.channelAttr),handler_events=c.attr(this.options.eventAttr),handler_channels&&handler_channels.length){var d=handler_channels.split(",");for(i in d){var e=$.trim(d[i]);-1===$.inArray(e,this.channels)&&this.channels.push(e)}}if(handler_events&&handler_events.length){var f=handler_events.split(",");for(i in f){var g=$.trim(f[i]);g in this.compliance||(this.compliance[g]=[]),this.compliance[g].push(c)}}},this))},this.initEventSource=function(){function a(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=0|16*Math.random(),c="x"==a?b:8|3&b;return c.toString(16)})}var b=$.param({channels:this.channels,uuid:a()},!0);this.options.debug===!0&&console.log("sse url: "+this.options.url+"?"+b),$.eventsource({label:this.options.label,url:this.options.url,data:b,dataType:this.options.type,open:$.proxy(this._onEventSourceOpen,this),error:$.proxy(this._onEventSourceError,this),message:$.proxy(this._onEventSourceMessage,this)})},this._onEventSourceOpen=function(){var a=this.options.eventPrefix+"open";$("#"+SSE_CONNECTOR_ID).trigger("sseconnect","open"),this.options.debug===!0&&console.log("sse connection opened"),this.handlers.each(function(b,c){$(c).trigger(a)})},this._onEventSourceError=function(a){$("#"+SSE_CONNECTOR_ID).trigger("sseconnect","error"),this.options.debug===!0&&(console.log("sse connection error"),console.log(a)),this.handlers.each($.proxy(function(b,c){jQuery(c).trigger(this.options.eventPrefix+"error",a)},this)),++this._errors>=this.options.maxErrors&&$.eventsource("close")},this._onEventSourceMessage=function(a,b){var c=getItem("lastEventId");if(c!=b.lastEventId&&(setItem("lastEventId",b.lastEventId),this.options.debug===!0&&(console.log("oneventsource"+a),console.log(b)),a)){var d=a[0],e=a[1],f=this.options.eventPrefix+d;if(this.options.debug===!0&&console.log("triggering event: "+f),d in this.compliance){var g=this.compliance[d];$.each(g,$.proxy(function(a,b){$(b).trigger(f,e)},this))}this.wc.isMaster&&this.wc.broadcast("sseMessage",a)}},this.init(a)};!function(a){a.extend({sse:function(a){return new SseController(a)}})}(jQuery);var Auth={user:null,notifTimeout:null,animationInProgress:!1,msgAuth:"Войдите на сайт, чтобы <%= action %>",msgNotConfirmed:"Подтвердите свой email, чтобы <%= action %>",msgBanned:'Вас временно забанили. <a href="mailto:kanobu@kanobu.ru">Вопросы?</a>',required:function(a,b,c){if(c="undefined"==typeof c?!1:c,"undefined"==typeof b)return Auth.notify(a),d.hasAccess(c);var d=this;return function(){if(d.hasAccess(c))return b.apply(this,arguments);var e=arguments[0];"function"==typeof e.preventDefault&&e.preventDefault(),Auth.notify(a)}},confirmed:function(a,b){return this.required(a,b,!0)},hasAccess:function(a){return a="undefined"==typeof a?!0:a,this.user&&!this.user.banned&&(!a||a&&this.user.confirmed)},notify:function(a){var b=this.getMessage(a);this.user?$(".profileItem").notify(b,"bottom"):$(".anonymous .loginItem").notify(b,"bottom")},getMessage:function(a){var b;return b=this.user?this.user.confirmed?this.user.banned?this.msgBanned:"":this.msgNotConfirmed:this.msgAuth,_.template(b,{action:a})}};!function(a){a.fn.authRequired=function(){Auth.hasAccess()||this.each(function(){var b=a(this).data("auth-action");a(this).disable().click(function(){Auth.notify(b)})})},a.fn.disable=function(){var b=a();return this.each(function(c,d){var e=a(d).css("opacity",.4);"absolute"!=e.css("position")&&e.css("position","relative");var f=e.wrapAll(a("<div>").css({position:e.css("position"),left:e.css("left"),top:e.css("top"),right:e.css("right"),bottom:e.css("bottom"),width:e.outerWidth(!0),height:e.outerHeight(!0),"float":e.css("float")})).parent(),g=a("<div>").css({position:"absolute",left:0,top:0,width:"100%",height:"100%",zIndex:100});g.appendTo(f),b=b.add(g)}),b}}(jQuery),$(function(){var a=a||"";"undefined"!=typeof knbApi&&($(".auth_trigger").on("click",function(b){b.preventDefault(),knbApi.showAuth({c_app_id:a,opened:!0,iframe:!0})}),$(".logout_trigger").on("click",function(a){a.preventDefault(),knbApi.authLogout()}))});