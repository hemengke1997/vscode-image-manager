# CHANGELOG

## 1.7.1 (2024-07-08)

### Fix

- 移除弹窗中的无用的多选功能

### Performance

- 移除 `Typography.Text` 的 ellipsis 功能，其非常消耗性能，在图片数量多时导致渲染缓慢
- 图片始终懒加载，当图片离开视窗后，将卸载以提高渲染性能
- 关闭文件夹目录时，卸载其中组件，提高渲染性能

## 1.7.0 (2024-07-05)

### Feat

- 重构svg配置逻辑，收敛并预设配置，减少用户的使用负担。对svg有深度需求的用户，可以使用命令 `image-manager.configure-svg` 进行配置
- 添加 `image-manager.compression.svg.removeDataAttributes` 配置，用于移除svg中的data属性，默认为`true`

### Break Change

- 移除了插件贡献点的所有 svgo 相关的配置，只能通过命令 `image-manager.configure-svg` 进行配置

## 1.6.0 (2024-07-04)

### Feat

- 添加 `image-manager.compression.svg.compressedAttribute` 配置，在svg压缩后添加已压缩属性。默认值为 `c`。即压缩后会在svg的根元素上添加 `data-c="1"`。如需禁用功能，可设置为 `null`

### Fix

- 移除需要必传参数的svgo插件，避免压缩失败
- 刷新图片后延迟250ms展示loading，避免闪烁

## 1.5.1 (2024-07-04)

### Fix

- 修复双击预览、文件名tooltip时弹出图片详情弹窗的问题
- 日语、繁中初始化语言未生效
- 系统缓存不可用时，第一次启动插件无法打开

## 1.5.0 (2024-07-03)

### Feat

- 现在可以跳过已压缩的svg了。根据压缩后的svg字符串判断是否已压缩过

### Fix

- svgo压缩失败后未错误提示

### Refactor

- 重构操作失败后的重试机制。以前是直接重新执行操作，现在会把所有失败的图片重新放到待操作弹窗中，用户可以重新设置参数后再次操作

## 1.4.0 (2024-07-02)

### Feat

- 支持繁体中文、日语
- 压缩时不保留原exif信息，减小图片体积

### Fix

- 右键文件夹名称时展示无效的快捷键

## 1.3.0 (2024-07-02)

### Feat

- 支持手动和超时取消压缩、转化格式这种可能比较耗时的操作（虽然能取消，但是操作是不可逆的）

### Fix

- 修复了无法跳过已压缩图片的问题

## 1.2.5 (2024-07-01)

### Fix

- windows上快捷键删除图片不规范的问题
- windows 上删除缓存时资源占用的问题
- 多次重复缓存依赖的问题

## 1.2.4 (2024-07-01)

### Fix

- 修复patch未生效导致安装依赖失败的问题

## 1.2.3 (2024-07-01)

### Fix

- 修复了 windows64 无法加载核心脚本的问题。如果加载脚本失败，请点击右下角重试按钮

## 1.2.2 (2024-07-01)

### Fix

- 修复了加载核心脚本失败的问题
- 修复了无权限写入文件流的问题

## 1.2.1 (2024-07-01)

### Fix

- 修复了首次启动插件时无法打开的问题

## 1.2.0 (2024-07-01)

### Feat

- 添加 `image-manager.clear-cache` 命令，用于清除本地缓存，在用户安装出错后，可以尝试清除缓存后重试
- 选择语言、选择镜像命令添加了当前选择的选项

### Fix

- 修复了跳过已压缩文件配置未生效的问题

## 1.1.0 (2024-06-29)

### Feat

- 添加切换语言命令
- 安装依赖时最长等待时间为 30 秒，超时将提示切换镜像源
- 依赖安装成功后才能打开插件页面（以前是安装失败也能打开，但是无法使用核心功能）
- 用户可手动取消安装

### Fix

- 修复了依赖安装失败后，非强依赖命令也无法使用的问题

## 1.0.1 (2024-06-28)

### Fix

- 修复安装 sharp-libvips 失败

## 1.0.0 (2024-06-27)

