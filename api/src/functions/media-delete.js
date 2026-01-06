const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

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

// Get Blob container client
function getBlobContainerClient() {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error('STORAGE_CONNECTION_STRING environment variable is not set');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClient.getContainerClient('media-files');
}

app.http('media-delete', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`DELETE /api/media/${id} - Deleting media asset`);

        try {
            const mediaContainer = await getContainer();

            // First, get the existing item to get the file name
            const { resource: mediaItem } = await mediaContainer.item(id, id).read();
            
            if (!mediaItem) {
                return {
                    status: 404,
                    jsonBody: {
                        message: `Media asset with id ${id} not found`
                    }
                };
            }

            // Delete from Cosmos DB
            await mediaContainer.item(id, id).delete();

            // Delete from Blob Storage
            if (mediaItem.fileName) {
                try {
                    const blobContainerClient = getBlobContainerClient();
                    const blockBlobClient = blobContainerClient.getBlockBlobClient(mediaItem.fileName);
                    await blockBlobClient.deleteIfExists();
                } catch (blobError) {
                    context.warn(`Could not delete blob: ${blobError.message}`);
                }
            }

            return {
                status: 204 // No content for successful deletion
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
            context.error(`Error deleting media asset: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error deleting media asset',
                    error: error.message
                }
            };
        }
    }
});
