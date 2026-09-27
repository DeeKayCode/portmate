import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { FastifyInstance } from 'fastify';
import { models, requests, responses } from './generated/contracts.js';

export function enforceResponses(app: FastifyInstance) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats.default(ajv);
  const validators = new Map(Object.entries(responses).map(([route, statuses]) => [route,
    new Map(Object.entries(statuses).map(([status, schema]) => [Number(status), ajv.compile({ ...schema, $defs: models.$defs })]))]));
  const inputValidators = new Map(Object.entries(requests).map(([route, schema]) => [route, ajv.compile({ ...schema, $defs: models.$defs })]));
  app.addHook('preValidation', async request => {
    const validate = inputValidators.get(`${request.method} ${request.routeOptions.url}`);
    if (validate && !validate(request.body)) throw app.httpErrors.unprocessableEntity('Request violates canonical OpenAPI');
  });
  app.addHook('onSend', async (request, reply, payload) => {
    if (reply.statusCode >= 400) return payload;
    const validate = validators.get(`${request.method} ${request.routeOptions.url}`)?.get(reply.statusCode);
    if (validate && (typeof payload !== 'string' || !validate(JSON.parse(payload)))) {
      request.log.error({ route: request.routeOptions.url }, 'Response violates canonical OpenAPI');
      throw new Error('Response violates canonical OpenAPI');
    }
    return payload;
  });
}
