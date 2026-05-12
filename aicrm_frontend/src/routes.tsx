import { createBrowserRouter } from "react-router";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import GoogleAuthCallback from "./app/pages/GoogleAuthCallback";
import GoogleAuthFailure from "./app/pages/GoogleAuthFailure";
import Layout from "./app/components/Layout";
import Dashboard from "./app/pages/Dashboard";
import Products from "./app/pages/Products";
import Categories from "./app/pages/Categories";
import Customers from "./app/pages/Customers";
import Conversations from "./app/pages/Conversations";
import Orders from "./app/pages/Orders";
import OrderDetail from "./app/pages/OrderDetail";
import Settings from "./app/pages/Settings";
import ProtectedRoute from "./app/components/auth/ProtectedRoute";
import PublicRoute from "./app/components/auth/PublicRoute";
import RootRedirect from "./app/components/auth/RootRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  {
    Component: PublicRoute,
    children: [
      {
        path: "/login",
        Component: Login,
      },
      {
        path: "/register",
        Component: Register,
      },
      {
        path: "/auth/google/success",
        Component: GoogleAuthCallback,
      },
      {
        path: "/login/google/callback",
        Component: GoogleAuthCallback,
      },
      {
        path: "/auth/google/failure",
        Component: GoogleAuthFailure,
      },
    ],
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          {
            path: "dashboard",
            Component: Dashboard,
          },
          {
            path: "products",
            Component: Products,
          },
          {
            path: "categories",
            Component: Categories,
          },
          {
            path: "customers",
            Component: Customers,
          },
          {
            path: "conversations",
            Component: Conversations,
          },
          {
            path: "orders",
            Component: Orders,
          },
          {
            path: "orders/:id",
            Component: OrderDetail,
          },
          {
            path: "settings",
            Component: Settings,
          },
        ],
      },
    ],
  },
]);
