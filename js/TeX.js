'use strict'


window.onload = (function (win, doc) {

	// -------------------------------------------------------------------------
	doc.HEREDOC = doc.HEREDOC || function (f) {
		return f.toString().split('\n').slice(1,-1).join('\n').normalize('NFC');
	}; // HEREDOC

	// -------------------------------------------------------------------------
	doc.main = doc.main || function (source) {
		{ // reload button
			var reload           = doc.createElement ('button');
			reload.innerHTML     = 'reload';
			reload.setAttribute  ('onclick', 'location.reload(true)');
			doc.body.appendChild (reload);
		}

		{ // rendering
			var section          = doc.createElement ('h3');
			section.innerHTML    = 'TeX (Rendered)';
			doc.body.appendChild (section);

			doc.body.appendChild (doc.createElement ('hr'));
			TeX (source);
			doc.body.appendChild (doc.createElement ('hr'));
		}

		{ // source display
			var section = doc.createElement ('h3');
			section.innerHTML = 'Raw';
			doc.body.appendChild (section);

			raw (source);
		}
	}; // TeX

	// -------------------------------------------------------------------------
	// Interpret and render the TeX source.
	var TeX = function (content) {
		var canvas = page ();
		var ctx    = canvas.getContext ('2d');
		var offX   = 10;
		var offY   = 50;
		var inter  =  3;
		ctx.font = '20px Arial';

		// This is just an echo of the source for now.
		for (var line of content.split (/\r?\n/)) {
			ctx.fillText (line, offX, offY);
			offY = offY + 20 + inter;
		}
	};

	// -------------------------------------------------------------------------
	// Display the source code being rendered.
	var raw = function (content) {
		var target            = doc.createElement ('pre');
		target.innerHTML      = content;
		doc.body.appendChild (target);
	};

	// -------------------------------------------------------------------------
	// Create a new canvas and return it to be filled.
	var page = function () {
		var canvas            = doc.createElement ('canvas');
		var td                = doc.createElement ('td'    );
		var tr                = doc.createElement ('tr'    );
		var table             = doc.createElement ('table' );

		table.setAttribute ('style', 'border: 1px solid black');

		// Letter-size paper
		canvas.width          = 785;
		canvas.height         = 969;
		canvas.setAttribute   ("id", "TeX");

		td.    appendChild (canvas);
		tr.    appendChild (td);
		table. appendChild (tr);

		doc.body.appendChild (table);

		return canvas;
	};


})(window, document);