### Feat

- 支持 sharp@0.34.4，libvips@8.15.2
- 内置 sharp 依赖，不再需要安装

### Fix

- 修复了压缩后文件变大的问题。但是在图片很小的情况下（如 3kb 以下），依然可能会压缩后变大

### Break Change

- 废弃 `image-manager.compression.saveCompressionData` 配置
- 最低支持 vscode@1.70.0

## 0.24.0 (2024-06-26)

### Feat

- 添加 `cmd+c` 快捷键复制图片文件名
- 多选时禁用预览

### Fix

- 打开指定图片时，之前被选中的图片未失焦

## 0.23.2 (2024-06-26)

### Fix

- 键盘快捷键失效的问题
- 删除多张图片时，只有最后一张选中的图片被删除

## 0.23.1 (2024-06-25)

### Fix

- 多选错误

## 0.23.0 (2024-06-24)

### Feat

- 支持 shift/cmd/ctrl 多选。你可以使用 `shift` 选择一段图片，`cmd` 或 `ctrl` 选择多张图片

## 0.22.0 (2024-06-20)

### Feat

- 添加 `image-manager.file.revealFileInOsDeeply` 配置，控制是否在操作系统中深度展示文件 **一** 层

### Fix

- 修复文件名省略号不生效的问题

## 0.21.0 (2024-06-13)

### Feat

- 添加 notification 进度条

## 0.20.4 (2024-06-01)

### Fix

- 警告不支持的图片扩展名

### Chore

- 使用 kebab-case 文件命名规范
- 使用 json5 存储 i18n 资源

## 0.20.3 (2024-05-24)

### Fix

- 翻译错误

## 0.20.2 (2024-05-24)

### Fix

- 警告通知移动到右下角

### Docs

- 添加「微信」、「支付宝」打赏，谢谢支持

## 0.20.1 (2024-05-23)

### Fix

- i18n 错误

## 0.20.0 (2024-05-22)

### Feat

- 支持 debug 调试模式
  - 添加 `image-manager.debug.enabled` 配置开启 debug 模式
  - 添加 `image-manager.debug.forceInstall` 配置强制安装依赖
- 使用 vscode 内置 nodejs 运行脚本

## 0.19.1 (2024-05-22)

### Fix

- macOS 下加载 sharp 失败

## 0.19.0 (2024-05-22)

### Feat

- 添加 `image-manager.viewer.imageRendering` 配置支持像素风格

### Fix

- 在扩展打开时重置设置的问题

## 0.18.0 (2024-05-21)

### Feat

- `reset-settings` 命令将重置用户配置
- 警告提示当转换 ico 格式为其他格式时

## 0.17.0 (2024-05-21)

### Refactor

- 重构 `image-manager.conversion.icoSize` 为数组数字，支持多个尺寸。默认值为 **[16, 32]**

## 0.16.1 (2024-05-21)

### Fix

- 删除文件夹时未触发刷新

## 0.16.0 (2024-05-20)

### Feat

- 支持转化为 ico 格式
- 添加 `image-manager.conversion.icoSize` 配置控制转换为 ico 文件后的尺寸，默认值为 **32**

## 0.15.2 (2024-05-19)

### Fix

- package.json 缓存解析错误

## 0.15.1 (2024-05-15)

### Fix

- 兼容旧版本

## 0.15.0 (2024-05-09)

### Feat

- 支持手动安装 sharp

## 0.14.1 (2024-05-05)

### Performance

- UX

## 0.14.0 (2024-04-29)

### Feat

- 添加 `reduceMotion` 配置，避免动画卡顿

### Fix

- 右键菜单渲染卡顿

## 0.13.2 (2024-04-28)

### Fix

- 操作配置同步到 webview
- sharp 默认添加 `palette` 

## 0.13.1 (2024-04-28)

### Update

- 优化压缩交互逻辑。现在只压缩单张图片不会跳过压缩

## 0.13.0 (2024-04-16)

### Break Change

