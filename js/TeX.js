'use strict'

// TODO: Guarantee font-face loaded and cross-browser.
// DONE: Two banks of DVI OPCODES 1. original 2. Unicode.
// TODO: Render Cajal's name properly.
// DONE: find word-breaks to terminate lines.
// TODO: fix occasional extra space before \par

/* DVI engine
https://web.archive.org/web/20070403030353/\
http://www.math.umd.edu/~asnowden/comp-cont/dvi.html
 */

window.onload = (function (win, doc) {

	doc.jlettvin = doc.jlettvin || {};
	doc.jlettvin.TeX = doc.jlettvin.TeX || {};

	// Control variables
	// ------------------------------------------------------------------------
	var paper    = { width: 785, height: 969 };
	var column   = { count: 1, current: 1 };
	var margin   = { top: 50, bottom: 10, left: 50, right: 50 };
	var border   = { top:  0, bottom:  0, left:  0, right:  0 };
	var padding  = { top:  0, bottom:  3, left:  0, right:  0 };
	var fontface = ["Crete Round", "Neuton", "Barlow", "Raleway", "Montserrat"];
	var fontnum  = 0;
	var font     = [
		{ size: 16, face:        '16px ' + fontface[fontnum] },
		{ size: 16, face: 'Italic 16px ' + fontface[fontnum] },
		//{ size: 16, face: '16pt '        + fontface[fontnum] },
		//{ size: 16, face: 'Italic 16pt'  + fontface[fontnum] },
	];
	var page     = { number: 0, numbers: true, canvas: null, ctx: null, align: 'C' };
	var line     = { height: font[0].size + padding.top + padding.bottom, text: '' };
	var data     = { source: '', target: '', index: 0, ok: true };
	var word     = { n: 0 };
	var engine   = { h: 0, v: 0, w: 0, x: 0, y: 0, z: 0, f: null }; // dvistd0.pdf
	var stack    = [];

	column.width = parseInt(paper.width / column.count);

	engine.f = font[0].face;
	//console.log (engine.f);

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var push = function () {
		stack.push (engine.assign ());
	};  // push

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var pop  = function () {
		engine.assign (stack.pop ());
		page.ctx.font = engine.f;
	};  // pop

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var unimplemented = function (subsystem, name) {
		console.log ('UNIMPLEMENTED: ' + subsystem + ': ' + name);
		data.ok = false;
	};  // unimplemented

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	// Enable multi-line strings in older versions of ECMAscript (javascript)
	doc.HEREDOC = doc.HEREDOC || function (f) {
		return f.toString().split('\n').slice(1,-1).join('\n').normalize('NFC');
	};  // HEREDOC

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	doc.main = doc.main || function (source) {
		data.source = source;
		for (var f of [buttons, newTeX, DVI, raw]) {
			if (!data.ok) break; else
			f ();
		}
	};  // doc.main

	// KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
	var newTeXreplacements = [
		// Note: ".*?" means reluctant match (opposite of greedy)
		[/\\%/gim                             , 'PeRcEnT'],
		[/%[\s\S]*?\n/gim                     , ' '],
		[/\\documentclass(\[.*?\])?{(.*?)}/gim, ''],
		[/\\chapter{(.*?)}/gim                , ''],
		[/\\begin{(.*?)}/gim                  , ''],
		[/\\part{(.*?)}/gim                   , ''],
		[/\\end{(.*?)}/gim                    , ''],
		[/\s+/gim                             , ' '],
		[/\\newpage/gim                       , '\x0c'],
		[/\\it{(.*?)}/gim                     , '$1'],
		[/\\par\s+/gim                        , '\n\n   '],
		[/\\title{(.*?)}/gim                  , '\n\n   $1'],
		[/\\subtitle{(.*?)}/gim               , '\n\n   $1'],
		[/\\subsubtitle{(.*?)}/gim            , '\n\n   $1'],
		[/\\subsubsubtitle{(.*?)}/gim         , '\n\n   $1'],
		[/\\section{(.*?)}/gim                , '\n\n   $1'],
		[/\\subsection{(.*?)}/gim             , '\n\n   $1'],
		[/\\subsubsection{(.*?)}/gim          , '\n\n   $1'],
		[/\\references/gim                    , '\n\n   '],
		[/\\\\/gim                            , '\n'],
		[/\. +/gim                            , '.  '],
		[/PeRcEnT/gim                         , '%'],
	];

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var newTeX = function () {
		newColumn ();
		var source = data.source;
		for (var replacement of newTeXreplacements) {
			source = source.replace (replacement[0], replacement[1]);
		}
		data.target = source;
	};

	// KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
	var TeXkeyword = {
		'\\':    function () { data.target += '\n';      },
		par:     function () { data.target += '\n\n   '; },
		newpage: function () { data.target += '\x0c';    }
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	// Interpret and render the TeX source.
	var TeX = function () {
		newColumn ();

		var bottom    = margin.bottom - border.bottom - padding .bottom;
		var maxY      = paper.height - bottom;

		// Operate on data.source
		// TODO trivial and incomplete ('TeX', 'interpreter');
		//var tokens = data.source.split (/\b\s+/);
		//var uncommented = data.source;
		var uncommented = data.source.replace (/^%.*$/gim, '');
		var tokens = uncommented.match(/\S+/g);
		for (var token of tokens) {
			var escapeChar = false;
			for (var I = token.length, i = 0; i < I; ++i) {
				var c = token[i];
				if (c == '\\' && !escapeChar) {
					escapeChar = true;  // Identify beginning of TeX operation
				} else if (c == '\n') {
					data.target += ' ';
				} else if (escapeChar) {
					//console.log ('"'+token.substring (i, i+3)+'"');
					var found = token.substring (i);
					if (found in TeXkeyword) {
						TeXkeyword[found] ();
					} else {
						data.target += '\\';  // ignore all other TeX for now
						data.target += found;
					}
					i += found.length;
					escapeChar = false;
				} else {
					if (c == '\n') {
						data.target += ' ';  // newline becomes space
					} else {
						data.target += c;  // all other chars are passed
					}
				}
			}
			data.target += ' ';
		}
	};  // TeX (content)

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var buttons = function () {
		doc.jlettvin.TeX.refresh = true;

		var td1              = doc.createElement ('td');
		var stop             = doc.createElement ('button');
		var abbrStop         = '' +
			'<abbr title=' +
			'"Toggle between refresh (poll) and unchanging (stop)"' +
			'>stop</abbr>';
		var abbrPoll         = '' +
			'<abbr title=' +
			'"Toggle between refresh (poll) and unchanging (stop)"' +
			'>stop</abbr>';
		stop.innerHTML       = abbrStop;
		stop.setAttribute    ('id', 'stopRefresh');
		stop.setAttribute    ('abbr', 'refresh toggle');
		stop.setAttribute    ('onClick',
			'(function () {' +
			' var refresh = !document.jlettvin.TeX.refresh;' +
			' document.jlettvin.TeX.refresh = refresh;' +
			' if (!refresh) {' +
			'   window.stop ();' +
			' } else {' +
			'   location.reload ();' +
			' }' +
			' var e = document.getElementById ("stopRefresh");' +
			' e.innerHTML = refresh ? "' + 'stop' +
			'" : "' + 'poll' +
			'";' +
			';' +
			'}) ();'
		);
		td1.appendChild (stop);

		var td2 = doc.createElement ('td');
		var print            = doc.createElement ('button');
		//print.innerHTML      = 'print';
		print.innerHTML       = '<abbr title=' +
			'"Open print dialog for browser"' +
			'>print</abbr>';
		print.setAttribute   ('onClick', 'window.print()');
		print.setAttribute   ('class', 'no-print');
		td1.appendChild (print);

		var tr = doc.createElement ('tr');
		tr.appendChild (td1);
		tr.appendChild (td2);

		var table = doc.createElement ('table');
		table.setAttribute   ('style', 'position: fixed; right: 0; top: 0;');
		//table.setAttribute   ('align', 'right');
		table.appendChild (tr);

		doc.body.appendChild (table);
	};  // buttons ();

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	// Display the source code being rendered.
	var raw = function () {
		var span    = doc.createElement ('span');
		span.setAttribute ('class', 'no-print');

		var section = doc.createElement ('h3');
		section.innerHTML = 'TeX (Raw)';
		span.appendChild (section);

		var target           = doc.createElement ('pre');
		target.innerHTML     = data.source;
		span.appendChild (target);
		doc.body.appendChild (span);
	};  // raw (content)

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var newColumn = function () {
		var Lwhite = margin.left  + border.left  + padding.left ;
		var Rwhite = margin.right + border.right + padding.right;
		var Lcol   = ((column.count + 0) * column.width);
		var Rcol   = ((column.count + 1) * column.width);

		if (column.count > 1) {
			column.current = (column.current + 1) % column.count;
			console.log(column.current);
			engine.h = Lcol + Lwhite;
			engine.H = Rcol - Rwhite;
			if (column.current == 0) {
				newPage ();
			}
		} else {
			newPage ();
		}
	};  // newColumn ()

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	// Create a new canvas and return it to be filled.
	var newPage = function () {

		var Lwhite = margin.left  + border.left  + padding.left ;
		var Rwhite = margin.right + border.right + padding.right;
		var Lcol   = ((column.count + 0) * column.width);
		var Rcol   = ((column.count + 1) * column.width);

		var td        = doc.createElement      ('td'    );
		var tr        = doc.createElement      ('tr'    );
		var table     = doc.createElement      ('table' );

		page.canvas   = doc.createElement      ('canvas');
		page.ctx      = page.canvas.getContext ('2d');

		page.canvas.innerHTML = "Use a browser which supports HTML5 canvas.";

		engine.h      = Lwhite;
		engine.H      = paper.width - Rwhite;
		engine.v      = margin.top  + border.top  + padding.top;
		page.number   = page.number + 1;

		// console.log ('newPage', engine.h, engine.v);

		// Letter-size paper
		page.canvas.width        = paper. width;
		page.canvas.height       = paper.height;
		page.ctx.font            = engine.f;
		//console.log('"'+page.ctx.font+'"');
		page.canvas.setAttribute ("id"   , "page." + page.number);
		page.canvas.setAttribute ("class", "page"               );

		td      .appendChild (page.canvas);
		tr      .appendChild (td         );
		table   .appendChild (tr         );
		doc.body.appendChild (table      );

		if (page.numbers) {
			var pageNumber    = "page " + page.number;
			var X             =  0;
			var pWidth        = paper.width - 50;  // width of pageNumber (faked)

			if      (page.align == 'C') { X = pWidth / 2; }
			else if (page.align == 'R') { X = pWidth;     }
			else                        { X =  engine.h;  }

			page.ctx.fillText (pageNumber, X, engine.v + padding.top);
			engine.v          = engine.v + 2 * line.height;
		}

		return page.canvas;
	};  // newPage ()


	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var renderable = function (s) {
		var finalWidth = engine.h + page.ctx.measureText (s).width;
		return (finalWidth < engine.H || s[0] == '\n');
	};  // renderable (s)

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var renderNL = function () {
		var Lwhite = margin.left  + border.left  + padding.left ;
		var Rwhite = margin.right + border.right + padding.right;
		var Lcol   = ((column.count + 0) * column.width);
		var Rcol   = ((column.count + 1) * column.width);

		var bottom    = margin.bottom - border.bottom - padding .bottom;
		var maxY      = paper.height - bottom;
		engine.h = margin.left + border.left + padding.left;
		engine.v += font[0].size + padding.bottom + padding.top;
		if (engine.v >= maxY) {
			newColumn ();
		}
		word.n = 0;
	};  // renderNL ()

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var render = function (s, move=true) {
		var bottom    = margin.bottom - border.bottom - padding .bottom;
		var maxY      = paper.height - bottom;
		var metrics = page.ctx.measureText (s);
		var space   = page.ctx.measureText (' ');
		var h = metrics.width;
		var H = engine.h + h;
		var i = 0;
		var I = s.length;
		if (s[i] == '\x0c') {
			i++;
			newColumn ();
		}
		while (i < I && s[i] == '\n') {
			renderNL ();
			H = 0;
			word.n = 0;
			i++;
		}
		if (word.n++ != 0 && H >= engine.H) {
			renderNL ();
		}
		h += space.width;
		page.ctx.fillText (s.substr (i), engine.h, engine.v + padding.top);
		if (move) {
			engine.h += h
		}
	};  // render

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_000_127 = function () {
/*
Opcodes 0-127: set_char_i (0 <= i <= 127)
Typeset character number i from font f such that the reference point of the
character is at (h,v). Then increase h by the width of that character. Note
that a character may have zero or negative width, so one cannot be sure that h
will advance after this command; but h usually does increase. 
*/
		var c = data.target[data.index++];
		render (c);
	};  // OP_000_127 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_128_131 = function () {
/*
Opcodes 128-131: seti (1 <= i <= 4); c[i]
Same as set_char_0, except that character number c is typeset. TeX82 uses the
set1 command for characters in the range 128 <= c < 256. TeX82 never uses the
set2, command which is intended for processors that deal with oriental
languages; but DVItype will allow character codes greater than 255, assuming
that they all have the same width as the character whose code is c mod 256. 
 */
		// TODO break this down into 128, 129, 130, and 131 as per spec
		data.index++;
		var c = data.target[data.index++];
		render (c);
	};  // OP_128_131 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_132_132 = function () {
/*
Opcode 132: set_rule; a[4], b[4]
Typeset a solid black rectangle of height a and width b, with its bottom left
corner at (h,v). Then set h:=h+b. If either a < =0 or b < =0, nothing should be
typeset. Note that if b < 0, the value of h will decrease even though nothing
else happens. Programs that typeset from DVI files should be careful to make
the rules line up carefully with digitized characters, as explained in
connection with the rule_pixels subroutine below. 
 */
		unimplemented ('DVI', 'OP_132_132');
	};  // OP_132_132 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_133_136 = function () {
/*
Opcodes 133-136: puti (1 <= i <= 4); c[i]
Typeset character number c from font f such that the reference point of the
character is at (h,v). (The put commands are exactly like the set commands,
except that they simply put out a character or a rule without moving the
reference point afterwards.) 
 */
		data.index++;
		var c = data.target[data.index++];
		render (c, false);
	};  // OP_133_136 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_137_137 = function () {
