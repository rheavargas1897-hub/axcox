const { createUniqueNameFactory, getAssetExportName } = require('./naming');

function emitPageAssets(pageIR) {
  const getUniqueName = createUniqueNameFactory();
  const imageEntries = [];
  const fontEntries = [];

  pageIR.assets.forEach((asset) => {
    const exportName = getAssetExportName(asset.fileName, asset.category, getUniqueName);
    const targetEntries = asset.category === 'fonts' ? fontEntries : imageEntries;
    targetEntries.push([exportName, asset.relativeAssetPath]);
  });

  const serializeEntries = (entries) => {
    if (!entries.length) {
      return '{} as const';
    }

    return `{
${entries.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n')}
} as const`;
  };

  return `export const imageAssets = ${serializeEntries(imageEntries)};

export const fontAssets = ${serializeEntries(fontEntries)};
`;
}

module.exports = {
  emitPageAssets
};
