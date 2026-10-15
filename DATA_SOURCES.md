# 天文数据来源与复现

构建日期：2026-10-15。数据随追星人网页版离线提供，运行时不需要访问星表服务器。

## 实际覆盖

| 数据 | 数量 | 口径 |
| --- | ---: | --- |
| 恒星 | 5,070 | HYG v4.1 中视星等 `mag <= 6.0` 的全部记录，排除太阳记录 `id=0` |
| 有中文名称的恒星 | 2,305 | 从中国星文化的中文星官名及星号得到，其他恒星仍保留编号/西文名 |
| 梅西耶天体 | 110 | M1—M110，每个编号恰好一条 |
| 有中文常用名称的梅西耶天体 | 30 | 独立维护的事实名称与搜索别名；其余显示 M 编号 |
| 现代星座 | 88 | 使用 IAU 三字母缩写；巨蛇座 `Ser` 为一条记录，保留其两片区域的连线 |
| 星座线段 | 674 | 从 Stellarium Western 星文化的 HIP 折线逐段展开 |
| 附加连线端点恒星 | 1 | HIP10826，鲸鱼座 ο / Mira；星表记录星等 6.47，仅补足连线，不混入 ≤6 等显示列表 |

“6 等及更亮”对应星等数值 **≤6**。这里按源星表的静态星等筛选，变星不会按当天亮度动态进出列表。HYG 会单独记录部分多星系统的成员，数量是星表记录数，不等同于肉眼可分辨的光点数。

## 上游来源、版本、署名

1. **HYG v4.1，David Nash / Astronomy Nexus。** 原始文件为 `hyg/CURRENT/hygdata_v41.csv`，固定在作者 GitHub 存档提交 `c7f7f883fe678cc7680169a50ccd7dcc49b060ce`。源表 119,626 条记录（含太阳）。HYG 汇集 Hipparcos、Yale Bright Star 与 Gliese 数据。v4.x 数据许可为 **CC BY-SA 4.0**。实际构建没有使用 v4.2。
   - 作者项目说明：https://www.astronexus.com/projects/hyg
   - 所用版本与字段说明：https://github.com/astronexus/HYG-Database/blob/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/README.md
   - 原始星表：https://raw.githubusercontent.com/astronexus/HYG-Database/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/CURRENT/hygdata_v41.csv

2. **OpenNGC，Mattia Verga 及贡献者。** 固定提交 `4e2398a263de663d83f7b86be80c368c34335764`，使用 `database_files/NGC.csv` 和 `database_files/addendum.csv`。许可 **CC BY-SA 4.0**，版权与 REUSE 声明随 `licenses/` 保存。OpenNGC 的上游包括 NED、SIMBAD、HyperLEDA、HEASARC 及 Harold Corwin 的记录；逐字段来源保留在原始 CSV 的 `Sources` 列。
   - 项目及署名：https://github.com/mattiaverga/OpenNGC
   - 固定主表：https://raw.githubusercontent.com/mattiaverga/OpenNGC/4e2398a263de663d83f7b86be80c368c34335764/database_files/NGC.csv
   - 固定附录：https://raw.githubusercontent.com/mattiaverga/OpenNGC/4e2398a263de663d83f7b86be80c368c34335764/database_files/addendum.csv

3. **Stellarium Sky Cultures。** 固定提交 `014fbb5e59233d133c22f9811af96b67d05a95c9`。使用 Western `index.json` 的连线和 Chinese `index.json` 的原生中文名称、HIP 关联；Chinese `po/zh_CN.po` 仅用于该星文化的少量直接名称，不使用 Stellarium 主程序翻译库。Western 数据归 Stellarium 团队；中国星文化由 Karrie Berglund、Sun Shuwei 及 Stellarium 团队等贡献，原说明引用香港太空馆星图及伊世同的中西对照星图资料。两个文化包将数据/文字/连线标为 **CC BY-SA**，其原文没有标明版本，本项目保留原样声明；未使用星座插图、地图图片或主程序代码。
   - 项目：https://github.com/Stellarium/stellarium-skycultures
   - Western 数据：https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/014fbb5e59233d133c22f9811af96b67d05a95c9/western/index.json
   - Western 原许可：https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/description.md#license
   - Chinese 数据：https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/014fbb5e59233d133c22f9811af96b67d05a95c9/chinese/index.json
   - Chinese 原许可及作者：https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/chinese/description.md#authors

## 中文事实名称表

`tools/chinese_names.json` 独立维护 88 个星座的中文名及 30 个常见梅西耶天体的中文名称/同义搜索形式。它只列事实性名称与编号对应，不复制网站文章、神话、说明文字、图片或应用翻译文件。

- 88 星座的拉丁名、缩写对应取自 Western 数据；中文标准用名人工维护，并对照香港坐井会的名称列表核查。使用简体惯用形式，例如鲸鱼座、印第安座、摩羯座；不复用该网站的解释、神话或版式：https://www.skyobserver.org/basic/Constellations/88%20Constellations%20names.htm
- 梅西耶编号与常用英文名称关系交叉核对 NASA Hubble Messier Catalog 和 OpenNGC `Common names` 字段；中文采用常用天文学术语，并显式列出同义形式，例如仙女座大星系/仙女座星系、昴星团/昴宿星团：https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/
- M42、M45 的中文观星名称亦对照南瀛天文馆原始科普资料：https://taea.tn.edu.tw/taea_area/item/page/a0000000-0000-0000-0000-000000000030
- 恒星的中文星号由源星文化的星官名与罗马数字编号转换，例如 `Three Stars IV` → 参宿四。另外补充少量常用搜索形式：天狼星、织女星、北极星、牛郎星、大角星、老人星。这些别名与原 HIP 编号关联，不重新猜测坐标。

