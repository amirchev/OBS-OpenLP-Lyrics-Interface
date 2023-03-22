jQuery(document).ready(function() {
    $.i18n().load( {
	fr: 'libs/i18n/fr.json'
    } )
    .done( function() { $('html').i18n(); });
});
