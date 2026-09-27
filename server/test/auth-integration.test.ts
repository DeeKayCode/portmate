import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { newDb } from "pg-mem";
import { OAuth2Client, LoginTicket } from 'google-auth-library';
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import type { Database } from "../src/db.js";

test('registration without email delivery rejects before creating an unreachable account', async t => {
  let queries = 0;
  const db: Database = { query: async () => { queries++; throw new Error('Database must not be touched'); } };
  const app = buildApp(loadConfig({ NODE_ENV: 'development', LOG_LEVEL: 'silent' }), db);
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {
    email: 'sailor@example.com', username: 'sailor', password: 'correct horse battery staple',
  } });
  assert.equal(response.statusCode, 503);
  assert.equal(queries, 0);
  assert.equal(response.headers['x-portmate-test-verification-token'], undefined);
});

test("email accounts cannot log in until a one-time verification token is consumed", async () => {
  const sql = await readFile(new URL("../../migrations/001_initial.sql", import.meta.url), "utf8");
  const memory = newDb(); memory.public.none(sql);
  const { Pool } = memory.adapters.createPg(); const pool = new Pool();
  const app = buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }), pool as unknown as Database);
  const credentials = { email: "sailor@example.com", username: "sailor_1", password: "correct horse battery staple" };
  const registration = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: credentials });
  assert.equal(registration.statusCode, 202);
  const token = registration.headers["x-portmate-test-verification-token"];
  assert.equal(typeof token, "string");
  const earlyLogin = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: credentials.email, password: credentials.password } });
  assert.equal(earlyLogin.statusCode, 403);
  const verification = await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } });
  assert.equal(verification.statusCode, 204);
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: credentials.email, password: credentials.password } });
  assert.equal(login.statusCode, 200);
  assert.equal(typeof login.json().accessToken, "string");
  await app.close(); await pool.end();
});

test('Google verification clears an unverified pre-registration password and binds the stable subject', async t => {
  const memory=newDb(); memory.public.none(await readFile(new URL('../../migrations/001_initial.sql',import.meta.url),'utf8'));
  const {Pool}=memory.adapters.createPg(); const pool=new Pool();
  const app=buildApp(loadConfig({NODE_ENV:'test',LOG_LEVEL:'silent',GOOGLE_CLIENT_ID:'fixture-client'}),pool as unknown as Database);
  t.after(async()=>{await app.close(); await pool.end();});
  t.mock.method(OAuth2Client.prototype,'verifyIdToken',async()=>new LoginTicket(undefined,{iss:'https://accounts.google.com',aud:'fixture-client',iat:1,exp:9999999999,sub:'google-subject',email:'victim@example.com',email_verified:true}));
  const registration=await app.inject({method:'POST',url:'/api/v1/auth/register',payload:{email:'victim@example.com',username:'pre_registered',password:'attacker-known-password'}});
  assert.equal(registration.statusCode,202,registration.body);
  const login=await app.inject({method:'POST',url:'/api/v1/auth/google',payload:{idToken:'verified-by-mocked-google-library'}});
  assert.equal(login.statusCode,200,login.body);
  const row=(await pool.query('SELECT password_hash,email_verified,google_subject FROM users')).rows[0];
  assert.equal(row.password_hash,null); assert.equal(row.email_verified,true); assert.equal(row.google_subject,'google-subject');
  const attacker=await app.inject({method:'POST',url:'/api/v1/auth/login',payload:{email:'victim@example.com',password:'attacker-known-password'}});
  assert.equal(attacker.statusCode,401,attacker.body);
});
