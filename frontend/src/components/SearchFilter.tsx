import React, { useState } from "react";

//setting type
import "../styles/pulse.css";
import "./searchfilter.css";
import { setActiveSearch } from "../redux/actions/searchActions";
import { useDispatch } from "react-redux";
interface SearchFilterProps {
  //for the state function to be passed from the home page
  onSearchAttributesChange: (attributes: any) => void;
  onToggleView: () => void;
  signedInUser: any;
}

//const SearchFilter: React.FC<SearchFilterProps> = ({
const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearchAttributesChange,
  onToggleView,
  signedInUser,
}) => {
  // const [searchTerm, setSearchTerm] = useState("");

  const [filterAttributes, setFilterAttributes] = useState({
    Personality: "",
    Diet: false,
    University: false,
  });

  const [collapsed, setCollapsed] = useState(true);

  const handleCheckboxAttributeChange = (e: any) => {
    setFilterAttributes({
      ...filterAttributes,
      [e.target.name]: e.target.checked, //set the user's university if checked
    });
  };

  const handleAttributeChange = (e: any) => {
    setFilterAttributes({
      ...filterAttributes,
      [e.target.name]: e.target.value,
    });
    console.log("");
  };

  const dispatch = useDispatch(); //redux dispatch

  const handleSearchClick = () => {
    // console.log("Search Term:", searchTerm);
    console.log("Filter Attributes:", filterAttributes);
    onSearchAttributesChange(filterAttributes); //executing the function passed in as prop from Home page
    dispatch(setActiveSearch("local"));
    onToggleView(); //toggle the search results
  };

  return (
    <div
      className="flex flex-col h-full backdrop-blur-md"
      style={{ maxHeight: "345px", overflowY: "auto" }}
    >
      <div className="justify-between items-center mb-4 mt-2">
        <h3
          className="text-xl font-semibold mb-4 text-center text-white"
          style={{
            fontFamily: "Roboto, sans-serif",
            letterSpacing: "0.05em",
            textShadow:
              "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
          }}
        >
          Search Fellow Ambrosians
        </h3>
      </div>
      <hr className=" border-t" />

      <hr className="border border-black mb-8" />
      <div
        className="flex flex-col h-full"
        style={{ maxHeight: "209px", overflowY: "auto" }}
      >
        <div className="flex justify-center">
          <div className="filter-attributes space-y-4 flex-1 overflow-y-auto max-w-lg">
            {/* <h4 className="font-semibold mb-4 text-center">Preferences:</h4> */}
            <div className="flex">
              <div className="w-1/2 pr-8">
                <label
                  htmlFor="university"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: "0.79rem",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Match University
                </label>
                <input
                  type="checkbox"
                  checked={filterAttributes.University}
                  onChange={handleCheckboxAttributeChange}
                  id="university"
                  name="University"
                  className="ml-2 align-middle"
                />
              </div>
              <div className="w-1/2 pr-8">
                <label
                  htmlFor="diet"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    fontSize: "0.79rem",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Match Diet Preference
                </label>
                <input
                  type="checkbox"
                  checked={filterAttributes.Diet}
                  onChange={handleCheckboxAttributeChange}
                  id="diet"
                  name="Diet"
                  className="ml-2 align-middle"
                />
              </div>
            </div>
            <br />
            <hr className="flame border-t" />

            <div className="filter-container">
              <div className="flex flex-col items-center">
                <label
                  htmlFor="personality"
                  className="font-semibold mb-2 text-white"
                  style={{
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: "0.05em",
                    fontSize: "0.89rem",
                    textShadow:
                      "0px 2px 4px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  Personality:
                </label>
                <select
                  name="Personality"
                  value={filterAttributes.Personality}
                  onChange={handleAttributeChange}
                  className="filter-select mb-4 transparent-dropdown"
                >
                  <option value=""></option>
                  <option value="introvert">introvert</option>
                  <option value="extrovert">extrovert</option>
                  <option value="ambivert">ambivert</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <button
          onClick={handleSearchClick}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Show Results
        </button>
      </div>
      <br />
    </div>
  );
};

export default SearchFilter;
