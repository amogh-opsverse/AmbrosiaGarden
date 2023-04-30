import React from "react";
import loadable from "@loadable/component";
import "./styles/transitions.css";
import Loading from "./Loading";

import ReactDOM from "react-dom/client";
//import { createRoot } from "react-dom";
import App from "./App";
import ProfileInfo from "./components/ProfileInfo";
import RegistrationForm from "./components/SignUp";
import LoginForm from "./components/Login";
import Home from "./components/Home";
import Layout from "./components/Layout";
import HomePageNav from "./components/HomeNav";
import About from "./components/About";
// const App = loadable(() => import("./App"), { fallback: <Loading /> });
// const ProfileInfo = loadable(() => import("./components/ProfileInfo"), {
//   fallback: <Loading />,
// });
// const RegistrationForm = loadable(() => import("./components/SignUp"), {
//   fallback: <Loading />,
// });
// const LoginForm = loadable(() => import("./components/Login"), {
//   fallback: <Loading />,
// });
// const Home = loadable(() => import("./components/Home"), {
//   fallback: <Loading />,
// });
// const Layout = loadable(() => import("./components/Layout"), {
//   fallback: <Loading />,
// });
// const HomePageNav = loadable(() => import("./components/HomeNav"), {
//   fallback: <Loading />,
// });
// const About = loadable(() => import("./components/About"), {
//   fallback: <Loading />,
// });

import client from "./apollo-client";
import { BrowserRouter, Routes } from "react-router-dom";
import { ApolloProvider } from "@apollo/react-hooks";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import {
  BrowserRouter as Router,
  Route,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { Provider } from "react-redux";
import store from "./redux/store";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  /*trying out different navbar views*/
  <Provider store={store}>
    <BrowserRouter>
      <ApolloProvider client={client as ApolloClient<any>}>
        <React.StrictMode>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Layout>
                    <Outlet />
                  </Layout>
                </>
              }
            >
              <Route index element={<App />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<RegistrationForm />} />
              <Route path="/profile-setup" element={<ProfileInfo />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route
              path="/home/*"
              element={
                <>
                  <HomePageNav>
                    <Outlet />
                  </HomePageNav>
                </>
              }
            >
              <Route index element={<Home />} />
            </Route>
          </Routes>
        </React.StrictMode>
      </ApolloProvider>
    </BrowserRouter>
  </Provider>
);
