"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Client,
  Account,
  Teams,
  Databases,
  Query,
  ID,
  Storage,
} from "appwrite";
import Link from "next/link";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { toast } from "react-hot-toast";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const teams = new Teams(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = "learning_spaces";
const CHAPTERS_COLLECTION_ID = "chapters";
const FLASHCARDS_COLLECTION_ID = "flashcards";
const QUIZZES_COLLECTION_ID = "quizzes";
const AUDIOBOOKS_COLLECTION_ID = "audiobooks";
const STORYBOARDS_COLLECTION_ID = "storyboards";
const WEB_NOTES_COLLECTION_ID = "webnotes";

// This is the new, self-contained, and corrected modal component.
// It is now defined outside the main page component to avoid re-definitions on re-renders.
const ImportWebsiteModal = ({ isOpen, onClose, onNotesGenerated }) => {
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleFetchPages = async (e) => {
    if (e) e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError("");
    setPages([]);
    setSelectedPage("");

    try {
      const response = await fetch(
        "https://prospace-4d2a452088b6.herokuapp.com/tavily-map",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
      );
      const data = await response.json();

      if (
        response.ok &&
        data.status === "success" &&
        data.data?.results?.length > 0
      ) {
        setPages(data.data.results);
      } else {
        const errorMessage = data.message || "";

        if (
          errorMessage.includes("No URLs found") ||
          data.data?.results?.length === 0
        ) {
          setError("No Links ahead. The provided URL has no crawlable links.");
        } else {
          throw new Error(errorMessage || "Failed to fetch sitemap.");
        }
      }
    } catch (err) {
      console.error("Error fetching sitemap:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapSelected = async () => {
    if (!selectedPage) return;

    const previousPages = [...pages]; // Keep a copy of the current pages

    setUrl(selectedPage);
    setIsLoading(true);
    setError("");
    setPages([]);

    try {
      const response = await fetch(
        "https://prospace-4d2a452088b6.herokuapp.com/tavily-map",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: selectedPage }),
        },
      );
      const data = await response.json();

      if (
        response.ok &&
        data.status === "success" &&
        data.data?.results?.length > 0
      ) {
        setPages(data.data.results);
        setSelectedPage("");
      } else {
        const errorMessage = data.message || "";

        if (
          errorMessage.includes("No URLs found") ||
          data.data?.results?.length === 0
        ) {
          setError(
            "No links found on the selected page. Returning to the previous list.",
          );
          setPages(previousPages); // Restore previous pages
        } else {
          throw new Error(errorMessage || "Could not map the website.");
        }
      }
    } catch (err) {
      console.error("Error fetching sitemap:", err);
      setError(`Error: ${err.message}`);
      setPages(previousPages); // Also restore on generic error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = (pageUrl) => {
    setSelectedPage(pageUrl);
  };

  const handleGenerateNotes = async () => {
    if (!selectedPage) return;
    setIsCreating(true);
    setError("");
    try {
      const response = await fetch(
        "https://prospace-4d2a452088b6.herokuapp.com/generate-notes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: selectedPage }),
        },
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        toast.success(
          `Notes generated successfully for '${result.data.notes.title}'.`,
        );
        onNotesGenerated(result.data.notes, selectedPage);
        onClose();
      } else {
        const errorDetail = result.detail?.error || "Failed to generate notes.";

        throw new Error(errorDetail);
      }
    } catch (err) {
      console.error("Error generating notes:", err);
      setError(`An error occurred while generating notes: ${err.message}`);
      toast.error("Failed to generate notes.");
    } finally {
      setIsCreating(false);
    }
  };

  const urlToTitle = (pageUrl) => {
    try {
      const path = new URL(pageUrl).pathname;

      if (path === "/") return "Home";
      const parts = path.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1] || parts[parts.length - 2];

      return lastPart
        .replace(/[_-]/g, " ")
        .replace(/\.html?$/, "")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch (e) {
      return pageUrl;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setPages([]);
      setSelectedPage("");
      setIsLoading(false);
      setIsCreating(false);
      setError("");
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ transition: "opacity 0.3s ease-in-out" }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-2xl w-full flex flex-col h-auto max-h-[85vh] border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Import from Website
          </h3>
          <button
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl z-10"
            onClick={onClose}
          >
            {" "}
            ×{" "}
          </button>
        </div>
        <form className="mb-4" onSubmit={handleFetchPages}>
          <div className="flex gap-2">
            <input
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
              placeholder="https://example.com"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center w-40"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Fetching..." : "Fetch Pages"}
            </button>
          </div>
        </form>

        <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-slate-200 dark:border-slate-700 py-4">
          {error && <div className="text-center text-red-500 p-2">{error}</div>}
          {isLoading && !pages.length && (
            <div className="text-center text-gray-500 p-4">
              Fetching pages...
            </div>
          )}
          {!isLoading && !pages.length && !error && (
            <div className="text-center text-gray-500 p-4">
              Enter a URL to get started.
            </div>
          )}
          {pages.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select a page to generate a chapter, or map it for more pages.
              </p>
              {pages.map((page, index) => (
                <label
                  key={index}
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${selectedPage === page ? "bg-indigo-50 dark:bg-indigo-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <input
                    checked={selectedPage === page}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="pageSelection"
                    type="radio"
                    onChange={() => handleSelectPage(page)}
                  />
                  <span
                    className="text-sm text-gray-700 dark:text-gray-300 truncate"
                    title={page}
                  >
                    {urlToTitle(page)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!selectedPage || isLoading || isCreating}
            onClick={handleMapSelected}
          >
            Map Selected
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!selectedPage || isCreating || isLoading}
            onClick={handleGenerateNotes}
          >
            {isCreating ? "Generating..." : "Generate Notes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NotesModal = ({ isOpen, onClose, notes, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !notes) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      // The onSave function will handle toast messages and closing
    } catch (error) {
      console.error("Failed to save from modal:", error);
      // Error toast is likely handled in the onSave implementation
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-2xl w-full flex flex-col h-auto max-h-[85vh] border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">
            {notes.title}
          </h3>
          <button
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl z-10 flex-shrink-0"
            onClick={onClose}
          >
            {" "}
            ×{" "}
          </button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">
              Summary
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {notes.detailed_summary}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">
              Key Points
            </h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              {notes.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Close
          </button>
          {onSave && (
            <button
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Notes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UserSpacePage({ params }) {
  const router = useRouter();
  const spaceId = React.use(params).id;
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("latest-updates");
  const [showChaptersList, setShowChaptersList] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [storyboards, setStoryboards] = useState([]);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizUserAnswers, setQuizUserAnswers] = useState([]);
  const [quizScore, setQuizScore] = useState(null);
  const [showAudiobookModal, setShowAudiobookModal] = useState(false);
  const [selectedAudiobook, setSelectedAudiobook] = useState(null);
  const [showStoryboardModal, setShowStoryboardModal] = useState(false);
  const [selectedStoryboard, setSelectedStoryboard] = useState(null);
  const [currentStoryboardSceneIndex, setCurrentStoryboardSceneIndex] =
    useState(0);
  const [isSearchWidgetOpen, setIsSearchWidgetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const chatContainerRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [notesSourceUrl, setNotesSourceUrl] = useState("");
  const [webNotes, setWebNotes] = useState([]);
  const [selectedWebNote, setSelectedWebNote] = useState(null);
  const [showWebNoteModal, setShowWebNoteModal] = useState(false);
  const [searchingCard, setSearchingCard] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showChatCardModal, setShowChatCardModal] = useState(false);
  const [selectedChatCard, setSelectedChatCard] = useState(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isSearching]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await account.get();

        setCurrentUser(user);
        const [spaceData, chaptersRes, webNotesRes] = await Promise.all([
          teams.get(spaceId),
          databases.listDocuments(DATABASE_ID, CHAPTERS_COLLECTION_ID, [
            Query.equal("spaceId", spaceId),
          ]),
          databases.listDocuments(DATABASE_ID, WEB_NOTES_COLLECTION_ID, [
            Query.equal("userId", user.$id),
          ]),
        ]);

        setSpace(spaceData);
        setChapters(chaptersRes.documents);
        setWebNotes(webNotesRes.documents);

        if (chaptersRes.documents.length > 0) {
          await handleChapterClick(chaptersRes.documents[0]);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load space data: " + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [spaceId]);

  const handleChapterClick = async (chapter) => {
    setSelectedChapter(chapter);
    try {
      const [flashRes, sumRes, quizRes, audioRes, storyRes] = await Promise.all(
        [
          databases.listDocuments(DATABASE_ID, FLASHCARDS_COLLECTION_ID, [
            Query.equal("chapterId", chapter.$id),
          ]),
          databases.listDocuments(DATABASE_ID, "summaries", [
            Query.equal("chapterId", chapter.$id),
            Query.equal("spaceId", spaceId),
          ]),
          databases.listDocuments(DATABASE_ID, "quizzes", [
            Query.equal("chapterId", chapter.$id),
            Query.equal("spaceId", spaceId),
          ]),
          databases.listDocuments(DATABASE_ID, AUDIOBOOKS_COLLECTION_ID, [
            Query.equal("chapterId", chapter.$id),
          ]),
          databases.listDocuments(DATABASE_ID, STORYBOARDS_COLLECTION_ID, [
            Query.equal("chapterId", chapter.$id),
          ]),
        ],
      );

      setFlashcards(
        flashRes.documents.map((doc) => ({
          ...doc,
          cards: JSON.parse(doc.cards),
        })),
      );
      setSummaries(sumRes.documents);
      setQuizzes(
        quizRes.documents.map((doc) => ({
          ...doc,
          questions: JSON.parse(doc.questions),
        })),
      );
      setAudiobooks(audioRes.documents);
      setStoryboards(
        storyRes.documents.map((doc) => ({
          ...doc,
          boards: JSON.parse(doc.boards),
        })),
      );
    } catch (err) {
      setError("Failed to load chapter content: " + err.message);
    }
  };

  const handleWebSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const newQuery = searchQuery;

    setChatHistory((prev) => [...prev, { type: "user", text: newQuery }]);
    setSearchQuery("");
    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        "https://prospace-4d2a452088b6.herokuapp.com/tavily-search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: newQuery }),
        },
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.status === "success" && data.data) {
        setChatHistory((prev) => [...prev, { type: "bot", data: data.data }]);
      } else {
        throw new Error(data.message || "Failed to get search results.");
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { type: "error", text: err.message }]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const chaptersRes = await databases.listDocuments(
        DATABASE_ID,
        CHAPTERS_COLLECTION_ID,
        [Query.equal("spaceId", spaceId)],
      );

      setChapters(chaptersRes.documents);

      return chaptersRes.documents;
    } catch (err) {
      console.error("Failed to fetch chapters", err);
      setError("Failed to fetch chapters: " + err.message);

      return [];
    }
  };

  const handleNotesGenerated = (notes, url) => {
    setGeneratedNotes(notes);
    setNotesSourceUrl(url);
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!generatedNotes) return;

    try {
      const user = await account.get();
      const userId = user.$id;

      await databases.createDocument(
        DATABASE_ID,
        WEB_NOTES_COLLECTION_ID,
        ID.unique(),
        {
          userId: userId,
          title: generatedNotes.title,
          detailed_summary: generatedNotes.detailed_summary,
          key_points: generatedNotes.key_points,
          sourceUrl: notesSourceUrl,
        },
        // Set document-level permissions
        [
          `read("user:${userId}")`,
          `update("user:${userId}")`,
          `delete("user:${userId}")`,
        ],
      );

      // Refresh the web notes list to show the newly saved note
      const updatedWebNotesRes = await databases.listDocuments(
        DATABASE_ID,
        WEB_NOTES_COLLECTION_ID,
        [Query.equal("userId", userId)],
      );

      setWebNotes(updatedWebNotesRes.documents);

      toast.success("Notes saved successfully!");
      setShowNotesModal(false); // Close modal on success
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error(`Failed to save notes: ${error.message}`);
      // Re-throw to be caught in the modal's handler if needed
      throw error;
    }
  };

  const hasAnyContent =
    flashcards.length > 0 ||
    summaries.length > 0 ||
    quizzes.length > 0 ||
    audiobooks.length > 0 ||
    storyboards.length > 0;

  const handleCardSearch = async (card) => {
    setSearchingCard(card);
    setSearchResult(null);
    setSearchError("");
    setSearchLoading(true);
    try {
      const response = await fetch(
        "https://prospace-4d2a452088b6.herokuapp.com/tavily-search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: card.note }),
        },
      );
      const data = await response.json();

      if (response.ok && data.status === "success" && data.data) {
        setSearchResult(data.data);
      } else {
        setSearchError(data.message || "No result");
      }
    } catch (err) {
      setSearchError("Failed to search: " + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <Link
            className="mt-6 inline-block text-indigo-600 hover:underline"
            href="/dashboard"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md dark:bg-slate-800/90 border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-16 relative">
            <div className="flex items-center gap-2 z-10">
              <button
                aria-label="Back to My Spaces"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600"
                onClick={() => router.push('/dashboard')}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {space?.name || "Space"}
                </span>
              </button>
              {space?.description && (
                <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-normal px-2 py-0.5 rounded border border-transparent">
                  {space.description}
                </span>
              )}
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <Tabs
                aria-label="Navigation Options"
                className=""
                selectedKey={
                  activeTab === "latest-updates"
                    ? "latest-updates"
                    : showChaptersList
                      ? "chapters"
                      : activeTab === "webnotes"
                        ? "webnotes"
                        : ""
                }
                onSelectionChange={(key) => {
                  if (key === "latest-updates") {
                    setShowChaptersList(false);
                    setActiveTab("latest-updates");
                  } else if (key === "chapters") {
                    setShowChaptersList((v) => !v);
                    if (!showChaptersList) setActiveTab("flashcards");
                  } else if (key === "webnotes") {
                    setShowChaptersList(false);
                    setActiveTab("webnotes");
                  }
                }}
              >
                <Tab key="latest-updates" title="🆕 Updates" />
                <Tab key="chapters" title="📚 Chapters" />
                <Tab key="webnotes" title="📝 Web Notes" />
              </Tabs>
            </div>
            <div className="flex items-center space-x-4 z-10">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span>👤</span>
                    {currentUser?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-8 overflow-y-auto">
        {showChaptersList && chapters.length > 0 && (
          <Tabs
            aria-label="Chapter List"
            className="w-full mb-2"
            isVertical={false}
            selectedKey={selectedChapter?.$id || chapters[0]?.$id || ""}
            onSelectionChange={(key) => {
              const chapter = chapters.find((c) => c.$id === key);

              if (chapter) handleChapterClick(chapter);
            }}
          >
            {chapters.map((chapter) => (
              <Tab
                key={chapter.$id}
                title={
                  <span className="truncate text-base py-2 px-4 font-medium">
                    {chapter.name}
                  </span>
                }
              />
            ))}
          </Tabs>
        )}
        {showChaptersList && !hasAnyContent && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-lg">
            No content in this chapter.
          </div>
        )}
        {showChaptersList && hasAnyContent && (
          <>
            <Tabs
              aria-label="Content Type"
              className="w-full mb-8"
              isVertical={false}
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
            >
              {flashcards.length > 0 && (
                <Tab
                  key="flashcards"
                  title={
                    <span className="font-semibold text-lg py-4 px-6">
                      Flashcards
                    </span>
                  }
                />
              )}
              {summaries.length > 0 && (
                <Tab
                  key="summaries"
                  title={
                    <span className="font-semibold text-lg py-4 px-6">
                      Summaries
                    </span>
                  }
                />
              )}
              {quizzes.length > 0 && (
                <Tab
                  key="quizzes"
                  title={
                    <span className="font-semibold text-lg py-4 px-6">
                      Quizzes
                    </span>
                  }
                />
              )}
              {audiobooks.length > 0 && (
                <Tab
                  key="audiobooks"
                  title={
                    <span className="font-semibold text-lg py-4 px-6">
                      Audiobooks
                    </span>
                  }
                />
              )}
              {storyboards.length > 0 && (
                <Tab
                  key="storyboards"
                  title={
                    <span className="font-semibold text-lg py-4 px-6">
                      Storyboards
                    </span>
                  }
                />
              )}
            </Tabs>
            {activeTab === "flashcards" && flashcards.length > 0 && (
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Flashcards
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flashcards.map((flashcardSet) => (
                      <button
                        key={flashcardSet.$id}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                        onClick={() => {
                          setSelectedFlashcardSet(flashcardSet);
                          setCurrentCardIndex(0);
                          setIsFlipped(false);
                          setShowFlashcardModal(true);
                        }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {flashcardSet.title}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {flashcardSet.cards.length} cards
                        </p>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
            {activeTab === "summaries" && summaries.length > 0 && (
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Summaries
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {summaries.map((summary) => (
                      <button
                        key={summary.$id}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                        onClick={() => {
                          setSelectedSummary(summary);
                          setShowSummaryModal(true);
                        }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {summary.summary?.split(" ").slice(0, 10).join(" ")}
                          {summary.summary?.split(" ").length > 10
                            ? "..."
                            : ""}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                          {new Date(summary.createdAt).toLocaleDateString()}
                        </p>
                        <span className="text-xs text-indigo-500 dark:text-indigo-300 underline">
                          View Summary
                        </span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
            {activeTab === "quizzes" && quizzes.length > 0 && (
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Quizzes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes.map((quiz) => (
                      <button
                        key={quiz.$id}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          setQuizQuestionIndex(0);
                          setQuizUserAnswers([]);
                          setQuizScore(null);
                          setShowQuizModal(true);
                        }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                          {quiz.questions.length} questions
                        </p>
                        <span className="text-xs text-indigo-500 dark:text-indigo-300 underline">
                          Take Quiz
                        </span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
            {activeTab === "audiobooks" && audiobooks.length > 0 && (
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Audiobooks
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {audiobooks.map((ab) => (
                      <button
                        key={ab.$id}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                        onClick={() => {
                          setSelectedAudiobook(ab);
                          setShowAudiobookModal(true);
                        }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {ab.title || "Untitled Audiobook"}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                          {ab.createdAt
                            ? new Date(ab.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                        <span className="text-xs text-indigo-500 dark:text-indigo-300 underline">
                          Listen
                        </span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
            {activeTab === "storyboards" && storyboards.length > 0 && (
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Storyboards
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {storyboards.map((storyboard) => (
                      <button
                        key={storyboard.$id}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                        onClick={() => {
                          setSelectedStoryboard(storyboard);
                          setCurrentStoryboardSceneIndex(0);
                          setShowStoryboardModal(true);
                        }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {storyboard.title}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                          {storyboard.boards.length} boards
                        </p>
                        <span className="text-xs text-indigo-500 dark:text-indigo-300 underline">
                          View Storyboard
                        </span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
        {activeTab === "latest-updates" && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Chapters</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{chapters.length}</p>
                    </div>
                    <div className="text-3xl">📚</div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium">Flashcards</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {flashcards.reduce((total, set) => total + set.cards.length, 0)}
                      </p>
                    </div>
                    <div className="text-3xl">🎯</div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Quizzes</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {quizzes.reduce((total, quiz) => total + quiz.questions.length, 0)}
                      </p>
                    </div>
                    <div className="text-3xl">🧠</div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Web Notes</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{webNotes.length}</p>
                    </div>
                    <div className="text-3xl">📝</div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <span>🕒</span>
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {chapters.length > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl">📚</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Latest Chapter: <span className="text-indigo-600 dark:text-indigo-400">{chapters[chapters.length - 1]?.name}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Added {chapters[chapters.length - 1]?.$createdAt ? new Date(chapters[chapters.length - 1].$createdAt).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {flashcards.length > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl">🎯</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Flashcards Available: <span className="text-green-600 dark:text-green-400">{flashcards.length} sets</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {flashcards.reduce((total, set) => total + set.cards.length, 0)} total cards to study
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {quizzes.length > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl">🧠</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Quizzes Ready: <span className="text-purple-600 dark:text-purple-400">{quizzes.length} quizzes</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Test your knowledge with interactive questions
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {webNotes.length > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl">📝</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Web Notes: <span className="text-orange-600 dark:text-orange-400">{webNotes.length} saved</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Latest: {webNotes[webNotes.length - 1]?.title}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {chapters.length === 0 && flashcards.length === 0 && quizzes.length === 0 && webNotes.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Welcome to your Space!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Start by exploring chapters or creating your first content.
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardBody>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <span>⚡</span>
                    Quick Actions
                  </h2>
                  <div className="space-y-4">
                    <button
                      className="w-full p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:scale-105 transition-all duration-200 text-left"
                      onClick={() => {
                        setShowChaptersList(true);
                        setActiveTab("chapters");
                      }}
                    >
                      <div className="text-2xl mb-2">📚</div>
                      <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Browse Chapters</h3>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Explore learning content</p>
                    </button>
                    
                    <button
                      className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg hover:scale-105 transition-all duration-200 text-left"
                      onClick={() => setShowImportModal(true)}
                    >
                      <div className="text-2xl mb-2">🌐</div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Import Web Content</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Create notes from websites</p>
                    </button>
                    
                    <button
                      className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:scale-105 transition-all duration-200 text-left"
                      onClick={() => setIsSearchWidgetOpen(true)}
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">Search Web</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Find information online</p>
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
        {activeTab === "webnotes" && (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardBody>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Web Notes
                </h2>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  onClick={() => setShowImportModal(true)}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4v16m8-8H4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  New Web Note
                </button>
              </div>
              {webNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {webNotes.map((note) => (
                    <button
                      key={note.$id}
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
                      onClick={() => {
                        setSelectedWebNote(note);
                        setShowWebNoteModal(true);
                      }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {note.title}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        Saved on{" "}
                        {new Date(note.$createdAt).toLocaleDateString()} from{" "}
                        <a
                          className="underline hover:text-indigo-400"
                          href={note.sourceUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {new URL(note.sourceUrl).hostname}
                        </a>
                      </p>
                      <span className="text-xs text-indigo-500 dark:text-indigo-300 underline">
                        View Note
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 dark:text-gray-500">
                    You haven&apos;t saved any web notes yet. Generate some
                    from the &apos;New Web Note&apos; button!
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </main>
      {/* Flashcard Modal */}
      {showFlashcardModal && selectedFlashcardSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full relative border border-slate-100 dark:border-slate-800">
            <button
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              onClick={() => setShowFlashcardModal(false)}
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-center mb-6 text-gray-900 dark:text-white">
              {selectedFlashcardSet.title}
            </h3>
            {selectedFlashcardSet.cards.length > 0 && (
              <div className="flex flex-col items-center">
                {/* Minimal Rotatable Flashcard */}
                <div
                  className="w-72 h-48 mb-6 relative"
                  role="button"
                  style={{ perspective: "1000px", cursor: "pointer" }}
                  tabIndex={0}
                  onClick={() => setIsFlipped((f) => !f)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsFlipped((f) => !f);
                    }
                  }}
                >
                  <div
                    className="absolute w-full h-full"
                    style={{
                      transition: "transform 0.5s",
                      transformStyle: "preserve-3d",
                      transform: isFlipped
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                    }}
                  >
                    {/* Front (Question) */}
                    <div
                      className="absolute w-full h-full flex items-center justify-center rounded-xl shadow border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-semibold"
                      style={{
                        backfaceVisibility: "hidden",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      <span className="text-gray-900 dark:text-white text-center px-4">
                        {selectedFlashcardSet.cards[currentCardIndex].question}
                      </span>
                    </div>
                    {/* Back (Answer) */}
                    <div
                      className="absolute w-full h-full flex items-center justify-center rounded-xl shadow border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-semibold"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      <span className="text-gray-900 dark:text-white text-center px-4">
                        {selectedFlashcardSet.cards[currentCardIndex].answer}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full mt-4">
                  <button
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    onClick={() => {
                      setCurrentCardIndex((i) =>
                        i > 0 ? i - 1 : selectedFlashcardSet.cards.length - 1,
                      );
                      setIsFlipped(false);
                    }}
                  >
                    Previous
                  </button>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {currentCardIndex + 1} / {selectedFlashcardSet.cards.length}
                  </span>
                  <button
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    onClick={() => {
                      setCurrentCardIndex((i) =>
                        i < selectedFlashcardSet.cards.length - 1 ? i + 1 : 0,
                      );
                      setIsFlipped(false);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Storyboard Modal */}
      {showStoryboardModal && selectedStoryboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-6xl w-full relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl z-10"
              onClick={() => setShowStoryboardModal(false)}
            >
              ×
            </button>

            <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              {selectedStoryboard.title}
            </h3>

            {selectedStoryboard.storyboards && selectedStoryboard.storyboards.length > 0 && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden shadow-md mb-6">
                    <div className="md:flex">
                      <div className="md:w-1/2">
                        <img
                          alt={`Scene ${selectedStoryboard.storyboards[currentStoryboardSceneIndex].scene_number}`}
                          className="w-full h-64 md:h-96 object-cover"
                          src={selectedStoryboard.storyboards[currentStoryboardSceneIndex].image_url || selectedStoryboard.image_url}
                        />
                      </div>
                      <div className="md:w-1/2 p-6 flex flex-col justify-center">
                        <div className="mb-4">
                          <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">
                            Scene {selectedStoryboard.storyboards[currentStoryboardSceneIndex].scene_number}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {currentStoryboardSceneIndex + 1} of {selectedStoryboard.storyboards.length}
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Description:</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {selectedStoryboard.storyboards[currentStoryboardSceneIndex].supporting_text}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Image Prompt:</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed italic">
                            {selectedStoryboard.storyboards[currentStoryboardSceneIndex].image_prompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full max-w-lg">
                    <button
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
                      onClick={() => {
                        setCurrentStoryboardSceneIndex((i) =>
                          i > 0 ? i - 1 : selectedStoryboard.storyboards.length - 1,
                        );
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {currentStoryboardSceneIndex + 1} / {selectedStoryboard.storyboards.length}
                    </span>
                    <button
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
                      onClick={() => {
                        setCurrentStoryboardSceneIndex((i) =>
                          i < selectedStoryboard.storyboards.length - 1 ? i + 1 : 0,
                        );
                      }}
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scene Thumbnails */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">All Scenes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {selectedStoryboard.storyboards.map((scene, index) => (
                      <button
                        key={index}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                          currentStoryboardSceneIndex === index
                            ? 'border-indigo-500 shadow-lg'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setCurrentStoryboardSceneIndex(index)}
                      >
                        <img
                          alt={`Scene ${scene.scene_number} thumbnail`}
                          className="w-full h-20 object-cover"
                          src={scene.image_url || selectedStoryboard.image_url}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                          Scene {scene.scene_number}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}