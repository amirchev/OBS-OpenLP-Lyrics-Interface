jQuery(document).ready(function() {
    $.i18n().load( {
	en: 'libs/i18n/en.json',
	es: 'libs/i18n/es.json',
	fr: 'libs/i18n/fr.json'
    } )
    .done( function() { $('html').i18n(); });
});
