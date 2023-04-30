const tf = require("@tensorflow/tfjs");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
const axios = require("axios");
const { bucket } = require("./google-storage");
const {
  indexAmbrosiaProfile,
  searchAmbrosiaProfiles,
  updateElasticsearchUser,
} = require("./elasticsearch");
//import { CourierClient } from "@trycourier/courier";
const { CourierClient } = require("@trycourier/courier");
const courier = CourierClient({
  authorizationToken: "pk_prod_639FEYNKQX4ZZMPDJKTTS4TQETX6",
});

require("dotenv").config({ path: ".env" });

const apiKey = process.env.OPEN_API_KEY;

function getNewRedisClient() {
  const client = new Redis({
    // Add your configuration options here, if needed
    password: "DLtLfalG0P1q4DEC6NZIQB54Z23WCImL",
    host: "redis-15161.c246.us-east-1-4.ec2.cloud.redislabs.com",
    port: 15161,
  });
  console.log("New Redis client created");

  return client;
}

const redisClient = getNewRedisClient();

//handle uploads to gcs
async function uploadImageToGCS(base64Image, filename) {
  const buffer = Buffer.from(base64Image, "base64");

  const file = bucket.file(filename);
  const stream = file.createWriteStream({
    metadata: {
      contentType: "image/png", // or the appropriate content type of your image
    },
    public: true, // set the access control to allow public read access
  });

  return new Promise((resolve, reject) => {
    stream.on("error", (error) => {
      console.error("Error uploading image to Google Cloud Storage:", error);
      reject(error);
    });

    stream.on("finish", () => {
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      resolve(imageUrl);
    });

    stream.end(buffer);
  });
}

const possibleCuisines = [
  "italian",
  "indian",
  "german",
  "chinese",
  "greek",
  "ethiopian",
  "japanese",
  "korean",
  "malaysian",
  "vietnamese",
  "british",
  "french",
  "russian",
  "cuban",
  "persian",
  "israeli",
  "turkish",
];

function oneHotEncodeCuisines(cuisines) {
  //match based on hobbies later?
  const encodedHobbies = possibleCuisines.map((cuisine) =>
    cuisines.includes(cuisine) ? 1 : 0
  );
  return encodedHobbies;
}

//finding compatible users:
async function findCompatibleUsers(models, targetUser) {
  //to normalize the string values to numerical
  const dietPreference = {
    vegetarian: 1,
    vegan: 2,
    pescaterian: 3,
    glutenfree: 4,
    dairyfree: 5,
    kosher: 6,
    halal: 7,
  };

  const major = {
    "Computer Science": 1,
    "Mechanical Engineering": 2,
    "Electrical Engineering": 3,
    "Civil Engineering": 4,
    Physics: 5,
    Mathematics: 6,
  };

  const personality = {
    introvert: 1,
    extrovert: 2,
    ambivert: 3,
  };

  //const encodedValue = categories[user.pets];

  // Fetch all users
  const users = await models.User.find({});
  const filteredUsers = users.filter(
    (user) => user.username !== targetUser.username
  ); // Assuming 'id' as the unique identifier, replace 'id' with the appropriate field if necessary

  // Process user data into tensors and store in userTensors
  const userTensors = filteredUsers.map((user) => {
    const encodedCuisines = oneHotEncodeCuisines(user.favCuisines);
    // Convert user data into a tensor
    // (Modify this to use the features you want to consider for compatibility)
    return tf.tensor([
      // user.hobbies,
      major[user.major] || 0,
      personality[user.personality] || 0,
      dietPreference[user.dietPreference] || 0,
      ...encodedCuisines,
    ]);
  });

  // Compute the cosine similarity between the target user and all other users
  const targetUserEncodedCuisines = oneHotEncodeCuisines(
    targetUser.favCuisines
  );
  const targetUserTensor = tf.tensor([
    major[targetUser.major] || 0,
    personality[targetUser.personality] || 0,
    dietPreference[targetUser.dietPreference] || 0,
    ...targetUserEncodedCuisines,
  ]);

  //calculate similarity score for each userTensor in the userTensors array
  const similarities = await Promise.all(
    userTensors.map(async (userTensor) => {
      const dotProduct = tf.sum(tf.mul(userTensor, targetUserTensor));
      const userTensorMagnitude = tf.norm(userTensor);
      const targetUserTensorMagnitude = tf.norm(targetUserTensor);
      return dotProduct
        .div(
          userTensorMagnitude.add(1e-8).mul(targetUserTensorMagnitude.add(1e-8))
        )
        .arraySync();
    })
  );

  // Sort users by similarity and return the most compatible users
  const sortedUsers = filteredUsers
    .map((user, index) => ({
      ...user._doc,
      similarity: similarities[index],
    }))
    .sort((a, b) => b.similarity - a.similarity);

  console.log("sorted users recommender function", sortedUsers.slice(1));
  return sortedUsers.slice(1); // Exclude the target user from the result
}

