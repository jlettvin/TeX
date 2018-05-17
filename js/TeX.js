'use strict'

/*
\documentclass[12pt]{article}
\begin{document}
Hello world.
\end{document}
 */

window.onload = (function (win, doc) {

	// Control variables
	var paper    = { width: 785, height: 969 };
	var margin   = { top: 50, bottom: 10, left: 10, right: 10 };
	var border   = { top:  0, bottom:  0, left:  0, right:  0 };
	var padding  = { top:  0, bottom:  3, left:  0, right:  0 };
	var font     = { size: 12, face: 'Arial' };
	var page     = { number: 0, numbers: false, canvas: null, ctx: null, align: 'C' };
	var line     = { height: font.size + padding.top + padding.bottom, text: '' };
	var render   = { h: 0, v: 0, ok: true };

	// -------------------------------------------------------------------------
	var unimplemented = function (subsystem, name) {
		console.log ('UNIMPLEMENTED: ' + subsystem + ': ' + name);
		render.ok = false;
	}

	// -------------------------------------------------------------------------
	// Enable multi-line strings in older versions of ECMAscript (javascript)
	doc.HEREDOC = doc.HEREDOC || function (f) {
		return f.toString().split('\n').slice(1,-1).join('\n').normalize('NFC');
	}; // HEREDOC

	// -------------------------------------------------------------------------
	doc.main = doc.main || function (source) {
		{ // rendering
			var section          = doc.createElement ('h3');
			section.innerHTML    = 'TeX (Rendered) (fake)';

			//doc.body.appendChild (doc.createElement ('hr'));
			TeX (source);
			doc.body.appendChild (doc.createElement ('hr'));
			doc.body.appendChild (section);
		}

		{ // reload button
			var reload           = doc.createElement ('button');
			reload.innerHTML     = 'reload';
			reload.setAttribute  ('onclick', 'location.reload(true)');
			doc.body.appendChild (reload);
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
		var bottom    = margin.bottom - border.bottom - padding .bottom;
		var maxY      = paper.height - bottom;
		var DVIbuffer = '';

		unimplemented ('TeX', 'interpreter');

		/*
		// This is just an echo of the source for now.
		for (line.text of content.split (/\r?\n/)) {
			page.ctx.fillText (line.text, render.h, render.v + padding.top);
			// console.log (render.h, render.v, maxY);
			render.v = render.v + line.height;
			if (render.v >= maxY) {
				newPage ();
			}
		}
		*/

		DVI (DVIbuffer);

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

		render.h      = margin.left + border.left + padding.left;
		render.v      = margin.top  + border.top  + padding.top;
		page.ctx.font = ''          + font.size   + 'px '       + font.face;
		page.number   = page.number + 1;

		// Letter-size paper
		page.canvas.width        = paper. width;
		page.canvas.height       = paper.height;
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
			else                        { X =  render.h;  }

			page.ctx.fillText (pageNumber, X, render.v + padding.top);
			render.v          = render.v + 2 * line.height;
		}

		return page.canvas;
	};  // newPage ()

	/* DVI engine
	 * https://web.archive.org/web/20070403030353/http://www.math.umd.edu/~asnowden/comp-cont/dvi.html

Opcodes 0-127: set_char_i (0 <= i <= 127)
Typeset character number i from font f such that the reference point of the
character is at (h,v). Then increase h by the width of that character. Note
that a character may have zero or negative width, so one cannot be sure that h
will advance after this command; but h usually does increase. 

Opcodes 128-131: seti (1 <= i <= 4); c[i]
Same as set_char_0, except that character number c is typeset. TeX82 uses the
set1 command for characters in the range 128 <= c < 256. TeX82 never uses the
set2, command which is intended for processors that deal with oriental
languages; but DVItype will allow character codes greater than 255, assuming
that they all have the same width as the character whose code is c mod 256. 

Opcode 132: set_rule; a[4], b[4]
Typeset a solid black rectangle of height a and width b, with its bottom left
corner at (h,v). Then set h:=h+b. If either a < =0 or b < =0, nothing should be
typeset. Note that if b < 0, the value of h will decrease even though nothing
else happens. Programs that typeset from DVI files should be careful to make
the rules line up carefully with digitized characters, as explained in
connection with the rule_pixels subroutine below. 

Opcodes 133-136: puti (1 <= i <= 4); c[i]
Typeset character number c from font f such that the reference point of the
character is at (h,v). (The put commands are exactly like the set commands,
except that they simply put out a character or a rule without moving the
reference point afterwards.) 

Opcode 137: put_rule; a[4], b[4]
Same as set_rule, except that h is not changed. 

Opcode 138: nop
No operation, do nothing. Any number of nop's may occur between DVI commands,
but a nop cannot be inserted between a command and its parameters or between
two parameters. 

Opcode 139: bop; c_0[4]..c_9[4], p[4]
Beginning of a page: Set (h,v,w,x,y,z):=(0,0,0,0,0,0) and set the stack empty.
Set the current font f to an undefined value. The ten c_i parameters can be
used to identify pages, if a user wants to print only part of a DVI file; TeX82
gives them the values of \count0...\count9 at the time \shipout was invoked for
this page. The parameter p points to the previous bop command in the file,
where the first bop has p=-1. 

Opcode 140: eop
End of page: Print what you have read since the previous bop. At this point the
stack should be empty. (The DVI-reading programs that drive most output devices
will have kept a buffer of the material that appears on the page that has just
ended. This material is largely, but not entirely, in order by v coordinate and
(for fixed v) by h coordinate; so it usually needs to be sorted into some order
that is appropriate for the device in question. DVItype does not do such
sorting.) 

Opcode 141: push
Push the current values of (h,v,w,x,y,z) onto the top of the stack; do not
change any of these values. Note that f is not pushed. 

Opcode 142: pop
Pop the top six values off of the stack and assign them to (h,v,w,x,y,z). The
number of pops should never exceed the number of pushes, since it would be
highly embarrassing if the stack were empty at the time of a pop command. 

Opcodes 143-146: righti (1 <= i <= 4); b[i]
Set h:=h+b, i.e., move right b units. The parameter is a signed number in two's
complement notation; if b < 0, the reference point actually moves left. 

Opcodes 147-151: wi (0 <= i <= 4); b[i]
The w0 command sets h:=h+w; i.e., moves right w units. With luck, this
parameterless command will usually suffice, because the same kind of motion
will occur several times in succession. The other w commands set w:=b and
h:=h+b. The value of b is a signed quantity in two's complement notation. This
command changes the current w spacing and moves right by b. 

Opcodes 152-156: xi (0 <= i <= 4); b[i]
The parameterless x0 command sets h:=h+x; i.e., moves right x units. The x
commands are like the w commands except that they involve x instead of w. The
other x commands set x:=b and h:=h+b. The value of b is a signed quantity in
two's complement notation. This command changes the current x spacing and moves
right by b. 

Opcodes 157-160: downi (1 <= i <= 4); a[i]
Set v:=v+a, i.e., move down a units. The parameter is a signed number in two's
complement notation; if a < 0, the reference point actually moves up. 

Opcodes 161-165: yi (0 <= i <= 4); a[i]
The y0 command sets v:=v+y; i.e., moves down y units. With luck, this
parameterless command will usually suffice, because the same kind of motion
will occur several times in succession. The other y commands set y:=a and
v:=v+a. The value of a is a signed quantity in two's complement notation. This
command changes the current y spacing and moves down by a. 

Opcodes 166-170: zi (0 <= i <= 4); a[i]
The z0 command sets v:=v+z; i.e., moves down z units. The z commands are like
the y commands except that they involve z instead of y. The other z commands
set z:=a and v:=v+a. The value of a is a signed quantity in two's complement
notation. This command changes the current z spacing and moves down by a. 

Opcodes 171-234: fnt_num_i (0 <= i <= 63)
Set f:=i. Font i must previously have been defined by a fnt_def instruction, as
explained below. 

Opcodes 235-238: fnti (1 <= i <= 4); k[i]
Set f:=k. TeX82 uses the fnt1 command for font numbers in the range 64 < =k <
256. TeX82 never generates the fnt2 command, but large font numbers may prove
useful for specifications of color or texture, or they may be used for special
fonts that have fixed numbers in some external coding scheme. 

Opcodes 239-242: xxxi (1 <= i <= 4); k[i], x[k]
This command is undefined in general; it functions as a k+i+1$-byte nop unless
special DVI-reading programs are being used. TeX82 generates xxx1 when a short
enough \special appears, setting k to the number of bytes being sent. It is
recommended that x be a string having the form of a keyword followed by
possible parameters relevant to that keyword. 

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

	// -------------------------------------------------------------------------
	var OP_000_127 = function (buffer) {
		unimplemented ('DVI', 'OP_000_127'); return 0;
	};  // OP_000_127 

	// -------------------------------------------------------------------------
	var OP_128_131 = function (buffer) {
		unimplemented ('DVI', 'OP_128_131'); return 0;
	};  // OP_000_127 

	// -------------------------------------------------------------------------
	var OP_128_131 = function (buffer) {
		unimplemented ('DVI', 'OP_128_131'); return 0;
	};  // OP_128_131 

	// -------------------------------------------------------------------------
	var OP_132_132 = function (buffer) {
		unimplemented ('DVI', 'OP_132_132'); return 0;
	};  // OP_132_132 

	// -------------------------------------------------------------------------
	var OP_133_136 = function (buffer) {
		unimplemented ('DVI', 'OP_133_136'); return 0;
	};  // OP_133_136 

	// -------------------------------------------------------------------------
	var OP_137_137 = function (buffer) {
		unimplemented ('DVI', 'OP_137_137'); return 0;
	};  // OP_137_137 

	// -------------------------------------------------------------------------
	var OP_138_138 = function (buffer) {
		unimplemented ('DVI', 'OP_138_138'); return 0;
	};  // OP_138_138 

	// -------------------------------------------------------------------------
	var OP_139_139 = function (buffer) {
		unimplemented ('DVI', 'OP_139_139'); return 0;
	};  // OP_139_139 

	// -------------------------------------------------------------------------
	var OP_140_140 = function (buffer) {
		unimplemented ('DVI', 'OP_140_140'); return 0;
	};  // OP_140_140 

	// -------------------------------------------------------------------------
	var OP_141_141 = function (buffer) {
		unimplemented ('DVI', 'OP_141_141'); return 0;
	};  // OP_141_141 

	// -------------------------------------------------------------------------
	var OP_142_142 = function (buffer) {
		unimplemented ('DVI', 'OP_142_142'); return 0;
	};  // OP_142_142 

	// -------------------------------------------------------------------------
	var OP_143_146 = function (buffer) {
		unimplemented ('DVI', 'OP_143_146'); return 0;
	};  // OP_143_146 

	// -------------------------------------------------------------------------
	var OP_147_151 = function (buffer) {
		unimplemented ('DVI', 'OP_147_151'); return 0;
	};  // OP_147_151 

	// -------------------------------------------------------------------------
	var OP_152_156 = function (buffer) {
		unimplemented ('DVI', 'OP_152_156'); return 0;
	};  // OP_152_156 

	// -------------------------------------------------------------------------
	var OP_157_160 = function (buffer) {
		unimplemented ('DVI', 'OP_157_160'); return 0;
	};  // OP_157_160 

	// -------------------------------------------------------------------------
	var OP_161_165 = function (buffer) {
		unimplemented ('DVI', 'OP_161_165'); return 0;
	};  // OP_161_165 

	// -------------------------------------------------------------------------
	var OP_166_170 = function (buffer) {
		unimplemented ('DVI', 'OP_166_170'); return 0;
	};  // OP_166_170 

	// -------------------------------------------------------------------------
	var OP_171_234 = function (buffer) {
		unimplemented ('DVI', 'OP_171_234'); return 0;
	};  // OP_171_234 

	// -------------------------------------------------------------------------
	var OP_235_238 = function (buffer) {
		unimplemented ('DVI', 'OP_235_238'); return 0;
	};  // OP_235_238 

	// -------------------------------------------------------------------------
	var OP_239_242 = function (buffer) {
		unimplemented ('DVI', 'OP_239_242'); return 0;
	};  // OP_239_242 

	// -------------------------------------------------------------------------
	var OP_243_246 = function (buffer) {
		unimplemented ('DVI', 'OP_243_246'); return 0;
	};  // OP_243_246 

	// -------------------------------------------------------------------------
	var OP_247_247 = function (buffer) {
		unimplemented ('DVI', 'OP_247_247'); return 0;
	};  // OP_247_247 

	// -------------------------------------------------------------------------
	var OP_248_248 = function (buffer) {
		unimplemented ('DVI', 'OP_248_248'); return 0;
	};  // OP_248_248 

	// -------------------------------------------------------------------------
	var OP_249_249 = function (buffer) {
		unimplemented ('DVI', 'OP_249_249'); return 0;
	};  // OP_249_249 

	// -------------------------------------------------------------------------
	// OPCODE and its fill specification
	var OPCODE = [];
	var DVI_INIT = [
		[  0, 127, OP_000_127], [128, 131, OP_128_131], [132, 132, OP_132_132],
		[133, 136, OP_133_136], [137, 137, OP_137_137], [138, 138, OP_138_138],
		[139, 139, OP_139_139], [140, 140, OP_140_140], [141, 141, OP_141_141],
		[142, 142, OP_142_142], [143, 146, OP_143_146], [147, 151, OP_147_151],
		[152, 156, OP_152_156], [157, 160, OP_157_160], [161, 165, OP_161_165],
		[166, 170, OP_166_170], [171, 234, OP_171_234], [235, 238, OP_235_238],
		[239, 242, OP_239_242], [243, 246, OP_243_246], [247, 247, OP_247_247],
		[248, 248, OP_248_248], [249, 249, OP_249_249],
	];

	// -------------------------------------------------------------------------
	// OPCODE fill loop
	for (var J = DVI_INIT.length, j = 0; j < J; ++j) {
		var abc = DVI_INIT[j];
		var a = abc[0], b = 1 + abc[1], c = abc[2];
		for (var i=a; i < b; i++) OPCODE.push (c);
	}

	// -------------------------------------------------------------------------
	// Rendering engine for DVI language
	var DVI = function (buffer) {
		var I = buffer.length;
		for (var i = 0; i < I && render.ok; ) {
			i = OPCODE[buffer[i]] (i, buffer);
		}
		return render.ok;
	};  // DVI (buffer)

})(window, document);
