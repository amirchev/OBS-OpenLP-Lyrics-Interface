jQuery(document).ready(function() {
    $.i18n().load( {
        en: 'en.json',
        es: 'es.json'
    } )
    .done( function() { $('html').i18n(); });
});