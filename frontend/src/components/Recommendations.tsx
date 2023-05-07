import React, { useEffect, useState } from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import "./recs.css";
import { faTimes, faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { LazyLoad } from "react-lazyload";

import { AiOutlineSave } from "react-icons/ai";

// Assuming that each user has an id, name, and other attributes
interface User {
  username: string;
  name: string;
  email: string;
  personality: string;
  major: string;
  university: string;
  bio: string;
  imgUrl: string;
  favCuisines: [string];
  savedRecipes: any;
  collectionPublic: boolean;
  profilePublic: boolean;
}

interface RecommendationsResultsProps {
  loggedInUser: String;
  onToggleView: () => void;
}

//define mutation query to fetch the results
const USER_DETAILS = gql`
  fragment UserDetails on User {
    username
    name
    bio
    email
    personality
    university
    major
    similarity
    imgUrl
    favCuisines
    savedRecipes {
      imgUrl
      name
    }
    collectionPublic
    profilePublic
  }
`;

//define a fragment
// const REC_USER_DETAILS = gql`
//   fragment SimilarityScore on Similarity {
//     similarity
//   }
// `;

//make sure the mutation exists in the backend
const RECOMMEND_USERS = gql`
  mutation UserRecommendations($input: UserRecs) {
    recommendUsers(input: $input) {
      ...UserDetails
    }
  }
  ${USER_DETAILS}
`;

const Recommendations: React.FC<RecommendationsResultsProps> = ({
  loggedInUser,
  onToggleView,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recommendUsers, recommendedUsers] = useMutation(RECOMMEND_USERS);

  const openDetailedView = (user: User) => {
    console.log("user attributes from detailed view", user.name);
    setSelectedUser(user);
  };

  const h3Style = {
    fontFamily: "Roboto, sans-serif",
    fontSize: "15px",
    letterSpacing: "0.05em",
    textShadow:
      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
    color: "white",
  };

  //can implement a useEffect instead of passing it from the home component

  const closeDetailedView = () => {
    setSelectedUser(null);
  };

  const refreshRecs = () => {
    //implment the refresh
    //requests the latest list of recommendations from the backend
  };

  const [recommendations, setRecommendations] = useState<User[] | any>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  //refresh the recommended user list:
  const refreshRecommendations = async () => {
    try {
      const input = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUser,
      };
      console.log("username rec view", input);
      //execute the mutation query to return a list of recommended users for the logged in user
      setSearchLoading(true);

      let recdUsers = await recommendUsers({
        variables: { input }, //the input has to match the input schema type defined in backend
      });
      console.log("refreshed recommended list of users: ", recommendedUsers);
      console.log(
        "recommended list of users: ",
        recdUsers,
        recdUsers.data.recommendUsers
      );
      setRecommendations(recdUsers.data.recommendUsers); //useState setter to set the returned recommendations
      setSearchLoading(false);
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  function getSleepTimeDescription(sleepTime: any) {
    switch (sleepTime) {
      case "1":
        return "Before 9pm";
      case "2":
        return "9pm-11pm";
      case "3":
        return "11pm-1am";
      case "4":
        return "1am-3am";
    }
  }

  const SAVE_IMAGE = gql`
    mutation SaveDesign($input: SaveDesign) {
      saveUserDesign(input: $input)
    }
  `;
  const [saveImage, savedImage] = useMutation(SAVE_IMAGE);
  const handleSaveImage = async (url: any, imgPrompt: any) => {
    setSearchLoading(true);
    console.log("url of image being saved: ", url);
    const input = {
      username: loggedInUser,
      imgSrc: url,
      imgPrompt: imgPrompt,
    };
    const { data } = await saveImage({
      variables: { input },
      context: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    }); //execute the mutation react hook
    console.log("response saved image:", data);
    setSearchLoading(false);
    //setImageURLs(data.createDesigns);
  };

  //fetch recommended users upon initial page load
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const input = {
          //this variable has to match the defined parameter accepted by the resolver
          username: loggedInUser,
        };
        console.log("username rec view", input);
        //execute the mutation query to return a list of recommended users for the logged in user
        setSearchLoading(true);
        let recdUsers = await recommendUsers({
          variables: { input }, //the input has to match the input schema type defined in backend
        });
        console.log("recommended list of users: ", recommendedUsers);
        console.log(
          "recommended list of users: ",
          recdUsers,
          recdUsers.data.recommendUsers
        );
        setRecommendations(recdUsers.data.recommendUsers); //useState setter to set the returned recommendations
        console.log("recommendations from fetchRecs: ", recdUsers.data);
        setSearchLoading(false);
      } catch (error) {
        console.error("Error fetching recommended users:", error);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <>
      {searchLoading ? (
        <div
          className="flex justify-center items-center"
          style={{
            height: "290px",
            // overflowY: "auto",
          }}
        >
          <div className="rlame"></div>
        </div>
      ) : (
        <>
          <div>
            <button
              onClick={refreshRecommendations}
              className="mt-1 mb-4 bg-blue-600 opacity-80 text-white px-4 py-1 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* {showResults ? "Go back to search filter" : "Show results"} */}
              <FontAwesomeIcon icon={faSync} />
            </button>
          </div>
          <hr className="border border" />
          <div
            className="flex  flex-col h-full"
            style={{ maxHeight: "290px", overflowY: "auto" }}
          >
            <div className="flex flex-wrap justify-between backdrop-blur-md items-start mb-8">
              {recommendations.map((user: any) =>
                user.profilePublic === true ? (
                  <div
                    key={user.username}
                    className=" p-4 m-2 rounded-lg cursor-pointer hover:shadow-lg"
                    onClick={() => openDetailedView(user)}
                  >
                    <div className="rounded-full mb-16 h-24 w-24 mx-auto mb-4 ">
                      <img
                        src={user.imgUrl}
                        alt=""
                        className="rounded-full h-full w-full object-cover"
                      />
                    </div>
                    <h3
                      className="font-semibold mb-2 text-white"
                      style={{
                        fontFamily: "Roboto, sans-serif",
                        letterSpacing: "0.05em",
                        textShadow:
                          "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {(parseFloat(user.similarity) * 100).toFixed(2)}% match
                    </h3>
                    {/* Render other user attributes here */}
                  </div>
                ) : user.profilePublic === false ? null : (
                  <div
                    key={user.username}
                    className=" p-4 m-2 rounded-lg cursor-pointer hover:shadow-lg"
                    onClick={() => openDetailedView(user)}
                  >
                    <div className="rounded-full mb-16 h-24 w-24 mx-auto mb-4 ">
                      <img
                        src={user.imgUrl}
                        alt=""
                        className="rounded-full h-full w-full object-cover"
                      />
                    </div>
                    <h3
                      className="font-semibold mb-2 text-white"
                      style={{
                        fontFamily: "Roboto, sans-serif",
                        letterSpacing: "0.05em",
                        textShadow:
                          "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {(parseFloat(user.similarity) * 100).toFixed(2)}% match
                    </h3>
                    {/* Render other user attributes here */}
                  </div>
                )
              )}
            </div>

            {selectedUser && (
              <div className="fixed top-0 left-0 w-full h-full bg-opacity-50 flex items-center justify-center z-50">
                <div
                  className="golden bg-blue-400 mt-4 border-4 border-gray-300 bg-opacity-25 backdrop-blur-lg p-6 rounded-lg shadow-lg"
                  style={{
                    maxHeight: "590px",
                    width: "489px",
                    overflowY: "auto",
                  }}
                  // ref={scrollContainerRef}
                >
                  <button
                    className="absolute top-4 left-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={closeDetailedView}
                  >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                  <div className="text-center mb-4">
                    <div className="rounded-full mb-4 h-24 w-24 mx-auto">
                      <img
                        src={selectedUser.imgUrl}
                        // alt="Profile"
                        className="rounded-full h-full w-full object-cover"
                      />
                    </div>
                    <h2
                      className="text-xl font-semibold mb-4 text-center text-white"
                      style={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: "25px",
                        letterSpacing: "0.05em",
                        textShadow:
                          "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      User: {selectedUser.username}
                    </h2>
                  </div>
                  <hr className="flame border-t border-black mt-8" />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <h3 style={h3Style}>Name: {selectedUser.name}</h3>
                    <h3 style={h3Style}>Email: {selectedUser.email}</h3>
                    <h3 style={h3Style}>Bio: {selectedUser.bio}</h3>
                    <h3 style={h3Style}>
                      University: {selectedUser.university}
                    </h3>
                    <h3 style={h3Style}>Major: {selectedUser.major}</h3>
                    <h3 style={h3Style}>
                      Personality: {selectedUser.personality}
                    </h3>
                  </div>
                  <hr className="flame border-t border-black mt-8" />
                  <h2
                    className="text-2xl font-semibold mb-4 mt-4 text-center text-white"
                    style={{
                      fontFamily: "Roboto, sans-serif",
                      fontSize: "20px",
                      letterSpacing: "0.05em",
                      textShadow:
                        "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    Design Collection:
                  </h2>
                  {selectedUser.collectionPublic === true ? (
                    <div
                      className="image-grid mt-8"
                      style={{ maxHeight: "725px", overflowY: "auto" }}
                    >
                      {selectedUser.savedRecipes.map((url: any, index: any) => (
                        <div
                          key={index}
                          className="images-container relative"
                          style={{
                            border: "3px solid #e0e0e0",
                            display: "inline-block",
                            borderRadius: "10px",
                            padding: "5px",
                            boxSizing: "border-box",
                            marginBottom: "16px",
                            textAlign: "center", // Add this for center alignment
                          }}
                        >
                          <div>
                            <AiOutlineSave
                              className="save-icon absolute"
                              size={34}
                              onClick={() =>
                                handleSaveImage(url.imgUrl, url.name)
                              }
                              style={{
                                top: "10px",
                                left: "10px",
                                cursor: "pointer",
                              }}
                              title={"Save to collection"}
                            />
                          </div>
                          <div
                            style={{
                              // border: "3px solid #e0e0e0",
                              display: "inline-block",
                              borderRadius: "10px",
                              padding: "5px",
                              boxSizing: "border-box",
                            }}
                          >
                            <img src={url.imgUrl} className="rounded-lg" />
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              marginTop: "8px",
                              fontStyle: "italic",
                              fontSize: "14px",
                              color: "#E4E1D0", // Bone white color
                              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)", // Text shadow
                            }}
                          >
                            &ldquo;{url.name}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedUser.collectionPublic === false ? (
                    <div
                      className="flex justify-center items-center"
                      style={{
                        height: "290px",
                        // overflowY: "auto",
                      }}
                    >
                      {/* <div className="rlame"></div> */}
                      <h2
                        className="text-xl font-semibold mb-4 mt-4 text-center text-white"
                        style={{
                          fontFamily: "Roboto, sans-serif",
                          fontSize: "15px",
                          letterSpacing: "0.05em",
                          textShadow:
                            "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        User's Collection is Private
                      </h2>
                    </div>
                  ) : (
                    <div
                      className="image-grid mt-8"
                      style={{ maxHeight: "725px", overflowY: "auto" }}
                    >
                      {/* {selectedUser.savedRecipes.map((url: any, index: any) => (
                        <div
                          key={index}
                          className="images-container relative"
                          style={{
                            border: "3px solid #e0e0e0",
                            display: "inline-block",
                            borderRadius: "10px",
                            padding: "5px",
                            boxSizing: "border-box",
                            marginBottom: "16px",
                            textAlign: "center", // Add this for center alignment
                          }}
                        >
                          <div>
                            <AiOutlineSave
                              className="save-icon absolute"
                              size={34}
                              onClick={() =>
                                handleSaveImage(url.imgUrl, url.prompt)
                              }
                              style={{
                                top: "10px",
                                left: "10px",
                                cursor: "pointer",
                              }}
                              title={"Save to collection"}
                            />
                          </div>
                          <div
                            style={{
                              // border: "3px solid #e0e0e0",
                              display: "inline-block",
                              borderRadius: "10px",
                              padding: "5px",
                              boxSizing: "border-box",
                            }}
                          >
                            <img src={url.imgUrl} className="rounded-lg" />
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              marginTop: "8px",
                              fontStyle: "italic",
                              fontSize: "14px",
                              color: "#E4E1D0", // Bone white color
                              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)", // Text shadow
                            }}
                          >
                            &ldquo;{url.prompt}&rdquo;
                          </div>
                        </div>
                      ))} */}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Recommendations;
