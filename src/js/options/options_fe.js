// front-end options engine
var ls = CommonFn.getBg()
    ,curOpt = ls.Options.getOptions();

$(document).ready(function(){
        getOpt();
        if (document.location.href.indexOf('addBack') >= 0){
            addBackBtn();
        }
    }
);

function addBackBtn(){
    var $btn = $('<a href="popup.html" class="backBtn">\u041D\u0430\u0437\u0430\u0434</a>');
    $('#contentArea').append($btn);
}

function getOpt(){
    for (var i in curOpt){
        if ( curOpt[i] ){
            $('#' + i).prop('checked', true);
        }
    }
}

//options change listener
$(document).on('change', '.chB', function(clicked){
    var id = $(this).prop('id'),
    val = ($(this).prop('checked')) ? true : false;
    ls.Options.setOneOption(id, val);
});