/*
Opcode 137: put_rule; a[4], b[4]
Same as set_rule, except that h is not changed. 
 */
		unimplemented ('DVI', 'OP_137_137');
	};  // OP_137_137 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_138_138 = function () {  // NOP
/*
Opcode 138: nop
No operation, do nothing. Any number of nop's may occur between DVI commands,
but a nop cannot be inserted between a command and its parameters or between
two parameters. 
 */
	};  // OP_138_138 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_139_139 = function () {
/*
Opcode 139: bop; c_0[4]..c_9[4], p[4]
Beginning of a page: Set (h,v,w,x,y,z):=(0,0,0,0,0,0) and set the stack empty.
Set the current font f to an undefined value. The ten c_i parameters can be
used to identify pages, if a user wants to print only part of a DVI file; TeX82
gives them the values of \count0...\count9 at the time \shipout was invoked for
this page. The parameter p points to the previous bop command in the file,
where the first bop has p=-1. 
 */
		unimplemented ('DVI', 'OP_139_139');
	};  // OP_139_139 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_140_140 = function () {
/*
Opcode 140: eop
End of page: Print what you have read since the previous bop. At this point the
stack should be empty. (The DVI-reading programs that drive most output devices
will have kept a buffer of the material that appears on the page that has just
ended. This material is largely, but not entirely, in order by v coordinate and
(for fixed v) by h coordinate; so it usually needs to be sorted into some order
that is appropriate for the device in question. DVItype does not do such
sorting.) 
 */
		unimplemented ('DVI', 'OP_140_140');
	};  // OP_140_140 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_141_141 = function () {
