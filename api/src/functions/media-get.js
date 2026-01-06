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

app.http('media-get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'media/{id}',
    handler: async (request, context) => {
        const id = request.params.id;
        context.log(`GET /api/media/${id} - Getting media asset`);

        try {
            const database = await getDatabase();
            const collection = database.collection('MediaAssets');
            const item = await collection.findOne({ id: id });

            if (!item) {
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
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: item
                })
            };
        } catch (error) {
            context.error('Error getting media:', error);

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
