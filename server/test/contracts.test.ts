import assert from 'node:assert/strict';
import test from 'node:test';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { models } from '../src/generated/contracts.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

test('meeting intent is the canonical object, never the old string enum', () => {
  const ajv=new Ajv2020({strict:false}); addFormats.default(ajv); ajv.addSchema(models);
  const validate=ajv.compile({$ref:models.$id+'#/$defs/Overlap'});
  const overlap={id:'baf9e425-49d2-4f14-83ca-d36a8c2e6ef0',connection:{id:'adf9e425-49d2-4f14-83ca-d36a8c2e6ef0',username:'sailor',emailVerified:true},type:'same_ship',lifecycle:'future',startsAt:'2030-01-01T00:00:00Z',endsAt:'2030-01-02T00:00:00Z',meetingIntent:{status:'poked'}};
  assert.equal(validate(overlap),true,JSON.stringify(validate.errors));
  assert.equal(validate({...overlap,meetingIntent:'poked'}),false);
  assert.equal(validate({...overlap,meetingIntent:{status:'invalid'}}),false);
});

test('server rejects a successful response that drifts from OpenAPI',async()=>{
  const app=buildApp(loadConfig({NODE_ENV:'test',LOG_LEVEL:'silent'}));
  app.addHook('preSerialization',async(request,_reply,payload)=>request.url==='/api/v1/health'?{...payload as object,status:'invented'}:payload);
  const result=await app.inject('/api/v1/health');
  assert.equal(result.statusCode,500);
  await app.close();
});

test('canonical request validation rejects nullable profile fields before database work',async()=>{
  const app=buildApp(loadConfig({NODE_ENV:'test',LOG_LEVEL:'silent'}));
  const result=await app.inject({method:'PATCH',url:'/api/v1/me',payload:{displayName:null}});
  assert.equal(result.statusCode,422);
  assert.match(result.json().detail,/canonical OpenAPI/);
  await app.close();
});