- 快捷键 'i' 已更改为 'j'。之前的快捷键与 VS Code 的内置快捷键冲突。
- `warningSize` 配置已更改为数字。当值为 0 时，省略号将被隐藏。

### Fix

- 当分组为 '文件类型'，viewer 展示错误的问题

## 0.12.1 (2024-04-15)

### Fix

- 排序不生效的问题
- 查找相似图片弹窗关闭后不销毁的问题

## 0.12.0 (2024-04-14)

### Feat

- 支持在viewer中打开指定图片
- 支持重命名文件夹
- 支持删除文件夹

## 0.11.3 (2024-04-11)

### Fix

- 添加时间戳以获取最新的图片文件

### Chore

- 替换logo

## 0.11.2 (2024-04-11)

### Fix

- 查找相似图片的问题

## 0.11.1 (2024-04-11)

### Fix

- 右键菜单渲染bug

## 0.11.0 (2024-04-11)

### Feat

- 支持查找相似图片
- 支持删除图片
- 支持重命名图片
- 添加配置
  - `image-manager.file.confirmDelete`: 控制删除图片时是否询问确认
  - `image-manager.similarity.precision`: 确定图片相似度的精度。值越小，判断越严格

## 0.10.1 (2024-04-07)

### Fix

- 修复操作弹窗状态混乱
- 修复国际化

## 0.10.0 (2024-04-04)

### Feat

- 支持 svg 压缩，由 svgo 提供支持。感谢 `vscode-svgo` 的启发。
- 支持独立格式转换
- 支持美化 svg 格式
- 添加配置
  - `image-manager.compression.keepOriginal`
  - `image-manager.compression.fileSuffix`
  - `image-manager.compression.skipCompressed`
  - `image-manager.compression.quality`
  - `image-manager.compression.size`
  - `image-manager.compression.format`
  - `image-manager.compression.png.compressionLevel`
  - `image-manager.compression.gif.colors`
  - `image-manager.compression.svg.*` (更多细节请参考 svgo 官方文档)
  - `image-manager.conversion.format`
  - `image-manager.conversion.keepOriginal`

## 0.9.1 (2024-03-25)

### Update

- 常规更新

## 0.9.0 (2024-03-22)

### Feat

- 支持手动安装依赖
- 当图片为空时，高亮工作区文件夹名称
- 添加 `select-mirror` 命令选择镜像地址

### Fix

- 修复自定义压缩尺寸不生效的问题

## 0.8.1 (2024-03-21)

### Fix

- 当依赖项初始化失败时，提示解决方案

### Docs

- 添加中文文档
- 添加常见问题和解答

## 0.8.0 (2024-03-20)

### Feat

- 添加 `image-manager.mirror.enabled` 配置支持镜像下载依赖
- 添加 `image-manager.mirror.url` 配置支持自定义镜像地址

## 0.7.3 (2024-03-20)

### Fix

- 裁剪器选项改变时保留内部数据

## 0.7.2 (2024-03-19)

### Update

- 改进翻译
- 将折叠图像压缩上下文菜单分离为子菜单

## 0.7.1 (2024-03-19)

### Feat

- 添加右键菜单压缩文件夹

### Fix

- 完善缺失的国际化

## 0.7.0 (2024-03-18)

### Feat

- 添加 `show ouput channel` 命令

### Fix

- 修复压缩时 `getMetadata` 错误导致压缩失败的问题

## 0.6.4 (2024-03-18)

### Fix

- 更新状态时，webview 状态混乱

## 0.6.3 (2024-03-18)

### Fix

- 跟踪防抖使 webview 状态混乱的问题
- 当 `reset` 命令触发时未同步工作区状态到 webview 

## 0.6.2 (2024-03-16)

### Fix

- 工作区状态中支持最近的颜色
- 修复复制 ico base64 失败
- 复制 tiff base64 为 png 格式（为了浏览器兼容性）

## 0.6.1 (2024-03-16)

### Fix

- i18n 未与 vscode 配置同步

## 0.6.0 (2024-03-16)

### Feat

- 添加 `image-manager.reset-settings` 命令重置 viewer 设置，包括 `group/sort/style/type` 等

