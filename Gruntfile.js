(function() {
    'use strict';
    module.exports = function(grunt) {
        var i = 0
        ,defaultOptions = {
            curly: true,
            eqeqeq: true,
            immed: true,
            latedef: 'nofunc',
            newcap: true,
            noarg: true,
            nonew: true,
            sub: true,
            undef: true,
            boss: true,
            eqnull: true,
            camelcase: true,
            quotmark: true,
            
            // lax
            laxcomma: true,
                    
            // environment
            browser: true,
            devel: true,
            jquery: true,
            ignores: [
                'js/jquery/*.js'
                ,'js/kanobu_vendor/*.js'
            ]
        }
        ,jshintGlobals = {
            module: true,
            require: true,
            define: true,
            requirejs: true,
            describe: true,
            expect: true,
            it: true,
            console: true
        }
        ,warningSupress = [
            // '-W003'		// use like this
        ]
        ,projectGlobals = [
                'chrome'
                ,'Extension'
                ,'SubExtension'
                ,'SubTicker'
                ,'Popup'
                ,'Options'
                ,'ContentPage'
                ,'CommonFn'
                ,'_txt'
                ,'sendResponse'
                ,'SSE_CONNECTOR_ID'
                ,'SSE_URL'
                // bad @todo refactor
                ,'getItem'
                ,'setItem'
        ];

        for (i = 0; i < projectGlobals.length; i++) {
            jshintGlobals[ projectGlobals[i] ] = true;
        }

        for (i = 0; i < warningSupress.length; i++) {
            defaultOptions[ warningSupress[i] ] = true;
        }

        defaultOptions.globals = jshintGlobals;
        
        var jsHintFiles = ['Gruntfile.js', 'js/*.js', 'js/**/*.js']
            ,uglifyFilesConfig = {}
            // files to concat <where : [what files]>
            ,concatFilesConfig = {
                '<%= pkg.buildPath %>js/hack/injectListener.js': ['js/hack/injectListener.js']
                ,'<%= pkg.buildPath %>js/analytics.js': ['js/analytics.js']
                ,'<%= pkg.buildPath %>js/hack/afterinsert.js': ['js/hack/afterinsert.js']
                ,'<%= pkg.buildPath %>js/background.js': [
                  'js/jquery/jquery203.js'
                  ,'js/text/text.js'
                  ,'js/tech/*.js'
                  ,'js/tweaks/*.js'
                  ,'js/core/*.js'
                  ,'js/options/options_bg.js'
                ]
                ,'<%= pkg.buildPath %>js/content.js': [
                  'js/jquery/jquery203.js'
                  ,'js/tech/extend.js'
                  ,'js/tech/common_func.js'
                  ,'js/content/content.js'
                ]
                ,'<%= pkg.buildPath %>js/popup.js': [
                  'js/jquery/jquery203.js'
                  ,'js/tech/extend.js'
                  ,'js/tech/common_func.js'
                  ,'js/popup/popup.js'
                ]
                ,'<%= pkg.buildPath %>js/options.js': [
                  'js/jquery/jquery203.js'
                  ,'js/tech/common_func.js'
                  ,'js/options/options_fe.js'
                ]
		// order is important
                ,'<%= pkg.buildPath %>js/vendor.js': [
                  'js/kanobu_vendor/2.js'
                  ,'js/kanobu_vendor/auth.js'
                  ,'js/kanobu_vendor/sse.js'                        
                  ,'js/kanobu_vendor/window_controller.js'
                  ,'js/kanobu_vendor/eventsource.js'                        
                  ,'js/kanobu_vendor/1.js'
                ].reverse()                
            };
			
        // uglify all minifed stuff
        for (var concatPath in concatFilesConfig){
            uglifyFilesConfig[concatPath] = [concatPath];
        }
		
         // now add not uglify files
        //concatFilesConfig['<%= pkg.buildPath %>manifest.json'] = ['manifest.' + build + '.json'];

        
        grunt.initConfig({
            pkg		: grunt.file.readJSON('package.json')
            ,jshint	: {
                all         : jsHintFiles
                ,options    : defaultOptions
            }
            ,watch	: {
                files		: jsHintFiles,
                tasks		: 'jshint'
            }
            ,concat	: {
                options		: {
                  separator		: ';'
                }
                ,all		: {
                    files		: concatFilesConfig
                  }
              }
              ,uglify: {
                options		: {
                  banner		: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
                },
                dist		: {
                  files			: uglifyFilesConfig
                }
              }
        });
        
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-watch');
		
		// no watch for default task atm
        grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
    };
}());
