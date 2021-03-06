// based on spec in React
// https://github.com/vjeux/react/blob/566fcc9a93223ecb7624a6459faa21e0fc8f31f3/docs/docs/08-diff-algorithm.md

function getAttrs(current) {
  var excluded = { 'type': true, 'children': true };
  // text nodes
  if(current.type == 'text') {
    return [ 'data' ];
  }
  // tags
  if(!current.attribs) {
    return [];
  }
  return Object.keys(current.attribs).filter(function(k) { return !excluded[k]; }).sort();
}

function getAttr(current, key) {
  // assume default type is tag
  if(current.attribs && current.attribs[key]) {
    return current.attribs[key];
  }
  return current[key];
}

function getType(current) {
  if(current.type == 'tag') {
    return current.name;
  }
  return current.type;
}

function diff(parent, current, expected) {
  var ops = [];
  // if both are arrays
  if(Array.isArray(current)) {
    if(current.length == 1) {
      current = current[0];
    } else {
      throw new Error('Must pass two nodes!');
    }
  }
  if(Array.isArray(expected)) {
    if(expected.length == 1) {
      expected = expected[0];
    } else {
      throw new Error('Must pass two nodes!');
    }
  }
  if(!current || !expected) {
    throw new Error('Must pass two nodes!');
    return;
  }

  if(expected.children) {
  // A, B lists:
  //  a1, b1 equal => nop
  //  a1, b1 different => update while both exist, insert if b1 missing, remove if b1 superfluous
    ops = ops.concat(listDiff(current, current.children, expected.children));
  }

  // A, B same type => diff attributes, generate (remove|add|replace operations)
  ops = ops.concat(attrDiff(current, expected));

  return ops;
}

function attrDiff(current, expected) {
  var aKeys = getAttrs(current),
      bKeys = getAttrs(expected),
      ops = [],
      i,
      inter = [],
      prevIndex = 0;
  // compare all A with B
  for(i = 0; i < aKeys.length; i++) {
    var search = aKeys[i],
        index = bKeys.indexOf(search, prevIndex);
    if(index > -1) {
      inter.push(search);
      // given that A & B are sorted, we can safely start the search
      // at the current index in B next time. More optimally, we'd only search from this index
      // until the point where the value in B is lexicographically larger than `search`
      prevIndex = index;
    } else {
      // only in a
      ops.push({ op: 'removeAttr', t: current, key: search });
    }
  }
  prevIndex = 0;
  // compare b with the intersection
  for(i = 0; i < bKeys.length; i++) {
    var search = bKeys[i],
        index = inter.indexOf(search, prevIndex);
    if(index > -1) {
      prevIndex = index;
    } else {
      ops.push({ op: 'addAttr', t: current, key: search, value: getAttr(expected, search) });
    }
  }

  inter.forEach(function(k) {
    if(getAttr(expected, k) != getAttr(current, k)) {
      ops.push({ op: 'replaceAttr', t: current, key: k, value: getAttr(expected, k) });
    }
  });

  return ops;
}

function listDiff(parent, currentArr, expectedArr) {
  var i = 0, ops = [];

  // compare all expected with current
  for(; i < expectedArr.length; i++) {
    var current = currentArr[i],
        expected = expectedArr[i];

    // current not set
    if(!current) {
      ops.push({ op: 'insert', t: parent, index: i, value: expected });
      continue;
    }

  // A, B different types => remove A, insert B
    if(getType(current) != getType(expected)) {
      ops.push({ op: 'remove', t: parent, index: i, value: current }, { op: 'insert', t: parent, index: i, value: expected });
      continue;
    }

    ops = ops.concat(diff(parent, current, expected));
  }

  // current has more nodes than expected?
  if(currentArr.length > expectedArr.length) {
    for(i = expectedArr.length; i < currentArr.length; i++) {
      ops.push({ op: 'remove', t: parent, index: i, value: currentArr[i] });
    }
  }

  return ops;
}

module.exports = diff;

module.exports.attrDiff = attrDiff;
