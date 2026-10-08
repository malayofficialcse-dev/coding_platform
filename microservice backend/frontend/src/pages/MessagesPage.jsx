import { useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";
import { api, getItems } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/useResource";
import {
  Badge,
  Button,
  PageHeading,
  Panel,
  ResourceState,
} from "../components/ui";

export function MessagesPage() {
  const { user } = useAuth();
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const {
    data: contacts,
    loading: loadingContacts,
    error: contactsError,
    reload: reloadContacts,
  } = useResource(async () =>
    getItems(await api("/messages/users"), ["users", "data"]),
  );
  const {
    data: messages,
    loading: loadingMessages,
    error: messagesError,
    reload: reloadMessages,
  } = useResource(
    () =>
      activeUser
        ? api(`/messages/${activeUser._id}`).then((result) =>
            getItems(result, ["messages", "data"]),
          )
        : Promise.resolve([]),
    [activeUser?._id],
  );

  async function sendMessage(event) {
    event.preventDefault();
    if (!text.trim() || !activeUser) return;
    setSending(true);
    setSendError("");
    try {
      await api(`/messages/send/${activeUser._id}`, {
        method: "POST",
        body: { text: text.trim() },
      });
      setText("");
      reloadMessages();
    } catch (reason) {
      setSendError(reason.message || "We couldn’t send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Keep in touch"
        title="Messages"
        description="Continue a conversation with people in your learning network."
      />
      <ResourceState
        loading={loadingContacts}
        error={contactsError}
        onRetry={reloadContacts}
        empty="Follow other learners to start a conversation."
      >
        <Panel className="grid min-h-[560px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-line md:border-b-0 md:border-r">
            <div className="border-b border-line px-4 py-4">
              <h2 className="text-sm font-semibold">Your people</h2>
              <p className="mt-1 text-xs text-muted">
                {contacts?.length || 0} conversations
              </p>
            </div>
            <div className="grid max-h-[300px] overflow-y-auto p-2 md:max-h-[510px]">
              {(contacts || []).map((person) => (
                <button
                  key={person._id}
                  onClick={() => setActiveUser(person)}
                  className={`flex items-center gap-3 p-3 text-left transition-colors ${
                    activeUser?._id === person._id
                      ? "bg-brand-soft"
                      : "hover:bg-surface-subtle"
                  }`}
                >
                  <div className="grid size-9 shrink-0 place-items-center bg-surface-subtle text-muted">
                    <UserRound size={17} />
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {person.name || person.username}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {person.username ? `@${person.username}` : "Learner"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[450px] flex-col">
            {activeUser ? (
              <>
                <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center bg-brand-soft text-brand">
                      <UserRound size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {activeUser.name || activeUser.username}
                      </p>
                      <p className="text-xs text-muted">Direct message</p>
                    </div>
                  </div>
                  <button
                    onClick={reloadMessages}
                    aria-label="Refresh messages"
                    className="grid size-9 place-items-center text-muted hover:bg-surface-subtle hover:text-brand"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface-subtle/70 p-4 sm:p-5">
                  {loadingMessages ? (
                    <p className="m-auto text-sm text-muted">Loading messages…</p>
                  ) : messagesError ? (
                    <div className="m-auto text-center">
                      <p className="text-sm text-negative">{messagesError}</p>
                      <Button
                        variant="secondary"
                        className="mt-3"
                        onClick={reloadMessages}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : messages?.length ? (
                    messages.map((message) => {
                      const senderId =
                        message.senderId?._id || message.senderId;
                      const isMine =
                        String(senderId) === String(user?._id || user?.id);
                      return (
                        <div
                          key={message._id}
                          className={`max-w-[85%] border px-3 py-2 ${
                            isMine
                              ? "self-end border-brand bg-brand text-white"
                              : "self-start border-line bg-surface"
                          }`}
                        >
                          {message.text && (
                            <p className="whitespace-pre-wrap text-sm">
                              {message.text}
                            </p>
                          )}
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Message attachment"
                              className="mt-1 max-h-64 max-w-full object-cover"
                            />
                          )}
                          <p
                            className={`mt-1 text-[10px] ${
                              isMine ? "text-white/75" : "text-muted"
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="m-auto text-center">
                      <MessageCircle
                        size={28}
                        className="mx-auto text-muted"
                      />
                      <p className="mt-3 text-sm font-semibold">
                        Start the conversation
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Send a note to {activeUser.name || "your connection"}.
                      </p>
                    </div>
                  )}
                </div>
                {sendError && (
                  <p role="alert" className="border-t border-negative/20 bg-negative/10 px-4 py-2 text-xs text-negative">
                    {sendError}
                  </p>
                )}
                <form
                  onSubmit={sendMessage}
                  className="flex gap-2 border-t border-line p-3 sm:p-4"
                >
                  <label className="sr-only" htmlFor="message-text">
                    Write a message
                  </label>
                  <input
                    id="message-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={3000}
                    placeholder="Write a message…"
                    className="h-10 min-w-0 flex-1 border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
                  />
                  <Button
                    type="submit"
                    className="min-h-10 px-3"
                    disabled={sending || !text.trim()}
                  >
                    <Send size={15} />
                    <span className="hidden sm:inline">
                      {sending ? "Sending…" : "Send"}
                    </span>
                  </Button>
                </form>
              </>
            ) : (
              <div className="m-auto p-6 text-center">
                <div className="mx-auto grid size-14 place-items-center bg-brand-soft text-brand">
                  <MessageCircle size={25} />
                </div>
                <h2 className="mt-4 font-semibold">Choose a conversation</h2>
                <p className="mt-1 text-sm text-muted">
                  Select someone from your network to view messages.
                </p>
                {contacts?.length === 0 && (
                  <Badge tone="brand" className="mt-4">
                    Follow learners to get started
                  </Badge>
                )}
              </div>
            )}
          </section>
        </Panel>
      </ResourceState>
    </div>
  );
}
