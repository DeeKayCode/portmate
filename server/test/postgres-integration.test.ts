import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createDatabase } from '../src/db.js';

test('PostgreSQL: assignments, QR, persistent overlap intent, ownership and block enforcement', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const schema='portmate_test_'+randomUUID().replaceAll('-','');
  const admin=createDatabase(process.env.TEST_DATABASE_URL!);
  await admin.query(`CREATE SCHEMA ${schema}`);
  const url=new URL(process.env.TEST_DATABASE_URL!); url.searchParams.set('options',`-c search_path=${schema}`);
  const db=createDatabase(url.toString());
  const app=buildApp(loadConfig({NODE_ENV:'test',LOG_LEVEL:'silent'}),db);
  try {
    await db.query(await readFile(new URL('../../migrations/001_initial.sql',import.meta.url),'utf8'));
    const identities=[];
    for(let i=0;i<3;i++) {
      const id=randomUUID();
      await db.query('INSERT INTO users(id,email,username,email_verified) VALUES($1,$2,$3,true)',[id,`person${i}@example.com`,`person${i}`]);
      await db.query('INSERT INTO user_settings(user_id) VALUES($1)',[id]);
      identities.push(id);
    }
    await app.ready();
    const auth=identities.map(sub=>({authorization:`Bearer ${app.jwt.sign({sub})}`}));
    const input={companyId:'royal-caribbean',shipId:'wonder-of-the-seas',startDate:'2030-01-01',endDate:'2030-01-03'};
    const a=await app.inject({method:'POST',url:'/api/v1/assignments',headers:auth[0],payload:input});
    assert.equal(a.statusCode,201,a.body);
    const b=await app.inject({method:'POST',url:'/api/v1/assignments',headers:auth[1],payload:input});
    assert.equal(b.statusCode,201,b.body);
    const conflict=await app.inject({method:'POST',url:'/api/v1/assignments',headers:auth[0],payload:input});
    assert.equal(conflict.statusCode,422,conflict.body);
    const wrongCompany=await app.inject({method:'PATCH',url:`/api/v1/assignments/${a.json().id}`,headers:auth[0],payload:{...input,companyId:'celebrity'}});
    assert.equal(wrongCompany.statusCode,422,wrongCompany.body);
    const forbidden=await app.inject({url:`/api/v1/itinerary?assignmentId=${a.json().id}`,headers:auth[2]});
    assert.equal(forbidden.statusCode,404,forbidden.body);
    const itinerary=await app.inject({url:`/api/v1/itinerary?assignmentId=${a.json().id}`,headers:auth[0]});
    assert.equal(itinerary.statusCode,200,itinerary.body);
    const qr=await app.inject({method:'POST',url:'/api/v1/connections/qr',headers:auth[0]});
    assert.equal(qr.statusCode,201,qr.body);
    const claim=await app.inject({method:'POST',url:'/api/v1/connections/claim',headers:auth[1],payload:{token:qr.json().token}});
    assert.equal(claim.statusCode,201,claim.body);
    const replay=await app.inject({method:'POST',url:'/api/v1/connections/claim',headers:auth[2],payload:{token:qr.json().token}});
    assert.equal(replay.statusCode,409,replay.body);
    const overlaps=await app.inject({url:'/api/v1/overlaps',headers:auth[0]});
    assert.equal(overlaps.statusCode,200,overlaps.body);
    assert.equal(overlaps.json().length,1,overlaps.body);
    const overlap=overlaps.json()[0];
    assert.equal(overlap.type,'same_ship'); assert.notEqual(overlap.id,overlap.connection.id);
    assert.deepEqual(overlap.meetingIntent,{status:'none'});
    const poke=await app.inject({method:'POST',url:`/api/v1/overlaps/${overlap.id}/poke`,headers:auth[0]});
    assert.equal(poke.statusCode,201,poke.body);
    const senderReply=await app.inject({method:'PATCH',url:`/api/v1/overlaps/${overlap.id}/intent`,headers:auth[0],payload:{status:'interested'}});
    assert.equal(senderReply.statusCode,403,senderReply.body);
    const reply=await app.inject({method:'PATCH',url:`/api/v1/overlaps/${overlap.id}/intent`,headers:auth[1],payload:{status:'not_interested'}});
    assert.equal(reply.statusCode,200,reply.body);
    const block=await app.inject({method:'POST',url:'/api/v1/blocks',headers:auth[1],payload:{userId:identities[0]}});
    assert.equal(block.statusCode,201,block.body);
    assert.deepEqual((await app.inject({url:'/api/v1/overlaps',headers:auth[0]})).json(),[]);
    const blockedPoke=await app.inject({method:'POST',url:`/api/v1/overlaps/${overlap.id}/poke`,headers:auth[0]});
    assert.equal(blockedPoke.statusCode,409,blockedPoke.body);
  } finally {
    await app.close(); await db.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
  }
});
