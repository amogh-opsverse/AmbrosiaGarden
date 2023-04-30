import React, { useEffect, useState, ChangeEvent } from "react";
import gql from "graphql-tag";
import { readAndCompressImage } from "browser-image-resizer";
import { useMutation } from "@apollo/react-hooks";
import Select from "react-select";
import "../styles/pulse.css";
import "./searchfilter.css";

//define types:
type CuisineOption = {
  value: string;
  label: string;
};

type MajorOption = {
  id: number;
  name: string;
};

// Assuming that each user has an id, name, and other attributes
interface User {
  username: string;
  name: string;
  email: string;
  bio: string;
}

interface RecommendationsResultsProps {
  //results: User[];
  loggedInUser: any;
}

//define mutation query to update the profile
const USER_DETAILS = gql`
  fragment UserDetails on User {
    username
    name
    bio
    email
  }
`;

//make sure the mutation exists in the backend
const UPDATE_USER = gql`
  mutation EditUserProfile($input: UserEditProfile) {
    editUserProfile(input: $input) {
      ...UserDetails
    }
  }
  ${USER_DETAILS}
`;

//mutation to update privacy settings
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

interface FormData {
  username: string;
  email: string;
  biography: string;
  image: string;
  university: string;
  major: string;
  favCuisines: string[];
}

interface University {
  name: string;
}

