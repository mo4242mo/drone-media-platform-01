const { app } = require('@azure/functions');

// Handle CORS preflight requests
app.http('cors-options', {
    methods: ['OPTIONS'],
    authLevel: 'anonymous',
    route: 'media/{*path}',
    handler: async (request, context) => {
        context.log('OPTIONS request - CORS preflight');
        
        return {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        };
    }
});