/*
Opcode 141: push
Push the current values of (h,v,w,x,y,z) onto the top of the stack; do not
change any of these values. Note that f is not pushed. 
 */
		push ();
	};  // OP_141_141 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_142_142 = function () {
/*
Opcode 142: pop
Pop the top six values off of the stack and assign them to (h,v,w,x,y,z). The
number of pops should never exceed the number of pushes, since it would be
highly embarrassing if the stack were empty at the time of a pop command. 
 */
		pop ();
	};  // OP_142_142 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_143_146 = function () {
/*
Opcodes 143-146: righti (1 <= i <= 4); b[i]
Set h:=h+b, i.e., move right b units. The parameter is a signed number in two's
complement notation; if b < 0, the reference point actually moves left. 
 */
		unimplemented ('DVI', 'OP_143_146');
	};  // OP_143_146 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_147_151 = function () {
/*
Opcodes 147-151: wi (0 <= i <= 4); b[i]
The w0 command sets h:=h+w; i.e., moves right w units. With luck, this
parameterless command will usually suffice, because the same kind of motion
will occur several times in succession. The other w commands set w:=b and
h:=h+b. The value of b is a signed quantity in two's complement notation. This
command changes the current w spacing and moves right by b. 
 */
		unimplemented ('DVI', 'OP_147_151');
	};  // OP_147_151 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_152_156 = function () {
