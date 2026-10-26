const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const sharedFolder = path.resolve(workspaceRoot, 'packages', 'shared');

const config = getDefaultConfig(projectRoot);

// 1. Only watch the packages/shared folder, do NOT crawl root node_modules or .next
config.watchFolders = [sharedFolder];

// 2. Map @supertime/shared to the packages/shared directory
config.resolver.extraNodeModules = {
  '@supertime/shared': sharedFolder,
};

module.exports = config;