### Fix

- 获取 `ico` 图片尺寸失败

## 0.5.2 (2024-03-14)

### Feat

- 保持裁剪后的图片原始文件类型

### Performance

- 减少过滤变化导致渲染多次的问题

## 0.5.1

### Fix (2024-03-13)

- 过滤 git staged/unstaged 图片不正确

### Optimize

- 更新icons

## 0.5.0 (2024-03-12)

### Feat

- 添加 `image-manager.appearance.primaryColor` 配置支持自定义主题色

### Performance

- 优化toast渲染性能
- 优化配置变化导致webview渲染缓慢的问题

## 0.4.3 (2024-03-11)

### Fix

- 压缩器初始化错误

## 0.4.2 (2024-03-10)

### Fix

- 批量压缩混乱（由 0.4.1 更改引起）

## 0.4.1 (2024-03-09)

### Feat

- 在操作弹窗中添加 `skip compressed` 选项
- 如果主题与 vscode 编辑器主题相同，则将 webview 背景更改为用户的 vscode 编辑器背景
- 将压缩错误和成功通知分开，错误通知将显示在左上角

## 0.4.0 (2024-03-08)

### Feat

- 支持过滤已压缩/未压缩的图片
- 支持过滤 git staged/unstaged 图片
- 鼠标悬停在图片上时显示压缩状态

### Fix

- 修复打开扩展时渲染两次
- 修复 git staged 命令执行多次

## 0.3.0 (2024-03-07)

### Feat

- 支持依赖项 os 缓存，提高性能

## 0.2.3 (2024-03-06)

### Fix

- 修复 `按类型分组` 选项勾选时无法压缩图片的问题

## 0.2.2 (2024-03-05)

### Chore

- 添加 vscode 状态栏初始化动画图标

## 0.2.1 (2024-03-04)

### Performance

- 优化图片列表渲染，减少内存使用
- 改进用户体验

## 0.2.0 (2024-03-01)

### Refactor

- 重构扩展的 vscode 配置

请使用

- `image-manager.file.root` 替换 `image-manager.root`
- `image-manager.file.exclude` 替换 `image-manager.exclude`
- `image-manager.file.scan` 替换 `image-manager.imageType`
- `image-manager.viewer.warningSize` 替换 `image-manager.warningSize`
- `image-manager.viewer.imageWidth` 替换 `image-manager.imageDefaultWidth`

### Feat

- 添加更多配置
  - `image-manager.appearance.theme`
  - `image-manager.appearance.language`
  - `image-manager.viewer.imageBackgroundColor`

## 0.1.2 (2024-02-29)

### Fix

- 修复 i18n 无法切换的问题

## 0.1.1 (2024-02-28)

### Feat

- 支持 gif 颜色压缩

### Docs

- 压缩提示文档

## 0.1.0 (2024-02-28)

### Feat

- 添加 `git-staged` 过滤器
- 添加 `compressed` 标志到图片元数据，你可以在图片详情弹窗中找到
- 当配置变化时自动刷新图片列表
- 在打开不同的工作区时重用 webview 以提高性能

### Break-Change

插件将使用 sharp 作为压缩器，因为它的性能和稳定性。所以我们移除了 `tinypng` 支持

- 废弃 `image-manager.compress.method`
- 废弃 `image-manager.compress.tinypngKey`

## 0.0.26 (2024-02-08)

### Feat

- 支持 VSCode 国际化

## 0.0.25 (2024-01-31)

### Fix

- 批量压缩失败的问题

## 0.0.24 (2024-01-29)

### Performance

- 不再依赖 npm, 安装更快

## 0.0.23 (2024-01-25)

### Feat

- 图片操作器，添加更多图片交互

### Break-Change

- 废弃 `image-manager.compress.replace`
- 废弃 `image-manager.compress.quality`
- 废弃 `image-manager.compress.compressionLevel`
- 以上所有配置现在都可以在图片操作器中找到

## 0.0.22 (2024-01-22)

### Fix

- 修复排序顺序不生效的问题

## 0.0.21 (2024-01-22)