/*
Opcodes 152-156: xi (0 <= i <= 4); b[i]
The parameterless x0 command sets h:=h+x; i.e., moves right x units. The x
commands are like the w commands except that they involve x instead of w. The
other x commands set x:=b and h:=h+b. The value of b is a signed quantity in
two's complement notation. This command changes the current x spacing and moves
right by b. 
 */
		unimplemented ('DVI', 'OP_152_156');
	};  // OP_152_156 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_157_160 = function () {
/*
Opcodes 157-160: downi (1 <= i <= 4); a[i]
Set v:=v+a, i.e., move down a units. The parameter is a signed number in two's
complement notation; if a < 0, the reference point actually moves up. 
 */
		unimplemented ('DVI', 'OP_157_160');
	};  // OP_157_160 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_161_165 = function () {
/*
Opcodes 161-165: yi (0 <= i <= 4); a[i]
The y0 command sets v:=v+y; i.e., moves down y units. With luck, this
parameterless command will usually suffice, because the same kind of motion
will occur several times in succession. The other y commands set y:=a and
v:=v+a. The value of a is a signed quantity in two's complement notation. This
command changes the current y spacing and moves down by a. 
 */
		unimplemented ('DVI', 'OP_161_165');
	};  // OP_161_165 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_166_170 = function () {
