import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BICAP - Retailer Service API",
      version: "1.0.0",
      description: "Retailer flows: marketplace, order lifecycle, QR trace and customer profile."
    },
    servers: [{ url: "http://localhost:8083", description: "Local Dev" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          security: [],
          responses: { "200": { description: "UP" } }
        }
      },
      "/api/v1/retailers/search": {
        get: {
          tags: ["Retailer"],
          summary: "Search retailers",
          responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
        }
      },
      "/api/v1/retailers": {
        post: {
          tags: ["Retailer"],
          summary: "Create retailer profile",
          responses: { "201": { description: "Created" }, "400": { description: "Invalid payload" } }
        }
      },
      "/api/v1/orders": {
        post: {
          tags: ["Retailer"],
          summary: "Create order (legacy route)",
          responses: { "201": { description: "Created" }, "400": { description: "Invalid payload" } }
        }
      },
      "/api/v1/orders/{orderId}/status": {
        patch: {
          tags: ["Retailer"],
          summary: "Update order status",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Updated" }, "404": { description: "Not found" } }
        }
      },
      "/api/v1/orders/{orderId}/qr-scan": {
        post: {
          tags: ["Retailer"],
          summary: "Scan product QR",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        }
      },
      "/api/v1/orders/{orderId}/confirm-delivery": {
        post: {
          tags: ["Retailer"],
          summary: "Confirm delivery",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Confirmed" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/marketplace/products": {
        get: {
          tags: ["Marketplace"],
          summary: "List marketplace products",
          security: [],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/retail/marketplace/products/{id}": {
        get: {
          tags: ["Marketplace"],
          summary: "Get product detail",
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/marketplace/farms/{farmId}": {
        get: {
          tags: ["Marketplace"],
          summary: "Get products by farm",
          security: [],
          parameters: [{ name: "farmId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/orders": {
        post: {
          tags: ["Order"],
          summary: "Create order",
          responses: { "201": { description: "Created" }, "400": { description: "Invalid payload" } }
        },
        get: {
          tags: ["Order"],
          summary: "List orders",
          responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
        }
      },
      "/api/retail/orders/payment-callback": {
        post: {
          tags: ["Order"],
          summary: "Receive payment callback",
          security: [],
          responses: { "200": { description: "OK" }, "400": { description: "Invalid callback" } }
        }
      },
      "/api/retail/orders/{orderId}": {
        get: {
          tags: ["Order"],
          summary: "Get order detail",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/orders/{orderId}/cancel": {
        delete: {
          tags: ["Order"],
          summary: "Cancel order",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Cancelled" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/qr/scan": {
        post: {
          tags: ["Retail Flow"],
          summary: "Scan QR in retail flow",
          responses: { "200": { description: "OK" }, "400": { description: "Invalid QR" } }
        }
      },
      "/api/retail/orders/{orderId}/shipping": {
        get: {
          tags: ["Retail Flow"],
          summary: "Get shipping info for order",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        }
      },
      "/api/retail/profile": {
        get: {
          tags: ["Retail Flow"],
          summary: "Get retailer profile",
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
        },
        put: {
          tags: ["Retail Flow"],
          summary: "Update retailer profile",
          responses: { "200": { description: "Updated" }, "400": { description: "Invalid payload" } }
        }
      },
      "/api/retail/reports": {
        post: {
          tags: ["Retail Flow"],
          summary: "Create retailer report",
          responses: { "201": { description: "Created" }, "400": { description: "Invalid payload" } }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
