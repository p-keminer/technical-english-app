import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repoRoot = process.cwd();
const certDir = path.join(repoRoot, '.local-https');
const rootKeyPath = path.join(certDir, 'rootCA.key');
const rootPemPath = path.join(certDir, 'rootCA.pem');
const rootCerPath = path.join(certDir, 'rootCA.cer');
const rootDerPath = path.join(certDir, 'rootCA.der');
const rootMobileConfigPath = path.join(certDir, 'rootCA.mobileconfig');
const serverKeyPath = path.join(certDir, 'server.key');
const serverCsrPath = path.join(certDir, 'server.csr');
const serverCrtPath = path.join(certDir, 'server.crt');
const serverConfigPath = path.join(certDir, 'server-openssl.cnf');
const serverExtPath = path.join(certDir, 'server-ext.cnf');
const appName = 'Technical English App';
const rootCaCommonName = `${appName} Local Root CA`;
const serverCommonName = `${appName} Local PWA`;
const payloadIdentifierBase = 'de.local.technical-english-app.root-ca';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
  }
  return args;
}

function getLanIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const entries of Object.values(networkInterfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && /^(192\.168\.|10\.|172\.)/.test(entry.address)) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function runOpenSsl(args) {
  execFileSync('openssl', args, {
    cwd: certDir,
    stdio: 'inherit',
  });
}

function readCertificateSubject(filePath) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  try {
    return execFileSync('openssl', ['x509', '-in', filePath, '-noout', '-subject', '-nameopt', 'RFC2253'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function formatBase64ForPlist(base64) {
  return base64.match(/.{1,64}/g)?.join('\n') ?? base64;
}

function writeRootMobileConfig() {
  runOpenSsl(['x509', '-in', rootPemPath, '-outform', 'der', '-out', rootDerPath]);
  const rootDerBase64 = formatBase64ForPlist(fs.readFileSync(rootDerPath).toString('base64'));
  const profileUuid = crypto.randomUUID().toUpperCase();
  const payloadUuid = crypto.randomUUID().toUpperCase();

  fs.writeFileSync(
    rootMobileConfigPath,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadCertificateFileName</key>
      <string>technical-english-app-root-ca.cer</string>
      <key>PayloadContent</key>
      <data>
${rootDerBase64}
      </data>
      <key>PayloadDescription</key>
      <string>Installs the local HTTPS root certificate for the Technical English App PWA.</string>
      <key>PayloadDisplayName</key>
      <string>${rootCaCommonName}</string>
      <key>PayloadIdentifier</key>
      <string>${payloadIdentifierBase}.certificate</string>
      <key>PayloadType</key>
      <string>com.apple.security.root</string>
      <key>PayloadUUID</key>
      <string>${payloadUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Allows this iPhone to trust the local HTTPS server used for the offline Technical English App PWA.</string>
  <key>PayloadDisplayName</key>
  <string>${appName} Local PWA Certificate</string>
  <key>PayloadIdentifier</key>
  <string>${payloadIdentifierBase}</string>
  <key>PayloadOrganization</key>
  <string>Local Development</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`,
    'utf8'
  );
}

function writeServerConfig(lanIp) {
  const altNames = [
    'DNS.1 = localhost',
    'IP.1 = 127.0.0.1',
    `IP.2 = ${lanIp}`,
  ].join('\n');

  fs.writeFileSync(
    serverConfigPath,
    `[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = ${serverCommonName}
O = Local Development

[req_ext]
subjectAltName = @alt_names

[alt_names]
${altNames}
`,
    'utf8'
  );

  fs.writeFileSync(
    serverExtPath,
    `authorityKeyIdentifier = keyid,issuer
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
${altNames}
`,
    'utf8'
  );
}

const args = parseArgs(process.argv.slice(2));
const lanIp = String(args.ip || getLanIp());
const force = Boolean(args.force);

fs.mkdirSync(certDir, { recursive: true });
writeServerConfig(lanIp);

const rootSubject = readCertificateSubject(rootPemPath);
const shouldCreateRoot =
  force || !fs.existsSync(rootKeyPath) || !fs.existsSync(rootPemPath) || !rootSubject.includes(`CN=${rootCaCommonName}`);

if (shouldCreateRoot) {
  runOpenSsl([
    'req',
    '-x509',
    '-new',
    '-nodes',
    '-newkey',
    'rsa:4096',
    '-sha256',
    '-days',
    '825',
    '-keyout',
    rootKeyPath,
    '-out',
    rootPemPath,
    '-subj',
    `/CN=${rootCaCommonName}/O=Local Development`,
  ]);
}

fs.copyFileSync(rootPemPath, rootCerPath);
writeRootMobileConfig();

runOpenSsl(['genrsa', '-out', serverKeyPath, '2048']);
runOpenSsl(['req', '-new', '-key', serverKeyPath, '-out', serverCsrPath, '-config', serverConfigPath]);
runOpenSsl([
  'x509',
  '-req',
  '-in',
  serverCsrPath,
  '-CA',
  rootPemPath,
  '-CAkey',
  rootKeyPath,
  '-CAcreateserial',
  '-out',
  serverCrtPath,
  '-days',
  '825',
  '-sha256',
  '-extfile',
  serverExtPath,
]);

console.log(`Local HTTPS certificate ready for ${lanIp}`);
console.log(`Root profile for iPhone: ${rootMobileConfigPath}`);
console.log(`Server certificate: ${serverCrtPath}`);
