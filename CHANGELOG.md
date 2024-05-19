# CHANGELOG

## 0.15.2 (2024-05-19)

### Fix

- 

## 0.15.1 (2024-05-15)

### Fix

- Compatible with older versions

## 0.15.0 (2024-05-09)

### Feat

- Manual installation of sharp is supported

### Break Change

- `mirror.url` is used by sharp and libvips now. If your mirror url is end with `sharp-libvips`, please remove it

## 0.14.1 (2024-05-05)

### Performance

- UX

## 0.14.0 (2024-04-29)

### Feat

- Add `reduceMotion` config to avoid animation sluggish

### Fix

- context-menu renders sluggish


## 0.13.2 (2024-04-28)

### Fix

- Operator config sync with webview
- Add `palette` to sharp by default

## 0.13.1 (2024-04-28)

### Update

- Optimizing interaction logic of compression. Image compression will not be skipped for now if only compress single image

## 0.13.0 (2024-04-16)

### Break Change

- The shortcut key 'i' has been changed to 'j'. The previous shortcut key conflicted with the built-in shortcut key of VS Code.
- The configuration of WarningSize has been changed to a number. When the value is 0, the dot will be hidden.

### Fix

- Reveal in viewer failed when group by 'file type'

## 0.12.1 (2024-04-15)

### Fix

- Sort not working
- Similarity modal do not destory after close

### Docs

- Move `configuration` to new docs


## 0.12.0 (2024-04-14)

### Feat

- Support for opening specified image in viewer
- Support for renaming folder
- Support for deleting folder

## 0.11.3 (2024-04-11)

### Fix

- Add timestamp to get latest image file

### Chore

- Replace logo

## 0.11.2 (2024-04-11)

### Fix

- Find all similar images bug

## 0.11.1 (2024-04-11)

### Fix

- Context-state render bug

## 0.11.0 (2024-04-11)

### Feat

- Support for finding similar images
- Support for deleting images
- Support for renaming images
- Add configurations
  - `image-manager.file.confirmDelete`: controls whether ask for confirmation when deleting a image
  - `image-manager.similarity.precision`: determining the precision of image similarity. The smaller the value, the stricter the judgment

## 0.10.1 (2024-04-07)

### Fix

- Opeartor modal state messup
- i18n

## 0.10.0 (2024-04-04)

### Feat

- Support svg compression which is powered by svgo. Thanks `vscode-svgo` for the inspiration.
- Support standalone format conversion
- Support pretty svg format
- Add configurations
  - `image-manager.compression.keepOriginal`
  - `image-manager.compression.fileSuffix`
  - `image-manager.compression.skipCompressed`
  - `image-manager.compression.quality`
  - `image-manager.compression.size`
  - `image-manager.compression.format`
  - `image-manager.compression.png.compressionLevel`
  - `image-manager.compression.gif.colors`
  - `image-manager.compression.svg.*` (Please refer to svgo official document for more details)
  - `image-manager.conversion.format`
  - `image-manager.conversion.keepOriginal`

## 0.9.1 (2024-03-25)

### Update

- Normal update

## 0.9.0 (2024-03-22)

### Feat

- Support manual dependency installation
- Highlight workspace folder name when images empty
- Add `select-mirror` command to select mirror url

### Fix

- Compression custom resize not working

## 0.8.1 (2024-03-21)

### Fix

- Prompt solutions when dependencies init fails

### Docs

- Add Chinese README
- Add Common Questions and Answers

## 0.8.0 (2024-03-20)

### Feat

- Add `image-manager.mirror.enabled` config to support mirror for downloading dependencies
- Add `image-manager.mirror.url` config to support custom mirror url

### Docs

- Add common questions and answers

## 0.7.3 (2024-03-20)

### Fix

- Cropper keep internal data on options changed
- I18n

## 0.7.2 (2024-03-19)

### Update

- Improve translations
- Separate the collapse image compression context-menu into submenus

## 0.7.1 (2024-03-19)

### Feat

- Add compress recursive directories in context menu

### Fix

- Complement missing i18n

## 0.7.0 (2024-03-18)

### Feat

- Add `show ouput channel` command

### Fix

- Catch `getMetadata` error which cause compress fail

## 0.6.4 (2024-03-18)

### Fix

- Update state in webview trigger endless loop

## 0.6.3 (2024-03-18)

### Fix

- Track debounced config make webview state mess up
- Sync workspaceState to webview when `reset` command triggerd

## 0.6.2 (2024-03-16)

### Fix

- Support recent colors in workspaceState
- Fix copy ico base64 failed
- Copy tiff base64 as png (for brower compatibility)

## 0.6.1 (2024-03-16)

### Fix

- I18n don't sync with vscode config

## 0.6.0 (2024-03-16)

### Feat

- Add `image-manager.reset-settings` command to reset viewer settings, including `group/sort/style/type` etc.

### Fix

- Get `ico` image dimession failed

## 0.5.2 (2024-03-14)

### Feat

- Keep image original file type after cropped

### Performance

- Reduce filter changed leading to render serveral times

## 0.5.1

### Fix (2024-03-13)

- Filter git staged/unstaged images not correct

### Optimize

- Update better icons

## 0.5.0 (2024-03-12)

### Feat

- Add `image-manager.appearance.primaryColor` config to support custom primary color

### Performance

- Optimize toast render performance
- Optimize config changed leading to webview slow render

## 0.4.3 (2024-03-11)

### Fix

- Compressor init error

## 0.4.2 (2024-03-10)

### Fix

- Batch compression messup (caused by 0.4.1 change)

## 0.4.1 (2024-03-09)

### Feat

- Add `skip compressed` option in operator modal
- Change webview background to user's vscode editor background if theme is the same
- Splite compress error and success notification placement, the error will show on left-top placement

## 0.4.0 (2024-03-08)

### Feat

- Support filter compressed/uncompressed images
- Support filter git-staged/unstaged images
- Show compressed status when hover on image

### Fix

- Render twice when open extension
- Git staged command execute too many times

## 0.3.0 (2024-03-07)

### Feat

- Support dependency os cache, improve performance

## 0.2.3 (2024-03-06)

### Fix

- Can't compress images when `group by type` option checked

## 0.2.2 (2024-03-05)

### Chore

- Add animation icon for extension initializing statusbar of vscode

## 0.2.1 (2024-03-04)

### Performance

- Optimize image list rendering, reduce memory usage
- Improve UX

## 0.2.0 (2024-03-01)

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
  

## 0.1.2 (2024-02-29)

### Fix

- i18n change not working

## 0.1.1 (2024-02-28)

### Feat

- Support gif colors in compression

### Docs

- Compression tips

## 0.1.0 (2024-02-28)

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
