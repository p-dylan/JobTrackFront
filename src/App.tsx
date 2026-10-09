import { RouterProvider } from "react-router";
import {GoogleOAuthProvider} from "@react-oauth/google"
import { router } from "./routes";
import Toast from "./components/Overlay/Toast";

export default function App() {
  return (
    <>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />;
      <Toast />
    </GoogleOAuthProvider>
    </>
  )
}
