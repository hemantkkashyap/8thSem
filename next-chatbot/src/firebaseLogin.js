// firebaseLogin.js
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebaseConfig";

const firebaseGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();

  // ✅ Add Gmail Send Scope
  provider.addScope('https://www.googleapis.com/auth/gmail.send');

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken(); // Firebase ID Token
    const credential = GoogleAuthProvider.credentialFromResult(result);

    // ✅ Get OAuth Access Token to use Gmail API
    const accessToken = credential.accessToken;

    // ✅ Store in localStorage
    sessionStorage.setItem("userEmail", user.email);
    sessionStorage.setItem("userIdToken", idToken);
    sessionStorage.setItem("gmailAccessToken", accessToken);

    console.log("✅ User Logged In: ", user.email);
    return { email: user.email, idToken, accessToken };
  } catch (error) {
    console.error("❌ Login Failed:", error);
    throw error;
  }
};

export default firebaseGoogleLogin;
