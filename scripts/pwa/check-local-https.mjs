import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repoRoot = process.cwd();
const certDir = path.join(repoRoot, '.local-https');
const requiredFiles = ['rootCA.pem', 'rootCA.cer', 'rootCA.der', 'rootCA.mobileconfig', 'server.crt', 'server.key'];

function getLanIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const entries of Object.values(networkInterfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && /^(192\.168\.|10\.|172\.)/.test(entry.address)) {
        return entry.address;
      }
    }
  }
  return null;
}

const missingFiles = requiredFiles.filter((fileName) => !fs.existsSync(path.join(certDir, fileName)));
if (missingFiles.length > 0) {
  throw new Error(`Local HTTPS certificate setup is incomplete. Missing files:\n${missingFiles.join('\n')}`);
}

const verifyOutput = execFileSync(
  'openssl',
  ['verify', '-CAfile', path.join(certDir, 'rootCA.pem'), path.join(certDir, 'server.crt')],
  { encoding: 'utf8' }
);

if (!verifyOutput.includes('OK')) {
  throw new Error(`OpenSSL could not verify the local HTTPS certificate:\n${verifyOutput}`);
}

const certText = execFileSync('openssl', ['x509', '-in', path.join(certDir, 'server.crt'), '-noout', '-text'], {
  encoding: 'utf8',
});

const expectedSans = ['DNS:localhost', 'IP Address:127.0.0.1'];
const lanIp = getLanIp();
if (lanIp) {
  expectedSans.push(`IP Address:${lanIp}`);
}

for (const expectedSan of expectedSans) {
  if (!certText.includes(expectedSan)) {
    throw new Error(`Server certificate is missing required SAN: ${expectedSan}`);
  }
}

const rootText = execFileSync('openssl', ['x509', '-in', path.join(certDir, 'rootCA.pem'), '-noout', '-text'], {
  encoding: 'utf8',
});

if (!rootText.includes('CA:TRUE')) {
  throw new Error('Root certificate is not marked as a CA root certificate.');
}

const mobileConfig = fs.readFileSync(path.join(certDir, 'rootCA.mobileconfig'), 'utf8');
for (const expectedSnippet of ['com.apple.security.root', '<key>PayloadContent</key>', '<data>']) {
  if (!mobileConfig.includes(expectedSnippet)) {
    throw new Error(`Root mobileconfig is missing expected snippet: ${expectedSnippet}`);
  }
}

console.log('Local HTTPS certificate check passed.');
