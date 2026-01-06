const { app } = require('@azure/functions');

/**
 * Health Check Endpoint
 * Used for monitoring and testing the API connectivity
 */
app.http('health-check', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async (request, context) => {
        context.log('GET /api/health - Health check');

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                api: 'running',
                mongodb: 'unknown',
                blobStorage: 'unknown'
            }
        };

        // Test MongoDB connection
        try {
            const { MongoClient } = require('mongodb');
            if (process.env.COSMOS_CONNECTION_STRING) {
                const client = new MongoClient(process.env.COSMOS_CONNECTION_STRING);
                await client.connect();
                await client.db('DroneMediaDB').command({ ping: 1 });
                await client.close();
                healthStatus.services.mongodb = 'connected';
            } else {
                healthStatus.services.mongodb = 'not configured';
                healthStatus.status = 'degraded';
            }
        } catch (error) {
            healthStatus.services.mongodb = 'error: ' + error.message;
            healthStatus.status = 'degraded';
        }

        // Test Blob Storage connection
        try {
            const { BlobServiceClient } = require('@azure/storage-blob');
            if (process.env.STORAGE_CONNECTION_STRING) {
                const blobServiceClient = BlobServiceClient.fromConnectionString(
                    process.env.STORAGE_CONNECTION_STRING
                );
                await blobServiceClient.getProperties();
                healthStatus.services.blobStorage = 'connected';
            } else {
                healthStatus.services.blobStorage = 'not configured';
                healthStatus.status = 'degraded';
            }
        } catch (error) {
            healthStatus.services.blobStorage = 'error: ' + error.message;
            healthStatus.status = 'degraded';
        }

        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

        return {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(healthStatus)
        };
    }
});
