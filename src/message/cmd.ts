/**
 * Commands for message passing between webview and vscode
 */

/**
 * @description Webview listens to these commands
 */
export enum CmdToWebview {
  // webview 发送命令后的回调
  WEBVIEW_CALLBACK = 'WEBVIEW_CALLBACK',
  // 图片改变
  REFRESH_IMAGES = 'REFRESH_IMAGES',
  // 图片压缩器改变
  COMPRESSOR_CHANGED = 'COMPRESSOR_CHANGED',
  // 重新加载webview
  PROGRAM_RELOAD_WEBVIEW = 'PROGRAM_RELOAD_WEBVIEW',
  // 更新配置
  UPDATE_CONFIG = 'UPDATE_CONFIG',
}

/**
 * @description Webview sends these commands
 */
export enum CmdToVscode {
  ON_WEBVIEW_READY = 'ON_WEBVIEW_READY',
  // 重新加载webview（vscode的webview自身没有重新加载的能力）
  RELOAD_WEBVIEW = 'RELOAD_WEBVIEW',
  // 获取所有图片
  GET_ALL_IMAGES = 'GET_ALL_IMAGES',
  // 获取图片尺寸
  GET_IMAGE_DIMENSIONS = 'GET_IMAGE_DIMENSIONS',
  // 获取图片元信息
  GET_IMAGE_METADATA = 'GET_IMAGE_METADATA',
  // 获取扩展的配置
  GET_EXT_CONFIG = 'GET_EXT_CONFIG',
  // 获取压缩器
  GET_COMPRESSOR = 'GET_COMPRESSOR',
  // 在vscode中的资源管理器中打开图片
  OPEN_IMAGE_IN_VSCODE_EXPLORER = 'OPEN_IMAGE_IN_VSCODE_EXPLORER',
  // 在操作系统资源管理器中打开图片
  OPEN_IMAGE_IN_OS_EXPLORER = 'OPEN_IMAGE_IN_OS_EXPLORER',
  // 复制图片为base64
  COPY_IMAGE_AS_BASE64 = 'COPY_IMAGE_AS_BASE64',
  // 压缩图片
  COMPRESS_IMAGE = 'COMPRESS_IMAGE',
  MICROMATCH_ISMATCH = 'MICROMATCH_ISMATCH',
  // 保存裁剪后的图片
  SAVE_CROPPER_IMAGE = 'SAVE_CROPPER_IMAGE',
  // 查找相似图片
  FIND_SIMILAR_IMAGES = 'FIND_SIMILAR_IMAGES',
  // 获取 git staged 中的图片
  GET_GIT_STAGED_IMAGES = 'GET_GIT_STAGED_IMAGES',
  // 更新用户config
  UPDATE_USER_CONFIGURATION = 'UPDATE_USER_CONFIGURATION',

  // Test vscode built-in command. For dev convenience
  TEMP_TEST_CMD = 'TEMP_TEST_CMD',
}
