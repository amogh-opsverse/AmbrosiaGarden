declare global {
  interface Window {
    voiceflow: {
      chat: {
        load: (options: {
          verify: { projectID: string };
          url: string;
          versionID: string;
        }) => void;
      };
    };
  }
}

import { useState, useEffect, useRef } from "react";
import SearchFilter from "./SearchFilter";
import { useLocation } from "react-router-dom";
import ProfileView from "./ProfileView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from "react-redux";
import { setActiveSearch } from "../redux/actions/searchActions";

import {
  faEdit,
  faLightbulb,
  faSun,
  faMoon,
  faImages,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/pulse.css";
import "./background.css";
import "./powerup.css";
import "./home.css";
import lightBackgroundPicOutdoor from "../assets/ambrosialight.jpg";
import darkBackgroundPicOutdoor from "../assets/ambrosiadark.jpeg";
import SearchResults from "./SearchResults";
import Recommendations from "./Recommendations";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import DALLEImageView from "./GPT";
import { useSelector } from "react-redux";

interface User {
  username: string;
  name: string;
  email: string;
  personality: string;
  major: string;
  university: string;
  bio: string;
  imgUrl: string;
  savedRecipes: [string];
  collectionPublic: boolean;
  profilePublic: boolean;
}

const IMAGE_DETAILS = gql`
  fragment ImageDetails on SavedImage {
    imgUrl
    prompt
  }
`;
//gql mutation query for the list of users based on the search query
//update this to include other
const USER_DETAILS = gql`
  fragment UserDetails on User {
    username
    name
    bio
    email
    imgUrl
    savedRecipes {
      imgUrl
      recipe
    }
    personality
    major
    university
    collectionPublic
    profilePublic
  }
`;

//make sure the mutation exists in the backend
const SEARCH_USERS = gql`
  mutation SearchUserProfile($input: UserSearch) {
    searchUsers(input: $input) {
      ...UserDetails
    }
  }
  ${USER_DETAILS}
`;

const Home = () => {
  const [visible, setVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    // Set the component to visible after a delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 5000); // Adjust the delay as needed

    // Clean up the timer when the component is unmounted
    return () => clearTimeout(timer);
  }, []);

  // useEffect(() => {
  //   setShowChatbot(true);
  //   return () => {
  //     setShowChatbot(false);
  //   };
  // }, []);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundSelection, setBackgroundSelection] = useState("outdoor");


  // Define your background images for each category and mode
  // const indoorBackgrounds = {
  //   light: lightBackgroundPicIndoor,
  //   dark: darkBackgroundPicIndoor,
  // };

  const outdoorBackgrounds = {
    light: lightBackgroundPicOutdoor,
    dark: darkBackgroundPicOutdoor,
  };

  const getSelectedBackground = () => {
    const backgrounds = outdoorBackgrounds;
    return isDarkMode ? backgrounds.dark : backgrounds.light;
  };
  const [searchAttributes, setSearchAttributes] = useState<any>({});
  const [searchresults, setResults] = useState<User[]>([]); //the results are being passed to the SearchResults component as a prop
  const [collapsedSearch, setCollapsedSearch] = useState(true); //default state is hidden to be conditionally changed when buttons are clicked
  const [collapsedEdit, setCollapsedEdit] = useState(true);
  const [collapsedRecs, setCollapsedRecs] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [searchUsers, searchedUsers] = useMutation(SEARCH_USERS);
  const [collapsedImage, setCollapsedImage] = useState(true);

  const location = useLocation();
  const { signedUser } = location.state;

  const imgUrl = signedUser["data"]["userLogin"].imgUrl; //the profile pic of the logged in user
  const university = signedUser["data"]["userLogin"].university;
  const username = signedUser["data"]["userLogin"].username;
  const email = signedUser["data"]["userLogin"].email;

  let chatbotStatus = useSelector((state: any) => state.searchResults.chatbot);
  //const logg
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;

    script.onload = function () {
      window.voiceflow.chat.load({
        verify: { projectID: "644ac896a04f80000732784f" },
        url: "https://general-runtime.voiceflow.com",
        versionID: "production",
      });
    };

    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
    if (chatbotStatus === "active") document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    // return () => {
    //   document.body.removeChild(script);
    // };
  }, [chatbotStatus]);

  const handleSearchAttributesChange = async (attributes: any) => {
    setSearchLoading(true);
    setSearchAttributes(attributes); //this will be set from the search filter react component

    let searchUniversity = "";
    //destructure the attributes object
    const { Guests, Personality, Pets, SleepTime, University } = attributes;
    //if university is selected (true) set the university field to match the logged in user's university
    if (University) {
      searchUniversity = university;
    } else {
      searchUniversity = "";
    }

    console.log("Guests search response:", typeof Guests);
    //making sure the input keys match the input fields defined in the schema
    const input = {
      user: username,
      university: searchUniversity,
      pets: Pets,
      sleepTime: SleepTime,
      personality: Personality,
    };

    let searchedUsers1 = await searchUsers({
      variables: { input }, //the input has to match the input schema type defined in backend
    });

    // signedUserData = signedUser["userLogin"]
    console.log("API response for search results:", searchedUsers1.data);
    setSearchLoading(false);

    let searchResults = searchedUsers1.data.searchUsers.map((user: any) => ({
      username: user.username, // Replace 'id' with the appropriate property from the user object
      name: user.name, // Replace 'name' with the appropriate property from the user object
      email: user.email, // Replace 'email' with the appropriate property from the user object
      bio: user.bio, // Replace 'attributes' with the appropriate property from the user object
      imgUrl: user.imgUrl,
      collection: user.savedImages,
      personality: user.personality,
      gender: user.gender,
      major: user.major,
      university: user.university,
      collectionPublic: user.collectionPublic,
      profilePublic: user.profilePublic,
    }));
    console.log("searchResults structure", searchResults);
    //call the api to get the list of searched users

    setResults(searchResults);
  };
  const activeSearch = useSelector(
    (state: any) => state.searchResults.activeSearch
  );

  //the following useEffect is used to listen to changes on the navbar search state and render the search result tab

  useEffect(() => {
    console.log("handle toggle view called", activeSearch);

    //setCollapsedSearch(!collapsedSearch); //and set the

    if (activeSearch === "redux") {
      if (!collapsedRecs) {
        setCollapsedRecs(!collapsedRecs); //setting rec view hidden to true
      }
      if (!collapsedImage) {
        setCollapsedImage(!collapsedImage);
      }
      if (!collapsedEdit) {
        setCollapsedEdit(!collapsedEdit);
      }
      if (collapsedSearch) {
        setCollapsedSearch(!collapsedSearch); //setting search view hidden to false
      }
      //setShowResults(!showResults);
      if (showResults === false) {
        setShowResults(!showResults);
      }
      console.log("show results value", showResults);
    } else if (activeSearch === "local") {
      //state will be set to local when the search button is clicked from the search filter component

      if (showResults === false) {
        setShowResults(!showResults);
      }
      console.log("show results value", showResults);
    }
  }, [activeSearch]);

  const dispatch = useDispatch(); //redux dispatch

  const handleToggleViewBack = () => {
    //accessed by the searchFilter component
    console.log("activeSearch from Home.tsx", activeSearch);

    dispatch(setActiveSearch("other"));
    setShowResults(!showResults);
  };

  const handleToggleViewSearch = () => {
    //accessed by the searchFilter component
    console.log("activeSearch from Home.tsx", activeSearch);

    // if (activeSearch === "redux") {
    //dispatch(setActiveSearch("local"));
    //dispatch(setActiveSearch("other"));
    setShowResults(!showResults);
  };

  return (
    <div className="transition-wrapper">
      {!visible && <div className="transition-background-entry"></div>}
      <div className={`transition-content ${visible ? "visible" : ""}`}>
        <div
          className={`mx-auto px-4 py-6 min-h-screen bg-white ${
            isDarkMode ? "bg-dark" : "bg-light"
          } bg-transition`}
          style={{
            backgroundImage: `url(${getSelectedBackground()})`,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div className=" p-4 ">
            <div
              className={` relative w-full backdrop-blur-md rounded-lg mx-auto mt-16 mb-4 bg-blue-400 bg-opacity-25 flex flex-col items-center justify-around border border-black ${
                isDarkMode ? "golden" : ""
              }`}
              style={{ maxWidth: "55%", maxHeight: "400px" }}
            >
              <div
                className="text-center relative mb-5"
                style={{
                  marginTop: "4rem", // Adjust this value according to the height of the navbar
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
                }}
              >
                <div className="rounded-full mb-16 h-24 w-24 mx-auto mb-2 glow-blue glow-white">
                  <img
                    //src={profPic}
                    src={imgUrl}
                    alt=""
                    className="rounded-full h-full w-full object-cover pulse"
                  />
                  <div
                    className="absolute bottom-0 right-0 text-blue-800 p-1 rounded-full"
                    style={{ transform: "translate(10%, 10%)" }}
                  >
                    <button
                      className="bg-blue-600 opacity-75 text-white px-4 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => {
                        dispatch(setActiveSearch("other"));
                        if (!collapsedRecs) {
                          setCollapsedRecs(!collapsedRecs);
                        }
                        if (!collapsedImage) {
                          setCollapsedImage(!collapsedImage);
                        }
                        if (!collapsedSearch) {
                          setCollapsedSearch(!collapsedSearch);
                        }
                        setCollapsedEdit(!collapsedEdit);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                </div>
              </div>
              <h2
                className="text-2xl font-semibold mb-4 text-center text-white mb-10"
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "25px",
                  letterSpacing: "0.05em",
                  textShadow:
                    "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                }}
              >
                hi, {username}
              </h2>
              <div className="flex justify-center space-x-2 mb-4">
                <div className="p-4">
                  <button
                    className="bg-blue-600 backdrop-blur-md opacity-75 text-white px-4 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => {
                      dispatch(setActiveSearch("other"));
                      if (!collapsedRecs) {
                        setCollapsedRecs(!collapsedRecs); //setting rec view hidden to true
                      }
                      if (!collapsedImage) {
                        setCollapsedImage(!collapsedImage);
                      }
                      if (!collapsedEdit) {
                        setCollapsedEdit(!collapsedEdit);
                      }
                      setCollapsedSearch(!collapsedSearch); //and set the
                    }}
                    title={
                      collapsedSearch ? "Search Roommates" : "Collapse Search"
                    }
                  >
                    <FontAwesomeIcon icon={faFilter} />
                  </button>

                  <div className="flex flex-col items-center">
                    <label className="text-xs text-white mt-2">Search</label>
                  </div>
                </div>

                <div className="p-4">
                  <button
                    className="bg-blue-600 opacity-75 text-white rounded-full px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => {
                      dispatch(setActiveSearch("other"));

                      if (!collapsedSearch) {
                        setCollapsedSearch(!collapsedSearch);
                      }
                      if (!collapsedImage) {
                        setCollapsedImage(!collapsedImage);
                      }
                      if (!collapsedEdit) {
                        setCollapsedEdit(!collapsedEdit);
                      }
                      setCollapsedRecs(!collapsedRecs);
                    }}
                    title={
                      collapsedRecs
                        ? "Recommended Roommates"
                        : "Collapse Recommendations"
                    }
                  >
                    <FontAwesomeIcon icon={faLightbulb} />
                  </button>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-white mt-2">
                      Recommendations
                    </label>
                  </div>
                </div>
                <div className="p-4">
                  <button
                    className="bg-blue-600 text-white opacity-75 px-4 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => {
                      dispatch(setActiveSearch("other"));
                      if (!collapsedRecs) {
                        setCollapsedRecs(!collapsedRecs);
                      }
                      if (!collapsedSearch) {
                        setCollapsedSearch(!collapsedSearch);
                      }
                      if (!collapsedEdit) {
                        setCollapsedEdit(!collapsedEdit);
                      }
                      setCollapsedImage(!collapsedImage);
                    }}
                    title={
                      collapsedImage
                        ? "Show Design Generator"
                        : "Collapse Generator"
                    }
                  >
                    <FontAwesomeIcon icon={faImages} />
                  </button>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-white mt-2">Cookbook</label>
                  </div>
                </div>

                <div className="p-4">
                  <button
                    className={`dark-mode-button p-2 rounded-full text-white bg-gray-600 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors ${
                      isDarkMode ? "text-white-500" : "text-white-500"
                    }`}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    title={
                      isDarkMode
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                    }
                  >
                    {isDarkMode ? (
                      <FontAwesomeIcon icon={faSun} />
                    ) : (
                      <FontAwesomeIcon icon={faMoon} />
                    )}
                  </button>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-white mt-2">
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative w-full mx-auto"
              style={{
                maxWidth: "55%",

                // overflowY: "auto",
              }}
            >
              <div
                className={`absolute z-10 border border-black w-full bg-blue-500 bg-opacity-25 p-6 rounded-lg shadow-lg transition-all duration-300  ${
                  collapsedSearch ? "hidden" : "block"
                } ${isDarkMode ? "golden" : ""}`}
              >
                {searchLoading ? (
                  <div
                    className="flex justify-center  items-center"
                    style={{
                      height: "135px",

                      // overflowY: "auto",
                    }}
                  >
                    <div className="clame"></div>
                  </div>
                ) : showResults ? (
                  <SearchResults
                    loggedInUserName={username}
                    loggedInUserEmail={email}
                    results={searchresults}
                    onToggleView={handleToggleViewBack}
                  />
                ) : (
                  <SearchFilter
                    onSearchAttributesChange={handleSearchAttributesChange}
                    onToggleView={handleToggleViewSearch}
                    signedInUser={signedUser}
                  />
                )}
              </div>
              <div
                className={`absolute z-10 border border-black w-full bg-blue-500  bg-opacity-25 p-6 rounded-lg shadow-lg transition-all duration-300  ${
                  collapsedRecs ? "hidden" : "block"
                } ${isDarkMode ? "golden" : ""}`}
              >
                <Recommendations
                  loggedInUser={username}
                  onToggleView={handleToggleViewBack}
                />
              </div>
              <div
                className={`absolute z-10 border backdrop-blur-sm border-black w-full bg-blue-500 bg-opacity-25 p-6 rounded-lg shadow-lg transition-all duration-300  ${
                  collapsedEdit ? "hidden" : "block"
                } ${isDarkMode ? "golden" : ""}`}
              >
                <ProfileView
                  loggedInUser={signedUser}
                  //onToggleView={handleToggleView}
                />
              </div>

              <div
                className={`image-container ${
                  isFullscreen ? "fullscreen" : ""
                }`}
              >
                <div
                  className={`absolute z-10 border backdrop-blur-md border-black w-full bg-blue-500 bg-opacity-25 p-6 rounded-lg shadow-lg transition-all duration-300 ${
                    collapsedImage ? "hidden" : "block"
                  } ${isDarkMode ? "golden" : ""} ${
                    isFullscreen ? "high-opacity" : ""
                  } max-w-md mx-auto`}
                  style={{
                    maxWidth: isFullscreen ? "95%" : "750px",
                    width: "750px",
                    height: isFullscreen ? "75%" : "850px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <DALLEImageView
                    loggedInUser={username}
                    fScreenState={setIsFullscreen}
                    fullScreenBool={isFullscreen}
                  /> 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
