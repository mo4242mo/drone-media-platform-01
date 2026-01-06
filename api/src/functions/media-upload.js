const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

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
const containerClient = blobServiceClient.getContainerClient(
    process.env.STORAGE_CONTAINER || 'media-files'
);

app.http('media-upload', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'media',
    handler: async (request, context) => {
        context.log('POST /api/media - Uploading media asset');

        try {
            const formData = await request.formData();
            const file = formData.get('file');
            const title = formData.get('title') || 'Untitled';
            const description = formData.get('description') || '';
            const latitude = formData.get('latitude') || null;
            const longitude = formData.get('longitude') || null;
            const altitude = formData.get('altitude') || null;
            const droneModel = formData.get('droneModel') || '';
            const missionId = formData.get('missionId') || '';

            if (!file) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'No file provided'
                    })
                };
            }

            // Generate unique ID and blob name
            const id = uuidv4();
            const fileExtension = file.name.split('.').pop();
            const blobName = `${id}.${fileExtension}`;

            // Upload file to Blob Storage
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: {
                    blobContentType: file.type
                }
            });

            const blobUrl = blockBlobClient.url;

            // Create metadata document in Cosmos DB
            const mediaDocument = {
                id: id,
                title: title,
                description: description,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                blobUrl: blobUrl,
                blobName: blobName,
                metadata: {
                    gps: {
                        latitude: latitude ? parseFloat(latitude) : null,
                        longitude: longitude ? parseFloat(longitude) : null,
                        altitude: altitude ? parseFloat(altitude) : null
                    },
                    droneModel: droneModel,
                    missionId: missionId
                },
                uploadedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const { resource: createdItem } = await container.items.create(mediaDocument);

            context.log(`Media uploaded successfully: ${id}`);

            return {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Media uploaded successfully',
                    data: createdItem
                })
            };
        } catch (error) {
            context.error('Error uploading media:', error);
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

