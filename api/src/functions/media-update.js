const { app } = require('@azure/functions');
const { MongoClient } = require('mongodb');

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

app.http('media-update', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`PUT /api/media/${id} - Updating media asset`);

        try {
            const database = await getDatabase();
            const collection = database.collection('MediaAssets');
            
            // Get existing item
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

            // Parse request body
            const body = await request.json();

            // Update only allowed fields
            const updateData = {
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

            // Update item in MongoDB
            const result = await collection.updateOne(
                { id: id },
                { $set: updateData }
            );

            const updatedItem = await collection.findOne({ id: id });

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
                    data: updatedItem
                })
            };
        } catch (error) {
            context.error('Error updating media:', error);

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
