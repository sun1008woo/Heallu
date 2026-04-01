const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 테스트 파일을 번들에서 제외
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !ext.includes("test")
);

// 테스트 파일 패턴 제외
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*\.test\.(ts|tsx|js|jsx)$/,
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