## 坐标与处理约定

- `ra`、`dec` 统一为 **J2000 赤道坐标，单位为度**。HYG 的赤经小时数乘以 15；OpenNGC 的时分秒/度分秒转成十进制度。赤经位于 `[0, 360)`，赤纬位于 `[-90, 90]`。
- 星图需要使用设备的地点和 UTC 时间，完成岁差及赤道坐标到地平坐标的变换。精简数据未导出恒星自行、视差或大气折射参数，不应当作高精度测量星表使用。
- 星座的 `ra/dec` 是线段端点单位向量的球面平均，只用于标签布局；星座是区域，不存在唯一的物理“中心坐标”。该值不是 IAU 官方星座中心。
- 星座连线没有唯一官方标准。IAU 定义 88 个星座的名称与区域边界；本项目选定 Stellarium Western 画法。此次只导出用户要求的连线，没有把边界当作连线。
- 深空天体的 `mag` 只用 OpenNGC `V-Mag`，缺失时为 `null`，不将 B 波段亮度冒充 V 波段。
- M40、M45 来自 OpenNGC 附录。M102 的历史识别有争议：OpenNGC 附录将其视为 M101 的重复。本项目采用 NASA Hubble 目录常用的 **M102 = NGC5866（纺锤星系）** 约定，从 OpenNGC 的 NGC5866 行取坐标，并不篡改原始 CSV。依据：https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-102/ ；明确列出双编号的 NASA APOD：https://apod.nasa.gov/apod/ap180725.html

## 双语显示与拼音排序

英文恒星和梅西耶名称沿用上述星表中的西文名称与别名；没有常用英文名时显示目录名称或编号，不将中文星官名自动翻译成新的英文专名。英文星座标签使用IAU的88个拉丁语主格名称，对照来源：[IAU Constellations](https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx)。切换语言只改变显示和排序，不改变天体编号或坐标。

`data/labels.js` 包含中文名称的离线拼音排序键，构建工具使用 **pypinyin 0.55.0** 的字音数据。来源为 mozillazg、闲耘及项目贡献者的 [python-pinyin](https://github.com/mozillazg/python-pinyin)，按 **MIT** 许可保留全文于 `licenses/pypinyin-MIT.txt`。固定wheel文件为 `pypinyin-0.55.0-py2.py3-none-any.whl`，SHA-256为 `d53b1e8ad2cdb815fb2cb604ed3123372f5a28c6f447571244aca36fc62a286f`；下载地址和校验代码保留在 `tools/build_search_labels.py`。

构建时去掉声调，并明确处理参（shen）、宿（xiu）、棓（bang）、觜（zi）、长（chang）、斗（dou）、落（luo）及傅说（fuyue）等名称读音。手机直接读取预生成排序键，不运行Python、不下载字音词典，也不依赖设备的中文排序区域设置。中文常用名称排在其他目录名称或编号之前；英文常用名称排在目录名称或编号之前。同组按拼音或字母排序，输入后的精确名称、别名和编号优先。

## 复现

需要 Python 3，仅使用标准库。在项目目录执行：

```text
python tools/build_catalog.py
python tools/build_search_labels.py
```

脚本下载 `tools/data_sources.json` 中固定提交的 6 个源文件，逐项验证 SHA-256，默认缓存到 `.cache/data/`，生成 `data/catalog.js`。可用 `--cache 路径` 指向已下载的原始文件，用 `--output 路径` 改变输出位置。本次原始文件保存在工作区 `work/data/`，构建时使用了该缓存；`validation_report.json` 保存数量、字节数和输出哈希。

脚本会验证恒星数量、坐标范围、唯一 ID、M1—M110 完整覆盖、88 个星座、所有线段端点和常用中文搜索结果。`catalog.js` 同时支持 CommonJS `require` 和浏览器 `globalThis.SkyCatalog`，这两种加载方式均已实际验证。

第二条命令读取已生成的 `catalog.js`，下载并校验固定pypinyin包后生成 `labels.js` 和MIT许可副本。工具本身只用Python标准库，无需安装pypinyin；构建需要网络，生成的小程序运行时不需要网络。

## 许可适用范围

`licenses/` 的上游 CC BY-SA 条款与署名要求适用于 `data/catalog.js` 内的派生天文数据及其再分发。HYG/OpenNGC 使用 CC BY-SA 4.0；Stellarium 星文化按其原 CC BY-SA 声明保留。修改或再分发这些数据时应保留来源、说明修改并遵守同方式共享要求。

本说明**不为主程序源码另行指定第三方软件许可**，也没有引入 Stellarium 主程序的 GPL 翻译库。应用代码和数据许可范围分别处理。

拼音字音数据及其生成的排序键另保留pypinyin的MIT版权与许可声明；这不会替代天文星表本身的CC BY-SA来源要求。


网页版说明：data/ 与 licenses/ 随网站发布；本文所列 tools/ 数据构建脚本保留在原小程序工程 xunxing-miniprogram 中，网页版直接复用其已验证的星表。
