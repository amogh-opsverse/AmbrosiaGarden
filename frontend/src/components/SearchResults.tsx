import React, { useState } from "react";
import "../styles/search.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
import "../styles/pulse.css";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { AiOutlineSave } from "react-icons/ai";
import "./recs.css";
import { useSelector } from "react-redux";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const optimizeImage = (url: any) => {
  const cloudinaryURL = "https://res.cloudinary.com/dcdogrqqp/image/fetch/";
  const optimizedParams = "w_400,c_fit,q_auto,f_auto/";
  return `${cloudinaryURL}${optimizedParams}${encodeURIComponent(url)}`;
};

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
  savedRecipes: any;
  collectionPublic: boolean;
  profilePublic: boolean;
}

const SAVE_IMAGE = gql`
  mutation SaveDesign($input: SaveDesign) {
    saveUserDesign(input: $input)
  }
`;

//mutation to send email
const SEND_EMAIL = gql`
  mutation SendEmail($input: ContactUser) {
    contactUser(input: $input)
  }
`;

interface SearchResultsProps {
  loggedInUserName: string;
  loggedInUserEmail: string;
  results: User[]; //results prop of type User being passed in from Home.tsx
  onToggleView: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  loggedInUserName,
  loggedInUserEmail,
  results,
  onToggleView,
}) => {
  console.log("results from SearchResults.tsx: ", results);
  const [searchLoading, setSearchLoading] = useState(false);

  const [saveImage, savedImage] = useMutation(SAVE_IMAGE);
  const handleSaveImage = async (url: any, imgPrompt: any) => {
    setSearchLoading(true);
    console.log("url of image being saved: ", url);
    const input = {
      username: loggedInUserName,
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

  //mutation to send email
  const [sendEmail, sentEmail] = useMutation(SEND_EMAIL);
  //handler function for send email:
  const handleSendEmail = async (sendersEmail: any, receiversEmail: any) => {
    setSearchLoading(true);
    console.log(
      "the emails of the sender and receiver: ",
      sendersEmail,
      receiversEmail
    );
    //must match the schema for the contactuser schema
    const input = {
      senderEmail: sendersEmail,
      receiverEmail: receiversEmail,
    };

    //make the mutation call to the backend to send the email
    const { data } = await sendEmail({
      variables: { input },
      context: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    }); //execute the mutation react hook

    //print the response received from the backend
    console.log("response from courier api", data);
    setSearchLoading(false);
  };

  const h3Style = {
    fontFamily: "Roboto, sans-serif",
    fontSize: "15px",
    letterSpacing: "0.05em",
    textShadow:
      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
    color: "white",
  };
  const [selectedUser, setSelectedUser] = useState<User | any>(null);

  // const searchResults = useSelector((state: any) => state.searchResults.users);
  // const displayResults = searchResults.length > 0 ? searchResults : results;
  const searchResults = useSelector((state: any) => state.searchResults.users); //redux state
  console.log("searchResults: ", searchResults);

  const activeSearch = useSelector(
    (state: any) => state.searchResults.activeSearch
  ); //redux state
  console.log("activeSearch from searchResults", activeSearch);
  //const displayResults = activeSearch === "redux" ? searchResults : results;
  let displayResults = activeSearch === "redux" ? searchResults : [];
  if (activeSearch === "local") {
    displayResults = results;
  }
  const openDetailedView = (user: User) => {
    console.log("user attributes from detailed view", user.username);
    setSelectedUser(user);
  };

  const closeDetailedView = () => {
    setSelectedUser(null);
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

  //update view to show similarity score for each user.
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
          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
            }}
          >
            <div
              className="justify-between items-center mb-2"
              style={{
                maxHeight: "30px",
                overflowY: "auto",
              }}
            >
              <h3
                className="text-xl font-semibold text-center text-white"
                style={{
                  fontFamily: "Roboto, sans-serif",
                  letterSpacing: "0.05em",
                  textShadow:
                    "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                }}
              >
                Search Results:
              </h3>
            </div>
            <div>
              <button
                onClick={onToggleView}
                className="mt-2 bg-blue-600 text-white px-4 py-0.5 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {/* {showResults ? "Go back to search filter" : "Show results"} */}
                Back
              </button>
            </div>
            <hr className="border border mt-4" />
            <div
              className="flex flex-col h-full "
              style={{ maxHeight: "295px", overflowY: "auto" }}
            >
              <div className="flex flex-wrap justify-between backdrop-blur-md items-start mb-8">
                {/* {results.map((user) => ( */}
                {displayResults.map((user: any) =>
                  user.profilePublic === true ? (
                    <div
                      key={user.username}
                      className="border-black p-4 m-2 rounded-lg cursor-pointer hover:shadow-lg"
                      onClick={() => openDetailedView(user)}
                    >
                      <div className="rounded-full mb-16 h-24 w-24 mx-auto mb-4 ">
                        <LazyLoadImage
                          //src={profPic}
                          src={user.imgUrl}
                          //src={optimizeImage(user.imgUrl)}
                          // alt="Profile"
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
                        {user.name}
                      </h3>
                    </div>
                  ) : user.profilePublic === false ? null : (
                    <div
                      key={user.username}
                      className="border-black p-4 m-2 rounded-lg cursor-pointer hover:shadow-lg"
                      onClick={() => openDetailedView(user)}
                    >
                      <div className="rounded-full mb-16 h-24 w-24 mx-auto mb-4 ">
                        <LazyLoadImage
                          //src={profPic}
                          src={user.imgUrl}
                          //src={optimizeImage(user.imgUrl)}
                          // alt="Profile"
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
                        {user.name}
                      </h3>
                    </div>
                  )
                )}
              </div>

              {selectedUser && (
                <div className="fixed top-0 left-0 w-full h-full bg-opacity-50 flex items-center justify-center z-50">
                  <div
                    className="golden bg-blue-400  border-4 border-gray-300 border-black bg-opacity-25 backdrop-blur-3xl p-6 rounded-lg shadow-lg"
                    style={{
                      maxHeight: "525px",
                      width: "469px",
                      overflowY: "auto",
                    }}
                    // ref={scrollContainerRef}
                  >
                    <div className="text-center mb-4">
                      <button
                        className="absolute top-4 left-4 ml-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={closeDetailedView}
                      >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                      </button>
                      <div className="rounded-full mb-4 h-24 w-24 mx-auto">
                        <LazyLoadImage
                          src={selectedUser.imgUrl}
                          //src={optimizeImage(selectedUser.imgUrl)}
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
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mt-4"
                        onClick={() =>
                          handleSendEmail(loggedInUserEmail, selectedUser.email)
                        }
                      >
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                        Request to Connect
                      </button>
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
                      className="text-xl font-semibold mb-4 mt-4 text-center text-white"
                      style={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: "20px",
                        letterSpacing: "0.05em",
                        textShadow:
                          "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      Recipe Collection:
                    </h2>
                    {selectedUser.collectionPublic === true ? (
                      <div
                        className="image-grid mt-8"
                        style={{ maxHeight: "725px", overflowY: "auto" }}
                      >
                        {(activeSearch === "redux"
                          ? selectedUser.savedRecipes
                          : selectedUser.savedRecipes
                        ).map((url: any, index: any) => (
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
                            {/* <div>
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
                            </div> */}
                            <div
                              style={{
                                // border: "3px solid #e0e0e0",
                                display: "inline-block",
                                borderRadius: "10px",
                                padding: "5px",
                                boxSizing: "border-box",
                              }}
                            >
                              <LazyLoadImage
                                //src={url.imgUrl}
                                src={optimizeImage(url.imgUrl)}
                                className="rounded-lg"
                              />
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
                        <div className="flex flex-col items-center">
                          <div className="rlame" />

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
                      </div>
                    ) : (
                      <div>
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
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(SearchResults);
