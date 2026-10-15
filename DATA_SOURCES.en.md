# Astronomical Data Sources and Reproduction

[中文](DATA_SOURCES.md) | **English**

Build date: 2026-10-15. The data is included with Astertrail for offline use; the app does not need to contact a catalog server at runtime.

## Coverage

| Data | Count | Definition |
| --- | ---: | --- |
| Stars | 5,070 | All HYG v4.1 records with apparent magnitude `mag <= 6.0`, excluding the Sun record `id=0` |
| Stars with Chinese names | 2,305 | Derived from Chinese asterism names and star numbers; other stars retain catalog identifiers or Western names |
| Messier objects | 110 | Exactly one record for each designation from M1 to M110 |
| Messier objects with common Chinese names | 30 | Independently maintained factual names and search aliases; other objects display their M designation |
| Modern constellations | 88 | IAU three-letter abbreviations; Serpens (`Ser`) is one record, with line segments retained for both of its regions |
| Constellation line segments | 674 | Individual segments expanded from HIP polylines in Stellarium's Western sky culture |
| Additional stars used only as line endpoints | 1 | HIP10826, ο Ceti / Mira, catalog magnitude 6.47; included only to complete a line, not in the displayed magnitude ≤6 star list |

“Magnitude 6 and brighter” means a numerical magnitude **≤6**. Filtering uses the source catalog's static magnitudes; variable stars do not enter or leave the list based on their brightness on a particular day. HYG lists some components of multiple-star systems separately, so these are counts of catalog records rather than distinct points of light visible to the naked eye.

## Upstream sources, versions, and attribution

1. **HYG v4.1, David Nash / Astronomy Nexus.** The source file is `hyg/CURRENT/hygdata_v41.csv`, pinned to commit `c7f7f883fe678cc7680169a50ccd7dcc49b060ce` in the author's GitHub archive. The source table contains 119,626 records, including the Sun. HYG combines Hipparcos, Yale Bright Star, and Gliese data. The v4.x data is licensed under **CC BY-SA 4.0**. This build did not use v4.2.
   - Author's project description: https://www.astronexus.com/projects/hyg
   - Version and field documentation: https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/README.md
   - Source catalog: https://raw.githubusercontent.com/astronexus/HYG-Database/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/CURRENT/hygdata_v41.csv

2. **OpenNGC, Mattia Verga and contributors.** Pinned to commit `4e2398a263de663d83f7b86be80c368c34335764`, using `database_files/NGC.csv` and `database_files/addendum.csv`. Licensed under **CC BY-SA 4.0**; copyright and REUSE notices are retained in `licenses/`. OpenNGC's upstream sources include NED, SIMBAD, HyperLEDA, HEASARC, and Harold Corwin's records. Per-field provenance remains in the `Sources` column of the original CSV files.
   - Project and attribution: https://github.com/mattiaverga/OpenNGC
   - Pinned main table: https://raw.githubusercontent.com/mattiaverga/OpenNGC/4e2398a263de663d83f7b86be80c368c34335764/database_files/NGC.csv
   - Pinned addendum: https://raw.githubusercontent.com/mattiaverga/OpenNGC/4e2398a263de663d83f7b86be80c368c34335764/database_files/addendum.csv

3. **Stellarium Sky Cultures.** Pinned to commit `014fbb5e59233d133c22f9811af96b67d05a95c9`. The build uses constellation lines from Western `index.json`, and native Chinese names and HIP associations from Chinese `index.json`. Chinese `po/zh_CN.po` supplies only a few names within that sky culture; the main Stellarium application's translation bundles are not used. Western data is attributed to the Stellarium team. Contributors to the Chinese sky culture include Karrie Berglund, Sun Shuwei, and the Stellarium team; its original documentation cites Hong Kong Space Museum star maps and Yi Shitong's Chinese–Western star-chart references. Both culture packages identify their data/text/lines as **CC BY-SA** without specifying a version. Those declarations are retained as written. No constellation artwork, map images, or main application code is used.
   - Project: https://github.com/Stellarium/stellarium-skycultures
   - Western data: https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/014fbb5e59233d133c22f9811af96b67d05a95c9/western/index.json
   - Original Western license: https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/description.md#license
   - Chinese data: https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/014fbb5e59233d133c22f9811af96b67d05a95c9/chinese/index.json
   - Original Chinese license and authors: https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/chinese/description.md#authors

## Factual Chinese-name table

`tools/chinese_names.json` independently maintains the Chinese names of 88 constellations and the Chinese names/search synonyms of 30 well-known Messier objects. It contains only factual associations between names and identifiers. It does not reproduce website articles, mythology, explanatory prose, pictures, or application translation files.

- Latin constellation names and abbreviations come from the Western data. Standard Chinese names are maintained manually and checked against the Hong Kong Sky Observers' Association list. Common simplified-Chinese forms are used, such as 鲸鱼座, 印第安座, and 摩羯座. The source website's explanations, mythology, and layout are not reused: https://www.skyobserver.org/basic/Constellations/88%20Constellations%20names.htm
- Associations between Messier designations and common English names are cross-checked against the NASA Hubble Messier Catalog and OpenNGC's `Common names` field. Chinese names use common astronomical terminology, with explicit synonyms such as 仙女座大星系/仙女座星系 and 昴星团/昴宿星团: https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/
- Chinese observing names for M42 and M45 are also checked against original educational material from the Tainan Astronomical Education Area: https://taea.tn.edu.tw/taea_area/item/page/a0000000-0000-0000-0000-000000000030
- Chinese star numbers are derived by converting asterism names and Roman numerals from the source sky culture; for example, `Three Stars IV` → 参宿四. A few common search forms are also added: 天狼星, 织女星, 北极星, 牛郎星, 大角星, and 老人星. These aliases are linked to the original HIP identifiers; coordinates are not guessed anew.

