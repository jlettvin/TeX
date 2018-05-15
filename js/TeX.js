'use strict'


window.onload = (function (win, doc) {

	const TeXjs="https://rawgit.com/jlettvin/TeX/master/js/TeX.js";

	doc.jlettvin = doc.jlettvin || {};

	// -------------------------------------------------------------------------
	var TeX = function () {
		var body    = doc.body;
		var head    = doc.head;
		var sources = doc.getElementsByClassName ('TeX');

		// source conversion
		for (var source of sources) {
			var target       = doc.createElement ('span');
			var TeXsrc       = source.innerHTML;
			var content      = interpret (TeXsrc);
			target.innerHTML = content;
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
	var interpret = function (content) {
		return 'Interpreted TeX: "' + content + '"';
	}

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
	loadJS (TeXjs, loadedCall, doc.body);

})(window, document);
