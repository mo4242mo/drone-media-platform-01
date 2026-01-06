const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'DroneMediaDB');
const container = database.container(process.env.COSMOS_CONTAINER || 'MediaAssets');

// Initialize Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.STORAGE_CONNECTION_STRING
);
const blobContainerClient = blobServiceClient.getContainerClient(
    process.env.STORAGE_CONTAINER || 'media-files'
);

app.http('media-delete', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`DELETE /api/media/${id} - Deleting media asset`);

        try {
            // Get existing item to get blob name
            const { resource: existingItem } = await container.item(id, id).read();

            if (!existingItem) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Media not found'
                    })
                };
            }

            // Delete blob from storage
            if (existingItem.blobName) {
                const blockBlobClient = blobContainerClient.getBlockBlobClient(existingItem.blobName);
                await blockBlobClient.deleteIfExists();
                context.log(`Blob deleted: ${existingItem.blobName}`);
            }

            // Delete document from Cosmos DB
            await container.item(id, id).delete();

            context.log(`Media deleted successfully: ${id}`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Media deleted successfully',
                    deletedId: id
                })
            };
        } catch (error) {
            context.error('Error deleting media:', error);

            if (error.code === 404) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Media not found'
                    })
                };
            }

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