/*
Opcodes 166-170: zi (0 <= i <= 4); a[i]
The z0 command sets v:=v+z; i.e., moves down z units. The z commands are like
the y commands except that they involve z instead of y. The other z commands
set z:=a and v:=v+a. The value of a is a signed quantity in two's complement
notation. This command changes the current z spacing and moves down by a. 
 */
		unimplemented ('DVI', 'OP_166_170');
	};  // OP_166_170 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_171_234 = function () {
/*
Opcodes 171-234: fnt_num_i (0 <= i <= 63)
Set f:=i. Font i must previously have been defined by a fnt_def instruction, as
explained below. 
 */
		unimplemented ('DVI', 'OP_171_234');
	};  // OP_171_234 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_235_238 = function () {
/*
Opcodes 235-238: fnti (1 <= i <= 4); k[i]
Set f:=k. TeX82 uses the fnt1 command for font numbers in the range 64 < =k <
256. TeX82 never generates the fnt2 command, but large font numbers may prove
useful for specifications of color or texture, or they may be used for special
fonts that have fixed numbers in some external coding scheme. 
 */
		unimplemented ('DVI', 'OP_235_238');
	};  // OP_235_238 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_239_242 = function () {
/*
Opcodes 239-242: xxxi (1 <= i <= 4); k[i], x[k]
This command is undefined in general; it functions as a k+i+1$-byte nop unless
special DVI-reading programs are being used. TeX82 generates xxx1 when a short
enough \special appears, setting k to the number of bytes being sent. It is
recommended that x be a string having the form of a keyword followed by
possible parameters relevant to that keyword. 
 */
		unimplemented ('DVI', 'OP_239_242');
	};  // OP_239_242 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_243_246 = function () {
/*
Opcodes 243-246: fnt_defi (1 <= i <= 4); k[i], c[4], s[4], d[4], a[1], l[1], n[a+l]
The four-byte value c is the check sum that TeX (or whatever program generated
the DVI file) found in the TFM file for this font; c should match the check sum
of the font found by programs that read this DVI file.

Parameter s contains a fixed-point scale factor that is applied to the
character widths in font k; font dimensions in TFM files and other font files
are relative to this quantity, which is always positive and less than 2^27. It
is given in the same units as the other dimensions of the DVI file. Parameter d
is similar to s; it is the ``design size,'' and (like s) it is given in DVI
units. Thus, font k is to be used at mag s / 1000 d times its normal size.

The remaining part of a font definition gives the external name of the font,
which is an ASCII string of length a+l. The number a is the length of the
``area'' or directory, and l is the length of the font name itself; the
standard local system font area is supposed to be used when a=0. The n field
contains the area in its first a bytes.

Font definitions must appear before the first use of a particular font number.
Once font k is defined, it must not be defined again; however, we shall see
below that font definitions appear in the postamble as well as in the pages, so
in this sense each font number is defined exactly twice, if at all. Like nop
commands, font definitions can appear before the first bop, or between an eop
and a bop. 
 */
		unimplemented ('DVI', 'OP_243_246');
	};  // OP_243_246 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_247_247 = function () {
