<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> Compress, crop, convert formats, search, and find similar images in VS Code

[中文文档](./README.zh.md)

## [Changelog](./CHANGELOG.md)

## Screenshot

<details open>
  <summary>Overview</summary>

![overview](./screenshots/overview.png)

</details>

<details>
  <summary>Preview</summary>

![preview](./screenshots/preview.png)

</details>

<details>
  <summary>Batch Compression</summary>

![compression](./screenshots/compression.png)

</details>

<details>
  <summary>Crop</summary>

![crop](./screenshots/crop.png)

</details>

<details>
  <summary>Search</summary>

![search](./screenshots/search.png)
</details>


<details>
  <summary>Finding Similarities</summary>

![find-similirity](./screenshots/find-similarity.png)

</details>


## Features

> **Absolutely secure, processed locally**. All image processing is done locally, ensuring privacy and security.

- **Batch image compression**
- **Image cropper**
- **Image viewer**
- **Finding similar images**
- Multi-select (Shift/Ctrl/Cmd)
- View image details
- Finding images
- Conditional filtering of images
- Dark/light theme
- I18n support: `English`, `简体中文`, `繁體中文`, `日本語`

## Usage

**Several ways open extension**

### 1.Shortcut

- Windows: `Shift+Alt+J`
- macOS: `Cmd+Option+J`

### 2.Context Menu

Right-click in Explorer, select `Image Manager` to open the extension (opens the current folder).

### 3.Command

Press `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`), type `Image Manager` to open (opens the workspace root folder).

## [Extension Configurations](./docs/vscode-configuration.en.md)

## Tips

### Compression

- Right-click on the image

![compress-right-click-image](./screenshots/compress-1.png)

- Right-click on the folder

![compress-right-click-folder](./screenshots/compress-2.png)

### Viewer

- `Cmd/Ctrl + Mouse Wheel` to scale image size
- `Cmd/Ctrl + F` to open the `Search` modal

### Common Questions

#### Why is opening the extension slow the first time?

The first time you open the extension, it will need to download the necessary dependencies. Depending on your network environment, this process may be slow. Please be patient!

#### Why does the file get bigger after compression?

- Meta information about whether the image is compressed is added during compression. As a result, a small image may become larger after compression.
- You can set `image-manager.compression.errorRange` to adjust the compression error range.

#### What to do if there are too many images and it feels sluggish?

- You can configure `image-manager.appearance.reduceMotion: 'on'` to reduce animation effects.
- You can open a specific directory by right-clicking on the folder, which will reduce the number of images rendered.

## Support

> If this plugin has been helpful to you, please consider buying the author a cup of coffee :) ☕️
>
> Or give it a star by [clicking here](https://github.com/hemengke1997/vscode-image-manager) ⭐️

| Wechat Pay                                             | Alipay                                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| <img src="./screenshots/wechatpay.jpeg" width="200" /> | <img src="./screenshots/alipay.jpeg" width="200" /> |

## Feedback

If you have any questions or suggestions, please raise them in [GitHub Issues](https://github.com/hemengke1997/vscode-image-manager/issues).

If you find this plugin useful, please give it a good rating in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=minko.image-manager&ssr=false#review-details). Thank you very much! Your support is my greatest motivation for open source.

## Thanks

❤️ [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)

❤️ [vscode-svgo](https://github.com/1000ch/vscode-svgo)
