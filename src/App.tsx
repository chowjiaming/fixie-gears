import { RouterProvider } from "@tanstack/solid-router";
import { router } from "./router";
import "./styles.css";

export default function App() {
  return <RouterProvider router={router} />;
}
