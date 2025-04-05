
"use client";
import { Fragment, useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import firebaseGoogleLogin from "@/firebaseLogin";
import Navbar from "@/components/Navbar";

type EmailParsed = {
  subject: string;
  body: string;
};

type Chat = {
  role: "user" | "bot";
  content: string;
};

export default function Page() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedOption, setSelectedOption] = useState("General"); // Track selected option
  const [userText, setUserText] = useState("");
  const [usermail, setUserMail] = useState<string | null>(null);
  const [chats, setChats] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [type, setType] = useState("General");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""; // Use .env.local

  useEffect(() => {
    const token = localStorage.getItem("userIdToken");
    const mail = localStorage.getItem("userEmail");
    if (token) {
      setUserMail(mail)
    }
  }, []);


  useEffect(() => {
    const storedChats = localStorage.getItem("chats");
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];
    setSessionId(id);
  }, [pathname]);
  
  const handleSubmit = async () => {
    console.log(chats);
    setLoading(true);

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
            session_id: sessionId,
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

  const sendEmailWithGmailAPI = async (
    to: string,
    subject: string,
    message: string
  ) => {
    const accessToken = sessionStorage.getItem("gmailAccessToken");
    if (!accessToken) {
      alert("Access Token Missing! Please login again.");
      return;
    }

    // ✅ Construct raw email
    const email = [
      `To: ${to}`,
      "Subject: " + subject,
      "Content-Type: text/plain; charset=utf-8",
      "",
      message,
    ].join("\n");

    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: base64EncodedEmail,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const newUserMessage: { role: "user" | "bot"; content: string } = {
          role: "user",
          content: "",
        };
        setChats((prev) => [...prev, newUserMessage]);

        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[updatedChats.length - 1] = {
            role: "bot",
            content: "✅ Email Sent SuccessFully",
          };
          return updatedChats;
        });
        console.log("✅ Email sent successfully", data);
        alert("✅ Email sent successfully!");
      } else {
        const newUserMessage: { role: "user" | "bot"; content: string } = {
          role: "user",
          content: "",
        };
        setChats((prev) => [...prev, newUserMessage]);

        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[updatedChats.length - 1] = {
            role: "bot",
            content: "❌ Failed to Sent Email",
          };
          return updatedChats;
        });
        console.error("❌ Error:", data);
        alert("❌ Failed to send email");
      }
    } catch (err) {
      const newUserMessage: { role: "user" | "bot"; content: string } = {
        role: "user",
        content: "",
      };
      setChats((prev) => [...prev, newUserMessage]);

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        updatedChats[updatedChats.length - 1] = {
          role: "bot",
          content: "❌ Failed to Sent Email",
        };
        return updatedChats;
      });
      console.error("❌ Exception while sending:", err);
      alert("❌ Failed to send email");
    }
  };

  const formatMessage = (message: string) => {
    const codeBlockRegex = /```([\s\S]*?)```/g; // Detects triple-backtick code blocks
    const inlineCodeRegex = /`([^`]+)`/g; // Detects inline code with single backticks
    const lineBreakRegex = /\n/g; // Detects new lines

    return message.split(codeBlockRegex).map((part, index) =>
      index % 2 === 0 ? ( // Normal text (not inside triple backticks)
        part.split(lineBreakRegex).map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {line.split(inlineCodeRegex).map((subPart, subIndex) =>
              subIndex % 2 === 0 ? ( // Normal text
                <span key={subIndex}>{subPart}</span>
              ) : (
                // Inline code
                <code
                  key={subIndex}
                  className="text-white px-2 py-1 rounded-md text-sm font-mono"
                >
                  {subPart}
                </code>
              )
            )}
            <br />
          </Fragment>
        ))
      ) : (
        // Code block
        <pre
          key={index}
          className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto"
        >
          <code>{part}</code>
        </pre>
      )
    );
  };

  const isEmailFormat = (message: string): EmailParsed | false => {
    const subjectRegex = /Subject:\s*(.*)/i;
    const subjectMatch = message.match(subjectRegex);

    if (subjectMatch && subjectMatch[1]) {
      const subject = subjectMatch[1].trim();
      // Extract everything after the subject line as body
      const bodyStartIndex =
        message.indexOf(subjectMatch[0]) + subjectMatch[0].length;
      const body = message.slice(bodyStartIndex).trim();

      return {
        subject,
        body,
      };
    }

    return false;
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


      <div className="w-[100%] max-w-[1500px] chats pb-20 h-[80vh] md:w-[60%] mx-auto p-4 flex flex-col gap-4 overflow-y-auto">
        {chats.map((chat, index) => (
          <div
            key={index}
            className={`p-3 ${
              chat.role === "user" ? "self-end" : "self-start"
            }`}
          >
            {chat.role === "bot" ? (
              <div className="px-6 py-2 text-white">
                {formatMessage(chat.content)}
                {(() => {
                  const emailData = isEmailFormat(chat.content);
                  return (
                    emailData && (
                      <div className="w-[100%] md:w-[60%] mx-auto p-4 mt-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="recipientEmail"
                            className="text-gray-700"
                          >
                            Recipient Email
                          </label>
                          <input
                            type="email"
                            id="recipientEmail"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="Enter recipient's email"
                            className="w-full p-2 mt-2 border border-gray-700 rounded-lg"
                            required
                            autoComplete="email"
                          />
                        </div>
                        <button
                          onClick={() =>
                            sendEmailWithGmailAPI(
                              userEmail,
                              emailData.subject,
                              emailData.body
                            )
                          }
                          className="w-full bg-blue-500 text-white p-2 rounded-lg mt-4 hover:bg-blue-600"
                        >
                          Send Email
                        </button>
                      </div>
                    )
                  );
                })()}
              </div>
            ) : (
              <h1
                className="px-6 py-2 lg:max-w-[80%] min-w-fit bg-[#292929] rounded-lg text-white"
                style={{ boxShadow: "0px 0px 9px 2px rgba(34, 34, 34, 0.5)" }}
              >
                {chat.content}
              </h1>
            )}
            <div className="w-full h-[1px] border"></div>
          </div>
        ))}
      </div>

      <div
        className="max-w-lg mx-auto p-4 lg:rounded-lg bg-[#292929] w-full lg:min-w-[800px] min-h-[10vh] fixed bottom-3 left-1/2 transform -translate-x-1/2"
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
                <StopCircleIcon/>
              ):(
                <GraphicEqIcon sx={{color:"black", background:"white"}}/>
              )}
             
            </button>
        </div>
      </div>
    </div>
  );
}
