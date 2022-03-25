$(document).ready(function(){
    $("input#email").focus(function(){
        $("div#mail-err").css("display", "none");
    });
    $("input#password").focus(function(){
        $("div#psw-err").css("display", "none");
    });
    $("input").focus(function(){
        $("div.msg_err").css("display", "none");
    });
});


