# 常见问题

## 第一次打开插件慢？

由于首次打开插件时需要下载必要的依赖，这个过程可能会比较慢，具体取决于您的网络环境。请耐心等待。

## 报错：依赖安装失败，请检查网络

如果您在中国大陆且网络环境不佳（你懂的），有两种解决方案：

1. 切换镜像源
2. 手动安装依赖

### 切换镜像源

使用命令面板，输入 `select mirror url` 并回车。
![选择](./images/select-mirror-1.png)

然后选择一个镜像源，重启 VS Code 并尝试重新下载依赖。

![选择](./images/select-mirror-2.png)

### 手动安装依赖

1. 打开命令面板，输入 `Show Output Channel`，选择 Image Manager 对应的选项。
2. 在输出中找到 `插件根目录 (Extension Root)`，之后需要用到。
3. 下载 `Output Channel` 中打印的依赖地址。
4. 将下载的文件放在步骤 2 的 `插件根目录`。
5. 重启 VS Code 即可。

## 不安装依赖能使用吗？

如果你不需要压缩图片、转换图片格式、查找相似图片等功能，你可以不安装依赖。在 `settings.json` 中设置 `image-manager.core.installDependencies: false` 即可。

幸运的是，你依然可以使用插件的大部分功能。

## 为什么压缩后文件反而变大了

- 由于压缩时添加了「是否已压缩」的元信息，可能导致小体积图片压缩后变大。
- 您可以设置 `image-manager.compression.errorRange` 来调整压缩误差范围。

## 图片太多，感觉卡顿？

- 可以配置 `image-manager.appearance.reduceMotion: 'on'` 来减少动画效果。
- 可以使用右键文件夹的方式打开指定的目录，从而减少渲染的图片数量。
