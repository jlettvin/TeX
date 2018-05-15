'use strict'


window.onload = (function (win, doc) {

	// -------------------------------------------------------------------------
	doc.HEREDOC = doc.HEREDOC || function (f) {
		return f.toString().split('\n').slice(1,-1).join('\n').normalize('NFC');
	} // HEREDOC

	// -------------------------------------------------------------------------
	doc.TeX = doc.TeX || function (source) {
		{ // reload button
			var reload           = doc.createElement ('button');
			var hr               = doc.createElement ('hr');
			reload.innerHTML     = 'reload';
			reload.setAttribute  ('onclick', 'location.reload(true)');
			doc.body.appendChild (reload);
			doc.body.appendChild (hr);
		}

		doc.body.appendChild (interpret (source));
	} // TeX

	// -------------------------------------------------------------------------
	// This is just an echo of the source for now.
	var interpret = function (content) {
		var target       = doc.createElement ('pre');
		target.innerHTML = content;
		return target;
	}


})(window, document);
