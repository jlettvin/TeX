# TeX
typesetting system rewritten in javascript

[Try it out](https://rawgit.com/jlettvin/TeX/master/index.html)

Currently, the TeX source is echoed as &lt;PRE&gt; text.
The up-to-date ANSI C code is found in the ANSIC directory.
This code will be converted to javascript and
instead of rendering to paper equivalent postscript or PDF
it will be rendered directly into an HTML5 canvas.

It can be developed and used locally by running:

    $ python -m SimpleHTTPServer

and browsing to:

	localhost:8000

# index.html:

____
# Before TeX data
____
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta   charset="utf-8" />
        <link   type="image/x-icon" href="/img/BBKtm.png" rel="icon" />
        <script type="text/javascript"  src="js/TeX.js"></script>
      </head>
      <body><h1>TeX 19</h1></body>
    	<script type="text/javascript">
    	document.TeX (document.HEREDOC(function() {/*
____
# TeX data
____
    \documentclass[12pt]{article}
    
    \begin{document}
    
      This is a very simple file, though it does include some mathematical 
      symbols, $\beta, x$ and $y$,  and some equations,  
    \begin{equation} 
     \frac{1}{2} + \frac{1}{5} = \frac{7}{10}. 
    \end{equation} 
     
     The equations are automatically numbered:
    \begin{equation} 
     1 + 1 = 2 \Rightarrow E = m c^2.  
    \end{equation}  
    
     \TeX\ can handle complicated mathematical expressions. 
    \begin{equation} 
     \int_0^\infty \cos (k t) e^{-s t} d t = \frac{s}{s^2 + k^2}
    \end{equation} 
     if $s > 0$. 
    \begin{equation}
     e^z = \sum_{n=0}^\infty \frac{ z^n}{n!} . 
    \end{equation} 
    
     Leave a blank line in your file when you want a new paragraph. 
          \TeX\ will automatically 
     arrange your text
                  into tidy lines of 
     even length, even 
     if the 
     original text in the .tex file is a mess. 
     
    \end{document} 
____
# After TeX data
____
    */}));
    	</script>
    </html>
____
