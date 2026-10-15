'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Search = require('../modules/search');
const catalog = require('../data/catalog');
const labels = require('../data/labels');

test('every selectable object is reachable once through paginated empty search', () => {
  const index = Search.createIndex(catalog);
  for (const language of ['zh', 'en']) {
    const ids = [];
    for (let offset = 0; offset < 5180; offset += 60) {
      const page = index.browse('', language, offset, 60);
      assert.equal(page.total, 5180);
      assert.equal(page.hasMore, offset + 60 < 5180);
      assert.ok(page.items.length <= 60);
      ids.push(...page.items.map(item => item.id));
    }
    assert.equal(ids.length, 5180);
    assert.equal(new Set(ids).size, 5180);
    assert.deepEqual(new Set(ids), new Set(catalog.stars.concat(catalog.messier).map(item => item.id)));
    assert.deepEqual(index.browse('', language, 5180, 60).items, []);
  }
});

test('Chinese display names follow deterministic pinyin including astronomical polyphones', () => {
  const index = Search.createIndex(catalog);
  const items = index.browse('', 'zh', 0, 6000).items;
  const named = items.filter(item => /[\u3400-\u9fff]/.test(item.name));
  assert.deepEqual(items.slice(0, named.length), named);
  const keys = named.map(item => labels.zhSortKeys[item.name].replace(/[\s·•._-]/g, ''));
  assert.ok(keys.every(Boolean));
  assert.deepEqual(keys, keys.slice().sort());
  assert.equal(labels.zhSortKeys['参宿四'], 'shenxiusi');
  assert.equal(labels.zhSortKeys['南河三'], 'nanhesan');
  assert.equal(labels.zhSortKeys['北斗一'], 'beidouyi');
  assert.equal(labels.zhSortKeys['天棓一'], 'tianbangyi');
});

test('English names are sourced proper names or catalog designations, never Chinese placeholders', () => {
  const index = Search.createIndex(catalog);
  const items = index.browse('', 'en', 0, 6000).items;
  for (const item of items) {
    const name = Search.displayName(item, 'en');
    assert.ok(name && !/[\u3400-\u9fff]/.test(name), item.id);
    assert.ok([item.name, item.id].concat(item.aliases).some(alias => alias.replace(/\s+/g, ' ') === name), item.id + ' ' + name);
  }
  assert.equal(Search.displayName(index.get('HIP32349'), 'en'), 'Sirius');
  assert.equal(Search.displayName(index.get('M31'), 'en'), 'Andromeda Galaxy');
  assert.equal(Search.displayName(index.get('M11'), 'en'), 'Wild Duck Cluster');
  assert.equal(Search.displayName(index.get('M76'), 'en'), 'Little Dumbbell Nebula');
  const firstNames = items.slice(0, 50).map(item => Search.displayName(item, 'en').toLowerCase().replace(/[\s·•._-]/g, ''));
  assert.deepEqual(firstNames, firstNames.slice().sort());
  assert.equal(firstNames[0], 'acamar');
});

test('both languages retain Chinese, English, Messier and HIP aliases, exact hits first', () => {
  const index = Search.createIndex(catalog);
  for (const language of ['zh', 'en']) {
    for (const [query, id] of [['天狼星', 'HIP32349'], ['Sirius', 'HIP32349'], ['HIP 032349', 'HIP32349'], ['M031', 'M31'], ['梅西耶31', 'M31'], ['仙女座大星系', 'M31'], ['Andromeda Galaxy', 'M31']]) {
      assert.equal(index.browse(query, language).items[0].id, id, query);
    }
    assert.equal(index.search('M31', 1, language)[0].id, 'M31');
    assert.deepEqual(index.search('', 60, language, 60), index.browse('', language, 60, 60).items);
    assert.deepEqual(index.browse('impossible object name', language), { items: [], total: 0, hasMore: false });
  }
  assert.equal(Search.typeName(index.get('HIP32349'), 'en'), 'Star');
  assert.equal(Search.typeName(index.get('M31'), 'en'), 'Galaxy');
  assert.equal(Search.typeName(index.get('M31'), 'zh'), '星系');
});

test('browser sorting does not require Intl or localeCompare', () => {
  const browser = vm.createContext({ Intl: undefined });
  vm.runInContext('String.prototype.localeCompare = function () { throw new Error("locale unavailable"); };', browser);
  for (const file of ['data/catalog.js', 'data/labels.js', 'lib/search.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file.replace('lib/', 'modules/')), 'utf8'), browser);
  }
  assert.equal(vm.runInContext("SkySearch.createIndex(SkyCatalog).browse('', 'zh', 0, 60).total", browser), 5180);
  assert.equal(vm.runInContext("SkySearch.createIndex(SkyCatalog).search('M31', 1, 'en')[0].id", browser), 'M31');
});
