import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repoRoot = process.cwd();
const certDir = path.join(repoRoot, '.local-https');
const rootKeyPath = path.join(certDir, 'rootCA.key');
const rootPemPath = path.join(certDir, 'rootCA.pem');
const rootCerPath = path.join(certDir, 'rootCA.cer');
const serverKeyPath = path.join(certDir, 'server.key');
const serverCsrPath = path.join(certDir, 'server.csr');
const serverCrtPath = path.join(certDir, 'server.crt');
const serverConfigPath = path.join(certDir, 'server-openssl.cnf');
const serverExtPath = path.join(certDir, 'server-ext.cnf');

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
CN = Technical English Coach Local PWA
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

if (force || !fs.existsSync(rootKeyPath) || !fs.existsSync(rootPemPath)) {
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
    '/CN=Technical English Coach Local Root CA/O=Local Development',
  ]);
}

fs.copyFileSync(rootPemPath, rootCerPath);

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
console.log(`Root certificate for iPhone: ${rootCerPath}`);
console.log(`Server certificate: ${serverCrtPath}`);
