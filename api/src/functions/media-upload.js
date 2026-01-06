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
            
            // Get GPS metadata
            const latitude = formData.get('latitude');
            const longitude = formData.get('longitude');
            const altitude = formData.get('altitude');
            const droneModel = formData.get('droneModel');
            const missionId = formData.get('missionId');

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f0768959-7ad9-4b46-9120-e67d373d75f7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'media-upload.js:63',message:'FormData GPS fields received',data:{latitude,longitude,altitude,droneModel,missionId,fileName:file?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A3,B1'})}).catch(()=>{});
            // #endregion

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

            // Create media item with GPS metadata
            const mediaItem = {
                id: mediaId,
                title: title,
                description: description,
                fileName: fileName,
                fileUrl: blockBlobClient.url,
                fileType: file.type,
                fileSize: file.size,
                tags: tags,
                uploadDate: new Date().toISOString(),
                gps: {
                    latitude: latitude || null,
                    longitude: longitude || null,
                    altitude: altitude ? parseFloat(altitude) : null
                },
                metadata: {
                    droneModel: droneModel || null,
                    missionId: missionId || null
                }
            };

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f0768959-7ad9-4b46-9120-e67d373d75f7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'media-upload.js:110',message:'MediaItem constructed before DB save',data:{mediaItem},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A1,A2,B2'})}).catch(()=>{});
            // #endregion

            // Save to Cosmos DB
            const mediaContainer = await getContainer();
            await mediaContainer.items.create(mediaItem);

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f0768959-7ad9-4b46-9120-e67d373d75f7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'media-upload.js:118',message:'MediaItem saved to Cosmos DB',data:{id:mediaItem.id,hasGps:!!mediaItem.gps,gpsValues:mediaItem.gps},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B2'})}).catch(()=>{});
            // #endregion

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
