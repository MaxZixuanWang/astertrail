# Data Attribution and License Guide

[中文](README.md) | **English**

This directory retains upstream data attribution and licenses used by 追星人 · Astertrail. The guide explains the files; upstream copyright notices and license texts remain unchanged. It does not replace those originals or separately license the application's source code.

See [Data sources](../DATA_SOURCES.en.md) for full versions, source links, processing methods, and reproduction notes.

## Files

| File | Contents |
| --- | --- |
| [DATA-NOTICE.txt](DATA-NOTICE.txt) | The project's English astronomical-data attribution and modification notice; also explained below |
| [CC-BY-SA-4.0.txt](CC-BY-SA-4.0.txt) | The full CC BY-SA 4.0 license retained from upstream, in its original English |
| [OpenNGC-REUSE.txt](OpenNGC-REUSE.txt) | OpenNGC's original REUSE copyright and license notice |
| [pypinyin-MIT.txt](pypinyin-MIT.txt) | pypinyin's original copyright notice and full MIT license |

## Astronomical data attribution and modifications

This notice applies to the astronomical data in `data/catalog.js`. It does not assign a third-party software license to the application's source code.

- **HYG v4.1**: David Nash / Astronomy Nexus, CC BY-SA 4.0. [Author's project](https://www.astronexus.com/projects/hyg) · [Version documentation](https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/README.md)
- **OpenNGC**: Mattia Verga and contributors, CC BY-SA 4.0. [Upstream project](https://github.com/mattiaverga/OpenNGC). The original REUSE attribution statement is included in `OpenNGC-REUSE.txt`, and the CC BY-SA 4.0 legal text is included in `CC-BY-SA-4.0.txt`.
- **Stellarium Sky Cultures**: Western and Chinese culture data. The original Western statement is “Text and data: CC BY-SA”; the original Chinese statement is “Text and line: CC BY-SA.” Neither specifies a license version. Authors are the Stellarium team; Chinese culture contributors include Karrie Berglund (Digitalis Education Solutions), Sun Shuwei, and other Stellarium contributors. The upstream documentation also credits Hong Kong Space Museum star maps and Yi Shitong's *Chinese and Western Contrast Star Chart and Catalogue 1950.0*. [Pinned version](https://github.com/Stellarium/stellarium-skycultures/tree/014fbb5e59233d133c22f9811af96b67d05a95c9)

No constellation artwork, map images, main Stellarium application code, or GPL application translation bundles are included.

Changes made for Astertrail on 2026-10-15 include magnitude filtering; removal of the Sun; conversion to decimal-degree coordinates; extraction of Chinese star names; polyline segmentation; spherical label positions; manually maintained factual Chinese search forms; the M102 identification convention; and serialization to an offline JavaScript data module. See [Data sources](../DATA_SOURCES.en.md) for full processing notes. Exact source hashes are retained in `tools/data_sources.json` in the original mini-program project. Retain source credit and applicable share-alike terms when redistributing the derived data.

## Original OpenNGC copyright record

`OpenNGC-REUSE.txt` uses the Debian machine-readable copyright format. It records OpenNGC as the upstream name, Mattia Verga (`mattia.verga@tiscali.it`) as the contact and copyright holder, and 2023 as the copyright year. Its `Files: *` entry specifies CC-BY-SA-4.0. The original record is unchanged.

## Pinyin data

Chinese sorting uses pypinyin pronunciation data and precomputed sort keys. `pypinyin-MIT.txt` retains **Copyright (c) 2016 mozillazg, 闲耘 <hotoo.cn@gmail.com>** and the full MIT license.

That license permits use, copying, modification, merging, publication, distribution, sublicensing, and sale of the covered software and documentation, provided that copies or substantial portions retain the copyright and permission notices. The original also contains an “as is” provision, a warranty disclaimer, and limitations of liability. This is a reading summary; the retained original gives the full terms. pypinyin's MIT license does not replace the CC BY-SA source and attribution requirements for the astronomical data.
