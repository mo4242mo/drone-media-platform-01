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
                cosmosdb: 'unknown',
                blobStorage: 'unknown'
            }
        };

        // Test Cosmos DB connection
        try {
            const { CosmosClient } = require('@azure/cosmos');
            if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
                const client = new CosmosClient({ 
                    endpoint: process.env.COSMOS_ENDPOINT, 
                    key: process.env.COSMOS_KEY 
                });
                await client.getDatabaseAccount();
                healthStatus.services.cosmosdb = 'connected';
            } else {
                healthStatus.services.cosmosdb = 'COSMOS_ENDPOINT or COSMOS_KEY not set';
            }
        } catch (error) {
            healthStatus.services.cosmosdb = `error: ${error.message}`;
        }

        // Test Blob Storage connection
        try {
            const { BlobServiceClient } = require('@azure/storage-blob');
            if (process.env.STORAGE_CONNECTION_STRING) {
                const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
                await blobServiceClient.getAccountInfo();
                healthStatus.services.blobStorage = 'connected';
            } else {
                healthStatus.services.blobStorage = 'STORAGE_CONNECTION_STRING not set';
            }
        } catch (error) {
            healthStatus.services.blobStorage = `error: ${error.message}`;
        }

        return {
            jsonBody: healthStatus
        };
    }
});
