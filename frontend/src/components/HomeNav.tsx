// Layout.tsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
//import Navbar from './Navbar';
import "./signup.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import "../styles/pulse.css";
import "../styles/nav.css";
import { useState } from "react";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import {
  setSearchResults,
  setActiveSearch,

} from "../redux/actions/searchActions";
import NotionIcon from '../assets/notion1411_adobe_express.svg';
import { useDispatch } from "react-redux";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
//...

interface LayoutProps {
  children: React.ReactNode;
}




const HomePageNav: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch(); //redux dispatch
  const navigate = useNavigate();

  // Add this inside HomePageNav functional component
  const [searchQuery, setSearchQuery] = useState("");
  //const [searchUsers, searchedUsers] = useMutation(SEARCH_USER);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<any>(false);

  
  const handleSignOut = async (e: any) => {
    e.preventDefault();
    //dispatch(setChatbotStatus("inactive")); //dispatch the search results to redux store
    //window.location.href = "/";
    navigate("/");
    // Navigate to the root route
    // window.location.reload(); // Force a refresh of the landing page
  };

  return (
    <>
      <nav className="golden fixed top-0 left-0 w-full bg-blue-500 backdrop-blur-md bg-opacity-20 shadow-md z-10 border-t border-black">
        <div className="container mx-auto px-1 py-3 flex items-center justify-between">
          <div className="flex-shrink-0">
            {/* Logo and header */}
            <div className="bruh relative">
              {/* <svg
                width="100%"
                height="100"
                className="absolute -top-4 -left-10 z-[-1] filter drop-shadow-whiteGlow"
              ></svg> */}
              <h1
                className="text-2xl font-bold text-white rounded p-2 mb-1 relative"
                // style={{
                //   WebkitTextStroke: "2px #2563EB", // Adjust the stroke width and color as needed
                // }}
              >
                Ambrosia
              </h1>
            </div>
          </div>

         <div className="hidden md:flex md:flex-grow mr-20">
          {/* Notion icon */}
           <a href="https://bstgrp.notion.site/0407339b10c34531a88f27f582443a49?v=4ba8f3d4529f4c3ea25e5d02a42770b6" target="_blank" rel="noopener noreferrer">
           <img src={NotionIcon} alt="Notion" className="h-10 w-10 cursor-pointer" />
           </a>
         </div>

          <div className="flex-shrink-0">
            {/* Sign out icon */}
            <Link
              to="/"
              className="text-lg font-semibold text-white hover:text-blue-600"
              //onClick={handleSignOut}
            >
              <div>
                <FontAwesomeIcon icon={faSignOutAlt} size="2x" />
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex-shrink-0 ml-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white"
            >
              <FontAwesomeIcon icon={faBars} size="2x" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } md:hidden w-full mt-2`}
        >

        </div>
      </nav>

      <main>{children}</main>
    </>
  );
};

export default HomePageNav;
