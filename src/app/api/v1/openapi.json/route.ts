import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'InmobiliariaPY API',
    version: '1.0.0',
    description: 'API pública B2B para acceder al catálogo de propiedades de InmobiliariaPY. Requiere una API key obtenida desde el portal de vendedor.',
    contact: { email: 'api@inmobiliariapy.com' },
  },
  servers: [
    { url: `${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com').replace(/\/+$/, '')}/api/v1`, description: 'Producción' },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Incluye tu API key como: `Authorization: Bearer impy_xxxxxxxxxxxx`',
      },
    },
    schemas: {
      Property: {
        type: 'object',
        properties: {
          id:          { type: 'string', example: 'abc123' },
          title:       { type: 'string', example: 'Casa moderna en Lambaré' },
          type:        { type: 'string', enum: ['Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina'] },
          location:    { type: 'string', example: 'Lambaré, Paraguay' },
          city:        { type: 'string', example: 'Lambaré' },
          price:       { type: 'number', example: 185000 },
          currency:    { type: 'string', enum: ['USD', 'PYG'] },
          bedrooms:    { type: 'integer', example: 3 },
          bathrooms:   { type: 'integer', example: 2 },
          sqm:         { type: 'number', example: 180 },
          images:      { type: 'array', items: { type: 'string' }, example: ['https://example.com/img.jpg'] },
          featured:    { type: 'boolean' },
          created_at:  { type: 'string', format: 'date-time' },
        },
      },
      PropertyDetail: {
        allOf: [
          { '$ref': '#/components/schemas/Property' },
          {
            type: 'object',
            properties: {
              neighborhood: { type: 'string' },
              description:  { type: 'string' },
              amenities:    { type: 'array', items: { type: 'string' } },
              latitude:     { type: 'number' },
              longitude:    { type: 'number' },
            },
          },
        ],
      },
      Meta: {
        type: 'object',
        properties: {
          total:       { type: 'integer' },
          page:        { type: 'integer' },
          limit:       { type: 'integer' },
          total_pages: { type: 'integer' },
          has_next:    { type: 'boolean' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/properties': {
      get: {
        summary: 'Listar propiedades',
        description: 'Retorna un listado paginado de propiedades activas. Límite 1 000 requests/día por API key.',
        tags: ['Propiedades'],
        parameters: [
          { name: 'page',           in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número de página' },
          { name: 'limit',          in: 'query', schema: { type: 'integer', default: 20, maximum: 100 }, description: 'Items por página (máx 100)' },
          { name: 'ciudad',         in: 'query', schema: { type: 'string' }, description: 'Filtrar por ciudad (ej: Asunción)' },
          { name: 'tipo',           in: 'query', schema: { type: 'string', enum: ['Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina'] }, description: 'Tipo de propiedad' },
          { name: 'precio_min',     in: 'query', schema: { type: 'number' }, description: 'Precio mínimo en USD' },
          { name: 'precio_max',     in: 'query', schema: { type: 'number' }, description: 'Precio máximo en USD' },
          { name: 'dormitorios_min',in: 'query', schema: { type: 'integer' }, description: 'Mínimo de dormitorios' },
          { name: 'order',          in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Orden por precio' },
        ],
        responses: {
          '200': {
            description: 'Lista de propiedades',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { '$ref': '#/components/schemas/Property' } },
                    meta: { '$ref': '#/components/schemas/Meta' },
                  },
                },
              },
            },
          },
          '401': { description: 'API key inválida', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },
    '/properties/{id}': {
      get: {
        summary: 'Detalle de propiedad',
        description: 'Retorna el detalle completo de una propiedad por su ID.',
        tags: ['Propiedades'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la propiedad' },
        ],
        responses: {
          '200': {
            description: 'Detalle de propiedad',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { '$ref': '#/components/schemas/PropertyDetail' } },
                },
              },
            },
          },
          '401': { description: 'API key inválida', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
          '404': { description: 'Propiedad no encontrada', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
