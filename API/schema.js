const { gql } = require("apollo-server");

const typeDefs = gql`
  enum Frequency {
    OFTEN
    SOMETIMES
    NEVER
  }

  type User {
    #id: ID!
    name: String
    password: String
    email: String
    username: String
    bio: String
    imgUrl: String
    university: String
    major: String
    personality: String
    favCuisines: [String]
    savedRecipes: [SavedRecipe]
    dietPreference: String
    collectionPublic: Boolean
    profilePublic: Boolean
    createdAt: Int
    similarity: Float
  }

  type SavedRecipe {
    imgUrl: String
    name: String
  }

  type ProfileInfo {
    username: User
  }

  type AddUserProfileResult {
    profile: User
    compatibleUsers: [User]
  }

  #enforces the structure and contents of clientside json req payload

  input NewUserInput {
    #id: String!
    password: String!
    email: String!
    username: String!
    #createdAt: Int!
  }

  input UserProfile {
    #id: ID!
    username: String
    password: String
    email: String
    name: String
    biography: String
    personality: String
    image: String
    university: String
    major: String
    dietPreference: String
    favCuisines: [String]
  }

  input UserEditProfile {
    #id: ID!
    username: String
    password: String
    email: String
    biography: String
    image: String
    university: String
    major: String
    sleepTime: String
    cleanliness: Frequency
    guests: Frequency
    hobbies: [String]
    smoking: String
    pets: String
  }

  input UserInputUniversity {
    university: String!
  }

  input UserInputLogin {
    username: String!
    password: String!
  }

  input UniqueID {
    username: String!
    email: String!
    password: String!
  }

  input UserSearch {
    user: String
    university: String
    smoke: String
    sleepTime: String
    guests: String
    personality: String
    gender: String
    hygiene: String
    pets: String
  }

  input UserElasticSearch {
    query: String
  }

  input UserRecs {
    username: String!
  }

  input GenerateDesigns {
    prompt: String
  }

  input GetUserRecipes {
    username: String!
  }

  input SaveDesign {
    username: String!
    imgSrc: String
    imgPrompt: String
  }

  input DeleteDesign {
    username: String!
    imgSrc: String
  }

  input CollectionPrivacy {
    username: String!
    collectionPublic: Boolean
    profilePublic: Boolean
    privacyType: String
  }

  input ContactUser {
    senderEmail: String!
    receiverEmail: String!
  }
  
  input SaveRecipeInput {
    username: String!
    name: String
  }

  type Query { #the query can be of any name but the input type and return types are usually defined in the schema
    usertestID(userID: String!): User! #a query which can be used to get user details based on user id
  }

  type Mutation {
    addUser(input: NewUserInput!): User!
    addUserProfile(input: UserProfile): User! #mutation definition to add profile info to the user
    editUserProfile(input: UserEditProfile): User #mutation definition to add profile info to the user
    verifyUniqueness(input: UniqueID): String! #used to check if username already exists during signup
    userLogin(input: UserInputLogin!): User!
    searchUsers(input: UserSearch): [User]
    recommendUsers(input: UserRecs): [User]

    #change collection privacy
    togglePrivacy(input: CollectionPrivacy): User
    getUserPrivacy(input: CollectionPrivacy): Boolean

    #dall-e generation
    getUserRecipes(input: GetUserRecipes): [SavedRecipe]
    createDesigns(input: GenerateDesigns): [String]
    deleteDesign(input: DeleteDesign): String
    saveUserDesign(input: SaveDesign): String

    #elasticsearch
    elasticSearch(input: UserElasticSearch): [User]

    #courier api
    contactUser(input: ContactUser): String
    
    #getLoggedInUsername(testInput: String): String #a query which can be used to get the username of the logged in user
    getLoggedInUsername(input: String): String
    
    saveRecipe(input: SaveRecipeInput): String


  }
`;

module.exports = typeDefs;
