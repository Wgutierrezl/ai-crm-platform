import { createBrowserRouter } from "react-router";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import Layout from "./app/components/Layout";
import Dashboard from "./app/pages/Dashboard";
import Products from "./app/pages/Products";
import Customers from "./app/pages/Customers";
import Conversations from "./app/pages/Conversations";
import Orders from "./app/pages/Orders";
import OrderDetail from "./app/pages/OrderDetail";
import Settings from "./app/pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "products",
        Component: Products,
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
]);