//displays the logged in users profile info and handles edit feature functionality ()
//when the user edits their profile, the edit profile resolver is called which takes the newly
//updated user, executes the recommender (with the updated user obj and its attrs) to update the
//the recommendations document in mongodb with the newly recommended list of users under the same username (find and update)
const ProfileView: React.FC<RecommendationsResultsProps> = ({
  loggedInUser,
}) => {
  const [updateUser, updatedUser] = useMutation(UPDATE_USER);
  const [updateUserPrivacy, updatedUserPrivacy] = useMutation(UPDATE_PRIVACY);
  const [getUserPrivacy, userPrivacy] = useMutation(GET_PRIVACY);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      width: 300, // Set the fixed width for the control
      color: "black",
    }),
    menu: (provided: any) => ({
      ...provided,
      width: 300, // Set the fixed width for the menu
    }),
    option: (provided: any) => ({
      ...provided,
      color: "black",
    }),
  };

  //const [recommendations, setRecommendations] = useState<User[] | any>([]);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const loggedInUsername = loggedInUser["data"]["userLogin"].username;
  const [isLoading, setIsLoading] = useState(true);

  //set the private profile toggle
  let [isPublic, setIsPublic] = useState(false);

  //handles toggle for private profile
  //sets the mode to public since the default is private (and vice versa)
  const handleToggle = async () => {
    setIsPublic(!isPublic); //default is false

    try {
      //the mutation resolver will find the user obj by the passed in username and then update the attributes along with it
      setSearchLoading(true);
      const input = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUsername,
        profilePublic: !isPublic,
        privacyType: "profile",
      };
      console.log("username rec view", input);
      //execute the mutation query to return a list of recommended users for the logged in user
      let updatedUserPrivacyRes = await updateUserPrivacy({
        variables: { input }, //the input has to match the input schema type defined in backend
      });
      // console.log("refreshed recommended list of users: ", recommendedUsers);
      console.log(
        "updated user privacy response: ",
        updatedUserPrivacyRes.data
      );
      setSearchLoading(false);
      //setRecommendations(updatedUser.data.recommendUsers); //useState setter to set the returned recommendations
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    username: loggedInUser["data"]["userLogin"].username,
    email: loggedInUser["data"]["userLogin"].email,
    biography: loggedInUser["data"]["userLogin"].bio,
    image: loggedInUser["data"]["userLogin"].imgUrl,
    university: loggedInUser["data"]["userLogin"].university,
    major: loggedInUser["data"]["userLogin"].major,
    favCuisines: loggedInUser["data"]["userLogin"].favCuisines,
  });

  const cuisineOptions: CuisineOption[] = [
    { value: "italian", label: "Italian" },
    { value: "indian", label: "Indian" },
    { value: "german", label: "German" },
    { value: "chinese", label: "Chinese" },
    { value: "greek", label: "Greek" },
    { value: "ethiopian", label: "Ethiopian" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "malaysian", label: "Malaysian" },
    { value: "vietnamese", label: "Vietnamese" },
    { value: "british", label: "British" },
    { value: "french", label: "French" },
    { value: "russian", label: "Russian" },
    { value: "cuban", label: "Cuban" },
    { value: "persian", label: "Persian" },
    { value: "israeli", label: "Israeli" },
    { value: "turkish", label: "Turkish" },
  ];
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null); //use the existing user's privacy state to set the toggle

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch(
          "https://fivethirtyeight.datasettes.com/fivethirtyeight.json?sql=select++Major+as+name%2C+rowid+as+id+from+%5Bcollege-majors%2Fmajors-list%5D+order+by+Major+limit+200"
        );
        const data = await response.json();
        setMajors(data.rows);
      } catch (error) {
        console.error("Error fetching majors:", error);
      }
    };

    const fetchUniversities = async () => {
      try {
        const response = await fetch(
          "https://parseapi.back4app.com/classes/University?limit=3002&order=name",
          {
            headers: {
              "X-Parse-Application-Id":
                "Ipq7xXxHYGxtAtrDgCvG0hrzriHKdOsnnapEgcbe", // This is the fake app's application id
              "X-Parse-Master-Key": "HNodr26mkits5ibQx2rIi0GR9pVCwOSEAkqJjgVp", // This is the fake app's readonly master key
            },
          }
        );
        const universities = await response.json();
        console.log(universities);
        setUniversities(universities.results);
      } catch (error) {
        console.error("Error fetching universities:", error);
      }
    };
    const fetchUserPrivacy = async () => {
      setIsLoading(true);

      const privInput = {
        //this variable has to match the defined parameter accepted by the resolver
        username: loggedInUsername,
        privacyType: "profile",
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

      setIsPublic(priv.data.getUserPrivacy);
      setIsLoading(false);

      // console.log("is images public value:", isImagesPublic);
    };

    fetchMajors();
    fetchUniversities();
    fetchUserPrivacy();
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      const config = {
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        autoRotate: true,
        debug: true,
      };

      try {
        const optimizedImage = await readAndCompressImage(file, config);
        const reader = new FileReader();
        reader.readAsDataURL(optimizedImage);
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setFormData({ ...formData, image: reader.result });
          } else {
            throw new Error("Error uploading image");
          }
        };
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    }
  };

  //edit the logged in user :
  const editProfile = async () => {
    console.log("profile being edited", loggedInUser);
    try {
      //the mutation resolver will find the user obj by the passed in username and then update the attributes along with it
      setSearchLoading(true);
      const input = {
        //this variable has to match the defined parameter accepted by the resolver
        username: formData.username,
        email: formData.email,
        biography: formData.biography,
        image: formData.image,
        university: formData.university,
        major: formData.major,
        favCuisines: formData.favCuisines,
      };
      console.log("username rec view", input);
      //execute the mutation query to return a list of recommended users for the logged in user
      let updatedUser = await updateUser({
        variables: { input }, //the input has to match the input schema type defined in backend
      });
      // console.log("refreshed recommended list of users: ", recommendedUsers);
      console.log("updated user profile: ", updatedUser.data.recommendUsers);
      setSearchLoading(false);
      //setRecommendations(updatedUser.data.recommendUsers); //useState setter to set the returned recommendations
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    console.log("name:", name, " ", "and value", value);
    console.log("form data", formData);
    setFormData({ ...formData, [name]: value });
  };

  const handleCuisinesChange = (selectedOptions: any) => {
    if (selectedOptions.length > 3) {
      // If more than 3 options are selected, show a message or handle the situation as needed
      alert("You can only select up to 5 cuisines.");
      console.log("cuisines", formData.favCuisines);
      return;
    } else {
      const selectedCuisines = selectedOptions.map(
        (option: any) => option.value
      );
      setFormData({ ...formData, favCuisines: selectedCuisines });
      console.log("cuisines", formData.favCuisines);
    }
  };

  return (
    //replace this with the profile info page view with a button that updates the user info

    <div className="flex flex-col h-full items-center">
      <div className="justify-between items-center ">
        <h3
          className="text-xl font-semibold text-center text-white"
          style={{
            fontFamily: "Roboto, sans-serif",
            letterSpacing: "0.05em",
            textShadow:
              "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
          }}
        >
          Your Profile
        </h3>
        <hr className="border-t border-white w-full mt-4  mb-2" />
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
                    checked={!isPublic || false}
                    onChange={handleToggle}
                  />
                  <div>
                    <label
                      htmlFor="toggleCollection"
                      className="cursor-pointer text-white"
                      style={{ fontSize: "13px" }}
                    >
                      current status: {isPublic ? "Public" : "Private"}
                    </label>
                  </div>
                </div>
              </div>
            </label>
          </div>
        )}
        <hr className="border-t border-white w-full mt-4 " />{" "}
      </div>

      <div>
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
        ) : (
          <div
            className="flex flex-col h-full"
            style={{ maxHeight: "280px", overflowY: "auto" }}
          >
            <div
              className="overflow-y-auto max-h-screen pt-10"
              style={{
                // marginTop: "2rem", // Adjust this value according to the height of the navbar
                maxHeight: "calc(100vh - 10rem)",
                // scrollbarWidth: "thin",
                // scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
              }}
            >
              <div className="mb-4">
                <label
                  htmlFor="bio"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Bio:
                </label>

                <div>
                  <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded h-32"
                    style={{ backgroundColor: "rgba(240, 240, 240, 0.8)" }}
                  />
                </div>
              </div>

              <br />
              <div className="mb-4">
                <label
                  htmlFor="ppic"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Profile Image:
                </label>

                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="mt-1 p-1 w-full border border-gray-300 rounded"
                />
              </div>
              <br />
              <div className="mb-4">
                <label
                  htmlFor="hobbies"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Fav Cuisines:
                </label>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Select<CuisineOption, true>
                    options={cuisineOptions}
                    isMulti
                    onChange={handleCuisinesChange}
                    placeholder="select upto 3 hobbies"
                    maxMenuHeight={formData.favCuisines.length < 3 ? 300 : 0} // Set maxMenuHeight to 0 to disable scrolling when 3 hobbies are selected
                    value={cuisineOptions.filter((option) =>
                      formData.favCuisines.includes(option.value)
                    )}
                    styles={customStyles}
                  />
                </div>
              </div>
              <br />
              <div className="select-container mb-4">
                <label
                  htmlFor="university"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  University:
                </label>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <select
                    className="filter-select mb-2 transparent-dropdown"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                  >
                    <option value="">Select a university</option>
                    {universities.map((university, index) => (
                      <option key={index} value={university.name}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <br />
              <div className=" mb-4">
                <label
                  htmlFor="major"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Major:
                </label>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <select
                    className="filter-select mb-2 transparent-dropdown"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                  >
                    <option value=""></option>
                    {majors.map((major) => (
                      <option key={major.id} value={major.name}>
                        {major.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <br />

              <button
                onClick={editProfile}
                className="bg-blue-800 text-gray-100 px-4 py-2 rounded hover:bg-gray-700 font-semibold"
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
