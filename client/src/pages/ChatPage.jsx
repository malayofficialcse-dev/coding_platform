// // ...existing code...
// import React from "react";
// import ChatPanel from "../components/ChatPanel";
// import  {AuthProvider}  from "../contexts/AuthContext";

// export default function ChatPage() {
//   const { user } = AuthProvider(); // uses your existing auth context

//   if (!user) return <div>Please login to use messages</div>;

//   return (
//     <div style={{ padding: 16 }}>
//       <h2>Messages</h2>
//       <ChatPanel user={user} />
//     </div>
//   );
// }
// // ...existing code...




// ...existing code...
import React, { useContext } from "react";
import ChatPanel from "../components/ChatPanel";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
  const { user } = useContext(AuthContext); // consume context correctly

  if (!user) return <div>Please login to use messages</div>;

  return (
    <div style={{ padding: 16, background: "var(--cc-background)", color: "var(--cc-text)", minHeight: "100vh" }}>
      <ChatPanel user={user} />
    </div>
  );
}
// ...existing code...