/*
Opcodes 247: pre; i[1], num[4], den[4], mag[4], k[1], x[k]
The preamble contains basic information about the file as a whole and must come
at the very beginning of the file. The i byte identifies DVI format; currently
this byte is always set to 2. (The value i=3 is currently used for an extended
format that allows a mixture of right-to-left and left-to-right typesetting.
Some day we will set i=4, when DVI format makes another incompatible change -
perhaps in the year 2048.)

The next two parameters, num and den, are positive integers that define the
units of measurement; they are the numerator and denominator of a fraction by
which all dimensions in the DVI file could be multiplied in order to get
lengths in units of 10^(-7) meters. (For example, there are exactly 7227 TeX
points in 254 centimeters, and TeX82 works with scaled points where there are
2^16 sp in a point, so TeX82 sets num=25400000 and den=7227 2^16=473628672.

The mag parameter is what TeX82 calls \mag, i.e., 1000 times the desired
magnification. The actual fraction by which dimensions are multiplied is
therefore m n /1000 d. Note that if a TeX source document does not call for any
true dimensions, and if you change it only by specifying a different \mag
setting, the DVI file that TeX creates will be completely unchanged except for
the value of mag in the preamble and postamble. (Fancy DVI-reading programs
allow users to override the mag setting when a DVI file is being printed.)

Finally, k and x allow the DVI writer to include a comment, which is not
interpreted further. The length of comment x is k, where 0 < = k < 256. 
 */
		unimplemented ('DVI', 'OP_247_247');
	};  // OP_247_247 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_248_248 = function () {
/*
Opcodes 248: post; p[4], num[4], den[4], mag[4], l[4], u[4], s[2], t[2]; < font
definitions > The last page in a DVI file is followed by post; this command
introduces the postamble, which summarizes important facts that TeX has
accumulated about the file, making it possible to print subsets of the data
with reasonable efficiency. The parameter p is a pointer to the final bop in
the file. The next three parameters, num, den, and mag, are duplicates of the
quantities that appeared in the preamble.

Parameters l and u give respectively the height-plus-depth of the tallest page
and the width of the widest page, in the same units as other dimensions of the
file. These numbers might be used by a DVI-reading program to position
individual ``pages'' on large sheets of film or paper; however, the standard
convention for output on normal size paper is to position each page so that the
upper left-hand corner is exactly one inch from the left and the top.
Experience has shown that it is unwise to design DVI-to-printer software that
attempts cleverly to center the output; a fixed position of the upper left
corner is easiest for users to understand and to work with. Therefore l and u
are often ignored.

Parameter s is the maximum stack depth (i.e., the largest excess of push
commands over pop commands) needed to process this file. Then comes t, the
total number of pages (bop commands) present.

The postamble continues with font definitions, which are any number of fnt_def
commands as described above, possibly interspersed with nop commands. Each font
number that is used in the DVI file must be defined exactly twice: Once before
it is first selected by a fnt command, and once in the postamble. 
 */
		unimplemented ('DVI', 'OP_248_248');
	};  // OP_248_248 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_249_249 = function () {
