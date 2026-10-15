# 数据署名与许可说明

**中文** | [English](README.en.md)

本目录保存追星人 · Astertrail 使用的上游数据署名和许可。下文提供中文阅读说明；上游版权声明和许可原文保持不变，本说明不替代这些原文，也不为应用程序源码另行授予许可。

完整的版本、来源链接、处理方法和复现记录见[数据来源](../DATA_SOURCES.md)。

## 文件导览

| 文件 | 内容 |
| --- | --- |
| [DATA-NOTICE.txt](DATA-NOTICE.txt) | 本项目的英文天文数据署名及修改说明；中文对应内容见下方 |
| [CC-BY-SA-4.0.txt](CC-BY-SA-4.0.txt) | 上游保留的 CC BY-SA 4.0 许可全文（英文原文） |
| [OpenNGC-REUSE.txt](OpenNGC-REUSE.txt) | OpenNGC 原始 REUSE 版权与许可声明 |
| [pypinyin-MIT.txt](pypinyin-MIT.txt) | pypinyin 原始 MIT 版权与许可全文 |

## 天文数据署名与修改说明

以下说明适用于 `data/catalog.js` 中的天文数据，不为应用程序源码指定第三方软件许可。

- **HYG v4.1**：David Nash / Astronomy Nexus，CC BY-SA 4.0。[作者项目](https://www.astronexus.com/projects/hyg) · [所用版本说明](https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/README.md)
- **OpenNGC**：Mattia Verga 及贡献者，CC BY-SA 4.0。[上游项目](https://github.com/mattiaverga/OpenNGC)。原 REUSE 声明保存在 `OpenNGC-REUSE.txt`，CC BY-SA 4.0 许可原文保存在 `CC-BY-SA-4.0.txt`。
- **Stellarium Sky Cultures**：使用 Western 和 Chinese 星文化数据。Western 原声明为“Text and data: CC BY-SA”，Chinese 原声明为“Text and line: CC BY-SA”；两者都没有指定许可版本。作者为 Stellarium 团队；中国星文化的贡献者包括 Karrie Berglund（Digitalis Education Solutions）、Sun Shuwei 及其他 Stellarium 贡献者。上游文档还致谢香港太空馆星图和伊世同的《中西对照恒星图表 1950.0》。[固定版本](https://github.com/Stellarium/stellarium-skycultures/tree/014fbb5e59233d133c22f9811af96b67d05a95c9)

本项目未包含星座插图、地图图片、Stellarium 主程序代码或使用 GPL 许可的主程序翻译包。

2026-10-15 为 Astertrail 所做的数据处理包括：按星等筛选、移除太阳、转换为十进制度坐标、提取中文恒星名称、把折线拆分为线段、计算球面标签位置、人工维护事实性中文搜索形式、采用 M102 识别约定，以及序列化为离线 JavaScript 数据模块。完整处理说明见[数据来源](../DATA_SOURCES.md)；精确源文件哈希保存在原小程序工程的 `tools/data_sources.json`。再分发派生数据时，请保留来源署名并遵守适用的同方式共享条款。

## OpenNGC 原始版权记录

`OpenNGC-REUSE.txt` 使用 Debian 可机器读取的版权文件格式。它记录的上游名称为 OpenNGC，联系人及版权人为 Mattia Verga（`mattia.verga@tiscali.it`），版权年份为 2023；`Files: *` 对应的许可为 CC-BY-SA-4.0。原始记录未改动。

## 拼音数据

中文排序使用 pypinyin 的字音数据和预生成排序键。`pypinyin-MIT.txt` 保留了 **Copyright (c) 2016 mozillazg, 闲耘 <hotoo.cn@gmail.com>** 及完整 MIT 许可。

该许可允许使用、复制、修改、合并、发布、分发、再许可和销售相关软件及文档，并要求在所有副本或实质部分中保留版权与许可声明；原文同时包含“按原样”提供、不作担保以及责任限制条款。这里是阅读摘要，完整条件以保留的原文为准。pypinyin 的 MIT 许可不会替代天文数据自身的 CC BY-SA 来源和署名要求。
