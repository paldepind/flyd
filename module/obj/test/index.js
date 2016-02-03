var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var obj = require('../index.js');

describe('stream props', function() {
  it('converts the properties in an object to streams', function() {
    var o = {one: 1, two: 2, three: 3};
    var oS = obj.streamProps(o);
    assert.equal(o.one, oS.one());
    assert.equal(o.two, oS.two());
    assert.equal(o.three, oS.three());
  });
  it('handles converting nested properties to nested streams', function() {
    var o = {nested: {value: 'val', deeper: {deepVal: 'deepVal'}}};
    var oS = obj.streamProps(o);
    assert.equal(o.nested.value, oS.nested.value());
    assert.equal(o.nested.deeper.deepVal, oS.nested.deeper.deepVal());
  });
});

describe('stream object', function() {
  var o = {one: 1, two: 2, three: 3};
  it('returns a stream', function() {
    var oS = obj.stream(obj.streamProps(o));
    assert(flyd.isStream(oS));
  });
  it('flow unwrapped object down stream when props change', function() {
    var oS = obj.streamProps(o);
    var result = [];
    flyd.map(function(o) { result.push(o); }, obj.stream(oS));
    oS.one(4);
    oS.three(4);
    oS.two(4);
    assert.deepEqual(result, [
      {one: 1, two: 2, three: 3},
      {one: 4, two: 2, three: 3},
      {one: 4, two: 2, three: 4},
      {one: 4, two: 4, three: 4}
    ]);
  });
  it('handles prop changes in nested objects', function() {
    var o = {nested: {value: 'val', deeper: {deepVal: 'deepVal'}}};
    var oS = obj.streamProps(o);
    var result = [];
    flyd.map(function(o) { result.push(o); }, obj.stream(oS));
    oS.nested.value('val2');
    oS.nested.deeper.deepVal('deepVal2');
    oS.nested.value('val3');
    assert.deepEqual(result, [
      {nested: {value: 'val', deeper: {deepVal: 'deepVal'}}},
      {nested: {value: 'val2', deeper: {deepVal: 'deepVal'}}},
      {nested: {value: 'val2', deeper: {deepVal: 'deepVal2'}}},
      {nested: {value: 'val3', deeper: {deepVal: 'deepVal2'}}}
    ]);
  });
  it('retains the values of non-streams', function() {
    var oS = {nested: {value: stream('val'), deeper: {constant: 'constantVal'}}};
    var result = [];
    flyd.map(function(o) { result.push(o); }, obj.stream(oS));
    oS.nested.value('val2');
    oS.nested.value('val3');
    assert.deepEqual(result, [
      {nested: {value: 'val', deeper: {constant: 'constantVal'}}},
      {nested: {value: 'val2', deeper: {constant: 'constantVal'}}},
      {nested: {value: 'val3', deeper: {constant: 'constantVal'}}}
    ]);
  });
});

describe('extract', function() {
  it('extracts the values from streams in object', function() {
    var oS = {one: stream(1), two: stream(2), three: stream(3)};
    var o = obj.extractProps(oS);
    assert.equal(o.one, oS.one());
    assert.equal(o.two, oS.two());
    assert.equal(o.three, oS.three());
  });
  it('handles values that are not streams', function() {
    var oS = {one: stream(1), undef: undefined, nll: null, two: 2};
    var o = obj.extractProps(oS);
    assert.equal(o.one, oS.one());
    assert.equal(o.undef, oS.undef);
    assert.equal(o.nll, oS.nll);
    assert.equal(o.two, oS.two);
  });
  it('handles nested values', function() {
    var oS = {nested: {value: stream('val'), deeper: {deepVal: stream('deepVal'), constant: 3}}};
    var o = obj.extractProps(oS);
    assert.equal(o.nested.value, oS.nested.value());
    assert.equal(o.nested.deeper.deepVal, oS.nested.deeper.deepVal());
    assert.equal(o.nested.deeper.constant, oS.nested.deeper.constant);
  });
});
