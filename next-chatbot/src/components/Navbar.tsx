import React, { JSX, useEffect, useState } from "react";
import {
  LinkedIn,
  GitHub,
  HelpOutline,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

type Option = {
  name: string;
  icon: JSX.Element;
};

type ChatDisplay = {
  session_id: string;
  message: string;
  date: string;
};


type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

type ChatSession = {
  session_id: string;
  username: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
};

type NavbarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedOption: string;
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
  handleOptionClick: (name: string) => void;
};

const Navbar: React.FC<NavbarProps> = ({
  open,
  setOpen,
  selectedOption,
  setSelectedOption,
  handleOptionClick,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatDisplay[]>([]);

  const [usermail, setUserMail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("userIdToken");
    const mail = localStorage.getItem("userEmail");
    if (token) {
      setUserMail(mail)
    }
  }, []);

  const options = [
    { name: "LinkedIn", icon: <LinkedIn className="text-blue-600" /> },
    { name: "GitHub", icon: <GitHub className="text-black" /> },
    { name: "General", icon: <HelpOutline className="text-gray-700" /> },
  ];


  const toggleDrawer = (state: boolean) => () => {
    setOpen(state);
  };

  const fetchHistory = async () => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${baseURL}/gethistory?username=${usermail}`);
      const data: ChatSession[] = await res.json();

      // Only show sessions with at least one user message
      const filtered = data.map((session) => {
        const lastUserMsg = [...session.messages]
          .reverse()
          .find((msg) => msg.role === "user");
        return {
          session_id: session.session_id,
          message: lastUserMsg?.content || "No user message",
          date: new Date(
            session.updated_at || session.created_at
          ).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
        };
      });

      setChatHistory(filtered);
    } catch (err) {
      console.error("Failed to fetch chat history", err);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  return (
    <div className="fixed top-0 left-0 z-50 flex w-full gap-2 p-4">
      <div className="">
        <IconButton
          onClick={toggleDrawer(true)}
          className="bg-chatbotBlue hover:bg-indigo-700"
        >
          <MenuIcon sx={{ color: "white" }} />
        </IconButton>
      </div>
      {/* Material UI Drawer */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        <div
          className="w-90 lg:w-80 h-full bg-[#292929] text-white p-5"
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <h2 className="text-lg font-bold mb-4">Chat History</h2>
          {chatHistory.length > 0 ? (
            chatHistory.map((session, index) => (
              <div
                key={index}
                className="mb-3 p-3 rounded flex justify-between cursor-pointer bg-[#292929] hover:bg-gray-700 transition-all"
              >
                                <p className="text-sm text-gray-300 truncate">
                  {session.message}
                </p>
                <p className="text-sm font-semibold">{session.date}</p>
              </div>
            ))
          ) : (
            <p>No history found</p>
          )}
        </div>
      </Drawer>

      <div>
        <button
          className="bg-chatbotBlue text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => setOpen(!open)}
        >
          {selectedOption} {/* Display the selected option */}
        </button>

        {open && (
          <div className="mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden">
            {options.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer 
                  ${
                    selectedOption === option.name
                      ? "bg-gray-200"
                      : "hover:bg-gray-100"
                  }`} // Highlight selected option
                onClick={() => handleOptionClick(option.name)}
              >
                {option.icon}
                <span className="text-gray-800">{option.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
