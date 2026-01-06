const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

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

// Get Blob container client
function getBlobContainerClient() {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error('STORAGE_CONNECTION_STRING environment variable is not set');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClient.getContainerClient('media-files');
}

app.http('media-upload', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'media',
    handler: async (request, context) => {
        context.log('POST /api/media - Uploading new media asset');

        try {
            const formData = await request.formData();
            const file = formData.get('file');
            const title = formData.get('title') || 'Untitled';
            const description = formData.get('description') || '';
            const tagsString = formData.get('tags');
            const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

            if (!file) {
                return {
                    status: 400,
                    jsonBody: {
                        message: 'No file uploaded'
                    }
                };
            }

            const mediaId = uuidv4();
            const fileName = `${mediaId}-${file.name}`;
            
            // Upload to Blob Storage
            const blobContainerClient = getBlobContainerClient();
            await blobContainerClient.createIfNotExists({ access: 'blob' });
            const blockBlobClient = blobContainerClient.getBlockBlobClient(fileName);

            // Get file content as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: file.type }
            });

            // Create media item
            const mediaItem = {
                id: mediaId,
                title: title,
                description: description,
                fileName: fileName,
                fileUrl: blockBlobClient.url,
                fileType: file.type,
                fileSize: file.size,
                tags: tags,
                uploadDate: new Date().toISOString()
            };

            // Save to Cosmos DB
            const mediaContainer = await getContainer();
            await mediaContainer.items.create(mediaItem);

            return {
                status: 201,
                jsonBody: mediaItem
            };
        } catch (error) {
            context.error(`Error uploading media asset: ${error.message}`);
            return {
                status: 500,
                jsonBody: {
                    message: 'Error uploading media asset',
                    error: error.message
                }
            };
        }
    }
});
