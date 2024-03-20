<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> Compress, crop, convert format and preview images in vscode

[功能介绍文章](https://juejin.cn/post/7348004403016794147)

## Screenshot

### Overview

![overview](./screenshots/overview.png)

### Preview
![preview](./screenshots/preview.png)

### Compression
![compression](./screenshots/compression.png)

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

- **Batch image compression** (magic happens on right-click 🤩)
- **Images Cropper**
- **Image Viewer**
- Dark/light theme
- I18n. Currently support `english` and `简体中文`


## Extension Settings

| Name                                      | Type                    | Description                                                                                                                                                     | Default value                                                        |
| ----------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| image-manager.file.root                   | `string[]`              | root folder to scan images                                                                                                                                      | current workspace                                                    |
| image-manager.file.exclude                | `string[]`              | scan images not in exclude, built-in exclue: `['**/node_modules/**', '**/.git/**''**/dist/**','**/coverage/**', '**/.next/**',  '**/.nuxt/**','**/.vercel/**']` | []                                                                   |
| image-manager.file.scan                   | `string[]`              | scan images with imageType                                                                                                                                      | `['svg', 'png', 'jpeg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng']` |
| image-manager.appearance.theme            | `dark \| light \| auto` | theme                                                                                                                                                           | `auto`                                                               |
| image-manager.appearance.language         | `en \| zh-CN \| auto`   | language                                                                                                                                                        | `auto`                                                               |
| image-manager.appearance.primaryColor     | `string`                | primary color                                                                                                                                                   | undefined                                                            |
| image-manager.viewer.warningSize          | `number \| boolean`     | show warning dot if image size is larger than this value (KB)                                                                                                   | 1024                                                                 |
| image-manager.viewer.imageWidth           | `number`                | width of image (px)                                                                                                                                             | 100                                                                  |
| image-manager.viewer.imageBackgroundColor | `string`                | image background color                                                                                                                                          | `#1a1a1a`                                                            |



## Tips

### Compression

- Right click on the image

![compress-right-click-image](./screenshots/compress-1.png)

- Right click on the folder

![compress-right-click-folder](./screenshots/compress-2.png)


### Viewer

- cmd/ctrl + Mouse Wheel to zoom in/out
- cmd/ctrl + F to open find modal

## Inspired

❤️ Respect [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)
