"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import firebaseGoogleLogin from "../firebaseLogin";
import Navbar from "./Navbar";


type Chat = {
  role: "user" | "bot";
  content: string;
};

export default function Home() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userIdToken, setUserIdToken] = useState<string | null>(null);
  const [usermail, setUserMail] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("General"); // Track selected option
  const [userText, setUserText] = useState("");
  const [chats, setChats] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [type, setType] = useState("General");
  const navigate = useRouter();
  const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""; // Use .env.local

  useEffect(() => {
    const token = localStorage.getItem("userIdToken");
    const mail = localStorage.getItem("userEmail");
    if (token) {
      setUserIdToken(token);
      setUserMail(mail)
    }
  }, []);

  const handleSubmit = async () => {
    console.log(chats);
    setLoading(true);
    const myUniqueId = uuidv4();

    if (!userText.trim()) {
      alert("Message cannot be empty");
      return;
    }

    const newUserMessage: { role: "user" | "bot"; content: string } = {
      role: "user",
      content: userText,
    };
    updateChats((prev) => [...prev, newUserMessage]); // Add user message to chat history

    // Add bot message for "Processing..." while waiting for the response
    const processingMessage: { role: "bot"; content: string } = {
      role: "bot",
      content: "Processing...",
    };
    updateChats((prev) => [...prev, processingMessage]);

    let res; // ✅ Declare response variable outside the condition block

    try {
      const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (type === "General") {
        res = await fetch(`${baseURL}/chat/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            username: usermail,
            session_id: myUniqueId,
            question: userText,
            type: type,
          }),
        });
      } else if (type === "GitHub") {
        res = await fetch(`${baseURL}/github`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            question: userText,
            type: type,
          }),
        });
      } else if (type === "Email") {
        res = await fetch(`${baseURL}/email/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            question: userText,
            type: type,
          }),
        });
      } else if (type === "Linkedin") {
        res = await fetch(`${baseURL}/linkedin/connect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            question: userText,
            type: type,
          }),
        });
      } else {
        // Default to general if no type matches
        res = await fetch(`${baseURL}/chat/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            question: userText,
            type: type,
          }),
        });
      }

      setUserText(""); // Clear input after sending
      const data = await res.json();
      const botResponse = data.answer || data.message;

      console.log(botResponse, data);

      if (data.error) {
        console.log(data.error);
        // Update "Processing..." message to error
        await streamBotResponse(data.error);
        return;
      }

      // If no error, update "Processing..." message to the bot response
      await streamBotResponse(botResponse);
    } catch (error) {
      console.log(error);
      // In case of error, update "Processing..." message to a generic error message
      await streamBotResponse("An error occurred. Please try again.");
    } finally {
      navigate.push(`/chat/${myUniqueId}`);
    }
  };

  const streamBotResponse = async (botResponse: string) => {
    let index = 0;
    let currentMessage = "";

    // Update the last bot message to show the final response (in case it's not processed yet)
    updateChats((prevChats) => {
      const updatedChats = [...prevChats];
      updatedChats[updatedChats.length - 1] = {
        role: "bot",
        content: "", // Clear the "Processing..." message first if required
      };
      return updatedChats;
    });

    // Add an empty bot message first
    updateChats((prevChats) => [...prevChats, { role: "bot", content: "" }]);

    const interval = setInterval(() => {
      if (index < botResponse.length) {
        currentMessage += botResponse[index];
        index++;

        // Update the last bot message in chat progressively
        updateChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[updatedChats.length - 1] = {
            role: "bot",
            content: currentMessage,
          };
          return updatedChats;
        });
      } else {
        clearInterval(interval); // Done streaming
      }
    }, 1); // Typing speed
  };

  const updateChats = (updater: (prev: Chat[]) => Chat[]) => {
    setChats((prev) => {
      const updated = updater(prev);
      localStorage.setItem("chats", JSON.stringify(updated));
      return updated;
    });
  };

  const handleOptionClick = (optionName: string) => {
    setType(optionName);
    setSelectedOption(optionName); // Update selected option on click
    setOpen(!open);
  };

  const handleUserText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      handleSubmit(); // Trigger submit on "Enter" key press
    }
  };

  const handleLogin = async () => {
    try {
      await firebaseGoogleLogin();
      alert("✅ Login Successful");
    } catch {
      alert("❌ Login Failed");
    }
  };

  return (
    <div className="w-full h-screen bg-[#171717] relative overflow-hidden">
      <Navbar
        open={open}
        setOpen={setOpen}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        handleOptionClick={handleOptionClick}
      />

      {!userIdToken && (
        <div className="absolute top-4 right-4 z-50">
          <button
            className="bg-chatbotBlue text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      )}

      <div className="w-[90%] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <h2 className="p-4 text-2xl font-semibold text-white text-center">
          What can I help with?
        </h2>
        <div
          className="max-w-lg mx-auto p-4 rounded-lg bg-[#292929] w-full lg:min-w-[800px] min-h-[10vh] "
          style={{ boxShadow: "0px 0px 29px 12px rgba(34, 34, 34, 0.5)" }}
        >
          <div className="relative w-full text-white">
            <textarea
              className="w-full p-2 min-h-[15vh] rounded-lg focus:outline-none"
              placeholder="Ask me anything..."
              value={userText}
              onKeyDown={handleKeyPress}
              onChange={handleUserText}
            />
            <button
              className={`absolute right-4 bottom-4 cursor-pointer rounded-full flex justify-center items-center w-[40px] h-[40px] ${loading ? "": "bg-white"}`}
              onClick={handleSubmit}
            >
              {loading ? (
                <StopCircleIcon />
              ) : (
                <GraphicEqIcon sx={{ color: "black" }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
