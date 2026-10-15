(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../data/labels'));
  else root.SkySearch = factory(root.SkyLabels || {});
})(typeof globalThis !== 'undefined' ? globalThis : this, function (labels) {
  'use strict';

  var types = {
    G: ['星系', 'Galaxy'], GCl: ['球状星团', 'Globular cluster'], OCl: ['疏散星团', 'Open cluster'],
    Neb: ['星云', 'Nebula'], '*Ass': ['星协', 'Stellar association'], PN: ['行星状星云', 'Planetary nebula'],
    '**': ['双星', 'Double star'], 'Cl+N': ['星团与星云', 'Cluster and nebula'], HII: ['发射星云', 'Emission nebula'],
    RfN: ['反射星云', 'Reflection nebula'], SNR: ['超新星遗迹', 'Supernova remnant'], Other: ['深空天体', 'Deep-sky object']
  };
  var preferredEnglish = { M11: 'Wild Duck Cluster', M17: 'Omega Nebula', M42: 'Orion Nebula', M44: 'Beehive Cluster', M76: 'Little Dumbbell Nebula' };

  function isProperName(name) {
    return /^[A-Za-z][A-Za-z\s'’.-]*$/.test(name) && !/^(Alp|Bet|Gam|Del|Eps|Zet|Eta|The|Iot|Kap|Lam|Mu|Nu|Xi|Omi|Pi|Rho|Sig|Tau|Ups|Phi|Chi|Psi|Ome)\s/i.test(name);
  }

  function displayName(item, language) {
    if (!item) return '';
    if (language !== 'en') return item.name || item.id;
    if (item.englishName) return item.englishName;
    var aliases = item.aliases || [];
    var preferred = preferredEnglish[item.id];
    if (preferred && aliases.indexOf(preferred) !== -1) return preferred;
    var latin = [item.name].concat(aliases).filter(function (name) {
      return name && !/[\u3400-\u9fff]/.test(name);
    });
    var proper = latin.filter(isProperName);
    return String(proper[0] || latin[0] || item.id || ('HIP ' + item.hip)).replace(/\s+/g, ' ');
  }

  function typeName(item, language) {
    if (!item) return '';
    var type = item.typeCode || item.type;
    var key = Object.keys(types).filter(function (code) { return code === type || types[code][0] === type; })[0];
    if (key) return types[key][language === 'en' ? 1 : 0];
    return item.kind === 'messier' || /^M\d+$/.test(item.id) ? (language === 'en' ? 'Deep-sky object' : '深空天体') : (language === 'en' ? 'Star' : '恒星');
  }

  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFKC').toLowerCase()
      .replace(/[\s·•._-]/g, '')
      .replace(/^(梅西耶|messier)/, 'm')
      .replace(/^(m|hip)0+(?=\d)/, '$1');
  }

  function createIndex(catalog) {
    var byId = Object.create(null);
    var records = [];
    function add(source, kind) {
      var item = Object.assign({}, source, {
        name: source.name || source.id,
        aliases: source.aliases || [],
        typeCode: source.type,
        type: types[source.type] ? types[source.type][0] : source.type || (kind === 'star' ? '恒星' : '深空天体'),
        kind: kind
      });
      item.englishName = displayName(item, 'en');
      var zhKey = labels.zhSortKeys && labels.zhSortKeys[item.name];
      if (!zhKey) zhKey = item.name.split('').map(function (char) { return labels.pinyin && labels.pinyin[char] || char; }).join('');
      var keys = [item.id].concat(item.hip ? ['HIP' + item.hip] : []);
      keys.forEach(function (key) { byId[normalize(key)] = item; });
      records.push({
        item: item,
        ids: keys.map(normalize),
        name: normalize(item.name),
        aliases: item.aliases.map(normalize),
        zhKey: normalize(zhKey),
        enKey: normalize(item.englishName),
        zhGroup: /[\u3400-\u9fff]/.test(item.name) ? 0 : 1,
        enGroup: isProperName(item.englishName) ? 0 : 1
      });
    }
    (catalog.stars || []).forEach(function (item) { add(item, 'star'); });
    (catalog.messier || []).forEach(function (item) { add(item, 'messier'); });

    function score(record, query) {
      if (record.ids.indexOf(query) !== -1) return 0;
      if (record.name === query) return 1;
      if (record.aliases.indexOf(query) !== -1) return 2;
      if (record.name.indexOf(query) === 0) return 10;
      if (record.aliases.some(function (alias) { return alias.indexOf(query) === 0; })) return 11;
      if (record.ids.some(function (id) { return id.indexOf(query) === 0; })) return 12;
      if (record.name.indexOf(query) !== -1) return 20;
      if (record.aliases.some(function (alias) { return alias.indexOf(query) !== -1; })) return 21;
      return Infinity;
    }

    var cachedQuery = null;
    var cachedLanguage = null;
    var cachedResults = [];
    function browse(query, language, offset, limit) {
      var key = normalize(query);
      var lang = language === 'en' ? 'en' : 'zh';
      var start = Math.max(0, Math.floor(Number(offset) || 0));
      var maximum = limit == null ? 60 : Math.max(0, Math.floor(Number(limit) || 0));
      if (key !== cachedQuery || lang !== cachedLanguage) {
        cachedResults = records.map(function (record) {
          return { record: record, score: key ? score(record, key) : 10 };
        }).filter(function (result) { return result.score !== Infinity; }).sort(function (a, b) {
          // Exact IDs/names/aliases stay first; all other suggestions follow the selected alphabet.
          var exact = (a.score < 3 ? a.score : 3) - (b.score < 3 ? b.score : 3);
          var ak = a.record[lang + 'Key'], bk = b.record[lang + 'Key'];
          return exact || a.record[lang + 'Group'] - b.record[lang + 'Group'] || (ak < bk ? -1 : ak > bk ? 1 : 0) ||
            (a.record.item.id < b.record.item.id ? -1 : a.record.item.id > b.record.item.id ? 1 : 0);
        }).map(function (result) { return result.record.item; });
        cachedQuery = key;
        cachedLanguage = lang;
      }
      return { items: cachedResults.slice(start, start + maximum), total: cachedResults.length, hasMore: start + maximum < cachedResults.length };
    }

    return {
      get: function (id) { return byId[normalize(id)] || null; },
      browse: browse,
      search: function (query, limit, language, offset) { return browse(query, language, offset, limit == null ? 8 : limit).items; }
    };
  }

  return { createIndex: createIndex, displayName: displayName, typeName: typeName };
});
