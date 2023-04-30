# Roommate Finder App

The Roommate Finder App is a web application built using the MERN stack, designed to help users find compatible roommates based on their preferences and lifestyle choices. This application is mobile-browser friendly and provides a seamless user experience.

## Deployment
have two separate terminal tabs open for frontend and API directories respectively and run the following commands in the root of both directories, if it's your first time deploying the app.
```
npm install
npm run dev
```

## Architecture

The application's architecture consists of the following components:

- Frontend: React, TypeScript, and Tailwind CSS
- Backend: Express, MongoDB, and GraphQL (with Apollo)
- Recommender System: TensorFlow (for calculating user similarities)
- Caching: Redis (for login flow)

### Frontend

The frontend is built using React, TypeScript, and Tailwind CSS, which enables a mobile browser-friendly UI experience.

### GraphQL Server (Apollo)

The GraphQL server, using Apollo, acts as the middleware between the frontend and the backend. It provides a flexible and efficient way of fetching data from the backend.

### Backend

The backend is built using Express and MongoDB. It contains two collections: Users and Recommendations (for storing the list of recommended users for a user in the Users collection). The GraphQL middleware is defined with the appropriate resolvers and schema to handle user signup, signin, authentication, recommending users, and editing user profiles.

### Recommender System

The recommender system is a function defined in the Express backend that uses TensorFlow to compute similarities between users using cosine matrix multiplication. This system helps to find the most compatible roommates based on user preferences.

### Redis Cache

Redis is used as a caching mechanism for the login flow, improving performance and reducing the load on the MongoDB database.

## Architecture Diagram
```
+-----------------------------+
|   Frontend (React, TS,      |
|   Tailwind CSS)             |
+-----------------------------+
               |
               V
+-----------------------------+
|   GraphQL Server (Apollo)   |
+-----------------------------+
               |
               V
+------+      +------+      +------+
|User  |      |Recs  |      |Redis |
|Resolvers <-->|Resolvers <-->|Cache |
+------+      +------+      +------+
               |
               V
+-----------------------------+
|     MongoDB (Users, Recs)   |
+-----------------------------+
```
