const mongoose = require('mongoose');
require('dotenv').config();

const checkAllCollections = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const collections = await mongoose.connection.db.collections();
        console.log(`Scanning ${collections.length} collections...`);

        for (let collection of collections) {
            const name = collection.collectionName;
            try {
                const docs = await collection.find({}).toArray();
                console.log(`Scanning ${name}: ${docs.length} docs`);

                docs.forEach(doc => {
                    const str = JSON.stringify(doc);
                    if (str.toLowerCase().includes('congradulation')) {
                        console.log(`!!! MATCH FOUND IN ${name} !!!`);
                        console.log(`ID: ${doc._id}`);
                        // Print snippet around the match
                        const idx = str.toLowerCase().indexOf('congradulation');
                        const start = Math.max(0, idx - 50);
                        const end = Math.min(str.length, idx + 50);
                        console.log(`Snippet: ...${str.substring(start, end)}...`);
                    } else if (str.toLowerCase().includes('congra')) {
                        // Check for partials
                        const idx = str.toLowerCase().indexOf('congra');
                        const snippet = str.substring(idx, idx + 20);
                        console.log(`[Info] Found "${snippet}" in ${name} (ID: ${doc._id})`);
                        if (snippet.toLowerCase().startsWith('congrad')) {
                            console.log('!!! POTENTIAL TYPO FOUND !!!');
                        }
                    }
                });
            } catch (err) {
                console.error(`Error scanning collection ${name}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkAllCollections();
