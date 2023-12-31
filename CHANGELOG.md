# CHANGELOG

## [0.0.12](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.11...v0.0.12) (2024-01-06)

### feat

* support dir context-menu to open folder or highlight vscode explorer ([9e4f3a1](https://github.com/hemengke1997/vscode-image-manager/commit/9e4f3a1121f05ed0b297455d6c3c05fb0a028bea))
* add copy image as base64 to context-menu ([8b7eab7](https://github.com/hemengke1997/vscode-image-manager/commit/8b7eab78eb434a7437b38baa4718ef154233eb44))
* add simple mode for clear layout, you can click left-top icon to change mode ([e297381](https://github.com/hemengke1997/vscode-image-manager/commit/e297381cb7c979d6dca3c27546f9e57ed230ef9f))

### fix

* compact dir display wrong

## [0.0.11](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.10...v0.0.11) (2024-01-04)

### feat

* support compact dir style just like vscode, user friendly ([8db6d09](https://github.com/hemengke1997/vscode-image-manager/commit/8db6d098497ea137ced0c96f82caa689c0e2464f))
* introduce `imageType` config, user can choose which type of image to display ([831ea1f](https://github.com/hemengke1997/vscode-image-manager/commit/831ea1f58156017aec056ea76e4a875a59b7908c))

### Break Change

* **rename `image-manager.excludePath` to `image-manager.exclude`**

## [0.0.10](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.9...v0.0.10) (2024-01-04)

### feat

* context-menu copy image(mod+c for shortcut), then you can paste it to other place  ([457f2b1](https://github.com/hemengke1997/vscode-image-manager/commit/457f2b1aacb73c7ca86363236f67e92494752550))

## [0.0.9](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.8...v0.0.9) (2024-01-03)

### Break Change

* rename extension to `Image Manager`

### feat

* error boundary ([9a214d5](https://github.com/hemengke1997/vscode-image-manager/commit/9a214d53ac129e2b9b5a6933f0a08b0c189bdacf))

If any internal error occurs, the extension will display a friendly error message instead of crashing. Furthermore, user could report the error to the author or choose to restart.

## [0.0.8](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.7...v0.0.8) (2024-01-02)

### fix

* filter action reset to previous values if user didn't trigger form submit real([206f06c](https://github.com/hemengke1997/vscode-image-manager/commit/206f06cdbd7a79857a64764e9071fc0edf2a05b1))

## [0.0.7](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.6...v0.0.7) (2024-01-02)

### chore
* improve UX, show tip when hover on icons ([88eeb48](https://github.com/hemengke1997/vscode-image-manager/commit/88eeb4830696f754f128179df185f5b18c2e2394))

## [0.0.6](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.5...v0.0.6) (2024-01-01)

### feat

* build in vscode primary colors ([a9d7793](https://github.com/hemengke1997/vscode-image-manager/commit/a9d7793199f267c1e0a463e31a4ba225fa0fb7d6))
* support `excludePath` vscode config ([663b002](https://github.com/hemengke1997/vscode-image-manager/commit/663b002365f37d9f927496fc5b6ca309a9ef5319))
* support display style(nested or flat) for visual ([55d3130](https://github.com/hemengke1997/vscode-image-manager/commit/55d3130bdc0010abae3c5c2ac6bb3350f8c41eb4))


## [0.0.5](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.4...v0.0.5) (2023-12-30)

### fix

* sync theme to localstorage ([a2e3df2](https://github.com/hemengke1997/vscode-image-manager/commit/a2e3df2543420eae57e6f92b8b2c022bfc938ec0))


## [0.0.4](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.3...v0.0.4) (2023-12-30)

### feat

* i18n, support only English and Chinese now ([b8f0352](https://github.com/hemengke1997/vscode-image-manager/commit/b8f0352e4f2cca38e24bfcf935863495501d9ff3))

### fix

* display images wrong when type filter change ([92b701d](https://github.com/hemengke1997/vscode-image-manager/commit/92b701ddb0275154130da94f0c33cce7c19b829d))
* duplicate image types when exists multiple dirs ([538cb7d](https://github.com/hemengke1997/vscode-image-manager/commit/538cb7d32b7e6314fe3341cc09ea05b68ac2bc60))


## [0.0.3](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.2...v0.0.3) (2023-12-29)

### feat

* support vscode configuration. ([4ef4593](https://github.com/hemengke1997/vscode-image-manager/commit/4ef4593ebfe2e126385a73218c4c98a9afddf08c))

You can configure the following items in the vscode configuration file.
For example:

```json
{
  "image-manager.warningSize": 500,
  "image-manager.imageDefaultWidth": 100,
  "image-manager.scaleStep": 0.2,
  "image-manager.excludePath": [],
}
```

* support vscode keybinding to open extension
  * Open Image Manager: `shift+alt+i` (macos: `cmd+alt+i`)

## [0.0.2](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.1...v0.0.2) 

### chore

* downgrade vscode version limit to ^1.60.0 ([a72c228](https://github.com/hemengke1997/vscode-image-manager/commit/a72c22806d74a83e2f7ce48d7d929baf9d2b706e))



## [0.0.1](https://github.com/hemengke1997/vscode-image-manager/compare/a1149cfd6c6f840896c5a38404d99d52ba3602ba...v0.0.1) (2023-12-28)

### feat

* Init vscode-image-manager. ([a1149cf](https://github.com/hemengke1997/vscode-image-manager/commit/a1149cfd6c6f840896c5a38404d99d52ba3602ba))

Currently support basic feature, includes viwer, preview, explorer context,etc
