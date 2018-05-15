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
			var hr              = doc.createElement ('hr');
			reload.innerHTML    = 'reload';
			reload.setAttribute ('onclick', 'location.reload(true)');
			body.appendChild    (reload);
			body.appendChild    (hr);
		}

		// source conversion
		for (var source of sources) {
			var TeXsrc       = source.innerHTML;
			var target       = interpret (TeXsrc);
			body.appendChild (target);
		}
	} // TeX

	// -------------------------------------------------------------------------
	var interpret = function (content) {
		var target       = doc.createElement ('pre');
		target.innerHTML = content;
		return target;
	}

	TeX ();

})(window, document);
