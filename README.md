<style>
table tr {
  white-space:nowrap;
}
</style>


<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> 压缩、裁剪、转换格式和预览图片的vscode插件

[English README](./README.en.md)

[功能介绍文章](https://juejin.cn/post/7348004403016794147)

## 插件截图

### 概览

![overview](./screenshots/overview.png)

### 大图预览
![preview](./screenshots/preview.png)

### 压缩
![compression](./screenshots/compression.png)

### 裁剪
![crop](./screenshots/crop.png)


## 核心功能

- **图片批量压缩** (右键总会发生魔法 🤩)
- **图片裁剪**
- **图片大图浏览**
- 查看图片详情（尺寸、体积等）
- 查找图片
- 条件筛选图片
- 暗黑/明亮主题，自定义UI主题色
- 国际化。目前支持 `english` 和 `简体中文`

## 使用方法

**有以下几种方式打开插件**

### 快捷键

- windows: `shift+alt+i`
- macos: `cmd+option+i`


### 命令面板

`ctrl+shift+p` (macos `cmd+shift+p`) 打开命令面板, 输入 `Image Manager` 选择打开

### 右键菜单

资源管理器中右键选择 `Image Manager 🏞️` 打开插件


## 插件配置项




| 配置项名称                                | 数据类型                | 描述                                       | 默认值                                                                                                                       |
| :---------------------------------------- | ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| image-manager.file.root                   | `string[]`              | 扫描图片的根目录                           | 当前工作区                                                                                                                   |
| image-manager.file.exclude                | `string[]`              | 排除目录                                   | `['**/node_modules/**','**/.git/**',`<br>`'**/dist/**','**/coverage/**','**/.next/**',`<br/>`'**/.nuxt/**','**/.vercel/**']` |
| image-manager.file.scan                   | `string[]`              | 扫描的图片类型                             | `['svg','png','jpeg','jpg',`<br/>`'ico','gif','webp','bmp',`<br/>`'tif','tiff','apng','avif']`                               |
| image-manager.appearance.theme            | `dark \| light \| auto` | 主题                                       | `auto`                                                                                                                       |
| image-manager.appearance.language         | `en \| zh-CN \| auto`   | 语言                                       | `auto`                                                                                                                       |
| image-manager.appearance.primaryColor     | `string`                | 主题色                                     | undefined                                                                                                                    |
| image-manager.viewer.warningSize          | `number \| boolean`     | 当图片体积大于此值时右上角展示警告点（KB） | 1024                                                                                                                         |
| image-manager.viewer.imageWidth           | `number`                | 图片宽度（px）                             | 100                                                                                                                          |
| image-manager.viewer.imageBackgroundColor | `string`                | 图片背景色                                 | `#1a1a1a`                                                                                                                    |
| image-manager.mirror.enabled              | `boolean`               | 使用镜像下载依赖                           | false                                                                                                                        |
| image-manager.mirror.url                  | `string`                | 镜像地址（通常情况不需要自定义）           | undefined                                                                                                                    |

## 小贴士

### 关于配置

大部分配置可以在插件页面中设置，比如主题、语言等，当然也可以在 `settings.json` 中设置

### 压缩

- 在图片上右键，可以单独压缩一张图片

![compress-right-click-image](./screenshots/compress-1.png)

- 在文件夹上右键，可以批量压缩文件夹下的图片

![compress-right-click-folder](./screenshots/compress-2.png)


### 浏览区域

- `cmd/ctrl + Mouse Wheel` 可以缩放图片大小
- `cmd/ctrl + F` 可以打开搜索窗口

### 常见问题

#### 为什么第一次打开插件很慢？

由于首次打开插件时，需要下载必要依赖，此过程跟您的网络环境有关，可能会比较慢，请耐心等待

#### 报错：依赖安装失败，请检查网络

如果您是在中国大陆，且网络环境不佳（懂的都懂），请开启镜像源配置，然后重启vscode

有两种方式：

- 使用命令面板，输入 `enable mirror`，然后回车

或者

- 手动修改配置文件 `settings.json`，添加如下配置

```json
{
  "image-manager.mirror.enabled": true
}
```

## 感谢

❤️ [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)