//the resolvers are used to assign business logic to the graphql schema
//for example, the user query below corresponds with the user(..) field defined in the query type
//in schema.js //the { input } is the input from the client which has to conform to the input parameter of input type
//UserInput defined in the schema. the resolvers get executed whenever a query is made with the query name matching one of the
//query fields defined in the query type (schema.js)
module.exports = {
  Query: {
    async usertestID(_, { userID }, { models }) {
      console.log("Input:", userID);
      try {
        const user = await models.User.findOne({
          _id: userID,
        }).exec();
        console.log("User:", user);
        return user;
      } catch (error) {
        console.error("Error in user resolver:", error);
        throw error;
      }
    },
    getLoggedInUsername: async (_, { input }, { models }) => {
      //retrieving the loggedInUsername stored in redis
      await redisClient.get("loggedInUser", (error, username) => {
        if (error) {
          console.error("Error retrieving username from Redis:", error);
        } else if (username) {
          console.log("Username retrieved from Redis:", username);
          return username;
        } else {
          console.log("No username found in Redis");
        }
      });
    },
  },
  Mutation: {
    verifyUniqueness: async (_, { input }, { models }) => {
      //if user exists with either the same username or email
      let uniqueUsername = await models.User.findOne({
        username: input.username,
      }).exec();

      if (uniqueUsername) {
        return "username already taken";
      } else {
        return "username available";
      }
    },
    searchUsers: async (_, { input, skip = 0, limit = 100 }, { models }) => {
      const filterAttributes = [
        input.university ? { university: input.university } : null,
        input.smoke ? { smoke: input.smoke } : null,
        input.sleepTime ? { sleepTime: input.sleepTime } : null,
        input.guests ? { guests: input.guests } : null,
        input.personality ? { personality: input.personality } : null,
        input.gender ? { gender: input.gender } : null,
        input.hygiene ? { hygiene: input.hygiene } : null,
        input.pets ? { pets: input.pets } : null,
      ];

      // Remove attributes that are not provided in the input
      const validAttributes = filterAttributes.filter(
        (attribute) => attribute !== null
      );

      const filter = {
        $and: [
          ...validAttributes,
          { username: { $ne: input.user } }, // Exclude logged-in user based on their ID
        ],
      };

      const searchResults = await models.User.find(filter)
        .skip(skip)
        .limit(limit);
      console.log("search results users:", searchResults);
      return searchResults;
    },
    elasticSearch: async (_, { input, skip = 0, limit = 100 }, { models }) => {
      console.log("elastic query input:", input.query);
      const searchResultsElastic = await searchRoommateProfiles(input.query);
      console.log(
        "search results users from elastic search:",
        searchResultsElastic
      );
      //return ["test elastic search"];
      return searchResultsElastic;
    },
    contactUser: async (_, { input, skip = 0, limit = 100 }, { models }) => {
      console.log("courier sender email contact input:", input.senderEmail);
      console.log("courier receiver email contact input:", input.receiverEmail);

      //implement the api here:
      let receiverEmail = input.receiverEmail;
      let senderEmail = input.senderEmail;

      const { requestId } = await courier.send({
        message: {
          to: {
            email: receiverEmail,
          },
          //template: "4WMFBTF2Z945PMQ334V7CH5Y3PVZ",
          data: {
            sendersEmail: senderEmail,
          },
          content: {
            title: "Hello from hæli!",
            body: "{{sendersEmail}}, likes your profile and requested to connect! Send them an email to get in touch.",
          },
        },
      });

      //return either a 200 response or a response which notifies the user of a successful connection
      return "email resolver accessed for courier api";
    },
    recommendUsers: async (_, { input, skip = 0, limit = 10 }, { models }) => {
      user = await models.User.findOne({
        username: input.username,
      }).exec();
      const compatibleUsers = await findCompatibleUsers(
        //calling the tensorflow function implementation for comparing cosine similarities
        //returns a list of compatible users
        models,
        user
      );

      console.log("compatible users:", compatibleUsers);

      const updateRecommendation = await models.Recs.findOneAndUpdate(
        { user: input.username }, // Find the document by username
        {
          $set: {
            // Update the fields
            user: input.username,
            recommendedUsers: compatibleUsers.map((user) => ({
              _id: user._id,
              username: user.username,
              similarity: user.similarity,
            })),
          },
        },
        {
          upsert: true, // Create a new document if it does not exist
          new: true, // Return the updated document
        }
      );
      try {
        await updateRecommendation.save(); //saving the changes to db
        //return newRecommendation;
      } catch (err) {
        console.error("Error creating user:", err);
        throw new Error("Failed to create user");
      }

      console.log("resolvers output for rec username", input.username);

      //call the recommender system again to update the recommendations to handle new user signups

      //fetching the existing list of recommended user data for the logged in user
      userList = await models.Recs.findOne({
        user: input.username,
      }).exec();
      console.log("recommended users:", userList["recommendedUsers"]);

      const recommendedUsersResult = userList["recommendedUsers"];

      //go through the usernames of each user returned from the above function and store the returned objects in a list of users
      async function fetchRecommendedUsers(recommendedUsers, userModel) {
        try {
          //find the corresponding User obj from User document and store in the userList
          const usersPromises = recommendedUsers.map(
            (
              user //store the corresponding User obj for each user in the recommendations list
            ) =>
              userModel
                .findOne({ username: user.username })
                // .skip(skip)
                // .limit(limit)
                .exec() //arrow function
          );
          //go through the list of User objects but how to get

          //list of recommended users
          const users = await Promise.all(usersPromises);

          //adding the similarity attribute to the response of each user object returned from the User table
          const recUsersSimilarityScore = recommendedUsers.map(
            (user, index) => ({
              ...users[index]._doc,
              similarity: user.similarity,
            })
          );
          console.log("users inside fetchRecUsers", users);
          console.log(
            "users inside fetchRecUsers with similarity score",
            recUsersSimilarityScore
          );
          //return the above payload with the similarity score added
          return recUsersSimilarityScore;
        } catch (error) {
          console.error("Error fetching recommended users:", error);
          throw error;
        }
      }
      console.log(
        "recommended users returned from recommended function",
        recommendedUsersResult
      );
      let recUsers = fetchRecommendedUsers(recommendedUsersResult, models.User); //recUser objects from User document

      console.log("rec users:", recUsers);

      return recUsers;
    },

    async userLogin(_, { input }, { models }) {
      //trying out redis
      console.log("Input:", input);
      try {
        let user;
        user = await models.User.findOne({
          username: input.username,
        }).exec();

        console.log("User:", user);
        console.log("resolver password:", input.password);

        // Perform password validation
        console.log("password", input.password);
        if (user.password != input.password) {
          console.error("Error in validating user resolver:");
          throw error;
          //return "failed login";
        } else {
          //storing the username in redis to be retrieved by ramsai
          redisClient.set(
            "loggedInUser",
            user.username,
            "EX",
            3600,
            (error) => {
              if (error) {
                console.error("Error storing username in Redis:", error);
              } else {
                console.log("Username stored in Redis:", user.username);
              }
            }
          );
          return user;
        }
      } catch (error) {
        console.error("Error in user resolver:", error);
        throw error;
      }
    },
    //signup resolver mutation
    addUserProfile: async (_, { input }, { models }) => {
      try {
        /*implement below logic for updateUserProfile() mutation*/

        const newUser = new models.User({
          //the field names here have to correspond with the field names in the mongoose
          //schema defined in user.js

          username: input.username,
          password: input.password,
          email: input.email,
          name: input.name,
          bio: input.biography,
          personality: input.personality,
          imgUrl: input.image,
          university: input.university,
          major: input.major,
          savedRecipes: [],
          favCuisines: input.favCuisines,
        });

        try {
          await newUser.save();
          const newProfile = {
            username: newUser.username,
            email: newUser.email,
            name: newUser.name,
            bio: newUser.bio,
            personality: newUser.personality,
            imgUrl: newUser.imgUrl,
            university: newUser.university,
            major: newUser.major,
            savedRecipes: newUser.savedRecipes,
            favCuisines: newUser.favCuisines,
          };

          //store the new user profile in the elastic-search index
          let newProfileId = newUser._id;
          indexAmbrosiaProfile(newProfileId, newProfile);
          if (!newUser) {
            throw new Error("Failed to create user profile");
          }

          const compatibleUsers = await findCompatibleUsers(
            //calling the tensorflow function implementation for comparing cosine similarities
            //returns a list of compatible users
            models,
            //updatedProfile
            newUser
          );

          console.log("compatible users:", compatibleUsers);
          //compiling a list of recommendations upon new user sign up
          //stores the list of compatible users for the user that just signed up
          const newRecommendation = await new models.Recs({
            _id: uuidv4(),
            user: input.username,
            //recommendedUsers: compatibleUsers,
            recommendedUsers: compatibleUsers.map((user) => ({
              _id: user._id,
              username: user.username, //can also include profile pic and email to retrieve for later
              similarity: user.similarity, //storing the similarity value to be displayed as part of the recommended results
            })),
          });
          try {
            await newRecommendation.save(); //saving the changes to db

            //return newRecommendation;
          } catch (err) {
            console.error("Error creating user:", err);
            throw new Error("Failed to create user");
          }

          //update the user object in the recommendations list with the similarity score:
          //similarity score cannot be a direct field in the original user schema because it is subjective for each user and can overlap (not specific to a user)
          //return newly created user;

          return newUser;
        } catch (err) {
          console.error("Error creating user:", err);
          throw new Error("Failed to create user");
        }
      } catch (err) {
        console.error("Error updating user profile:", err);
        throw new Error("Failed to create user profile");
      }
    },
    //finds the user object by username and updates the document with the passed in attrs
    //calls the recommender system to update the recs document with the latest recommendations for
    //the passed in user (similar to the addUser flow)
    editUserProfile: async (_, { input }, { models }) => {
      const filter = { username: input.username };
      const update = {
        //the input would have to be passed in from the root state (Home.tsx)
        //name: input.name,
        imgUrl: input.image,
        bio: input.biography,
        university: input.university,
        major: input.major,
        sleepTime: input.sleepTime,
        guests: input.guests,
        hygiene: input.cleanliness,
        hobbies: input.hobbies,
        smoke: input.smoking,
        pets: input.pets,
      };

      const options = { new: true, upsert: true };

      const updatedProfile = await models.User.findOneAndUpdate(
        filter, //the filter here being the unique username from the frontend
        update,
        options
      );

      const upProfile = {
        username: updatedProfile.username,
        email: updatedProfile.email,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        personality: updatedProfile.personality,
        gender: updatedProfile.gender,
        imgUrl: updatedProfile.imgUrl,
        university: updatedProfile.university,
        major: updatedProfile.major,
        sleepTime: updatedProfile.sleepTime,
        savedImages: updatedProfile.savedImages,
        guests: updatedProfile.guests,
        hygiene: updatedProfile.hygiene,
        hobbies: updatedProfile.hobbies,
        smoke: updatedProfile.smoke,
        pets: updatedProfile.pets,
      };
      console.log("updated user profile:", updatedProfile);
      let updatedProfileId = updatedProfile._id;

      await updateElasticsearchUser(updatedProfileId, upProfile);
    },
    getUserPrivacy: async (_, { input }, { models }) => {
      //to remember the privacy settings for the user to set initial the toggle state
      const { username } = input;
      const filter = { username };

      try {
        // // Try to get data from Redis cache

        const user = await models.User.findOne(filter);
        if (!user) {
          throw new Error("User not found");
        }

        let privacySetting;
        if (input.privacyType == "images") {
          privacySetting = user.collectionPublic;
          console.log("User collection privacy setting:", privacySetting);
        } else if (input.privacyType == "profile") {
          privacySetting = user.profilePublic;
          console.log("User profile privacy setting:", privacySetting);
        }
        // Cache the data in Redis with an expiration time (e.g., 3600 seconds = 1 hour)
        //await redisClient.setex(cacheKey, 3600, JSON.stringify(savedImages));

        return privacySetting;
      } catch (error) {
        console.error("Error fetching user designs:", error);
        throw error;
      }
    },

    togglePrivacy: async (_, { input }, { models }) => {
      const filter = { username: input.username };
      let update;
      if (input.privacyType == "profile") {
        update = {
          //the input would have to be passed in from the root state (Home.tsx)
          //name: input.name,
          profilePublic: input.profilePublic,
        };
      } else if (input.privacyType == "images") {
        update = {
          //the input would have to be passed in from the root state (Home.tsx)
          //name: input.name,
          collectionPublic: input.collectionPublic,
        };
      }
      const options = { new: true, upsert: true };

      const updatedProfile = await models.User.findOneAndUpdate(
        filter, //the filter here being the unique username from the frontend
        update,
        options
      );
      const upProfile = {
        username: updatedProfile.username,
        email: updatedProfile.email,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        personality: updatedProfile.personality,
        gender: updatedProfile.gender,
        imgUrl: updatedProfile.imgUrl,
        university: updatedProfile.university,
        major: updatedProfile.major,
        sleepTime: updatedProfile.sleepTime,
        savedImages: updatedProfile.savedImages,
        guests: updatedProfile.guests,
        hygiene: updatedProfile.hygiene,
        hobbies: updatedProfile.hobbies,
        smoke: updatedProfile.smoke,
        pets: updatedProfile.pets,
      };

      // Update Elasticsearch
      let updatedProfileId = updatedProfile._id;
      await updateElasticsearchUser(updatedProfileId, upProfile);

      console.log("updated user profile:", upProfile);
      //return "saved image";
      return updatedProfile;
    },
    saveUserDesign: async (_, { input }, { models }) => {
      const filter = { username: input.username };
      const response = await axios.get(input.imgSrc, {
        responseType: "arraybuffer",
      });
      const imgPrompt = input.imgPrompt;
      console.log("the prompt used to generate the image:", imgPrompt);
      const buffer = Buffer.from(response.data, "binary");
      const uuid = uuidv4();

      // Convert the image to a base64 string
      const base64Image = buffer.toString("base64");
      const imageUrl = await uploadImageToGCS(
        base64Image,
        // "some-unique-image-filename"
        uuid
      );
      console.log("base64 converted dall-e image uploaded to gcs:", imageUrl);
      const update = {
        $addToSet: {
          // savedImages: imageUrl,
          savedImages: {
            imgUrl: imageUrl,
            prompt: imgPrompt,
          },
        },
      };

      const options = { new: true, upsert: true };

      const updatedProfile = await models.User.findOneAndUpdate(
        filter,
        update,
        options
      );

      const upProfile = {
        username: updatedProfile.username,
        email: updatedProfile.email,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        personality: updatedProfile.personality,
        gender: updatedProfile.gender,
        imgUrl: updatedProfile.imgUrl,
        university: updatedProfile.university,
        major: updatedProfile.major,
        sleepTime: updatedProfile.sleepTime,
        savedImages: updatedProfile.savedImages,
        guests: updatedProfile.guests,
        hygiene: updatedProfile.hygiene,
        hobbies: updatedProfile.hobbies,
        smoke: updatedProfile.smoke,
        pets: updatedProfile.pets,
      };

      // Update Redis cache
      const cacheKey = `userDesigns:${input.username}`;
      const newSavedImages = updatedProfile.savedImages;
      await redisClient.set(cacheKey, JSON.stringify(newSavedImages)); //updating the cache with the new saved images

      // Update Elasticsearch
      let updatedProfileId = updatedProfile._id;
      await updateElasticsearchUser(updatedProfileId, upProfile);

      console.log("updated user profile:", upProfile);
      return "saved image";
    },
    deleteDesign: async (_, { input }, { models }) => {
      const filter = { username: input.username };
      const imageUrl = input.imgSrc;

      console.log("Deleting image URL:", imageUrl);
      const update = {
        $pull: {
          // savedImages: imageUrl,
          savedImages: {
            imgUrl: imageUrl,
            // prompt: imgPrompt,
          },
        },
      };

      const options = { new: true };

      const updatedProfile = await models.User.findOneAndUpdate(
        filter,
        update,
        options
      );

      const upProfile = {
        username: updatedProfile.username,
        email: updatedProfile.email,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        personality: updatedProfile.personality,
        gender: updatedProfile.gender,
        imgUrl: updatedProfile.imgUrl,
        university: updatedProfile.university,
        major: updatedProfile.major,
        sleepTime: updatedProfile.sleepTime,
        savedImages: updatedProfile.savedImages,
        guests: updatedProfile.guests,
        hygiene: updatedProfile.hygiene,
        hobbies: updatedProfile.hobbies,
        smoke: updatedProfile.smoke,
        pets: updatedProfile.pets,
      };

      // Update Redis cache
      const cacheKey = `userDesigns:${input.username}`;
      const newSavedImages = updatedProfile.savedImages;
      await redisClient.set(cacheKey, JSON.stringify(newSavedImages));

      // Update Elasticsearch
      let updatedProfileId = updatedProfile._id;
      await updateElasticsearchUser(updatedProfileId, upProfile);

      console.log("Updated user profile:", updatedProfile);
      return "Deleted image";
    },

    getUserDesigns: async (_, { input }, { models }) => {
      const { username } = input;
      const filter = { username };
      const cacheKey = `userDesigns:${username}`;

      try {
        // Try to get data from Redis cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
          console.log("Returning data from Redis cache");
          return JSON.parse(cachedData);
        }

        const user = await models.User.findOne(filter);
        if (!user) {
          throw new Error("User not found");
        }

        const savedImages = user.savedImages;
        console.log("User saved images:", savedImages);

        // Cache the data in Redis with an expiration time (e.g., 3600 seconds = 1 hour)
        await redisClient.setex(cacheKey, 3600, JSON.stringify(savedImages));

        return savedImages;
      } catch (error) {
        console.error("Error fetching user designs:", error);
        throw error;
      }
    },

    createDesigns: async (_, { input }, { models }) => {
      async function generateDetailedPrompt(userPrompt) {
        try {
          const response = await axios.post(
            "https://api.openai.com/v1/engines/text-davinci-002/completions",
            JSON.stringify({
              //prompt: `Given the user's input: "${userPrompt}", create a detailed description including the words photorealistic and high-quality for the interior design of a living space in a true-to-life manner.`,
              prompt: `Given the user's input: "${userPrompt}", display a high-quality and photorealistic image of a fusion cuisine dish that creatively combines elements from different culinary traditions.`,
              //The description should capture the essence of the theme, include essential elements, and describe the atmosphere, furniture, decorations, color scheme, and other aspects of the room in a true-to-life manner.`,
              max_tokens: 150, // Increase max tokens if necessary
              n: 1, // Generate multiple responses
              stop: null, // Stop when encountering a newline character
              //temperature: 0.6, // Adjust the temperature for more diverse outputs
              top_p: 0.7, // Use top_p instead of temperature for more focused outputs
              echo: false, // Do not include the input prompt in the response
            }),
            {
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer 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`,
              },
            }
          );
          // return response.data.choices[0].text.trim();
          const generatedText = response.data.choices[0].text.trim();

          return generatedText;
        } catch (error) {
          console.error("Error generating detailed prompt:", error);
          throw error;
        }
      }

      async function fetchGeneratedImages(imagePrompt) {
        if (imagePrompt === "") {
          imagePrompt = "cute kitten";
        }
        try {
          const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
              model: "image-alpha-001",
              prompt: `${imagePrompt}`,
              num_images: 1,
              size: "512x512",
              response_format: "url",
            },
            {
              headers: {
                "Content-Type": "application/json",
                //Authorization: `Bearer ${apiKey}`,
                Authorization:
                  "Bearer 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",
              },
            }
          );
          return response.data.data.map((image) => image.url);
        } catch (error) {
          console.error("Error fetching generated images:", error);
          throw error;
        }
      }

      const detailedPrompt = await generateDetailedPrompt(input.prompt);
      console.log("detailed davinci prompt: ", detailedPrompt);
      const urls = await fetchGeneratedImages(detailedPrompt);

      console.log("generated image urls: ", urls);
      return urls;
    },
  },
};
