var assert = require('assert'),
    util = require('util'),
    htdiff = require('htdiff'),
    htmlparser = require('htmlparser2');

var diff = htdiff,
    attrDiff = htdiff.attrDiff;

function html2tree(html) {
    var handler = new htmlparser.DomHandler(function(error, dom) {
        if(error) throw error;
      }, { verbose: false, ignoreWhitespace: true });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
    return handler.dom;
}

function log(list) {
  list.forEach(function(item) {
    delete item.t;
  });

  console.log(util.inspect(list, null, 5, true));
}

exports['tests'] = {

  'two nodes of different type': function() {
    assert.deepEqual(diff('root',  { type: 'A'}, { type: 'B' }),
      [ { op: 'remove', t: 'root', value: { type: 'A' } },
        { op: 'insert', t: 'root', value: { type: 'B' } } ]);
  },

  'attribute diff': function() {
    var before = { attribs: { a: 'a', b: 'b', c: 'c', d: 'd' } },
        after = { attribs: { b: 'b', c: '!' } };

    // console.log(util.inspect(attrDiff(before, after), null, 5, true));

    assert.deepEqual(attrDiff(before, after), [
      { op: 'removeAttr',
        t: before,
        key: 'a' },
      { op: 'removeAttr',
        t: before,
        key: 'd' },
      { op: 'replaceAttr',
        t: before,
        key: 'c',
        value: '!' } ]);
  },

  'same type, different attr': function() {
    var before = { type: 'A', attribs: { a: 'a', b: 'b'} },
        after = { type: 'A', attribs: { b: '!' } };

    assert.deepEqual(diff('root', before, after), [
      { op: 'removeAttr', t: before, key: 'a' },
      { op: 'replaceAttr',
        t: before,
        key: 'b',
        value: '!' } ]);
  },

  'same type, different children, appended child': function() {
    var before = { type: 'ul', children: [ { type: 'li', attribs: { text: 'first' } } ] },
        after = { type: 'ul', children: [ { type: 'li', attribs: { text: 'first' } }, { type: 'li', attribs: { text: 'second' } } ] };

    assert.deepEqual(diff('root', before, after), [
      { op: 'insert',
        t: before,
        value: { type: 'li', attribs: { text: 'second' } } } ]);
  },

  'same type, different children, prepended child': function() {
    var before = { type: 'ul', children: [ { type: 'li', attribs: { text: 'first' } } ] },
        after = { type: 'ul', children: [ { type: 'li', attribs: { text: 'second' } }, { type: 'li', attribs: { text: 'first' } }, ] };

    assert.deepEqual(diff('root', before, after), [
      { op: 'replaceAttr',
        t: before.children[0],
        key: 'text',
        value: 'second' },
      { op: 'insert',
        t: before,
        value: { type: 'li', attribs: { text: 'first' } } } ]);
  },

  'text node change': function() {
    var before = html2tree('<p>Hello</p>'),
        after = html2tree('<p>Hello world</p>');

    assert.deepEqual(diff('root', before, after), [
        { op: 'replaceAttr',
          t: before[0].children[0],
          key: 'data',
          value: 'Hello world' } ]);
  },

  'nested node change': function() {
    var before = html2tree('<p>Hello<b>foo</b>!</p>'),
        after = html2tree('<p>Hello<i>bar</i>!</p>');

    // log(diff('root', before, after));
    /*
    assert.deepEqual(diff('root', before, after), [
        { op: 'replaceAttr',
          t: before[0].children[0],
          key: 'data',
          value: 'Hello world' } ]);
    */
  }


};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
