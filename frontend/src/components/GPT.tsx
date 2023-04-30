import React, { useState } from "react";
import axios from "axios";
import "./gpt.css";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { AiOutlineEye, AiOutlineAppstoreAdd } from "react-icons/ai";
//define the mutation query
import { AiOutlineDownload, AiOutlineSave } from "react-icons/ai";
import {
  AiOutlineFullscreen,
  AiOutlineFullscreenExit,
  AiOutlineExpand,
  AiOutlinePicture,
  AiOutlineDelete,
} from "react-icons/ai";
import { useEffect } from "react";
import {
  faArrowLeft,
  faMagic,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

//import AiOutlinePicture from "@ant-design/icons";

//get signedInUser prop
const USER_DETAILS = gql`
  fragment UserDetails on User {
    username
    name
    bio
    email
    collectionPublic
  }
`;

const RECIPE_DETAILS = gql`
  fragment RecipeDetails on SavedRecipe {
    imgUrl
    name
  }
`;

//make sure the mutation exists in the backend
const GENERATE_IMAGES = gql`
  mutation GenerateDesigns($input: GenerateDesigns) {
    createDesigns(input: $input)
  }
`;

const SAVE_IMAGE = gql`
  mutation SaveDesign($input: SaveDesign) {
    saveUserDesign(input: $input)
  }
`;

const DELETE_IMAGE = gql`
  mutation DeleteImage($input: DeleteDesign) {
    deleteDesign(input: $input)
  }
`;

const GET_RECIPES = gql`
  mutation GetRecipes($input: GetUserRecipes) {
    getUserRecipes(input: $input) {
      ...RecipeDetails
    }
  }
  ${RECIPE_DETAILS}
`;

const UPDATE_PRIVACY = gql`
  mutation ToggleUserPrivacy($input: CollectionPrivacy) {
    togglePrivacy(input: $input) {
      ...UserDetails
    }
  }
  ${USER_DETAILS}
`;

const GET_PRIVACY = gql`
  mutation GetUserPrivacy($privInput: CollectionPrivacy) {
    getUserPrivacy(input: $privInput)
  }
`;

interface DallEProps {
  //for the state function to be passed from the home page
  loggedInUser: any;
  fScreenState: any;
  fullScreenBool: any;
}
const DALLEImageView: React.FC<DallEProps> = ({
  loggedInUser,
  fScreenState,
  fullScreenBool,
}) => {
  // const [isFullscreen, setIsFullscreen] = useState(false);

  const [userPrompt, setUserPrompt] = useState("");
  const [imageURLs, setImageURLs] = useState([]);
  const [collectionURLs, setCollectionURLs] = useState<any>();
  const [searchLoading, setSearchLoading] = useState(false);
  const [generateImages, generatedImages] = useMutation(GENERATE_IMAGES);
  const [updateUserPrivacy, updatedUserPrivacy] = useMutation(UPDATE_PRIVACY);
  const [getUserPrivacy, userPrivacy] = useMutation(GET_PRIVACY);
  const [getRecipes, userRecipes] = useMutation(GET_RECIPES);
  const [saveImage, savedImage] = useMutation(SAVE_IMAGE);
  const [deleteImage, deletedImage] = useMutation(DELETE_IMAGE);
  const [isViewingCollection, setIsViewingCollection] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  console.log("collectionURLS: ", collectionURLs);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const input = {
      prompt: userPrompt,
    };
    setSearchLoading(true);

    const { data } = await generateImages({
      variables: { input },
    }); //execute the mutation react hook
    console.log("response generated images:", data);
    setSearchLoading(false);
    setImageURLs(data.createDesigns);
  };

  //refactor this to execute the mutation query to save the selected image in mongodb
  const handleSaveImage = async (url: any, usersPrompt: any) => {
    setSearchLoading(true);
    console.log("url of image being saved: ", url);
    const input = {
      username: loggedInUser,
      imgSrc: url,
      imgPrompt: usersPrompt,
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

  const handleDeleteImage = async (url: any) => {
    setSearchLoading(true);
    console.log("url of image being deleted: ", url);
    const input = {
      username: loggedInUser,
      imgSrc: url,
    };

    //this should be a mutation call to the backend to delete the image from user's collection
    const { data } = await deleteImage({
      variables: { input },
      context: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    }); //execute the mutation react hook
    console.log("response deleted image:", data);
    refetchCollection();
    setSearchLoading(false);
    //setImageURLs(data.createDesigns);
  };

  const handleLeftArrowClick = () => {
    setSearchLoading(false);
  };

  const refetchCollection = async () => {
    try {
      const input = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUser,
      };
      console.log("username rec view", input);
      //execute the mutation query to return a list of recommended users for the logged in user
      setSearchLoading(true);
      let collection = await getRecipes({
        variables: { input }, //the input has to match the input schema type defined in backend
      });
      console.log("design collections: ", collection);
      // setCollectionURLs(collection.data.getUserDesigns); //useState setter to set the returned recommendations
      const verifiedURLArr = await checkImage(collection.data.getUserDesigns);
      setCollectionURLs(verifiedURLArr);
      //setCollectionURLs(verifiedURLs);
      setSearchLoading(false);
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  //set the private profile toggle
  const [isImagesPublic, setIsImagesPublic] = useState<boolean | null>(null); //use the existing user's privacy state to set the toggle

  const handleToggle = async () => {
    setIsImagesPublic(!isImagesPublic);
    try {
      //this gets executed before the above state setter
      let inputFlagPriv = isImagesPublic;
      //the mutation resolver will find the user obj by the passed in username and then update the attributes along with it
      setSearchLoading(true);
      const input = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUser,
        collectionPublic: !isImagesPublic,
        privacyType: "images",
      };
      console.log("update profile mutation input:", input);
      //execute the mutation query to return a list of recommended users for the logged in user
      const updatedUserPrivacyRes = await updateUserPrivacy({
        variables: { input }, //the input has to match the input schema type defined in backend
      });
      // console.log("refreshed recommended list of users: ", recommendedUsers);
      console.log(
        "updated user privacy response for collection: ",
        updatedUserPrivacyRes.data
      );
      setSearchLoading(false);
      //setRecommendations(updatedUser.data.recommendUsers); //useState setter to set the returned recommendations
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const input = {
          //this variable has to match the defined parameter accepted by the resolver
          username: loggedInUser,
        };
        console.log("username rec view", input);
        //execute the mutation query to return a list of recommended users for the logged in user
        setSearchLoading(true);
        let collection = await getRecipes({
          variables: { input }, //the input has to match the input schema type defined in backend
        });
        console.log(
          "the value of collectionPublic for loggedInUser gpt ",
          collection.data.getUserDesigns
        );

        //setting the initial privacy state to the one stored in the db

        const verifiedURLArr = await checkImage(collection.data.getUserRecipes);
        setCollectionURLs(verifiedURLArr);
        setSearchLoading(false);
      } catch (error) {
        console.error("Error fetching recommended users:", error);
      }
    };

    const fetchUserPrivacy = async () => {
      setIsLoading(true);

      const privInput = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUser,
        privacyType: "images",
      };
      let priv = await getUserPrivacy({
        variables: { privInput }, //the input has to match the input schema type defined in backend
      });
      // console.log(
      //   "the value of collectionPublic privacy value for loggedInUser gpt ",
      //   priv.data.getUserPrivacy
      // );
      console.log(
        "the type and value of collectionPublic privacy value for loggedInUser gpt:",
        typeof priv.data.getUserPrivacy,
        priv.data.getUserPrivacy
      );

      setIsImagesPublic(priv.data.getUserPrivacy);
      setIsLoading(false);
      //console.log("is images public value:", isImagesPublic);

      // console.log("is images public value:", isImagesPublic);
    };
    fetchCollection();
    fetchUserPrivacy();
  }, []);

  useEffect(() => {
    console.log("is images public value:", isImagesPublic);
  }, [isImagesPublic]);

  const downloadImage = (url: any) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = "generated-image.jpg";
    link.click();
  };

  const checkImage = async (urls: any) => {
    const urlPromises = urls.map(
      (url: any) =>
        new Promise((resolve) => {
          const img = new Image();
          img.src = url.imgUrl;
          img.onload = () => {
            resolve(url);
            //resolve(url.imgPrompt);
          };
          img.onerror = () => {
            console.error("Invalid image URL:", url);
            resolve(null);
          };
        })
    );

    const verifiedUrls = await Promise.all(urlPromises);
    return verifiedUrls.filter((url) => url !== null);
  };

  async function openWithSquoosh(url: any, filename: any) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = "generated-image.jpg";
    link.click();
    const squooshUrl = `https://squoosh.app/?src=${encodeURIComponent(url)}`;
    window.open(squooshUrl, "_blank");
  }

  return (
    //comment the following code
    <div
      // className="dalle-image-view "
      className="dalle-image-view overflow-y-auto"
      style={{
        maxHeight: fullScreenBool ? "545px" : "745px",
        overflowY: "auto",
        //  overflowX: "auto",
      }}
    >
      <div
        className="fullscreen-icon-container mr-6"
        style={{ position: "absolute", top: "10px", right: "10px" }}
      >
        {fullScreenBool ? (
          <AiOutlineFullscreenExit
            size={28}
            onClick={() => fScreenState(false)}
            style={{ cursor: "pointer" }}
            className="text-white"
          />
        ) : (
          <AiOutlineFullscreen
            size={28}
            onClick={() => fScreenState(true)}
            style={{ cursor: "pointer" }}
            className="text-white"
          />
        )}
      </div>

      {searchLoading ? (
        <div
          className="flex justify-center items-center"
          style={{
            height: "135px",
            // overflowY: "auto",
          }}
        >
          <button
            className="absolute top-0 left-0 m-4"
            onClick={handleLeftArrowClick}
            style={{ color: "white" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="glame"></div>
        </div>
      ) : isViewingCollection ? (
        <>
          <div className="flex flex-col h-full items-center">
            <p
              className="text font-semibold mb-4 text-center text-white opacity-80"
              style={{
                fontFamily: "Roboto, sans-serif",
                letterSpacing: "0.05em",
                fontSize: "20px",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Your Recipe Collection
            </p>
            <hr className="border-t border-white w-1/2 mb-2" />
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="flex items-center mt-1 mb-2">
                <label
                  htmlFor="toggleCollection"
                  className="flex items-center cursor-pointer"
                >
                  <div className="relative">
                    <div>
                      <span className="text-white mr-2">Make Private?</span>

                      <input
                        type="checkbox"
                        id="toggleCollection"
                        className="cursor-pointer"
                        checked={!isImagesPublic || false}
                        onChange={handleToggle}
                      />
                      <div>
                        <label
                          htmlFor="toggleCollection"
                          className="cursor-pointer text-white"
                          style={{ fontSize: "13px" }}
                        >
                          current status:{" "}
                          {isImagesPublic ? "Public" : "Private"}
                        </label>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            )}
            <hr className="border-t border-white w-1/2 mt-1 mb-4" />
          </div>
          <button
            onClick={() => {
              setIsViewingCollection(!isViewingCollection);
            }}
            className=" opacity-60 view-collection-button"
            style={{
              backgroundColor: "blue",
              color: "white",
              border: "none",
              padding: "2px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isViewingCollection ? (
              "Create"
            ) : (
              <>
                <AiOutlineEye />
                {/* <span style={{ marginLeft: "8px" }}>View Collection</span> */}
              </>
            )}
          </button>
          <div
            className="image-grid mt-10"
            style={{
              maxHeight: "720px",
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            {/* Render your collection view here */}
            <div className="image-grid mt-2">
              {collectionURLs.map((url: any, index: any) => (
                <div
                  style={{
                    border: "2px solid #e0e0e0",
                    display: "inline-block",
                    borderRadius: "15px",
                    padding: "5px",
                    boxSizing: "border-box",
                    marginBottom: "10px",
                    textAlign: "center", // Add this for center alignment
                  }}
                >
                  <div key={index} className="images-container relative">
                    <AiOutlineDelete
                      className="save-icon absolute"
                      size={34}
                      onClick={() => handleDeleteImage(url.imgUrl)}
                      style={{
                        top: "10px",
                        left: "57%",
                        transform: "translateX(-90%)",
                        cursor: "pointer",
                      }}
                      title={"Save to collection"}
                    />
                    <AiOutlinePicture
                      className="squoosh-icon absolute "
                      size={34}
                      onClick={() =>
                        openWithSquoosh(url.imgUrl, "squoosh-dalle.png")
                      }
                      style={{
                        top: "10px",
                        left: "50%",
                        transform: "translateX(-90%)",
                        cursor: "pointer",
                      }}
                      title={"Open with squoosh"}
                    />
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
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <p
              className="text font-semibold mb-8 text-center text-white opacity-70"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "20px",
                // width: "369px",
                letterSpacing: "0.05em",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              {isViewingCollection
                ? "View Collection"
                : "Visualize Your Fusion Recipe:"}
            </p>
            <div>
              <button
                onClick={() => {
                  refetchCollection();
                  setIsViewingCollection(!isViewingCollection);
                }}
                className="opacity-60 view-collection-button  mb-2"
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {isViewingCollection ? (
                  "Create"
                ) : (
                  <>
                    <div className="">
                      <AiOutlineEye />
                    </div>
                    {/* <span style={{ marginLeft: "8px" }}>View Collection</span> */}
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              id="prompt-input"
              //className="form-input mb-4 mt-6 opacity-70 "
              className="form-input mb-4 mt-6 opacity-70 w-4/5 mx-auto"
              placeholder="input the name of dish created by Ramsai"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{ width: "70%", marginLeft: "auto", marginRight: "auto" }}
            />
          </div>
          <button
            onClick={handleSubmit}
            //className="opacity-61 submit-button mt-1 bg-blue-600"
            className="opacity-61 submit-button mt-1 bg-blue-600 w-1/3 mx-auto"

            // style={{ width: "30%", marginLeft: "auto", marginRight: "auto" }}
          >
            Cook
          </button>

          <div className="image-grid mt-20">
            {imageURLs.map((url, index) => (
              <>
                <div key={index} className="images-container relative">
                  <div>
                    <AiOutlineSave
                      className="save-icon absolute"
                      size={34}
                      onClick={() => handleSaveImage(url, userPrompt)}
                      style={{ top: "10px", left: "10px", cursor: "pointer" }}
                      title={"Save to collection"}
                    />
                    <AiOutlinePicture
                      className="squoosh-icon absolute "
                      size={34}
                      onClick={() => openWithSquoosh(url, "squoosh-dalle.png")}
                      style={{
                        top: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        cursor: "pointer",
                      }}
                      title={"Open with squoosh"}
                    />
                    <AiOutlineExpand
                      className="download-icon"
                      size={34}
                      onClick={() => downloadImage(url)}
                      title={"Open in new tab"}
                    />
                  </div>
                  <div
                    style={{
                      border: "3px solid #e0e0e0",
                      display: "inline-block",
                      borderRadius: "10px",
                      padding: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={url}
                      // alt="Generated Room"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DALLEImageView;
