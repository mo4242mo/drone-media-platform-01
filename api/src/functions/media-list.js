const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB connection
let cosmosClient = null;
let container = null;

async function getContainer() {
    if (!container) {
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        
        if (!endpoint || !key) {
            throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set');
        }
        
        cosmosClient = new CosmosClient({ endpoint, key });
        const database = cosmosClient.database('DroneMediaDB');
        container = database.container('media');
        
        // Ensure database and container exist
        await cosmosClient.databases.createIfNotExists({ id: 'DroneMediaDB' });
        await database.containers.createIfNotExists({ 
            id: 'media',
            partitionKey: { paths: ['/id'] }
        });
    }
    return container;
}

app.http('media-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'media',
    handler: async (request, context) => {
        context.log('GET /api/media - Listing all media assets');

        try {
            const mediaContainer = await getContainer();
            const { resources: mediaItems } = await mediaContainer.items
                .query('SELECT * FROM c ORDER BY c.uploadDate DESC')
                .fetchAll();

            return {
                jsonBody: mediaItems
            };
        } catch (error) {
            context.error(`Error listing media assets: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error listing media assets',
                    error: error.message
                }
            };
        }
    }
});
