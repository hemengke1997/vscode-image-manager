# CHANGELOG

## [0.0.23](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.22...v0.0.23) (2024-01-25)

### Feat

* Image operator, added more image interactivity ([bf39b58](https://github.com/hemengke1997/vscode-image-manager/commit/bf39b580f0b8d0a0aa9b7d141bc24957dbad66be))

### Break-Change

* Deprecate `image-manager.compress.replace`
* Deprecate `image-manager.compress.quality`
* Deprecate `image-manager.compress.compressionLevel`
* All above configs you can find in Image operator now.

## [0.0.22](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.21...v0.0.22) (2024-01-22)

### Fix

* Render sort order not working ([6312699](https://github.com/hemengke1997/vscode-image-manager/commit/631269988c721c98160ac535bf01617a3451442d))


## [0.0.21](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.20...v0.0.21) (2024-01-22)

### Fix

* Missing windows path condition when render image ([2146d27](https://github.com/hemengke1997/vscode-image-manager/commit/2146d27c6bc2500a7c1e5ebed3020064117f5941))


## [0.0.20](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.19...v0.0.20) (2024-01-22)

### Feat

* Support more user-custom cropper options ([47f4249](https://github.com/hemengke1997/vscode-image-manager/commit/47f42495d39147844d81ffac3d74db5963403117))

### Fix

* Images in root directory don't render ([fe37250](https://github.com/hemengke1997/vscode-image-manager/commit/fe372507b0e69162f0c1075a6de4f9b636dfb1a2))


## [0.0.19](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.18...v0.0.19) (2024-01-18)

### Performance

* Mask image compressor more stable ([c1f638f](https://github.com/hemengke1997/vscode-image-manager/commit/c1f638f802f0f0c3df6188ed8033db5d133e623d))

### Style

* Mask menu to aviod misclick ([e1162d3](https://github.com/hemengke1997/vscode-image-manager/commit/e1162d38b438479be4970acf5e08edaf4c95284a))
* Add collapse content border ([08bb016](https://github.com/hemengke1997/vscode-image-manager/commit/08bb016d0646ad21337e5a5104a720eae47b1d54))
* Make cropper modal width flexible ([6114572](https://github.com/hemengke1997/vscode-image-manager/commit/6114572e90f8924c4f452e0b67fb9d54f0b94994))

## [0.0.18](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.17...v0.0.18) (2024-01-17)

### Fix

* Windows compress fail ([1fc2cd2](https://github.com/hemengke1997/vscode-image-manager/commit/1fc2cd28c114adcf17391a8eb9ee8a594b72d7d3))

## [0.0.17](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.16...v0.0.17) (2024-01-16)

### Fix

* Windows open extension fail ([183170e](https://github.com/hemengke1997/vscode-image-manager/commit/183170e846a193141702282b3c8cf3c7535df909))

## [0.0.16](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.15...v0.0.16) (2024-01-16)

### Feat

* Support crop image! ([e198f86](https://github.com/hemengke1997/vscode-image-manager/commit/e198f861a69570e34b831a1870e19df665687689))

### Fix

* Install sharp failed ([256a0d7](https://github.com/hemengke1997/vscode-image-manager/commit/256a0d7ce3bbe212d3efd3d5c6d2a90264dae85a))

### Performance

* Remove `user-agent` lib to reduce pack size ([713caed](https://github.com/hemengke1997/vscode-image-manager/commit/713caedc766e87931f7a6c8ba1eb06fb6ecbeb5e))


## [0.0.15](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.14...v0.0.15) (2024-01-13)

### Feat

* Support search image. Just use `cmd + f` or `ctrl + f`! ([22ae37d](https://github.com/hemengke1997/vscode-image-manager/commit/22ae37d1e0012fc2d7349749e46112543c85b55a))

## [0.0.14](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.13...v0.0.14) (2024-01-13)

### Feat

* Support compress image! Please refer to [README](./README.md) for more details
* Windows compatibility, though it's not perfect, but it works. (I don't have a windows machine, so I can't test it. If you get any problems, please submit an issue)


## [0.0.13](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.12...v0.0.13) (2024-01-08)

### Feat

* Support multiple workspaces, you can right-clik on vscode explorer to choose workspace. If using vscode command or keybinding, it will open all workspaces ([16b5afb](https://github.com/hemengke1997/vscode-image-manager/commit/16b5afb2702b3a105424edd68f5270e9b0be53f9))

### Performance

* Optimized rendering logic, smoother now

## [0.0.12](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.11...v0.0.12) (2024-01-06)

### Feat

* Support dir context-menu to open folder or highlight vscode explorer ([9e4f3a1](https://github.com/hemengke1997/vscode-image-manager/commit/9e4f3a1121f05ed0b297455d6c3c05fb0a028bea))
* Add copy image as base64 to context-menu ([8b7eab7](https://github.com/hemengke1997/vscode-image-manager/commit/8b7eab78eb434a7437b38baa4718ef154233eb44))
* Add simple mode for clear layout, you can click left-top icon to change mode ([e297381](https://github.com/hemengke1997/vscode-image-manager/commit/e297381cb7c979d6dca3c27546f9e57ed230ef9f))

### Fix

* Compact dir display wrong

## [0.0.11](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.10...v0.0.11) (2024-01-04)

### Feat

* Support compact dir style just like vscode, user friendly ([8db6d09](https://github.com/hemengke1997/vscode-image-manager/commit/8db6d098497ea137ced0c96f82caa689c0e2464f))
* Introduce `imageType` config, user can choose which type of image to display ([831ea1f](https://github.com/hemengke1997/vscode-image-manager/commit/831ea1f58156017aec056ea76e4a875a59b7908c))

### Break Change

* **Rename `image-manager.excludePath` to `image-manager.exclude`**

## [0.0.10](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.9...v0.0.10) (2024-01-04)

### Feat

* Context-menu copy image(mod+c for shortcut), then you can paste it to other place  ([457f2b1](https://github.com/hemengke1997/vscode-image-manager/commit/457f2b1aacb73c7ca86363236f67e92494752550))

## [0.0.9](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.8...v0.0.9) (2024-01-03)

### Break Change

* Rename extension to `Image Manager`

### Feat

* Error boundary ([9a214d5](https://github.com/hemengke1997/vscode-image-manager/commit/9a214d53ac129e2b9b5a6933f0a08b0c189bdacf))

If any internal error occurs, the extension will display a friendly error message instead of crashing. Furthermore, user could report the error to the author or choose to restart.

## [0.0.8](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.7...v0.0.8) (2024-01-02)

### Fix

* Filter action reset to previous values if user didn't trigger form submit real([206f06c](https://github.com/hemengke1997/vscode-image-manager/commit/206f06cdbd7a79857a64764e9071fc0edf2a05b1))

## [0.0.7](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.6...v0.0.7) (2024-01-02)

### Chore
* Improve UX, show tip when hover on icons ([88eeb48](https://github.com/hemengke1997/vscode-image-manager/commit/88eeb4830696f754f128179df185f5b18c2e2394))

## [0.0.6](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.5...v0.0.6) (2024-01-01)

### Feat

* Build in vscode primary colors ([a9d7793](https://github.com/hemengke1997/vscode-image-manager/commit/a9d7793199f267c1e0a463e31a4ba225fa0fb7d6))
* Support `excludePath` vscode config ([663b002](https://github.com/hemengke1997/vscode-image-manager/commit/663b002365f37d9f927496fc5b6ca309a9ef5319))
* Support display style(nested or flat) for visual ([55d3130](https://github.com/hemengke1997/vscode-image-manager/commit/55d3130bdc0010abae3c5c2ac6bb3350f8c41eb4))


## [0.0.5](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.4...v0.0.5) (2023-12-30)

### Fix

* Sync theme to localstorage ([a2e3df2](https://github.com/hemengke1997/vscode-image-manager/commit/a2e3df2543420eae57e6f92b8b2c022bfc938ec0))


## [0.0.4](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.3...v0.0.4) (2023-12-30)

### Feat

* I18n, support only English and Chinese now ([b8f0352](https://github.com/hemengke1997/vscode-image-manager/commit/b8f0352e4f2cca38e24bfcf935863495501d9ff3))

### Fix

* Display images wrong when type filter change ([92b701d](https://github.com/hemengke1997/vscode-image-manager/commit/92b701ddb0275154130da94f0c33cce7c19b829d))
* Deduplicate image types when exists multiple dirs ([538cb7d](https://github.com/hemengke1997/vscode-image-manager/commit/538cb7d32b7e6314fe3341cc09ea05b68ac2bc60))


## [0.0.3](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.2...v0.0.3) (2023-12-29)

### Feat

* Support vscode configuration. ([4ef4593](https://github.com/hemengke1997/vscode-image-manager/commit/4ef4593ebfe2e126385a73218c4c98a9afddf08c))

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

* Support vscode keybinding to open extension
  * Open Image Manager: `shift+alt+i` (macos: `cmd+alt+i`)

## [0.0.2](https://github.com/hemengke1997/vscode-image-manager/compare/v0.0.1...v0.0.2) 

### Chore

* Downgrade vscode version limit to ^1.60.0 ([a72c228](https://github.com/hemengke1997/vscode-image-manager/commit/a72c22806d74a83e2f7ce48d7d929baf9d2b706e))



## [0.0.1](https://github.com/hemengke1997/vscode-image-manager/compare/a1149cfd6c6f840896c5a38404d99d52ba3602ba...v0.0.1) (2023-12-28)

### Feat

* Init vscode-image-manager. ([a1149cf](https://github.com/hemengke1997/vscode-image-manager/commit/a1149cfd6c6f840896c5a38404d99d52ba3602ba))

Currently support basic feature, includes viwer, preview, explorer context,etc
