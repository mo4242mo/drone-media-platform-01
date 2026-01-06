const { app } = require('@azure/functions');
const appInsights = require('applicationinsights');

// Initialize Application Insights if configured
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .start();
}

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
                cosmosDb: 'unknown',
                blobStorage: 'unknown',
                cognitiveServices: process.env.COGNITIVE_ENDPOINT ? 'configured' : 'not configured',
                applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ? 'configured' : 'not configured'
            }
        };

        // Test Cosmos DB connection
        try {
            const { CosmosClient } = require('@azure/cosmos');
            const client = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });
            await client.getDatabaseAccount();
            healthStatus.services.cosmosDb = 'connected';
        } catch (error) {
            healthStatus.services.cosmosDb = 'error: ' + error.message;
            healthStatus.status = 'degraded';
        }

        // Test Blob Storage connection
        try {
            const { BlobServiceClient } = require('@azure/storage-blob');
            const blobServiceClient = BlobServiceClient.fromConnectionString(
                process.env.STORAGE_CONNECTION_STRING
            );
            await blobServiceClient.getProperties();
            healthStatus.services.blobStorage = 'connected';
        } catch (error) {
            healthStatus.services.blobStorage = 'error: ' + error.message;
            healthStatus.status = 'degraded';
        }

        // Track custom event in Application Insights
        if (appInsights.defaultClient) {
            appInsights.defaultClient.trackEvent({
                name: 'HealthCheck',
                properties: {
                    status: healthStatus.status,
                    timestamp: healthStatus.timestamp
                }
            });
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

