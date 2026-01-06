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
    }
    return container;
}

app.http('media-get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`GET /api/media/${id} - Getting media asset`);

        try {
            const mediaContainer = await getContainer();
            
            // Read item by id and partition key
            const { resource: mediaItem } = await mediaContainer.item(id, id).read();

            if (!mediaItem) {
                return {
                    status: 404,
                    jsonBody: {
                        message: `Media asset with id ${id} not found`
                    }
                };
            }

            return {
                jsonBody: mediaItem
            };
        } catch (error) {
            if (error.code === 404) {
                return {
                    status: 404,
                    jsonBody: {
                        message: `Media asset with id ${id} not found`
                    }
                };
            }
            context.error(`Error getting media asset: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error getting media asset',
                    error: error.message
                }
            };
        }
    }
});
