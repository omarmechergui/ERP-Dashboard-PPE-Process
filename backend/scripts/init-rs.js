const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb://localhost:27018/?directConnection=true";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const adminDb = client.db('admin');
    console.log("Connected to MongoDB. Initializing Replica Set...");
    const result = await adminDb.command({ replSetInitiate: {
      _id: "rs0",
      members: [{ _id: 0, host: "localhost:27018" }]
    }});
    console.log("Replica Set Initialized:", result);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
