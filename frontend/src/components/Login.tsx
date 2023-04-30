import React, { useState } from "react";
//import "../styles/tailwind.css";
import "./login.css";
import { FiX } from "react-icons/fi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faLightbulb,
  faSearch,
  faSignIn,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
//import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import axios from "axios";
import { useQuery, useMutation } from "@apollo/react-hooks";
import Loader from "../components/Loader";
import { Link, useNavigate } from "react-router-dom";
import backgroundPic from "../assets/backgroundramsai.jpg";

const USER_DETAILS = gql`
  fragment SignedInUserDetails on User {
    username
    imgUrl
    university
    major
    favCuisines
    email
    name
    bio
  }
`;

const VERIFY_USER = gql`
  mutation ValidateUser($input: UserInputLogin!) {
    userLogin(input: $input) {
      ...SignedInUserDetails
    }
  }
  ${USER_DETAILS}
`;

const LoginForm = () => {
  //implement for recommendations and userprofile page
  //const [modal, setModal] = useState(false);
  //const users = useQuery(GET_USERS);

  const navigate = useNavigate();

  const [validateUser, validatedUser] = useMutation(VERIFY_USER);
  //const validatedUser = useQuery(VERIFY_USER); //the response implies that the user has been validated in the backend

  //const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [formData, setFormData] = useState({
    password: "",
    username: "",
  });

  //updates the formData above whenever a change is detected in the text field via user interaction
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Send data to the backend/API for login validation
    try {
      const { username, password } = formData; //destructuring the data to be passed as a req in createUser
      //graphql req: input payload
      const input = {
        username, //this value has to be passed in from the signup flow to establish the relationship
        password,
      };

      try {
        const signedUser = await validateUser({
          variables: { input }, //the input has to match the input schema type defined in backend
        });
        // signedUserData = signedUser["userLogin"]
        console.log("API response:", signedUser.data);
        navigate("/home", { state: { signedUser } });
      } catch (error) {
        console.error("API error:", error);
        alert("incorrect credentials");
        // Handle the error, e.g., show error message, etc.
      }
    } catch (error) {
      console.error("API error:", error);
      // Handle the error, e.g., show error message, etc.
      //implement toastify
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-center bg-cover"
      style={{
        backgroundImage: `url(${backgroundPic})`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className=" bg-blue-500 bg-opacity-20 backdrop-blur-md p-8 border border-black rounded-lg shadow-md w-full max-w-md mx-auto"
      >
        <Link to="/" className="position: relative top-2 right-2 text-blue">
          <FiX size={29} />
        </Link>
        <div className="mb-4">
          <div>
            <h2
              className="text-2xl font-semibold mb-4 text-center text-white"
              style={{
                fontFamily: "Roboto, sans-serif",
                letterSpacing: "0.05em",
                textShadow:
                  "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Sign In
            </h2>
          </div>
        </div>
        <hr className="border-1 border-black mb-8" />
        <div className="rounded-md shadow-sm -space-y-px mb-4">
          <div className="mb-2">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input //this is the input field for username
              id="username" //this is the id of the input field
              name="username" //this is the name of the input field
              type="text" //this is the type of the input field
              required
              value={formData.username}
              onChange={handleChange}
              className="my-input appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black-500 text-white rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Username"
              style={{ backgroundColor: "rgba(0, 123, 123, 0.2)" }}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              required
              onChange={handleChange}
              className="my-input appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black-500 text-white rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              style={{ backgroundColor: "rgba(0, 123 , 123, 0.2)" }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 text-white font-semibold rounded hover:bg-opacity-80 transition-all mr-4"
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(37, 99, 235, 0.6)",
          }}
        >
          {/* <FontAwesomeIcon icon={faSignIn} /> */}
          Login
        </button>
        <Link
          to="/signup"
          className="px-4 py-2.5 text-white font-bold rounded transition-all"
          style={{
            backdropFilter: "blur(10px)",
            background:
              "linear-gradient(90deg, rgba(37, 99, 235, 0.6), rgba(37, 99, 235, 0.6))",
          }}
        >
          {/* <FontAwesomeIcon icon={faUserPlus} /> */}
          Sign Up
        </Link>
      </form>
    </div>
  );
};

export default LoginForm;
