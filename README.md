<p align='center'>
  <a href='https://github.com/hemengke1997/vscode-image-manager' target="_blank" rel='noopener noreferrer'>
    <img width='140' src='./assets/logo.png' alt='logo' />
  </a>
</p>

<h1 align='center'>Image Manager</h1>

> [!WARNING]
> Extension maybe unstable on windows. If you encounter any problem, please report [issue](https://github.com/hemengke1997/vscode-image-manager/issues)

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

`ctrl+shift+p` (macos `cmd+shift+p`), input `Open Image Manager` to open. (Open workspace root folder)

### Context Menu

Right click in Explorer, select `Open Image Manager` to open extension. (Open current folder)


## Features

- **Compress Images** (magic happens on right-click 🤩)
- **Crop Images**
- **Image Viewer**
- Dynamic Theme
- Image Scale (`cmd + wheel` or `ctrl + wheel`)
- I18n. Currently support `english` and `简体中文`
- And so on waiting for you to discover...🤗

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

## About image compress

### Three compression methods are supported at present (`image-manager.compress.method`)

#### sharp

This is the default compression method. You need to install `node` and set the system environment variable (node -v is successful)

When installing the extension, sharp will be installed automatically, please be patient (depending on your network environment)

#### tinypng api mode

You need to apply for the tinypng api key at https://tinypng.com/developers. The personal mode can compress 500 images per month

Of course you need to set `image-manager.compress.tinypngKey`, otherwise the free mode will be used

#### tinypng free mode

If you don't set tinypngKey(`image-manager.compress.tinypngKey`), extension will automatically switch to this mode. Free, but may be unstable

### How to compress

#### Right click on the image
![compress-right-click-image](./screenshots/compress-1.png)

#### Right click on the folder name
![compress-right-click-folder](./screenshots/compress-2.png)



## Inspired

❤️ Big thanks for [vscode-image-viewer](https://github.com/ZhangJian1713/vscode-image-viewer)
