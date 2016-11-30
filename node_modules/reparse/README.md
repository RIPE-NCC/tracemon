# ReParse #

ReParse is a parser combinator library for Javascript like Haskell's
[Parsec](http://legacy.cs.uu.nl/daan/parsec.html).

## Installation ##

Download `lib/reparse.js` and add it to your project or use `npm
install reparse`.

## API ##

To use ReParse, construct a `new ReParse(input)` object, then call the
`.start()` method, passing it the top-level production of your
grammar.  Each production may be a RegExp or a function.

A RegExp will produce the first captured group or the entire value it
matched if there are no groups.  Functions are called with `this`
bound to the parser.  They take no arguments.  A function should
invoke one or more parser methods, optionally transforming the results
into an appropriate return value.

Here is a grammar for a subset of JSON that supports arrays and
positive integers.  See `examples/json.js` for a more complete
example:

    // e.g: parse("[1, [2]]")
    var ReParse = require('reparse');

    function parse(data) {
      return (new ReParse(data, true)).start(value);
    }

    function value() {
      return this.choice(number, array);
    }

    function array() {
      return this.between(/^\[/, /^\]/, elements);
    }

    function elements() {
      return this.sepBy(value, /^,/);
    }

    function number() {
      return parseInt(this.match(/^\d+/));
    }

ReParse indicates failure internally using exceptions, so it's safe to
use the result of any production immediately without checking for an
error state.

### ReParse(input, [ignorews]) ###

Create a new parser for an `input` string.  If `ignorews` is `true`,
skip whitespace before and after each production.

#### .start(method) ####

Return the value produced by `method`.  All input must be consumed.

#### .eof() ####

Return `true` if the input is exhausted.

#### .fail() ####

Calling this method indicates that a production has failed; an
exception will be raised and caught by the previous production.

#### .produce(method) ####

Apply the production `method` to the input and return the result.

#### .maybe(method) ####

Apply the production `method` to the input and return the result.  If
`method` fails, restoring the input to its previous state.

#### .option(method, otherwise) ####

Try to produce `method`.  If it fails, restore the input and return
`otherwise`.

#### .match(regexp) ####

Match a regular expression against the input, returning the first
captured group.  If no group is captured, return the matched string.

#### .choice(alt1, alt2, ...) ####

Try alternatives from left to right, returning the value of the first
one that's successful.

#### .seq(p1, p2, ...) ####

Apply a sequence of productions from left to right.  They must all
succeed.  Return an array of capture groups (like a regular expression
match would).  Index 0 is the entire matched string, index 1
corresponds to `p1`, etc.

#### .many(method) ####

Return an array of zero or more values produced by `method`.

#### .many1(method) ####

Return an array of one or more values produced by `method`.

#### .between(left, right, body) ####

This is equivalent to `.seq(left, body, right)[2]`.

#### .skip(method) ####

Ignore zero or more instances of `method`.  Return the parser object.

#### .skip1(method) ####

Ignore one or more instances of `method`.  Return the parser object.

#### .skipWS() ####

Ignore whitespace.  Return the parser object.

#### .sepBy(method, sep) ####

Return an array of zero or more values produced by `method`.  Each
value is separated by `sep`.

#### .sepBy1(method, sep) ####

Return an array of one or more values produced by `method`.  Each
value is separated by `sep`.

#### .endBy(method, end) ####

This is equivalent to `.many(method)` followed by `.option(end)`.

#### .endBy1(method, end) ####

This is equivalent to `.many1(method)` followed by `.option(end)`.

#### .sepEndBy(method, sep) ####

Return an array of zero or more values produced by `method`.  Each
value is separated by `sep` and the entire sequence is optionally
terminated by `sep`.

#### .sepEndBy1(method, sep) ####

Return an array of one or more values produced by `method`.  Each
value is separated by `sep` and the entire sequence is optionally
terminated by `sep`.

#### .chainl(method, op, [otherwise]) ####

This can be used to eliminate direct left-recursion.  Parse zero or
more values produced by `method` and separated by `op`.  Returns a
value obtained by left associative application of functions returned
by `op`.  If zero values are produced, return otherwise.

#### .chainl1(method, op) ####

Like `.chainl`, but at least one value must be produced by `method`.
For example, this grammar:

    expr   ::= expr '+' term | term
    term   ::= term '*' factor | factor

Might be implemented like this (see `examples/calc.js`):

    function expr() {
      return this.chainl1(term, addop);
    }

    function term() {
      return this.chainl1(factor, mulop);
    }

    function factor() {
      ...
    }

## Compatibility ##

ReParse has been tested with Node.JS version `v0.1.103`.  It should
work in a browser if you comment out the `exports` line.

## License ##

Copyright (c) 2010, Ben Weaver &lt;ben@orangesoda.net&gt;
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

* Neither the name of the <organization> nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT
HOLDER> BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

