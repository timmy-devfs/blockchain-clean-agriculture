import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'BICAP — Farm Service API',
      version:     '1.0.0',
      description: 'Quản lý Trang trại, Vụ mùa, Marketplace. NodeJS/TypeScript + Prisma ORM. Kafka Producer chính.',
    },
    servers: [{ url: 'http://localhost:8082', description: 'Local Dev' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'JWT từ /api/auth/login — Gateway forward X-User-Id header',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Thông báo lỗi cho client' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/farm/farms': {
        post: { tags: ['Farm'], summary: 'Tạo farm', responses: { '201': { description: 'Created' }, '400': { description: 'Invalid payload' }, '401': { description: 'Unauthorized' } } },
        get: { tags: ['Farm'], summary: 'Danh sách farm của user', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } }
      },
      '/api/farm/farms/{id}': {
        put: { tags: ['Farm'], summary: 'Cập nhật farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/farms/{id}/license': {
        post: { tags: ['Farm'], summary: 'Upload giấy phép farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Created' }, '409': { description: 'License already exists' } } }
      },
      '/api/farm/admin/farms': {
        get: { tags: ['Farm Admin'], summary: 'Danh sách farm cho admin', responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } } }
      },
      '/api/farm/admin/farms/{id}': {
        put: { tags: ['Farm Admin'], summary: 'Admin cập nhật farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
        delete: { tags: ['Farm Admin'], summary: 'Admin xóa farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/admin/farms/{id}/approve': {
        put: { tags: ['Farm Admin'], summary: 'Duyệt farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Approved' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/admin/farms/{id}/reject': {
        put: { tags: ['Farm Admin'], summary: 'Từ chối farm', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Rejected' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/seasons': {
        post: { tags: ['Season'], summary: 'Tạo season', responses: { '201': { description: 'Created' }, '400': { description: 'Invalid payload' } } },
        get: { tags: ['Season'], summary: 'Danh sách season', responses: { '200': { description: 'OK' }, '400': { description: 'Invalid query' } } }
      },
      '/api/farm/seasons/{id}': {
        get: { tags: ['Season'], summary: 'Chi tiết season', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
        put: { tags: ['Season'], summary: 'Cập nhật season', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/seasons/{id}/updates': {
        post: { tags: ['Season'], summary: 'Tạo season update', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Created' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/seasons/{id}/export': {
        post: { tags: ['Season'], summary: 'Export season', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Exported' }, '400': { description: 'Invalid status' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/orders': {
        get: { tags: ['Order'], summary: 'Danh sách đơn hàng của farm', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } }
      },
      '/api/farm/orders/{id}/confirm': {
        put: { tags: ['Order'], summary: 'Xác nhận đơn hàng', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Confirmed' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/orders/{id}/reject': {
        put: { tags: ['Order'], summary: 'Từ chối đơn hàng', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Rejected' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/shipments': {
        get: { tags: ['Shipment'], summary: 'Danh sách shipment theo farm', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } }
      },
      '/api/farm/marketplace/listings': {
        post: { tags: ['Marketplace'], summary: 'Tạo listing', responses: { '201': { description: 'Created' }, '400': { description: 'Invalid payload' } } },
        get: { tags: ['Marketplace'], summary: 'Danh sách listings', responses: { '200': { description: 'OK' }, '400': { description: 'Invalid query' } } }
      },
      '/api/farm/marketplace/listings/my': {
        get: { tags: ['Marketplace'], summary: 'Danh sách listing của tôi', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } }
      },
      '/api/farm/marketplace/listings/{id}': {
        put: { tags: ['Marketplace'], summary: 'Cập nhật listing', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } } },
        delete: { tags: ['Marketplace'], summary: 'Xóa listing', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } } }
      },
      '/api/farm/packages': {
        get: { tags: ['Subscription'], summary: 'Danh sách package', responses: { '200': { description: 'OK' } } }
      },
      '/api/farm/packages/{id}/subscribe': {
        post: { tags: ['Subscription'], summary: 'Đăng ký package', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Subscribed' }, '400': { description: 'Invalid package' } } }
      },
      '/api/farm/packages/my': {
        get: { tags: ['Subscription'], summary: 'Package hiện tại của tôi', responses: { '200': { description: 'OK' } } }
      },
      '/health': {
        get: { tags: ['Health'], summary: 'Health check', security: [], responses: { '200': { description: 'UP' } } }
      }
    }
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);