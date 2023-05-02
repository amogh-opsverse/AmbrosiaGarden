const { Client } = require("@elastic/elasticsearch");
require("dotenv").config({ path: ".env" });
const nodeVal = process.env.ELASTIC_NODE;
const apiVal = process.env.ELASTIC_API_KEY;

const client = new Client({
  node: nodeVal,
  auth: {
    apiKey: apiVal,
  },
});

async function createIndex(indexName) {
  try {
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
      },
    });
    console.log(`Created index: ${indexName}`);
  } catch (error) {
    console.error(`Error creating index: ${indexName}`, error);
  }
}

//createIndex("roommate_profiles"); //creating an index for the roommate profiles

async function indexAmbrosiaProfile(id, profile) {
  try {
    await client.index({
      index: "search-ambrosia",
      id: id,
      body: profile,
    });
  } catch (error) {
    console.error("Error indexing ambrosia profile:", error);
  }
}
async function indexAmbrosiaRecipe(id, recipe) {
  try {
    await client.index({
      index: "search-ambrosia",
      id: id,
      body: recipe,
    });
  } catch (error) {
    console.error("Error indexing ambrosia profile:", error);
  }
}
async function searchAmbrosiaProfiles(query) {
  try {
    const response = await client.search({
      index: "search-ambrosia",
      body: {
        query: {
          // You can customize the search query based on your requirements
          multi_match: {
            query: query,
            fields: ["*"],
          },
        },
      },
    });
    console.log("Elasticsearch response:", response);
    return response.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error("Error searching for ambrosia profiles:", error);
    return [];
  }
}
const updateElasticsearchUser = async (userId, updatedUser) => {
  // Assuming you have a configured Elasticsearch client instance as `client`
  try {
    await client.update({
      index: "search-ambrosia", // Replace with the name of your index
      id: userId,
      body: {
        doc: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error updating Elasticsearch user:", error);
  }
};
//module.exports = client;
module.exports = {
  client,
  createIndex,
  indexAmbrosiaProfile,
  indexAmbrosiaRecipe,
  searchAmbrosiaProfiles,
  updateElasticsearchUser,
};
