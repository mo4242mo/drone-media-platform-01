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

app.http('media-update', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`PUT /api/media/${id} - Updating media asset`);

        try {
            const mediaContainer = await getContainer();
            const updatedData = await request.json();

            // First, get the existing item
            const { resource: existingItem } = await mediaContainer.item(id, id).read();
            
            if (!existingItem) {
                return {
                    status: 404,
                    jsonBody: {
                        message: `Media asset with id ${id} not found`
                    }
                };
            }

            // Merge existing data with updates
            const updatedItem = {
                ...existingItem,
                ...updatedData,
                id: id, // Ensure id is not changed
                updatedDate: new Date().toISOString()
            };

            // Replace the item
            const { resource: result } = await mediaContainer.item(id, id).replace(updatedItem);

            return {
                jsonBody: result
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
            context.error(`Error updating media asset: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error updating media asset',
                    error: error.message
                }
            };
        }
    }
});
