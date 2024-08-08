<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> Compress, crop, convert format, search and find similary images in vscode

[中文 README](./README.md)

## Screenshot

### Overview

![overview](./screenshots/overview.png)

### Preview

![preview](./screenshots/preview.png)

### Compression

![compression](./screenshots/compression.png)

### Crop

![crop](./screenshots/crop.png)

### Finding Similarities

![find-similirity](./screenshots/find-similarity.png)

### Search

![search](./screenshots/search.png)

## Features

- **Batch image compression** (magic happens on right-click)
- **Images Cropper**
- **Image Viewer**
- **Finding similar images**
- Multi-select (shift/ctrl/cmd)
- View image details
- Finding images
- Conditional filtering of images
- Dark/light theme
- I18n. Currently support `english`, `简体中文`, `繁體中文`, `日本語`

## Usage

**Several ways open extension**

### 1.Shortcut

- windows: `shift+alt+j`
- macos: `cmd+option+j`

### 2.Context Menu

Right click in Explorer, select `Image Manager` to open extension. (Open current folder)

### 3.Command

`ctrl+shift+p` (macos `cmd+shift+p`), input `Image Manager` to open. (Open workspace root folder)

## [Extension Configurations](./docs/vscode-configuration.en.md)

## Tips

### Compression

- Right click on the image

![compress-right-click-image](./screenshots/compress-1.png)

- Right click on the folder

![compress-right-click-folder](./screenshots/compress-2.png)

### Viewer

- `cmd/ctrl + Mouse Wheel` to scale image size
- `cmd/ctrl + F` to open `Search` modal

### Common Questions

#### Why is opening the extension slow at the first time?

The first time you open the extension, it will need to download the necessary dependencies. Depending on your network environment, this process may be slow. Please be patient!

#### Why does the file get bigger after compression?

- The meta information of Whether the image is compressed is added during compression. As a result, a small image may become larger after compression.

## Thanks

❤️ [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)

❤️ [vscode-svgo](https://github.com/1000ch/vscode-svgo)
