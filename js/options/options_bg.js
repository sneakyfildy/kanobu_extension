// back-end options engine
function Options(){
    this.getOptions = function(){
        var options = false,
            defOptions = this.getDefaultOptions() || {},
            serverOptions = {};

        try{
            options = JSON.parse( getItem('options') );
        }catch(e){
            options = defOptions;
        }

        options = CommonFn.applyIf(options, defOptions);

        try{
            serverOptions = JSON.parse( getItem('server_options') );
        }catch(e){}

        options = CommonFn.apply(options, serverOptions);
        return options || this.getDefaultOptions();
    };

    /**
     * get array of options by ids
     * ids - object/array
     */
    this.getOptionsById = function( ids ){
        var options = this.getOptions(),
            res = {};

        for (var i in ids){
            res[ids[i]] = options[ids[i]];
        }

        return res;
    };

    /** 
     * set all options
     * request - object
     */
    this.setOptions = function(request){
        var options = request.options || request,
            serverOptions;

        try{
            serverOptions = JSON.parse( getItem('server_options') );
        }catch(e){
            serverOptions = {};
        }

        options = CommonFn.apply( options, serverOptions );
        setItem('options', JSON.stringify( options ));

        return options;
    };

    /**
     * set one option
     * oId - id of option, string
     * oVal - value, any type
     */
    this.setOneOption = function(oId, oVal){
        var curOpts = this.getOptions(),
            serverOpts;

        curOpts[oId] = oVal;
        try{
            serverOpts = JSON.parse( getItem('server_options') );
        }catch(e){
            serverOpts = {};
        }

        curOpts = CommonFn.apply(curOpts, serverOpts);

        setItem('options', JSON.stringify(curOpts));
        Extension.Sub.options = curOpts;

        return curOpts;

    };

    /**
     * get default extension options
     * returns just static object
     */
    this.getDefaultOptions = function(){
        var options = {
            'visualAlertOn'             : true,
            'soundOn'                   : true,
            'smartNav'                  : true,
            'autoReloadOn'              : true
        };

        return options;
    };

    /**
     * get and than set default options
     * like 'reset'
     */
    this.setDefaultOptions = function(){
        var res = {
            options: this.getDefaultOptions()
        };

        this.setOptions(res);
        return true;
    };
}