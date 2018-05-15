'use strict'


window.onload = (function (win, doc) {

	doc.jlettvin = doc.jlettvin || {};

	// -------------------------------------------------------------------------
	var TeX = function () {
		const fmt = '<hr /><small><small>[{}]</small></small><br />';
		var body    = doc.body;
		var head    = doc.head;
		var sources = doc.getElementsByClassName ('TeX');

		// source conversion
		for (var source of sources) {
			var target       = doc.createElement ('span');
			var TeXsrc       = source.innerHTML;
			var title        = source.id ? fmt.replace ('{}', source.id) : "";
			var content      = doc.jlettvin.TeX.TeXsrc (TeXsrc);
			target.innerHTML = title + content;
			body.appendChild (target);
		}

		{ // reload button
			var reload          = doc.createElement ('button');
			reload.innerHTML    = 'reload';
			reload.setAttribute ('onclick', 'location.reload(true)');
			body.appendChild    (reload);
		}
	} // TeX

	// -------------------------------------------------------------------------
	var loadJS = function (url, fun, loc) {
		var script                = doc.createElement ('script');
		script.src                = url;
		script.onload             = fun;
		script.onreadystatechange = fun;
		loc.appendChild           (script);
	} // loadJS

	// -------------------------------------------------------------------------
	var loadedCall = function () { TeX (); }

	// -------------------------------------------------------------------------
	// Load all the modules needed to transform markdown to HTML
	const TeXjs="https://rawgit.com/jlettvin/TeX/master/js/TeX.js";
	loadJS (TeXjs, loadedCall, doc.body);

})(window, document);
