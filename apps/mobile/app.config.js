// 动态 Expo 配置 —— 运行时可读 process.env,便于把后端地址等
// 环境变量通过 extra 暴露给 App(当前主要通过 EXPO_PUBLIC_API_URL 直接
// 注入 bundle,这里 extra.apiUrl 仅作为调试兜底)。
module.exports = ({ config }) => ({
  ...config,
  name: '智能记账',
  slug: 'smart-expense',
  version: '1.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#6C5CE7',
    resizeMode: 'contain',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.smartexpense.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#6C5CE7',
    },
    package: 'com.smartexpense.app',
    versionCode: 2,
    permissions: ['INTERNET'],
  },
  web: {},
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
    eas: {
      projectId: 'f2d69db7-b177-4517-9101-fe71a639acbd',
    },
  },
});
