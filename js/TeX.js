'use strict'


window.onload = (function (win, doc) {

	const TeXjs="https://rawgit.com/jlettvin/TeX/master/js/TeX.js";

	doc.jlettvin = doc.jlettvin || {};

	// -------------------------------------------------------------------------
	var TeX = function () {
		var body    = doc.body;
		var head    = doc.head;
		var sources = doc.getElementsByClassName ('TeX');

		{ // reload button
			var reload          = doc.createElement ('button');
			reload.innerHTML    = 'reload';
			reload.setAttribute ('onclick', 'location.reload(true)');
			body.appendChild    (reload);
			body.appendChild    (doc.createElement ('hr');
		}

		// source conversion
		for (var source of sources) {
			var target       = doc.createElement ('span');
			var TeXsrc       = source.innerHTML;
			var content      = interpret (TeXsrc);
			target.innerHTML = content;
			body.appendChild (target);
		}
	} // TeX

	// -------------------------------------------------------------------------
	var interpret = function (content) {
		return 'Interpreted TeX: "' + content + '"';
	}

	TeX ();

})(window, document);
