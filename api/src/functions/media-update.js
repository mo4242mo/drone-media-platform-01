const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'DroneMediaDB');
const container = database.container(process.env.COSMOS_CONTAINER || 'MediaAssets');

app.http('media-update', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`PUT /api/media/${id} - Updating media asset`);

        try {
            // Get existing item
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

            // Parse request body
            const body = await request.json();

            // Update only allowed fields
            const updatedItem = {
                ...existingItem,
                title: body.title || existingItem.title,
                description: body.description || existingItem.description,
                metadata: {
                    ...existingItem.metadata,
                    gps: {
                        latitude: body.latitude !== undefined ? parseFloat(body.latitude) : existingItem.metadata?.gps?.latitude,
                        longitude: body.longitude !== undefined ? parseFloat(body.longitude) : existingItem.metadata?.gps?.longitude,
                        altitude: body.altitude !== undefined ? parseFloat(body.altitude) : existingItem.metadata?.gps?.altitude
                    },
                    droneModel: body.droneModel || existingItem.metadata?.droneModel,
                    missionId: body.missionId || existingItem.metadata?.missionId
                },
                updatedAt: new Date().toISOString()
            };

            // Replace item in Cosmos DB
            const { resource: replacedItem } = await container.item(id, id).replace(updatedItem);

            context.log(`Media updated successfully: ${id}`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Media updated successfully',
                    data: replacedItem
                })
            };
        } catch (error) {
            context.error('Error updating media:', error);

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

