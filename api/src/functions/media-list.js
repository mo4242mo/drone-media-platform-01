const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'DroneMediaDB');
const container = database.container(process.env.COSMOS_CONTAINER || 'MediaAssets');

app.http('media-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'media',
    handler: async (request, context) => {
        context.log('GET /api/media - Listing all media assets');

        try {
            // Query all media items
            const querySpec = {
                query: 'SELECT * FROM c ORDER BY c.uploadedAt DESC'
            };

            const { resources: items } = await container.items
                .query(querySpec)
                .fetchAll();

            context.log(`Found ${items.length} media items`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    count: items.length,
                    data: items
                })
            };
        } catch (error) {
            context.error('Error listing media:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: error.message
                })
            };
        }
    }
});

