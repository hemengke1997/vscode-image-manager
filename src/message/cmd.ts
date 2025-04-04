/**
 * Commands for message passing between webview and vscode
 */

/**
 * @description Webview listens to these commands
 */
export const enum CmdToWebview {
  // webview 发送命令后的回调
  webview_callback = 'webview_callback',
  // 图片更新
  update_images = 'update_images',
  // 重新加载webview
  program_reload_webview = 'program_reload_webview',
  // 更新配置
  update_config = 'update_config',
  // 更新工作区缓存
  update_workspaceState = 'update_workspaceState',
  // 在viewer中打开指定图片
  reveal_image_in_viewer = 'reveal_image_in_viewer',
}

/**
 * @description Webview sends these commands
 */
export const enum CmdToVscode {
  // 流程：vscode打开webview，webview 调用 on_webview_ready，触发 vscode 发送webview需要的初始化数据
  on_webview_ready = 'on_webview_ready',
  // 重新加载webview（vscode的webview自身没有重新加载的能力）
  reload_webview = 'reload_webview',
  // 获取图片信息
  get_image_info = 'get_image_info',
  // 获取所有图片
  get_all_images_from_cwds = 'get_all_images_from_cwds',
  // 获取多张图片
  get_images = 'get_images',
  // 获取图片元信息
  get_images_metadata = 'get_images_metadata',
  // 获取扩展的配置（用户配置和默认的vscode配置）
  get_extension_config = 'get_extension_config',
  // 获取压缩器
  get_compressor = 'get_compressor',
  // 获取格式转换器
  get_format_converter = 'get_format_converter',
  // 在vscode中的资源管理器中打开图片
  open_image_in_vscode_explorer = 'open_image_in_vscode_explorer',
  // 在操作系统资源管理器中打开图片
  open_image_in_os_explorer = 'open_image_in_os_explorer',
  // 复制图片为base64
  copy_image_as_base64 = 'copy_image_as_base64',
  // 压缩图片 (sharp)
  compress_image = 'compress_image',
  // 转化图片格式 (sharp)
  convert_image_format = 'convert_image_format',
  // 撤销操作
  undo_operation = 'undo_operation',
  // 清除指定操作缓存
  remove_operation_cmd_cache = 'remove_operation_cmd_cache',
  // 清空操作缓存
  clear_operation_cmd_cache = 'clear_operation_cmd_cache',
  // 获取操作缓存
  get_operation_cmd_cache = 'get_operation_cmd_cache',
  // 把缓存中的inputBuffer转为base64
  get_cmd_cache_inputBuffer_as_base64 = 'get_cmd_cache_inputBuffer_as_base64',
  // 匹配
  micromatch_ismatch = 'micromatch_ismatch',
  // 保存裁剪后的图片
  save_cropper_image = 'save_cropper_image',
  // 查找相似图片 (sharp)
  find_similar_images = 'find_similar_images',
  // 获取 git staged 中的图片
  get_git_staged_images = 'get_git_staged_images',
  // 更新用户config
  update_user_configuration = 'update_user_configuration',
  // 获取工作区缓存
  get_workspace_state = 'get_workspace_state',
  // 设置工作区缓存
  update_workspace_state = 'update_workspace_state',
  // 清空工作区缓存
  clear_workspace_state = 'clear_workspace_state',
  // 清除无用的工作区缓存
  clear_useless_workspace_state = 'clear_useless_workspace_state',
  // 格式化svg
  prettify_svg = 'prettify_svg',
  // 在text editor中打开指定文件
  open_file_in_text_editor = 'open_file_in_text_editor',
  // 删除指定文件
  delete_file = 'delete_file',
  // 重命名文件或目录
  rename_file = 'rename_file',
  // 复制/移动文件到指定目录
  copy_or_move_file_to = 'copy_or_move_file_to',
  // 获取路径下的同级文件(夹)列表
  get_sibling_resource = 'get_sibling_resource',
  // 打开svgo配置文件
  open_svgo_config = 'open_svgo_config',
}
