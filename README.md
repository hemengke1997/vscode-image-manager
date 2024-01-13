# Image Manager

## Notice

Currently extension may be unstable (windows). If you encounter problems, please report [issue](https://github.com/hemengke1997/vscode-image-manager/issues)

## Screenshot

### overview

![overview](./screenshots/overview.png)

### i18n 
![i18n](./screenshots/i18n.png)

### preview
![preview](./screenshots/preview.png)

### theme
![theme](./screenshots/theme.png)


## Usage

**Several ways open extension**

### Shortcut

- windows: `shift+alt+i`
- macos: `cmd+option+i`


### Command

`ctrl+shift+p` (macos `cmd+shift+p`), input `Open Image Manager` to open.

### Context Menu

Right click in Explorer, select `Open Image Manager` to open extension.


## Features

- **Compress Images** (magic happens with right-click)
- Image Viewer
- Dynamic Theme

## Extension Settings

| Name                              | Type                | Description                                                                                                                                        | Default value                                                                                                      |
| --------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| image-manager.warningSize         | `number \| boolean` | Show warning dot if image size is larger than this value (KB)                                                                                      | 500                                                                                                                |
| image-manager.imageDefaultWidth   | `number`            | default width of image (px)                                                                                                                        | 100                                                                                                                |
| image-manager.scaleStep           | `number`            | scale step when zooming image list                                                                                                                 | 0.1                                                                                                                |
| image-manager.exclude             | `string[]`          | scan images not in exclude (pattern syntax of micromatch)                                                                                          | `['**/node_modules/**', '**/.git/**''**/dist/**','**/coverage/**', '**/.next/**',  '**/.nuxt/**','**/.vercel/**']` |
| image-manager.imageTypes          | `string[]`          | scan images with imageType                                                                                                                         | `['svg', 'png', 'jpeg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng']`                                               |
| image-manager.compress.replace    | `boolean`           | replace original image with compressed image                                                                                                       | true                                                                                                               |
| image-manager.compress.method     | `sharp \| tinypng`  | compress method. If sharp installed, use sharp, else use tinypng                                                                                   | `sharp`                                                                                                            |
| image-manager.compress.tinypngKey | `string`            | tinypng key. If choose tinypng, you should set this key which can be get from https://tinypng.com/developers. If not set, it will use unstable key | ''                                                                                                                 |
| image-manager.compress.quality    | `number`            | quality of compressed image used in sharp which is between 0 and 100                                                                               | 60                                                                                                                 |

## 关于图片压缩功能

### 目前支持三种压缩方式 (`image-manager.compress.method`)

#### sharp

这是默认的压缩方式。前提需要你已经安装 node，并且设置了系统环境变量 (node -v 成功即可) 
安装扩展时，会自动安装sharp，需要耐心等待 (跟你的网络环境有关)

#### tinypng api 模式

需要你已经申请了 tinypng 的 api key，可以在 https://tinypng.com/developers 申请，个人模式每个月可以压缩 500 张图片

需要设置 `image-manager.compress.tinypngKey`，否则会使用免费模式

#### tinypng 无 api 模式

不需要 tinypng 的 api key，免费，但是可能不稳定

### 如何压缩

#### 右键图片
![右键图片](./screenshots/compress-1.png)

#### 右键文件夹
![右键文件夹](./screenshots/compress-2.png)

## Inspired

❤️ [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)
