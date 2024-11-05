import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/vscode-image-manager/',
  title: 'VSCode Image Manager',
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'View, compress, crop, convert format, search and find similary images in VSCode',
      themeConfig: {
        sidebar: [
          {
            text: 'Guides',
            items: [
              { text: 'Introduction', link: '/guides/introduction' },
              { text: 'Get Started', link: '/guides/get-started' },
              {
                text: 'FAQ',
                link: '/guides/faq',
              },
              {
                text: 'Support',
                link: '/guides/support',
              },
              {
                text: 'Feedback',
                link: '/guides/feedback',
              },
            ],
          },
          {
            text: 'Features',
            items: [
              {
                text: 'Preview',
                link: '/features/preview',
              },
              {
                text: 'Compress',
                link: '/features/compress',
              },
              {
                text: 'Convert Format',
                link: '/features/convert-format',
              },
              {
                text: 'Crop',
                link: '/features/crop',
              },
              {
                text: 'Filter',
                link: '/features/filter',
              },
              {
                text: 'Search',
                link: '/features/search',
              },
              {
                text: 'Customize',
                link: '/features/customize',
              },
            ],
          },
          {
            text: 'Settings',
            items: [
              {
                text: 'VSCode Settings',
                link: '/settings/vscode',
              },
            ],
          },
        ],
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh',
      description: '查看、压缩、裁剪、转换格式、搜索、过滤和查找相似图片的 VSCode 插件',
      themeConfig: {
        nav: [
          {
            text: '更新日志',
            link: 'https://github.com/hemengke1997/vscode-image-manager/blob/master/CHANGELOG.md',
          },
        ],
        sidebar: [
          {
            text: '指南',
            items: [
              { text: '介绍', link: '/zh/guides/introduction' },
              { text: '开始使用', link: '/zh/guides/get-started' },
              {
                text: '常见问题',
                link: '/zh/guides/faq',
              },
              {
                text: '支持作者',
                link: '/zh/guides/support',
              },
              {
                text: '反馈',
                link: '/zh/guides/feedback',
              },
            ],
          },
          {
            text: '功能',
            items: [
              {
                text: '大图预览',
                link: '/zh/features/preview',
              },
              {
                text: '图片压缩',
                link: '/zh/features/compress',
              },
              {
                text: '格式转换',
                link: '/zh/features/convert-format',
              },
              {
                text: '图片裁剪',
                link: '/zh/features/crop',
              },
              {
                text: '图片筛选',
                link: '/zh/features/filter',
              },
              {
                text: '图片搜索',
                link: '/zh/features/search',
              },
              {
                text: '自定义设置',
                link: '/zh/features/customize',
              },
            ],
          },
          {
            text: '设置项',
            items: [
              {
                text: 'VSCode 设置项',
                link: '/zh/settings/vscode',
              },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    logo: '/images/logo.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/hemengke1997/vscode-image-manager' }],
    search: {
      provider: 'local',
    },
  },
})
