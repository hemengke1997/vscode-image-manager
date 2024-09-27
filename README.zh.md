<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> 压缩、裁剪、转换格式、搜索、查找相似图片的 VS Code 插件

[English Docs](./README.md)

## [更新日志](./CHANGELOG.md)

## 插件截图

<details open>
  <summary>概览</summary>

![overview](./screenshots/overview.png)

</details>

<details>
  <summary>大图预览</summary>

![preview](./screenshots/preview.png)

</details>

<details>
  <summary>批量压缩</summary>

![compression](./screenshots/compression.png)

</details>

<details>
  <summary>裁剪</summary>

![crop](./screenshots/crop.png)

</details>


<details>
  <summary>图片查找</summary>

![search](./screenshots/search.png)

</details>


<details>
  <summary>查找相似图片</summary>

![find-similarity](./screenshots/find-similarity.png)

</details>



## 核心功能

> **绝对安全，本地处理**。所有图片处理均在本地完成，确保隐私安全

- **图片批量压缩**
- **图片裁剪**
- **图片大图浏览**
- **相似图片查找**
- 支持多选（Shift/Ctrl/Cmd）
- 查看图片详情（尺寸、体积等）
- 查找图片
- 条件筛选图片（根据 git-staged/图片大小/是否已压缩筛选）
- 暗黑/明亮主题，自定义 UI 主题色
- 国际化。目前支持 `English`，`简体中文`，`繁體中文`，`日本語`

## 使用方法

**有以下几种方式打开插件**

### 1. 快捷键

- Windows: `Shift+Alt+J`
- macOS: `Cmd+Option+J`

### 2. 右键菜单

在资源管理器中右键选择 `Image Manager 🏞️` 打开插件。

### 3. 命令面板

按 `Ctrl+Shift+P`（macOS: `Cmd+Shift+P`）打开命令面板，输入 `Image Manager` 并选择打开。

## [插件配置项](./docs/vscode-configuration.md)

## 小贴士

### 关于配置

大部分配置可以在插件页面中设置，比如主题、语言等。当然，也可以在 `settings.json` 中进行设置。

### 压缩

- 在图片上右键，可以单独压缩一张图片。

![compress-right-click-image](./screenshots/compress-cn-1.png)

- 在文件夹上右键，可以批量压缩文件夹下的图片。

![compress-right-click-folder](./screenshots/compress-cn-2.png)

### 浏览区域

- `Cmd/Ctrl + 鼠标滚轮` 可以缩放图片大小。
- `Cmd/Ctrl + F` 可以打开搜索窗口。

### 常见问题

#### 为什么第一次打开插件很慢？

由于首次打开插件时需要下载必要的依赖，这个过程可能会比较慢，具体取决于您的网络环境。请耐心等待。

#### 报错：依赖安装失败，请检查网络

如果您在中国大陆且网络环境不佳（你懂的），有两种解决方案：

1. 切换镜像源
2. 手动安装依赖

##### 如何切换镜像源

使用命令面板，输入 `select mirror url` 并回车。

![选择](./screenshots/select-mirror-1.png)

然后选择一个镜像源，重启 VS Code 并尝试重新下载依赖。

![选择](./screenshots/select-mirror-2.png)

如果切换镜像源后依然安装失败，请手动安装依赖。

##### 如何手动安装依赖

1. 打开命令面板，输入 `Show Output Channel`，选择 Image Manager 对应的选项。
2. 在输出中找到 `插件根目录 (Extension Root)`，之后需要用到。
3. 下载 `Output Channel` 中打印的依赖地址。
4. 将下载的文件放在步骤 2 的 `插件根目录`。
5. 重启 VS Code 即可。

#### 为什么压缩后文件反而变大了？

- 由于压缩时添加了「是否已压缩」的元信息，可能导致小体积图片压缩后变大。
- 您可以设置 `image-manager.compression.errorRange` 来调整压缩误差范围。

#### 图片太多，感觉卡顿怎么办？

- 可以配置 `image-manager.appearance.reduceMotion: 'on'` 来减少动画效果。
- 可以使用右键文件夹的方式打开指定的目录，从而减少渲染的图片数量。

## 赞赏

> 如果这个插件能帮助到您，请作者喝杯咖啡吧 :) ☕️
>
> 或者动动小手指 [点个 star](https://github.com/hemengke1997/vscode-image-manager) ⭐️

| 微信                                                   | 支付宝                                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| <img src="./screenshots/wechatpay.jpeg" width="200" /> | <img src="./screenshots/alipay.jpeg" width="200" /> |

## 反馈

如果有任何问题或建议，请在 [GitHub Issues](https://github.com/hemengke1997/vscode-image-manager/issues) 中提出。

如果觉得此插件好用，请在 [Marketplace](https://marketplace.visualstudio.com/items?itemName=minko.image-manager&ssr=false#review-details) 中给予好评，非常感谢！你的支持是我开源的最大动力

## 感谢

❤️ [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)

❤️ [vscode-svgo](https://github.com/1000ch/vscode-svgo)
