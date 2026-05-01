const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const generatedPrivateModule = path.resolve(__dirname, 'private-content/generated/index.ts');
const fallbackPrivateModule = path.resolve(__dirname, 'src/private-content/stub.ts');
const webSqliteShim = path.resolve(__dirname, 'src/shims/expo-sqlite.web.tsx');
const skiaWebPlatformModule = path.resolve(
  __dirname,
  'node_modules/@shopify/react-native-skia/lib/module/Platform/Platform.web.js'
);

function isSkiaInternalModule(originModulePath) {
  return originModulePath?.replace(/\\/g, '/').includes('@shopify/react-native-skia/lib/module');
}

config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@private-content': fs.existsSync(generatedPrivateModule)
    ? generatedPrivateModule
    : fallbackPrivateModule,
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: webSqliteShim,
      type: 'sourceFile',
    };
  }

  if (
    platform === 'web' &&
    moduleName === '../Platform' &&
    isSkiaInternalModule(context.originModulePath)
  ) {
    return {
      filePath: skiaWebPlatformModule,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