## Coordinates and processing conventions

- `ra` and `dec` are **J2000 equatorial coordinates in degrees**. HYG right ascension in hours is multiplied by 15; OpenNGC hours/minutes/seconds and degrees/minutes/seconds are converted to decimal degrees. Right ascension is in `[0, 360)`, and declination is in `[-90, 90]`.
- The chart uses the device's location and UTC time to apply precession and transform equatorial coordinates to horizontal coordinates. The compact dataset does not export proper motion, parallax, or atmospheric-refraction parameters and should not be used as a precision measurement catalog.
- A constellation's `ra/dec` is the spherical mean of the unit vectors of its line endpoints, used only for placing labels. Constellations are regions, with no unique physical “center coordinate.” These values are not official IAU constellation centers.
- There is no single official standard for constellation stick figures. The IAU defines the names and regional boundaries of 88 constellations; this project uses Stellarium's Western line drawings. Only the requested line segments were exported; boundaries are not treated as stick figures.
- Deep-sky `mag` uses only OpenNGC `V-Mag`, or `null` when unavailable. B-band brightness is not substituted for V-band brightness.
- M40 and M45 come from the OpenNGC addendum. The historical identification of M102 is disputed: the OpenNGC addendum treats it as a duplicate of M101. This project adopts the convention used in NASA's Hubble catalog, **M102 = NGC5866 (the Spindle Galaxy)**, taking coordinates from OpenNGC's NGC5866 row without altering the original CSV. Reference: https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-102/ ; NASA APOD explicitly giving both designations: https://apod.nasa.gov/apod/ap180725.html

## Bilingual display and pinyin sorting

English star and Messier labels retain Western names and aliases from the catalogs above. If no common English name is available, a catalog name or identifier is displayed. Chinese asterism names are not automatically translated into invented English proper names. English constellation labels use the IAU's 88 Latin nominative names, checked against [IAU Constellations](https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx). Changing language affects labels and sorting, not object identifiers or coordinates.

`data/labels.js` contains offline pinyin sort keys for Chinese names. The build tool uses pronunciation data from **pypinyin 0.55.0**, from [python-pinyin](https://github.com/mozillazg/python-pinyin) by mozillazg, 闲耘, and project contributors. Its full **MIT** license is retained in `licenses/pypinyin-MIT.txt`. The pinned wheel is `pypinyin-0.55.0-py2.py3-none-any.whl`, with SHA-256 `d53b1e8ad2cdb815fb2cb604ed3123372f5a28c6f447571244aca36fc62a286f`; its download address and verification code are retained in `tools/build_search_labels.py`.

The build removes tone marks and explicitly handles pronunciations including 参 (shen), 宿 (xiu), 棓 (bang), 觜 (zi), 长 (chang), 斗 (dou), 落 (luo), and 傅说 (fuyue). Phones read the precomputed sort keys directly: they do not run Python, download a pronunciation dictionary, or depend on a device's Chinese collation settings. Common Chinese names appear before other catalog names or identifiers; common English names also appear before catalog names or identifiers. Within each group, entries are ordered by pinyin or alphabetically. When a query is entered, exact names, aliases, and identifiers take priority.

## Reproduction

Python 3 is required; the tools use only its standard library. Run the following from the original project's directory:

```text
python tools/build_catalog.py
python tools/build_search_labels.py
```

The scripts download the six source files pinned in `tools/data_sources.json`, verify each SHA-256 hash, cache them in `.cache/data/` by default, and generate `data/catalog.js`. Use `--cache PATH` to reuse downloaded source files or `--output PATH` to change the output location. For this build, original files were stored in the workspace's `work/data/` directory and reused as the cache. `validation_report.json` records counts, byte sizes, and the output hash.

The scripts validate the star count, coordinate ranges, unique identifiers, complete M1–M110 coverage, 88 constellations, every line endpoint, and common Chinese search results. `catalog.js` supports both CommonJS `require` and browser `globalThis.SkyCatalog`; both loading methods have been verified.

The second command reads the generated `catalog.js`, downloads and verifies the pinned pypinyin package, and generates `labels.js` and a copy of the MIT license. The tool itself uses only the Python standard library, so pypinyin does not need to be installed. Building requires network access; the resulting mini-program does not need network access for its catalog at runtime.

## License scope

The upstream CC BY-SA terms and attribution requirements in `licenses/` apply to the derived astronomical data in `data/catalog.js` and its redistribution. HYG and OpenNGC use CC BY-SA 4.0; Stellarium sky cultures retain their original CC BY-SA declarations. When modifying or redistributing these data, retain their sources, identify modifications, and comply with the applicable share-alike terms.

This document **does not assign a separate third-party software license to the main application source code**. The main Stellarium application's GPL translation bundles are not included. Application code and data have separate license scopes.

A bilingual guide to the license files is available in the [License guide](licenses/README.en.md). Upstream license texts are retained unchanged.

The pinyin pronunciation data and derived sort keys also retain pypinyin's MIT copyright and license notice. This does not replace the CC BY-SA attribution requirements for the astronomical catalogs themselves.

Web edition note: `data/` and `licenses/` are included in the website. The `tools/` data-building scripts described here remain in the original `xunxing-miniprogram` project. The web edition directly reuses its verified catalogs.
