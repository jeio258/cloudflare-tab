import { randomBytes, scrypt, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const scryptAsync = promisify(scrypt);

function arg(name) {
  const i = process.argv.findIndex((a) => a === name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const remote = process.argv.includes('--remote') || process.argv.includes('-r');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let username = arg('--username') || arg('-u') || process.env.GOTAB_USERNAME;
if (!username) username = (await rl.question('用户名/邮箱: ')).trim();
if (!username) throw new Error('缺少用户名');

let password = arg('--password') || arg('-p') || process.env.GOTAB_PASSWORD;
if (!password) {
  const input = await rl.question('密码(留空自动生成): ');
  password = input || randomBytes(12).toString('base64url');
  if (!input) console.log(`已生成密码: ${password}`);
}
rl.close();

const salt = randomBytes(16);
const dk = await scryptAsync(password, salt, 32);
const hash = `${salt.toString('hex')}:${dk.toString('hex')}`;
const id = randomUUID();
const esc = (s) => s.replace(/'/g, "''");

const sql =
  `insert into users (id, username, password, nickname, email, user_type, status, share_id, share_enabled) values ` +
  `('${id}', '${esc(username)}', '${hash}', '', '${esc(username)}', 1, 1, '${randomUUID()}', 0) ` +
  `on conflict(username) do update set password = excluded.password, user_type = 1;`;

const bin = 'wrangler';
const r = spawnSync(
  bin,
  ['d1', 'execute', 'gotab-cf-db', ...(remote ? ['--remote'] : ['--local']), '--command', sql],
  {
    stdio: 'inherit',
    env: { ...process.env, NO_COLOR: '1' },
    cwd: process.cwd(),
  }
);
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`账号已写入 D1(${remote ? 'remote' : 'local'}): ${username}`);
