# 中国图书馆分类法查询数据

数据来源：[acdzh/Chinese-Library-Classification](https://github.com/acdzh/Chinese-Library-Classification)。
来源说明为《中国图书馆分类法》第五版，2023-06-14 更新，共 45,785 条。
来源项目注明“禁止用于商业用途”；本站保留此说明，仅作个人学习查询。
本目录的数据不适用网站代码的 MIT 许可。

本站未逐条核验完整性和准确性，也未将该整理数据作为官方版本。
分类号、名称、方括号及花括号等标记均按来源保留；父子关系直接取自来源树结构，
不根据分类号前缀推断。没有补造分类号或名称，亦不包含正式版本的全部说明及复分规则。
基本大类与交替类号说明参考
[清华大学图书馆第五版简表](https://lib.tsinghua.edu.cn/info/1049/3358.htm)。

`index.json` 使用 `[分类号, 名称, 父节点数组下标]` 的紧凑结构，根节点的父下标为 -1。
来源文件的 SHA-256、来源地址、版本和来源更新时间保存在 JSON 元数据内。
页面只请求站内数据；外部参考链接不参与查询。

更新方式（从仓库根目录运行）：

```sh
curl -L --fail https://raw.githubusercontent.com/acdzh/Chinese-Library-Classification/master/clc.json -o /tmp/clc.json
python3 scripts/build_clc_search_data.py /tmp/clc.json
```

如果更换来源或版本，需同步修改生成脚本、页面及本说明中的来源信息。
