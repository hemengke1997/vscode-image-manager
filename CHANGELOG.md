# CHANGELOG

## 0.2.2

### Chore

- Add animation icon for extension initializing statusbar of vscode

## 0.2.1

### Performance

- Optimize image list rendering, reduce memory usage
- Improve UX

## 0.2.0

### Refactor

- Refactor extension's vscode configuration

Please use

- `image-manager.file.root` replace `image-manager.root`
- `image-manager.file.exclude` replace `image-manager.exclude`
- `image-manager.file.scan` replace `image-manager.imageType`
- `image-manager.viewer.warningSize` replace `image-manager.warningSize`
- `image-manager.viewer.imageWidth` replace `image-manager.imageDefaultWidth`

### Feat

- Add more configuration
  
  - `image-manager.appearance.theme`
  - `image-manager.appearance.language`
  - `image-manager.viewer.imageBackgroundColor`
  

## 0.1.2

### Fix

- i18n change not working

## 0.1.1

### Feat

- Support gif colors in compression

### Docs

- Compression tips

## 0.1.0

### Feat

- Add `git-staged` filter in Filter Action
- Add `compressed` flag to image metadata, you can find it in the image detail modal
- Auto refresh image list when config changed
- Reuse webview when open different workspace for better performance

### Break-Change

Currently, we use sharp as compressor only due to its performance and stability. So we remove `tinypng` support.

- Deprecate `image-manager.compress.method`
- Deprecate `image-manager.compress.tinypngKey`


## 0.0.26 (2024-02-08)

### Feat

- Support VSCode i10n

## 0.0.25 (2024-01-31)

### Fix

- Compress group error 😥

## 0.0.24 (2024-01-29)

### Performance

- No `npm` relay, faster install

## 0.0.23 (2024-01-25)

### Feat

- Image operator, added more image interactivity

### Break-Change

- Deprecate `image-manager.compress.replace`
- Deprecate `image-manager.compress.quality`
- Deprecate `image-manager.compress.compressionLevel`
- All above configs you can find in Image operator now.

## 0.0.22 (2024-01-22)

### Fix

- Render sort order not working

## 0.0.21 (2024-01-22)

### Fix

- Missing windows path condition when render image

## 0.0.20 (2024-01-22)

### Feat

- Support more user-custom cropper options

### Fix

- Images in root directory don't render

## 0.0.19 (2024-01-18)

### Performance

- Mask image compressor more stable

### Style

- Mask menu to aviod misclick
- Add collapse content border
- Make cropper modal width flexible

## 0.0.18 (2024-01-17)

### Fix

- Windows compress fail

## 0.0.17 (2024-01-16)

### Fix

- Windows open extension fail

## 0.0.16 (2024-01-16)

### Feat

- Support crop image!

### Fix

- Install sharp failed

### Performance

- Remove `user-agent` lib to reduce pack size

## 0.0.15 (2024-01-13)

### Feat

- Support search image. Just use `cmd + f` or `ctrl + f`!

## 0.0.14 (2024-01-13)

### Feat

- Support compress image! Please refer to README(./README.md) for more details
- Windows compatibility, though it's not perfect, but it works. (I don't have a windows machine, so I can't test it. If you get any problems, please submit an issue)

## 0.0.13 (2024-01-08)

### Feat

- Support multiple workspaces, you can right-clik on vscode explorer to choose workspace. If using vscode command or keybinding, it will open all workspaces

### Performance

- Optimized rendering logic, smoother now

## 0.0.12 (2024-01-06)

### Feat

- Support dir context-menu to open folder or highlight vscode explorer
- Add copy image as base64 to context-menu
- Add simple mode for clear layout, you can click left-top icon to change mode

### Fix

- Compact dir display wrong

## 0.0.11 (2024-01-04)

### Feat

- Support compact dir style just like vscode, user friendly
- Introduce `imageType` config, user can choose which type of image to display

### Break Change

- **Rename `image-manager.excludePath` to `image-manager.exclude`**

## 0.0.10 (2024-01-04)

### Feat

- Context-menu copy image(mod+c for shortcut), then you can paste it to other place

## 0.0.9 (2024-01-03)

### Break Change

- Rename extension to `Image Manager`

### Feat

- Error boundary

If any internal error occurs, the extension will display a friendly error message instead of crashing. Furthermore, user could report the error to the author or choose to restart.

## 0.0.8 (2024-01-02)

### Fix

- Filter action reset to previous values if user didn't trigger form submit real

## 0.0.7 (2024-01-02)

### Chore

- Improve UX, show tip when hover on icons

## 0.0.6 (2024-01-01)

### Feat

- Build in vscode primary colors
- Support `excludePath` vscode config
- Support display style(nested or flat) for visual

## 0.0.5 (2023-12-30)

### Fix

- Sync theme to localstorage

## 0.0.4 (2023-12-30)

### Feat

- I18n, support only English and Chinese now

### Fix

- Display images wrong when type filter change
- Deduplicate image types when exists multiple dirs

## 0.0.3 (2023-12-29)

### Feat

- Support vscode configuration.

You can configure the following items in the vscode configuration file.
For example:

```json
{
  "image-manager.warningSize": 500,
  "image-manager.imageDefaultWidth": 100,
  "image-manager.scaleStep": 0.2,
  "image-manager.excludePath": 
}
```

- Support vscode keybinding to open extension
  - Open Image Manager: `shift+alt+i` (macos: `cmd+alt+i`)

## 0.0.2 (2023-12-29)

### Chore

- Downgrade vscode version limit to ^1.60.0

## 0.0.1 (2023-12-28)

### Feat

- Init vscode-image-manager.

Currently support basic feature, includes viwer, preview, explorer context,etc
