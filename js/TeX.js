'use strict'

window.onload = (function (win, doc) {

	// Control variables
	var paper    = { width: 785, height: 969 };
	var margin   = { top: 50, bottom: 10, left: 10, right: 10 };
	var border   = { top:  0, bottom:  0, left:  0, right:  0 };
	var padding  = { top:  0, bottom:  3, left:  0, right:  0 };
	var font     = { size: 12, face: 'Arial' };
	var page     = { number: 0, numbers: true, canvas: null, ctx: null, align: 'C' };
	var line     = { height: font.size + padding.top + padding.bottom, text: '' };
	var offset   = { X: 0, Y: 0 };

	// -------------------------------------------------------------------------
	// Enable multi-line strings in older versions of ECMAscript (javascript)
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
			section.innerHTML    = 'TeX (Rendered) (fake)';
			doc.body.appendChild (section);

			doc.body.appendChild (doc.createElement ('hr'));
			TeX (source);
			doc.body.appendChild (doc.createElement ('hr'));
		}

		{ // source display
			var section = doc.createElement ('h3');
			section.innerHTML = 'TeX (Raw)';
			doc.body.appendChild (section);

			raw (source);
		}
	}; // doc.main

	// -------------------------------------------------------------------------
	// Interpret and render the TeX source.
	var TeX = function (content) {
		newPage ();
		var bottom  = margin.bottom - border.bottom - padding .bottom;
		var maxY    = paper.height - bottom;

		// This is just an echo of the source for now.
		for (line.text of content.split (/\r?\n/)) {
			page.ctx.fillText (line.text, offset.X, offset.Y + padding.top);
			// console.log (offset.X, offset.Y, maxY);
			offset.Y = offset.Y + line.height;
			if (offset.Y >= maxY) {
				newPage ();
			}
		}
	};  // TeX (content)

	// -------------------------------------------------------------------------
	// Display the source code being rendered.
	var raw = function (content) {
		var target           = doc.createElement ('pre');
		target.innerHTML     = content;
		doc.body.appendChild (target);
	};  // raw (content)

	// -------------------------------------------------------------------------
	// Create a new canvas and return it to be filled.
	var newPage = function () {
		var td             = doc.createElement      ('td'    );
		var tr             = doc.createElement      ('tr'    );
		var table          = doc.createElement      ('table' );

		page.canvas        = doc.createElement      ('canvas');
		page.ctx           = page.canvas.getContext ('2d');
		table.setAttribute ('style', 'border: 1px solid black');

		offset.X      = margin.left + border.left + padding.left;
		offset.Y      = margin.top  + border.top  + padding.top;
		page.ctx.font = ''          + font.size   + 'px '       + font.face;
		page.number   = page.number + 1;

		// Letter-size paper
		page.canvas.width        = paper. width;
		page.canvas.height       = paper.height;
		page.canvas.setAttribute ("id"   , "page." + page.number);
		page.canvas.setAttribute ("class", "page"               );

		td      .appendChild (page.canvas);
		tr      .appendChild (td);
		table   .appendChild (tr);
		doc.body.appendChild (table);

		if (page.numbers) {
			var pageNumber    = "page " + page.number;
			var X             =  0;
			var pWidth        = paper.width - 50;  // width of pageNumber (faked)

			if      (page.align == 'C') { X = pWidth / 2; }
			else if (page.align == 'R') { X = pWidth;     }
			else                        { X =  offset.X;  }

			page.ctx.fillText (pageNumber, X, offset.Y + padding.top);
			offset.Y          = offset.Y + 2 * line.height;
		}

		return page.canvas;
	};  // newPage ()

})(window, document);
