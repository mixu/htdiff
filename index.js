
function diff(current, expected) {
  var ops = [];
  // A, B different types => remove A, insert B
  if(current.type != expected.type) {
    return [ { op: 'remove', t: current }, { op: 'insert', t: expected } ]
  }

  // A, B same type => diff attributes, generate (remove|add|replace operations)
  ops = ops.concat(attrDiff(current, expected));

  if(expected.children) {
  // A, B lists:
  //  a1, b1 equal => nop
  //  a1, b1 different => update while both exist, insert if b1 missing, remove if b1 superfluous
    ops.push(listDiff(current.children, expected.children));
  }
  return ops;
}

function attrDiff(current, expected) {
  var excluded = { 'type': true, 'children': true },
      ops = [],
      aKeys = Object.keys(current).filter(function(k) { return !excluded[k]; }).sort(),
      bKeys = Object.keys(expected).filter(function(k) { return !excluded[k]; }).sort(),
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
      ops.push({ op: 'remove', key: search });
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
      ops.push({ op: 'insert', key: k, value: expected[k] });
    }
  }

  inter.forEach(function(k) {
    if(expected[k] != current[k]) {
      ops.push({ op: 'replace', key: k, value: expected[k] });
    }
  });

  return ops;
}

function listDiff(current, expected) {

}

console.log(diff({ type: 'A'}, { type: 'B' }));

console.log(attrDiff({ a: 'a', b: 'b', c: 'c', d: 'd' }, { b: 'b', c: '!' }));

console.log(diff({ type: 'A', a: 'a', b: 'b'}, { type: 'A',  b: '!' }));
