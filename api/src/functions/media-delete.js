const { app } = require('@azure/functions');
const { MongoClient } = require('mongodb');
const { BlobServiceClient } = require('@azure/storage-blob');

// MongoDB connection
let client = null;
let db = null;

async function getDatabase() {
    if (!db) {
        const connectionString = process.env.COSMOS_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('COSMOS_CONNECTION_STRING environment variable is not set');
        }
        client = new MongoClient(connectionString);
        await client.connect();
        db = client.db('DroneMediaDB');
    }
    return db;
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
            const database = await getDatabase();
            const collection = database.collection('MediaAssets');
            
            // Get existing item to get blob name
            const existingItem = await collection.findOne({ id: id });

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
                try {
                    const containerClient = getBlobContainerClient();
                    const blockBlobClient = containerClient.getBlockBlobClient(existingItem.blobName);
                    await blockBlobClient.deleteIfExists();
                    context.log(`Blob deleted: ${existingItem.blobName}`);
                } catch (blobError) {
                    context.warn(`Failed to delete blob: ${blobError.message}`);
                }
            }

            // Delete document from MongoDB
            await collection.deleteOne({ id: id });

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
