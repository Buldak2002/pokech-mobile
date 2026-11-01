const { withAppBuildGradle } = require('expo/config-plugins');

const marker = '// @poketch/local-signing';
const signingBlock = `
${marker}
// Loaded at build time; never embed passwords in generated source or app config.
def poketchSigningFile = rootProject.file('../.local-signing/signing.properties')
if (!poketchSigningFile.exists()) {
    throw new GradleException('Missing Poketch signing key. Restore .local-signing from backup, or run npm run signing:setup for a NEW app.')
}
def poketchSigning = new Properties()
poketchSigningFile.withInputStream { poketchSigning.load(it) }
['storeFile', 'storePassword', 'keyAlias', 'keyPassword'].each { name ->
    if (!poketchSigning.getProperty(name)) {
        throw new GradleException('Incomplete Poketch signing configuration: ' + name)
    }
}
def poketchKeystore = new File(poketchSigningFile.parentFile, poketchSigning.getProperty('storeFile'))
if (!poketchKeystore.exists()) {
    throw new GradleException('Poketch keystore missing. Restore the original key; do not generate a replacement for an existing app.')
}
android {
    signingConfigs {
        poketch {
            storeFile poketchKeystore
            storePassword poketchSigning.getProperty('storePassword')
            keyAlias poketchSigning.getProperty('keyAlias')
            keyPassword poketchSigning.getProperty('keyPassword')
        }
    }
    buildTypes {
        debug { signingConfig signingConfigs.poketch }
        release { signingConfig signingConfigs.poketch }
    }
}
// @poketch/local-signing-end
`;

module.exports = function withLocalSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('Poketch local signing requires a Groovy app/build.gradle.');
    }
    const existing = config.modResults.contents;
    const blockPattern = /\n\/\/ @poketch\/local-signing\r?\n[\s\S]*?\/\/ @poketch\/local-signing-end\r?\n?/g;
    config.modResults.contents = existing.replace(blockPattern, '').trimEnd() + '\n' + signingBlock;
    return config;
  });
};
