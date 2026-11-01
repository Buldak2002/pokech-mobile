import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, '.local-signing');
const keystore = join(directory, 'poketch.jks');
const properties = join(directory, 'signing.properties');

// Never replace an existing key or partially completed setup.
if (existsSync(directory)) {
  if (existsSync(keystore) && existsSync(properties)) {
    console.log('Existing Poketch signing files preserved. No key was generated.');
    process.exit(0);
  }
  throw new Error('Incomplete .local-signing directory. Restore your backup or inspect it manually; no files were overwritten.');
}

const keytool = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool')
  : 'keytool';
const probe = spawnSync(keytool, ['-help'], { encoding: 'utf8', windowsHide: true });
if (probe.error || probe.status !== 0) {
  throw new Error('keytool is unavailable. Install a JDK and configure JAVA_HOME or PATH.');
}

mkdirSync(directory, { mode: 0o700 });
const password = randomBytes(32).toString('hex');
// Save first so a failed/interrupted generation cannot leave an unrecoverable key.
writeFileSync(properties, [
  'storeFile=poketch.jks',
  `storePassword=${password}`,
  'keyAlias=poketch',
  `keyPassword=${password}`,
  '',
].join('\n'), { flag: 'wx', mode: 0o600 });

const result = spawnSync(keytool, [
  '-genkeypair', '-noprompt', '-storetype', 'PKCS12',
  '-keystore', keystore, '-alias', 'poketch',
  '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
  '-dname', 'CN=Poketch',
  '-storepass:env', 'POKETCH_KEYTOOL_PASSWORD',
  '-keypass:env', 'POKETCH_KEYTOOL_PASSWORD',
], {
  env: { ...process.env, POKETCH_KEYTOOL_PASSWORD: password },
  encoding: 'utf8', windowsHide: true,
});
if (result.error || result.status !== 0) {
  throw new Error('Key generation failed. Preserve .local-signing/signing.properties and inspect your JDK setup.');
}
console.log('Created .local-signing/poketch.jks and signing.properties. Back up this folder securely. Passwords were not printed.');
