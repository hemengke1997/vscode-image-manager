<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager-issue' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> Compress, crop and preview images in vscode

## Screenshot

### Overview

![overview](./screenshots/overview.png)

### Preview
![preview](./screenshots/preview.png)

### Crop
![crop](./screenshots/crop.png)

## Usage

**Several ways open extension**

### Shortcut

- windows: `shift+alt+i`
- macos: `cmd+option+i`


### Command

`ctrl+shift+p` (macos `cmd+shift+p`), input `Image Manager` to open. (Open workspace root folder)

### Context Menu

Right click in Explorer, select `Image Manager` to open extension. (Open current folder)


## Features

- **Compress Images** (magic happens on right-click 🤩)
- **Crop Images**
- **Image Viewer**
- Dynamic Theme
- Image Scale (`cmd + wheel` or `ctrl + wheel`)
- I18n. Currently support `english` and `简体中文`
- And so on waiting for you to discover...🤗


## Extension Settings

| Name                            | Type                | Description                                                   | Default value                                                                                                      |
| ------------------------------- | ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| image-manager.warningSize       | `number \| boolean` | Show warning dot if image size is larger than this value (KB) | 1024                                                                                                               |
| image-manager.imageDefaultWidth | `number`            | default width of image (px)                                   | 100                                                                                                                |
| image-manager.scaleStep         | `number`            | scale step when zooming image list                            | 0.1                                                                                                                |
| image-manager.exclude           | `string[]`          | scan images not in exclude (pattern syntax of micromatch)     | `['**/node_modules/**', '**/.git/**''**/dist/**','**/coverage/**', '**/.next/**',  '**/.nuxt/**','**/.vercel/**']` |
| image-manager.imageTypes        | `string[]`          | scan images with imageType                                    | `['svg', 'png', 'jpeg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng']`                                               |


## How to compress

### Right click on the image
![compress-right-click-image](./screenshots/compress-1.png)

### Right click on the folder name
![compress-right-click-folder](./screenshots/compress-2.png)



## Inspired

❤️ Big thanks for [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)