/*
Opcodes 249: post_post; q[4], i[1]; 223's
The last part of the postamble, following the post_post byte that signifies the
end of the font definitions, contains q a pointer to the post command that
started the postamble. An identification byte, i, comes next; this currently
equals 2, as in the preamble.

The i byte is followed by four or more bytes that are all equal to the decimal
number 223 (i.e., 337 in octal). TeX puts out four to seven of these trailing
bytes, until the total length of the file is a multiple of four bytes, since
this works out best on machines that pack four bytes per word; but any number
of 223's is allowed, as long as there are at least four of them. In effect, 223
is a sort of signature that is added at the very end.

This curious way to finish off a DVI file makes it feasible for DVI-reading
programs to find the postamble first, on most computers, even though TeX wants
to write the postamble last. Most operating systems permit random access to
individual words or bytes of a file, so the DVI reader can start at the end and
skip backwards over the 223's until finding the identification byte. Then it can
back up four bytes, read q, and move to byte q of the file. This byte should, of
course, contain the value 248 (post); now the postamble can be read, so the DVI
reader discovers all the information needed for typesetting the pages. Note that
it is also possible to skip through the DVI file at reasonably high speed to
locate a particular page, if that proves desirable. This saves a lot of time,
since DVI files used in production jobs tend to be large.
 */
		unimplemented ('DVI', 'OP_249_249');
	};  // OP_249_249 

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_BANK_0 = function () {
		DVI_OP.bank = 0;
		data.index++;
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_BANK_1 = function () {
		DVI_OP.bank = 1;
		data.index++;
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_BANK_2 = function () {
		DVI_OP.bank = 2;
		data.index++;
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_BANK_3 = function () {
		DVI_OP.bank = 3;
		data.index++;
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_Illegal = function () {
		unimplemented ('DVI', 'OP illegal');
	};

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_C0 = function () {
		var a = data.target[data.index++];
		var b = data.target[data.index++];
		var c = ((a & 0x1f) << 6) + (b & 0x3f);
		render (c);
	}

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_E0 = function () {
		var a = data.target[data.index++];
		var b = data.target[data.index++];
		var c = data.target[data.index++];
		var d = ((a & 0xf) << 12) + ((b & 0x3f) << 6) + (c& 0x3f);
		render (d);
	}

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	var OP_F0 = function () {
		var a = data.target[data.index++];
		var b = data.target[data.index++];
		var c = data.target[data.index++];
		var d = data.target[data.index++];
		var e = ((a & 0xf) << 18) + ((b & 0x3f) << 12) + ((c& 0x3f) << 6) + (d & 0x3f);
		render (e);
	}

	// -------------------------------------------------------------------------
	// OPCODE and its fill specification (DC1 and DC2 are bank-switcher OPS).
	/* DC2 (Unicode) is ^R, DC1 (ASCII) is ^Q.

愚公移山

	*/
	const H11 = 0x11, H12 = 0x12, H13 = 0x12, H14 = 0x14;
	const Hc0 = 0xc0, He0 = 0xe0, Hf0 = 0xf0, H80 = 0x80;
	const Hbf = 0xbf, Hdf = 0xdf, Hef = 0xef, Hff = 0xFF;
	var DVI_OP = { bank: 0, code: [] };
	var DVI_OP_FILL_SPECIFICATION = [  // BANK 0 original DVI
		[
			[  0,  16, OP_000_127], [H11, H11, OP_BANK_0 ], [H12, H12, OP_BANK_1 ],
			[H13, H13, OP_BANK_2 ], [H14, H14, OP_BANK_3 ], [ 19, 127, OP_000_127],
			[128, 131, OP_128_131], [132, 132, OP_132_132],
			[133, 136, OP_133_136], [137, 137, OP_137_137], [138, 138, OP_138_138],
			[139, 139, OP_139_139], [140, 140, OP_140_140], [141, 141, OP_141_141],
			[142, 142, OP_142_142], [143, 146, OP_143_146], [147, 151, OP_147_151],
			[152, 156, OP_152_156], [157, 160, OP_157_160], [161, 165, OP_161_165],
			[166, 170, OP_166_170], [171, 234, OP_171_234], [235, 238, OP_235_238],
			[239, 242, OP_239_242], [243, 246, OP_243_246], [247, 247, OP_247_247],
			[248, 248, OP_248_248], [249, 249, OP_249_249], [250, 255, OP_Illegal],
		], [  // BANK 1 Unicode
			[  0,  16, OP_000_127], [ 17,  17, OP_BANK_0 ], [ 18,  18, OP_BANK_1 ],
			[ 19, 127, OP_000_127], [H80, Hbf, OP_Illegal],
			[Hc0, Hdf, OP_C0     ], [He0, Hef, OP_E0     ], [Hf0, Hff, OP_F0     ],
		], [
			[  0, Hff, OP_Illegal]
		], [
			[  0, Hff, OP_Illegal]
		]
	];

	// -------------------------------------------------------------------------
	// OPCODE fill loop for original DVI
	for (var bank = 0; bank < DVI_OP_FILL_SPECIFICATION.length; ++bank) {
		DVI_OP.code.push ([]);
		var spec = DVI_OP_FILL_SPECIFICATION[bank];
		for (var J = spec.length, j = 0; j < J; ++j) {
			var abc = spec[j];
			var a = abc[0], b = 1 + abc[1], c = abc[2];
			for (var i=a; i < b; i++) {
				DVI_OP.code[bank].push (c);
			}
		}
	}

	// ()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()
	// Rendering engine for DVI language
	var DVI = function () {
		var tokens = data.target.split(' ');
		for (var token of tokens) {
			// console.log ('render', '"' + token + '"');

			render (token);
		}
		return data.ok;
	};  // DVI (buffer)

})(window, document);
