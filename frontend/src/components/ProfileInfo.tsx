// ProfileSetup.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import internal from "stream";
import Select from "react-select";
import { GroupBase, OptionProps } from "react-select";
import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import backgroundPic from "../assets/backgroundramsai.jpg";
import { readAndCompressImage } from "browser-image-resizer";

type CuisineOption = {
  value: string;
  label: string;
};

type DietOption = {
  value: string;
  label: string;
};

type MajorOption = {
  id: number;
  name: string;
};

interface FormData {
  username: string;
  email: string;
  password: string;
  name: string;
  biography: string;
  image: string;
  university: string;
  major: string;
  personality: string;
  dietPreference: string;
  favCuisines: string[];
}

interface University {
  name: string;
}

const USER_DETAILS = gql`
  fragment UserDetails on User {
    username
    email
  }
`;

const CREATE_PROFILE = gql`
  mutation CreateUserProfile($input: UserProfile) {
    #prevents the user from signing up if the profile's not fully finished
    addUserProfile(input: $input) {
      ...UserDetails
    }
  }
  ${USER_DETAILS}
`;

const ProfileInfo: React.FC = () => {
  const navigate = useNavigate();
  const [createProfile, newProfile] = useMutation(CREATE_PROFILE);

  //taking state userinput from signup page
  const location = useLocation();
  const input = location.state;
  console.log("stateUsername", input);

  const [formData, setFormData] = useState<FormData>({
    username: input["input"].username,
    email: input["input"].email,
    password: input["input"].password,
    name: "",
    biography: "",
    personality: "",
    dietPreference: "",
    image: "",
    university: "",
    major: "",
    favCuisines: [],
  });
  console.log("form data Username", formData.username);

  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

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

  // const dietOptions: DietOption[] = [
  //   { value: "vegetarian", label: "Vegetarian" },
  //   { value: "vegan", label: "Vegan" },
  //   { value: "pescatarian", label: "Pescatarian" },
  //   { value: "gluten-free", label: "Gluten-free" },
  //   { value: "dairy-free", label: "Dairy-free" },
  //   { value: "kosher", label: "Kosher" },
  //   { value: "halal", label: "Halal" },
  // ];

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

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      const config = {
        quality: 0.6,
        maxWidth: 200,
        maxHeight: 200,
        autoRotate: true,
        debug: true,
      };

       try {
      const optimizedImage = await readAndCompressImage(file, config);
      const imageUrl = URL.createObjectURL(optimizedImage);
      setFormData({ ...formData, image: imageUrl });
    } catch (error) {
      console.error("Error resizing image:", error);
    }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const {
        username,
        email,
        password,
        name,
        biography,
        personality,
        university,
        image,
        major,
        favCuisines,
        dietPreference,
      } = formData; //destructuring the data to be passed as a req in createUser
      //graphql req: input payload
      const input = {
        username, //this value has to be passed in from the signup flow to establish the relationship
        email,
        password,
        name,
        biography,
        personality,
        university,
        image,
        major,
        favCuisines,
        dietPreference,
        //createdAt,
      };

      const response = await createProfile({
        variables: { input }, //the input has to match the input schema type defined in backend
      });

      console.log("API response:", response.data);
      console.log("API response:", newProfile);

      // You can handle the response data here, e.g., show success message, redirect, etc.
    } catch (error) {
      console.error("API error:", error);
      // Handle the error, e.g., show error message, etc.
    }
    console.log("Form submitted:", formData);
    console.log("image", formData.image);
    console.log("Form submitted:", formData);
    navigate("/login");
  };

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

    fetchMajors();
    fetchUniversities();
  }, [0]);

  return (
    // <div className="bg-cover bg-black bg-center text-black-800 bg-fixed min-h-screen flex items-center justify-center">
    <div
      className="min-h-screen flex b items-center justify-center bg-center bg-cover"
      style={{
        backgroundImage: `url(${backgroundPic})`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-blue-500 backdrop-blur-sm bg-opacity-20 p-6 border-black border-2 rounded-lg shadow-lg w-full max-w-md mx-auto"
        style={{
          marginTop: "6rem", // Adjust this value according to the height of the navbar
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
        }}
      >
        <h2
          className="text-2xl font-semibold mb-2 text-center text-white"
          style={{
            fontFamily: "Roboto, sans-serif",
            letterSpacing: "0.05em",
            textShadow:
              "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
          }}
        >
          Survey:
        </h2>
        <hr className="border-1 border-black" />
        <div
          className="overflow-y-auto max-h-screen pt-5"
          style={{
            maxHeight: "calc(100vh - 10rem)",
          }}
        >
          <div className="mb-4 ">
            <label
              htmlFor="name"
              className="font-semibold mb-2 text-white"
              style={{
                fontFamily: "Roboto, sans-serif",
                letterSpacing: "0.05em",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Name:
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              required
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <br />
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
              Short Biography:
            </label>

            <div>
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded h-32"
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
              required
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
              Favorite Cuisines:
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
                placeholder="select upto 5 favorite cuisines"
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
                className="mt-1 p-1 w-full border border-gray-300 rounded"
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
                className="mt-1 p-1 w-full border border-gray-300 rounded"
                name="major"
                value={formData.major}
                onChange={handleChange}
              >
                <option value="">Select a major</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.name}>
                    {major.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <br />
          <div className=" mb-4">
            <label
              htmlFor="personality"
              className="font-semibold mb-2 text-white"
              style={{
                fontFamily: "Roboto, sans-serif",
                letterSpacing: "0.05em",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Personality:
            </label>

            <select
              className="mt-1 p-1 w-full border border-gray-300 rounded"
              name="personality"
              value={formData.personality}
              onChange={handleChange}
            >
              <option value=""></option>
              <option value="introvert">introvert</option>
              <option value="extrovert">extrovert</option>
              <option value="ambivert">ambivert</option>
            </select>
          </div>
          <br />
          <div className=" mb-4">
            <label
              htmlFor="diet"
              className="font-semibold mb-2 text-white"
              style={{
                fontFamily: "Roboto, sans-serif",
                letterSpacing: "0.05em",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Diet Preference:
            </label>

            <select
              className="mt-1 p-1 w-full border border-gray-300 rounded"
              name="dietPreference"
              value={formData.dietPreference}
              onChange={handleChange}
            >
              <option value=""></option>
              <option value="vegetarian">vegetarian</option>
              <option value="vegan">vegan</option>
              <option value="pescaterian">pescaterian</option>
              <option value="glutenfree">glutenfree</option>
              <option value="dairyfree">dairyfree</option>
              <option value="kosher">kosher</option>
              <option value="halal">halal</option>
            </select>
          </div>
          <br />
          <button
            type="submit"
            className="bg-gray-800 text-gray-100 px-4 py-2 rounded hover:bg-gray-700 font-semibold"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInfo;
