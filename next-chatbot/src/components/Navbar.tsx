import React, { useEffect, useState } from "react";
import {
  LinkedIn,
  GitHub,
  HelpOutline,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Drawer, IconButton } from "@mui/material";

type ChatGroup = {
  date: string;
  sessions: {
    session_id: string;
    message: string;
    displayDate: string;
    sortDate: Date;
    groupLabel: string;
  }[];
};

type GroupedSession = {
  session_id: string;
  message: string;
  displayDate: string;
  sortDate: Date;
  groupLabel: string;
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
  handleOptionClick,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatGroup[]>([]);
  const navigate = useRouter();
  const [usermail, setUserMail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("userIdToken");
    const mail = localStorage.getItem("userEmail");
    if (token) {
      setUserMail(mail);
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

      const now = new Date();
      const getDayLabel = (d: Date) => {
        const diff = Math.floor(
          (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 0) return "Today";
        if (diff === 1) return "Yesterday";
        return d.toLocaleDateString(undefined, { dateStyle: "long" });
      };

      const groupedMap: Record<string, GroupedSession[]> = {};

      data
        .map((session) => {
          const dateObj = new Date(session.updated_at || session.created_at);
          const lastUserMsg = [...session.messages]
            .reverse()
            .find((msg) => msg.role === "user");
          return {
            session_id: session.session_id,
            message: lastUserMsg?.content || "No user message",
            displayDate: dateObj.toLocaleTimeString([], {
              timeStyle: "short",
            }),
            sortDate: dateObj,
            groupLabel: getDayLabel(dateObj),
          };
        })
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
        .forEach((item) => {
          if (!groupedMap[item.groupLabel]) groupedMap[item.groupLabel] = [];
          groupedMap[item.groupLabel].push(item);
        });

      // Convert map to array for rendering
      const grouped = Object.entries(groupedMap).map(([date, sessions]) => ({
        date,
        sessions,
      }));

      setChatHistory(grouped); // you'll need to update UI to loop over groups
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

  const gotoChats = (myUniqueId: string) => {
    try {
      localStorage.removeItem("chats");
      navigate.push(`/chat/${myUniqueId}`);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="fixed top-0 left-0 z-50 flex w-full gap-2 p-4 bg-[#171717]">
      <div className="">
        {usermail && (
          <IconButton
            onClick={toggleDrawer(true)}
            className="bg-chatbotBlue hover:bg-indigo-700"
          >
            <MenuIcon sx={{ color: "white" }} />
          </IconButton>
        )}
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
          {chatHistory.map((group) => (
            <div key={group.date}>
              <h2>{group.date}</h2>
              {group.sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="flex w-full cursor-pointer justify-between p-2 hover:bg-gray-700 rounded-[3px]"
                  onClick={() => gotoChats(session.session_id)}
                >
                  <p>{session.message}</p>
                  <small>{session.displayDate}</small>
                </div>
              ))}
            </div>
          ))}
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
