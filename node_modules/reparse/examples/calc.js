/// calc -- a simple calculator
//
// Parses the this grammar and calculates the result:
//
//     expr   ::= expr '+' term | term
//     term   ::= term '*' factor | factor
//     factor ::= '(' expr ')' | number
//     number ::= '-' digit+ | digit+
//     digit  ::= '0' | '1' | ... | '9'

var sys = require('sys'),
    ReParse = require('../lib/reparse').ReParse;

function read(input) {
  return (new ReParse(input, true)).start(expr);
}

function expr() {
  return this.chainl1(term, addop);
}

function term() {
  return this.chainl1(factor, mulop);
}

function factor() {
  return this.choice(group, number);
}

function group() {
  return this.between(/^\(/, /^\)/, expr);
}

function number() {
  return parseInt(this.match(/^\-?\d+/));
}

function mulop() {
  return OPS[this.match(/^[\*\/]/)];
}

function addop() {
  return OPS[this.match(/^[\+\-]/)];
}

var OPS = {
  '+': function(a, b) { return a + b; },
  '-': function(a, b) { return a - b; },
  '*': function(a, b) { return a * b; },
  '/': function(a, b) { return a / b; }
};


/// --- Main Program

if (process.argv.length != 3) {
  sys.puts('Usage: node ' + process.argv[1] + ' expression');
  process.exit(1);
}

sys.puts(read(process.argv[2]));