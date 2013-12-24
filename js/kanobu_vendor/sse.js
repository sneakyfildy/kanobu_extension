
/**
 * Server side events controller. Written by kanobu.ru to manage multiple tabs (have 1 active
 * connection).
 * Has no lisence. Ported here for compatibility.
 */
var SseController = function(options) {

	var defaults = {
		url : '/sse/',
		selector : '.sse',
		channelAttr : 'data-sse-channels',
		eventAttr : 'data-sse-events',
		debug : false,
		label : "default",
		type : "json",
		eventPrefix : 'sse.',
		maxErrors: 50
	};

	this.init = function(options) {
		if (!$.eventsource) {
			console.log("jquery eventsource polyfill not found");
			return;
		}

		this.options = $.extend(defaults, options);
		this._errors = 0;

		this.channels = [];
		this.handlers = $(this.options.selector);
		this.compliance = {};

		if (this.handlers.length === 0) {
			if (this.options.debug === true) {
				console.log("no eventsource handlers found on page");
			}
			//return;
		}

		this.collectChannels();
		this.initController();

		return this;

	};

	this.initController = function() {
                // added row
                $('#' + SSE_CONNECTOR_ID).trigger('sseconnect', 'start');

		this.wc = window.wc;

		this.wc.sseMessage = $.proxy(function(message) {
			this._onEventSourceMessage(message);
		}, this);
                window.localStorage.removeItem('ping');
		$(window).on('masterChange.wc', $.proxy(function(event, data){
			if (this.wc.isMaster) {
				this.initEventSource();
			} else {                                
				$.eventsource('close');
			}
		}, this));

		this.wc.masterDidChange();
	};

	this.collectChannels = function() {

		this.handlers.each($.proxy(function(index, element) {
			var handler = $(element);
			handler_channels = handler.attr(this.options.channelAttr);
			handler_events = handler.attr(this.options.eventAttr);
			if (handler_channels && handler_channels.length) {
				var channel_list = handler_channels.split(',');
				for (i in channel_list) {
					var c = $.trim(channel_list[i]);
					if ($.inArray(c, this.channels) === -1) {
						this.channels.push(c);
					}
				}
			}
			if (handler_events && handler_events.length) {
				var event_list = handler_events.split(',');
				for (i in event_list) {
					var e = $.trim(event_list[i]);
					if (!( e in this.compliance)) {
						this.compliance[e] = [];
					}
					this.compliance[e].push(handler);
				}
			}
		}, this));

	};

	this.initEventSource = function() {//debugger;
		// make appropriate query
		function uuid() {
			// generate uuid to append to GET params of connection url
			// this helps to avoid problems with Chrome behaviour -
			// it seems that it caches connections
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}

		var query = $.param({'channels': this.channels, 'uuid': uuid()}, true);

		if (this.options.debug === true) {
			console.log('sse url: ' + this.options.url + '?' + query);
		}

		$.eventsource({
			label : this.options.label,
			url : this.options.url,
			data : query,
			dataType : this.options.type,

			open: $.proxy(this._onEventSourceOpen, this),
			error: $.proxy(this._onEventSourceError, this),
			message: $.proxy(this._onEventSourceMessage, this)
		});

	};

	this._onEventSourceOpen = function() {
		var errorEvent = this.options.eventPrefix + 'open';

                //added row
                $('#' + SSE_CONNECTOR_ID).trigger('sseconnect', 'open');

		if (this.options.debug === true) {
			console.log('sse connection opened');
		}
		this.handlers.each(function(index, element) {
			$(element).trigger(errorEvent);
		});
	};

	this._onEventSourceError = function(err) {
                //added row
                $('#' + SSE_CONNECTOR_ID).trigger('sseconnect', 'error');
                
		if (this.options.debug === true) {
			console.log('sse connection error');
			console.log(err);
		}
		this.handlers.each($.proxy(function(index, element) {
			jQuery(element).trigger(this.options.eventPrefix + 'error', err);
		}, this));

		if (++this._errors >= this.options.maxErrors) {
			$.eventsource('close');
		}
	};

	this._onEventSourceMessage = function(msg, event) {
                var lei = getItem('lastEventId');
               
                if ( lei == event.lastEventId ){
                    return;
                }
                
                setItem('lastEventId', event.lastEventId);
		if (this.options.debug === true) {
			console.log('oneventsource' + msg);
			console.log(event);
		}
		// msg can be null in case of ping sse messages
		if (msg) {
			var eventType = msg[0];
			var eventData = msg[1];
			var customEvent = this.options.eventPrefix + eventType;

			if (this.options.debug === true) {
				console.log("triggering event: " + customEvent);
			}
			if (eventType in this.compliance) {
				var eventHandlers = this.compliance[eventType];
				$.each(eventHandlers, $.proxy(function(index, element) {//debugger;
					$(element).trigger(customEvent, eventData);

				}, this));
			}

			if (this.wc.isMaster) {
				// broadcast to other browser tabs/windows
				this.wc.broadcast('sseMessage', msg);
			}
                        
                        
		}
	};

	return this.init(options);

};

(function(jQuery) {
	jQuery.extend({
		sse: function(options) {
			return new SseController(options);
		}
	});
})(jQuery);
