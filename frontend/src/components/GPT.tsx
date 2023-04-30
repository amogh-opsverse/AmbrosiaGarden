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
    // fetchUserPrivacy();
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
    <>
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
              <AiOutlinePicture
                className="squoosh-icon absolute "
                size={34}
                onClick={() => openWithSquoosh(url.imgUrl, "squoosh-dalle.png")}
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
    </>
  );
};

export default DALLEImageView;