### Fix

- 修复渲染图片时缺少 windows 路径条件

## 0.0.20 (2024-01-22)

### Feat

- 添加更多用户自定义裁剪器选项

### Fix

- 修复根目录中的图片不渲染

## 0.0.19 (2024-01-18)

### Performance

- 图片压缩器更稳定

### Style

- 添加蒙层避免误点
- 添加折叠内容边框
- 使裁剪器模态框宽度灵活

## 0.0.18 (2024-01-17)

### Fix

- Windows上压缩失败

## 0.0.17 (2024-01-16)

### Fix

- Windows上打开插件失败

## 0.0.16 (2024-01-16)

### Feat

- 支持图片裁剪

### Fix

- 安装sharp失败的问题

### Performance

- 移除 `user-agent` 依赖减少包大小

## 0.0.15 (2024-01-13)

### Feat

- 支持图片搜索，使用 `cmd + f` 或 `ctrl + f` 即可搜索图片

## 0.0.14 (2024-01-13)

### Feat

- 支持压缩图片！请参阅 README 了解更多细节
- Windows 兼容性，虽然不完美，但它可以工作。 (我没有 Windows 电脑，所以我无法测试。如果您遇到任何问题，请提交issue)

## 0.0.13 (2024-01-08)

### Feat

- 支持多工作区，你可以右键点击 vscode explorer 选择工作区。如果使用 vscode 命令或快捷键，它将打开所有工作区

### Performance

- 优化渲染逻辑，现在更流畅

## 0.0.12 (2024-01-06)

### Feat

- 支持目录右键菜单打开文件夹或高亮 vscode explorer
- 添加复制图片为 base64 到右键菜单
- 添加简单模式，你可以点击左上角图标切换模式

### Fix

- 修复紧凑目录显示错误

## 0.0.11 (2024-01-04)

### Feat

- 支持紧凑目录样式，就像 vscode 一样，用户友好
- 引入 `imageType` 配置，用户可以选择要显示的图片类型

### Break Change

- **重命名 `image-manager.excludePath` 为 `image-manager.exclude`**

## 0.0.10 (2024-01-04)

### Feat

- 支持右键菜单复制图片(mod+c快捷键)，然后你可以粘贴到其他地方

## 0.0.9 (2024-01-03)

### Break Change

- 将扩展名更改为 `Image Manager`

### Feat

- 支持错误边界
如果发生任何内部错误，扩展将显示友好的错误消息，而不是崩溃。此外，用户可以向作者报告错误或选择重新启动。

## 0.0.8 (2024-01-02)

### Fix

- 如果用户没有真正触发表单提交过滤器操作重置为上一个值的问题

## 0.0.7 (2024-01-02)

### Chore

- 优化用户体验，当鼠标悬停在图标上时显示提示

## 0.0.6 (2024-01-01)

### Feat

- 内置 vscode 主题颜色
- 支持 vscode 配置 `excludePath`，用户可以选择要排除的目录
- 支持显示风格（嵌套或平面）的可视化

## 0.0.5 (2023-12-30)

### Fix

- 同步主题到本地存储

## 0.0.4 (2023-12-30)

### Feat

- I18n，现在只支持英文和中文

### Fix

- 修复当类型过滤器更改时显示图像错误
- 当存在多个目录时，去重图像类型

## 0.0.3 (2023-12-29)

### Feat

- 支持 vscode 配置文件

你可以在 vscode 配置文件中配置以下项目，例如：

```json
{
  "image-manager.warningSize": 500,
  "image-manager.imageDefaultWidth": 100,
  "image-manager.scaleStep": 0.2,
  "image-manager.excludePath": 
}
```

- 支持 vscode 快捷键打开扩展
  - 打开 Image Manager: `shift+alt+i` (macos: `cmd+alt+i`)

## 0.0.2 (2023-12-29)

### Chore

- 降级 vscode 版本限制到 ^1.60.0

## 0.0.1 (2023-12-28)

### Feat


- 初始化 vscode-image-manager

目前支持基本功能，包括查看、预览、资源管理器上下文等
