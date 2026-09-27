import openapiTS, { astToString } from 'openapi-typescript';
import { parseDocument } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export async function deriveContracts(source) {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors.map(String).join('\n'));
  const api = document.toJS();
  if (api.openapi !== '3.1.0') throw new Error('OpenAPI 3.1.0 required');
  const rewrite = value => {
    if (Array.isArray(value)) return value.map(rewrite);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
      key === '$ref' && typeof child === 'string' ? child.replace('#/components/schemas/', '#/$defs/') : rewrite(child)]));
  };
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://portmate.example/contracts/models.schema.json',
    $comment: 'Generated from openapi.yaml. Run npm --prefix server run generate:contracts.',
    $defs: rewrite(api.components.schemas),
  };
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(schema);
  for (const name of Object.keys(schema.$defs)) ajv.compile({ $ref: `${schema.$id}#/$defs/${name}` });
  const responses = {};
  const requests = {};
  for (const [path, item] of Object.entries(api.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!['get','post','patch','put','delete','head','options'].includes(method)) continue;
      const key = `${method.toUpperCase()} /api/v1${path.replace(/\{([^}]+)\}/g, ':$1')}`;
      responses[key] = {};
      const requestBody = operation.requestBody?.content?.['application/json']?.schema;
      if (requestBody) requests[key] = rewrite(requestBody);
      for (const [status, response] of Object.entries(operation.responses)) {
        const body = response.content?.['application/json']?.schema;
        if (body) responses[key][status] = rewrite(body);
      }
    }
  }
  return {
    'contracts/models.schema.json': JSON.stringify(schema, null, 2) + '\n',
    'contracts/api.d.ts': '// Generated from contracts/openapi.yaml; do not edit.\n' + astToString(await openapiTS(api)),
    'server/src/generated/contracts.ts': '// Generated from contracts/openapi.yaml; do not edit.\nexport const models = ' + JSON.stringify(schema, null, 2) + ';\nexport const responses: Record<string, Record<string, object>> = ' + JSON.stringify(responses, null, 2) + ';\nexport const requests: Record<string, object> = ' + JSON.stringify(requests, null, 2) + ';\n',
  };
}
