/// email-address - Parse a string of email addresses into an array.
//
// This parser supports a subset of RFC 5322.

var sys = require('sys'),
    ReParse = require('../lib/reparse').ReParse;

function readAddressList(str) {
  return (new ReParse(str)).start(addressList);
}

function addressList() {
  return this.sepEndBy(address, /^\s*,\s*/);
}

function address() {
  return this.choice(namedAddress, bareAddress);
}

function namedAddress() {
  return this.seq(phrase, /^\s*</m, bareAddress, /^>/)[3];
}

function bareAddress() {
  return this.seq(word, /^@/, word).slice(1).join('');
}

function phrase() {
  return this.many(word);
}

function word() {
  return this.skip(/^\s+/).choice(quoted, dottedAtom);
}

function quoted() {
  return this.match(/^"(?:\\.|[^"\r\n])+"/m);
}

function dottedAtom() {
  return this.match(/^[!#\$%&'\*\+\-\/\w=\?\^`\{\|\}~]+(?:\.[!#\$%&'\*\+\-\/\w=\?\^`\{\|\}~]+)*/m);
}


/// --- Main Program

if (process.argv.length != 3) {
  sys.puts('Usage: node ' + process.argv[1] + ' list-of-addresses');
  process.exit(1);
}

sys.puts(sys.inspect(readAddressList(process.argv[2])));