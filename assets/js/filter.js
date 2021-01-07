$(function(){
    $('.receiverfilter').find('input, select').on('change', function(e) {
        $(e.target).closest('form').submit();
    });
});