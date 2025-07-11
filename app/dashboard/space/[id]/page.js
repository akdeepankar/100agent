"use client";

import { useState, useEffect } from "react";
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
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const teams = new Teams(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Database and Collection IDs
const DATABASE_ID = "learning_spaces";
const CHAPTERS_COLLECTION_ID = "chapters";
const FLASHCARDS_COLLECTION_ID = "flashcards";
const QUIZZES_COLLECTION_ID = "quizzes";
const STORYBOARDS_COLLECTION_ID = "storyboards";
const STORYBOARDS_BUCKET_ID = "files"; // Bucket for storing storyboard images

export default function SpaceDashboard({ params }) {
  const router = useRouter();
  const spaceId = params.id;
  const [user, setUser] = useState(null);
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("flashcards");
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] =
    useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    question: "",
    answer: "",
  });
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [editedChapter, setEditedChapter] = useState({
    name: "",
    description: "",
  });
  const [urlInput, setUrlInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [showGeneratedFlashcardsModal, setShowGeneratedFlashcardsModal] =
    useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState(null);
  const [showEditFlashcardModal, setShowEditFlashcardModal] = useState(false);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [showGenerateSummaryModal, setShowGenerateSummaryModal] =
    useState(false);
  const [summaryUrlInput, setSummaryUrlInput] = useState("");
  const [summaryResult, setSummaryResult] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summarySaveLoading, setSummarySaveLoading] = useState(false);
  const [summarySaveError, setSummarySaveError] = useState("");
  const [summarySaveSuccess, setSummarySaveSuccess] = useState(false);
  // Add state for summary title
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizInput, setQuizInput] = useState("");
  const [quizInputType, setQuizInputType] = useState("text"); // 'text' or 'url'
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  // Add new state variables
  const [quizDifficulty, setQuizDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState(5);
  // Add new state for quiz preview modal
  const [showQuizPreviewModal, setShowQuizPreviewModal] = useState(false);
  // Add quizzes state after other state variables
  const [quizzes, setQuizzes] = useState([]);
  const [showStoryboardModal, setShowStoryboardModal] = useState(false);
  const [storyboardPayload, setStoryboardPayload] = useState({
    description: "A magical forest with glowing mushrooms",
    image_type: "Entertainment",
    number_of_boards: 3,
    art_style: "Studio Ghibli style",
  });
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [generatedStoryboards, setGeneratedStoryboards] = useState([]);
  const [showStoryboardResultModal, setShowStoryboardResultModal] =
    useState(false);
  const [currentStoryboardIndex, setCurrentStoryboardIndex] = useState(0);
  const [storyboardImageUrl, setStoryboardImageUrl] = useState("");
  const [storyboards, setStoryboards] = useState([]);
  const [isSavingStoryboard, setIsSavingStoryboard] = useState(false);
  const [selectedStoryboardForView, setSelectedStoryboardForView] = useState(null);
  const [currentViewStoryboardIndex, setCurrentViewStoryboardIndex] = useState(0);
  const [showStoryboardViewModal, setShowStoryboardViewModal] = useState(false);
  // Add state for editing flashcard values
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [isSavingFlashcard, setIsSavingFlashcard] = useState(false);
  // Add state for editing flashcard title
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  // Add state for editing quiz title
  const [showEditQuizTitleModal, setShowEditQuizTitleModal] = useState(false);
  const [editingQuizTitle, setEditingQuizTitle] = useState("");
  const [isSavingQuizTitle, setIsSavingQuizTitle] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  // Add state for custom delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [isDeletingFlashcard, setIsDeletingFlashcard] = useState(false);
  // Add state for individual card deletion confirmation modal
  const [showDeleteCardConfirmModal, setShowDeleteCardConfirmModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await account.get();

        setUser(userData);

        // Fetch space details
        const spaceData = await teams.get(spaceId);

        setSpace(spaceData);

        // Fetch chapters
        await fetchChapters(spaceId);

        setLoading(false);
      } catch (err) {
        setError("Failed to load space data: " + err.message);
        setLoading(false);
      }
    };

    checkUser();
  }, [spaceId]);

  useEffect(() => {
    // Add custom scrollbar styles only on client side
    if (typeof window !== "undefined") {
      const style = document.createElement("style");

      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `;
      document.head.appendChild(style);

      // Cleanup function
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  const fetchChapters = async (spaceId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAPTERS_COLLECTION_ID,
        [Query.equal("spaceId", spaceId)],
      );

      setChapters(response.documents);
    } catch (err) {
      setError("Failed to fetch chapters");
    }
  };

  const fetchFlashcards = async (chapterId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        [Query.equal("chapterId", chapterId)],
      );

      setFlashcards(response.documents);
    } catch (err) {
      setError("Failed to fetch flashcards");
    }
  };

  const fetchSummaries = async (chapterId) => {
    if (!chapterId) {
      return;
    }

    try {
      const response = await databases.listDocuments(DATABASE_ID, "summaries", [
        Query.equal("chapterId", chapterId),
        Query.equal("spaceId", spaceId),
        Query.orderDesc("createdAt"),
      ]);

      setSummaries(response.documents);
    } catch (err) {
      toast.error("Failed to load summaries");
    }
  };

  const fetchQuizzes = async (chapterId) => {
    if (!chapterId) {
      return;
    }

    try {
      const response = await databases.listDocuments(DATABASE_ID, "quizzes", [
        Query.equal("chapterId", chapterId),
        Query.equal("spaceId", spaceId),
        Query.orderDesc("createdAt"),
      ]);

      // Parse the questions JSON string for each quiz
      const parsedQuizzes = response.documents.map((doc) => ({
        ...doc,
        questions: JSON.parse(doc.questions),
      }));

      setQuizzes(parsedQuizzes);
    } catch (err) {
      toast.error("Failed to load quizzes");
    }
  };

  const fetchStoryboards = async (chapterId) => {
    if (!chapterId) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        STORYBOARDS_COLLECTION_ID,
        [Query.equal("chapterId", chapterId), Query.orderDesc("createdAt")],
      );
      const parsedStoryboards = response.documents.map((doc) => {
        const parsedBoards = JSON.parse(doc.boards);
        // Handle both old format (array) and new format (object with image_url and storyboards)
        if (Array.isArray(parsedBoards)) {
          return {
            ...doc,
            boards: parsedBoards,
            image_url: null // Old format didn't have image_url
          };
        } else {
          return {
            ...doc,
            boards: parsedBoards.storyboards || [],
            image_url: parsedBoards.image_url || doc.image || null
          };
        }
      });

      setStoryboards(parsedStoryboards);
    } catch (err) {
      if (err.code !== 404) {
        toast.error("Failed to load storyboards");
      } else {
        setStoryboards([]);
      }
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    try {
      await databases.createDocument(
        DATABASE_ID,
        CHAPTERS_COLLECTION_ID,
        ID.unique(),
        {
          name: newChapterName,
          description: newChapterDescription,
          spaceId: spaceId,
          createdAt: new Date().toISOString(),
          createdBy: user.$id,
        },
      );
      setShowCreateChapterModal(false);
      setNewChapterName("");
      setNewChapterDescription("");
      await fetchChapters(spaceId);
    } catch (err) {
      setError("Failed to create chapter");
    }
  };

  const handleGenerateFlashcards = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(""); // Clear any previous errors
    try {
      // First check if the API is accessible
      const apiUrl = "/api/flashcards";

      // Increase timeout to 90 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      // Validate URL input
      if (!urlInput.trim()) {
        throw new Error("Please enter a valid URL");
      }

      // Ensure URL is properly formatted
      let formattedUrl = urlInput.trim();

      if (
        !formattedUrl.startsWith("http://") &&
        !formattedUrl.startsWith("https://")
      ) {
        formattedUrl = "https://" + formattedUrl;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        signal: controller.signal,
        body: JSON.stringify({
          url: formattedUrl,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 400) {
          throw new Error("Invalid URL format. Please enter a valid URL.");
        }
        throw new Error(
          errorData?.message || `Server error: ${response.status}`,
        );
      }

      const responseData = await response.json();

      // Check if the response has the expected structure
      if (!responseData || typeof responseData !== "object") {
        throw new Error("Invalid response format from server");
      }

      // Handle the new response format
      if (responseData.status === "error") {
        throw new Error(responseData.message || "Server error");
      }

      if (responseData.status !== "success" || !responseData.data?.flashcards) {
        throw new Error("Invalid response format from server");
      }

      const flashcards = responseData.data.flashcards;

      // Validate each flashcard has the required fields
      const validFlashcards = flashcards.filter(
        (card) =>
          card &&
          typeof card === "object" &&
          typeof card.question === "string" &&
          typeof card.answer === "string",
      );

      if (validFlashcards.length === 0) {
        throw new Error("No valid flashcards found in the response");
      }

      setGeneratedFlashcards(validFlashcards);
      setShowToolsModal(false); // Close the tools modal
      setShowGeneratedFlashcardsModal(true); // Open the new modal
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          "Request timed out. The server is taking too long to respond. Please try again.",
        );
      } else if (err.message.includes("Failed to fetch")) {
        setError(
          "Could not connect to the flashcard generation service. Please try again later.",
        );
      } else {
        setError(
          err.message || "Failed to generate flashcards. Please try again.",
        );
      }
      setGeneratedFlashcards([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedFlashcards = async () => {
    if (!selectedChapter || !generatedFlashcards.length) return;

    try {
      setError("");

      // Create a single document with the entire flashcard set
      await databases.createDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        ID.unique(),
        {
          chapterId: selectedChapter.$id,
          title: `Flashcards for ${selectedChapter.name}`,
          cards: JSON.stringify(generatedFlashcards), // Convert array to string
          createdAt: new Date().toISOString(),
          createdBy: user.$id,
        },
      );

      setGeneratedFlashcards([]);
      setShowGeneratedFlashcardsModal(false);
      setUrlInput("");
      // Refresh flashcards list
      loadFlashcards(selectedChapter.$id);
      toast.success("Flashcards saved successfully!");
    } catch (err) {
      setError("Failed to save flashcards. Please try again.");
    }
  };

  const loadFlashcards = async (chapterId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        [Query.equal("chapterId", chapterId), Query.orderDesc("createdAt")],
      );

      // Parse the cards JSON string for each document
      const parsedFlashcards = response.documents.map((doc) => ({
        ...doc,
        cards: JSON.parse(doc.cards),
      }));

      setFlashcards(parsedFlashcards);
    } catch (err) {
      toast.error("Failed to load flashcards");
    }
  };

  const handleChapterClick = async (chapter) => {
    setSelectedChapter(chapter);
    await fetchFlashcards(chapter.$id);
    await fetchSummaries(chapter.$id);
    await fetchQuizzes(chapter.$id);
    await fetchStoryboards(chapter.$id);
  };

  const handleEditChapter = async (e) => {
    e.preventDefault();
    try {
      await databases.updateDocument(
        DATABASE_ID,
        CHAPTERS_COLLECTION_ID,
        selectedChapter.$id,
        {
          name: editedChapter.name,
          description: editedChapter.description,
        },
      );
      setShowEditChapterModal(false);
      await fetchChapters(spaceId);
      // Update selected chapter with new data
      const updatedChapter = { ...selectedChapter, ...editedChapter };

      setSelectedChapter(updatedChapter);
    } catch (err) {
      setError("Failed to update chapter");
    }
  };

  const handleDeleteChapter = async () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Are you sure you want to delete this chapter? This will also delete all associated flashcards.",
      )
    ) {
      try {
        // First delete all flashcards in this chapter
        const flashcards = await databases.listDocuments(
          DATABASE_ID,
          FLASHCARDS_COLLECTION_ID,
          [Query.equal("chapterId", selectedChapter.$id)],
        );

        for (const flashcard of flashcards.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            FLASHCARDS_COLLECTION_ID,
            flashcard.$id,
          );
        }

        // Then delete the chapter
        await databases.deleteDocument(
          DATABASE_ID,
          CHAPTERS_COLLECTION_ID,
          selectedChapter.$id,
        );

        setSelectedChapter(null);
        await fetchChapters(spaceId);
      } catch (err) {
        setError("Failed to delete chapter");
      }
    }
  };

  const handleCardClick = (flashcardSet, cardIndex) => {
    setSelectedFlashcardSet(flashcardSet);
    setSelectedCardIndex(cardIndex);
    
    // Initialize editing values
    const cards = typeof flashcardSet.cards === "string"
      ? JSON.parse(flashcardSet.cards)
      : flashcardSet.cards;
    
    setEditingQuestion(cards[cardIndex].question);
    setEditingAnswer(cards[cardIndex].answer);
    setShowEditFlashcardModal(true);
  };

  const handleEditCard = (field, value) => {
    if (selectedFlashcardSet && selectedCardIndex !== null) {
      const cards =
        typeof selectedFlashcardSet.cards === "string"
          ? JSON.parse(selectedFlashcardSet.cards)
          : selectedFlashcardSet.cards;

      const updatedCards = [...cards];

      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        [field]: value,
      };

      // Update the flashcard set in the database
      databases
        .updateDocument(
          DATABASE_ID,
          FLASHCARDS_COLLECTION_ID,
          selectedFlashcardSet.$id,
          {
            cards: JSON.stringify(updatedCards),
          },
        )
        .then(() => {
          // Update local state
          const updatedFlashcards = flashcards.map((fs) =>
            fs.$id === selectedFlashcardSet.$id
              ? { ...fs, cards: JSON.stringify(updatedCards) }
              : fs,
          );

          setFlashcards(updatedFlashcards);
        })
        .catch((err) => {
          toast.error("Failed to update flashcard");
        });
    }
  };

  const handleDeleteFlashcard = async (flashcardSetId) => {
    // Find the flashcard set to delete
    const flashcardSet = flashcards.find(fs => fs.$id === flashcardSetId);
    if (flashcardSet) {
      setFlashcardToDelete(flashcardSet);
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;

    setIsDeletingFlashcard(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        flashcardToDelete.$id,
      );
      
      // Update local state
      setFlashcards(flashcards.filter(fs => fs.$id !== flashcardToDelete.$id));
      toast.success("Flashcard set deleted successfully!");
      
      // Close modal and reset state
      setShowDeleteConfirmModal(false);
      setFlashcardToDelete(null);
    } catch (err) {
      toast.error("Failed to delete flashcard set");
    } finally {
      setIsDeletingFlashcard(false);
    }
  };

  const handleDeleteIndividualCard = async (flashcardSet, cardIndex) => {
    const cards = typeof flashcardSet.cards === "string" 
      ? JSON.parse(flashcardSet.cards) 
      : flashcardSet.cards;
    
    setCardToDelete({
      flashcardSet,
      cardIndex,
      card: cards[cardIndex]
    });
    setShowDeleteCardConfirmModal(true);
  };

  const confirmDeleteIndividualCard = async () => {
    if (!cardToDelete) return;

    setIsDeletingCard(true);
    try {
      const { flashcardSet, cardIndex } = cardToDelete;
      const cards = typeof flashcardSet.cards === "string" 
        ? JSON.parse(flashcardSet.cards) 
        : flashcardSet.cards;
      
      // Remove the card at the specified index
      const updatedCards = cards.filter((_, index) => index !== cardIndex);
      
      // Update the database
      await databases.updateDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        flashcardSet.$id,
        {
          cards: JSON.stringify(updatedCards),
        },
      );
      
      // Update local state
      const updatedFlashcards = flashcards.map(fs => 
        fs.$id === flashcardSet.$id 
          ? { ...fs, cards: JSON.stringify(updatedCards) }
          : fs
      );
      setFlashcards(updatedFlashcards);
      
      // Close edit modal if the deleted card was being edited
      if (selectedFlashcardSet?.$id === flashcardSet.$id && selectedCardIndex === cardIndex) {
        setShowEditFlashcardModal(false);
        setSelectedFlashcardSet(null);
        setSelectedCardIndex(null);
      }
      
      toast.success("Card deleted successfully!");
      
      // Close modal and reset state
      setShowDeleteCardConfirmModal(false);
      setCardToDelete(null);
    } catch (err) {
      toast.error("Failed to delete card");
    } finally {
      setIsDeletingCard(false);
    }
  };

  async function handleSaveSummary(summary) {
    if (!selectedChapter?.$id) {
      setSummarySaveError("Please select a chapter first");

      return;
    }

    if (!summaryTitle.trim()) {
      setSummarySaveError("Please enter a title for the summary");
      return;
    }

    setSummarySaveLoading(true);
    setSummarySaveError("");
    setSummarySaveSuccess(false);

    try {
      const databases = new Databases(client);
      
      const summaryData = {
        title: summaryTitle.trim(),
        summary: summary,
        url: summaryUrlInput,
        spaceId: spaceId,
        chapterId: selectedChapter.$id,
        userId: user.$id,
        createdAt: new Date().toISOString(),
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        "summaries",
        ID.unique(),
        summaryData,
      );

      setSummarySaveSuccess(true);
      // Refresh summaries after saving
      await fetchSummaries(selectedChapter.$id);
      // Close the modal after successful save
      setTimeout(() => {
        setShowGenerateSummaryModal(false);
        setSummaryUrlInput("");
        setSummaryResult("");
        setSummaryError("");
        setSummaryTitle("");
        setSummarySaveSuccess(false);
      }, 1500);
    } catch (err) {
      setSummarySaveError(err.message || "Failed to save summary.");
    } finally {
      setSummarySaveLoading(false);
    }
  }

  const handleDeleteSummary = async (summaryId) => {
    try {
      const databases = new Databases(client);

      await databases.deleteDocument(DATABASE_ID, "summaries", summaryId);
      // Refresh summaries after deletion
      await fetchSummaries(selectedChapter.$id);
      toast.success("Summary deleted successfully");
    } catch (err) {
      toast.error("Failed to delete summary");
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setIsGeneratingQuiz(true);
      const response = await fetch(
        "/api/quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: quizInput,
            num_questions: questionCount,
            difficulty: quizDifficulty,
          }),
        },
      );

      const responseText = await response.text();

      // Parse the JSON response
      const data = JSON.parse(responseText);

      // Check for the nested data structure
      if (!data.data || !data.data.quiz || !data.data.quiz.questions) {
        throw new Error("Invalid quiz data structure");
      }

      // Set the quiz data from the nested structure
      setGeneratedQuiz(data.data.quiz.questions);
      setShowQuizModal(false);
      setShowQuizPreviewModal(true);
      toast.success("Quiz generated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      if (!selectedChapter) {
        toast.error("Please select a chapter first");

        return;
      }

      const quizData = {
        title: "Generated Quiz",
        description: "Quiz generated from content",
        questions: JSON.stringify(generatedQuiz), // Store as JSON string like flashcards
        spaceId: spaceId,
        chapterId: selectedChapter.$id,
        createdBy: user.$id,
        createdAt: new Date().toISOString(),
      };

      await databases.createDocument(
        DATABASE_ID,
        "quizzes",
        ID.unique(),
        quizData,
      );

      toast.success("Quiz saved successfully!");
      setShowQuizPreviewModal(false);
      setGeneratedQuiz([]);
    } catch (error) {
      toast.error("Failed to save quiz");
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!storyboardPayload.description) {
      toast.error("Please enter a description for the storyboard.");

      return;
    }
    setIsGeneratingStoryboard(true);
    try {
      // Combine description with image_type and art_style
      const enhancedDescription = `${storyboardPayload.description} (${storyboardPayload.image_type} style, ${storyboardPayload.art_style})`;
      
      const response = await fetch(
        "/api/storyboards",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: enhancedDescription,
            number_of_boards: parseInt(storyboardPayload.number_of_boards, 10),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to generate storyboard. Please try again.",
        }));

        throw new Error(
          errorData.message ||
            "Failed to generate storyboard. Please try again.",
        );
      }

      const result = await response.json();

      toast.success("Storyboard generated successfully!");

      if (result.data && result.data.storyboards) {
        setGeneratedStoryboards(result.data.storyboards);
        setStoryboardImageUrl(result.data.image_url || "");
        setCurrentStoryboardIndex(0); // Reset to first storyboard
        setShowStoryboardResultModal(true);
      }

      setShowStoryboardModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleNextStoryboard = () => {
    if (currentStoryboardIndex < generatedStoryboards.length - 1) {
      setCurrentStoryboardIndex(currentStoryboardIndex + 1);
    }
  };

  const handlePreviousStoryboard = () => {
    if (currentStoryboardIndex > 0) {
      setCurrentStoryboardIndex(currentStoryboardIndex - 1);
    }
  };

  const uploadStoryboardImage = async (imageUrl) => {
    try {
      // Use server-side API to download the image (bypasses CORS)
      const downloadResponse = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download image from server');
      }

      // Get the image blob from our server
      const blob = await downloadResponse.blob();
      
      // Create a file from the blob
      const file = new File([blob], `storyboard_${Date.now()}.png`, { type: 'image/png' });
      
      // Upload to Appwrite storage
      const uploadedFile = await storage.createFile(
        STORYBOARDS_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Get the file URL
      const fileUrl = storage.getFileView(STORYBOARDS_BUCKET_ID, uploadedFile.$id);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl
      };
    } catch (error) {
      console.error('Error uploading storyboard image:', error);
      throw error;
    }
  };

  const handleSaveStoryboard = async () => {
    if (!selectedChapter || !generatedStoryboards.length) {
      toast.error("No chapter selected or no storyboard to save.");

      return;
    }
    setIsSavingStoryboard(true);
    try {
      // Create a storyboard object that includes the image URL and all storyboard data
      const storyboardData = {
        image_url: storyboardImageUrl,
        storyboards: generatedStoryboards,
        total_boards: generatedStoryboards.length
      };

      // Upload image to Appwrite storage
      let storyboardImage;
      try {
        storyboardImage = await uploadStoryboardImage(storyboardImageUrl);
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        toast.error("Failed to upload image. Please try again.");
        return;
      }

      const storyboardDataWithImage = {
        ...storyboardData,
        image_url: storyboardImage.fileUrl
      };

      await databases.createDocument(
        DATABASE_ID,
        STORYBOARDS_COLLECTION_ID,
        ID.unique(),
        {
          chapterId: selectedChapter.$id,
          spaceId: spaceId,
          userId: user.$id,
          title: storyboardPayload.description.substring(0, 50) + "...",
          boards: JSON.stringify(storyboardDataWithImage),
          image: storyboardImage.fileUrl,
          createdAt: new Date().toISOString(),
        },
      );

      toast.success("Storyboard saved successfully!");
      setShowStoryboardResultModal(false);
      setGeneratedStoryboards([]);
      setStoryboardImageUrl("");
      await fetchStoryboards(selectedChapter.$id);
    } catch (error) {
      console.error("Error saving storyboard:", error);
      toast.error("Failed to save storyboard.");
    } finally {
      setIsSavingStoryboard(false);
    }
  };

  async function handleDeleteStoryboard(storyboardId) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Are you sure you want to delete this storyboard?")
    )
      return;
    try {
      // Find the storyboard to get the image file ID
      const storyboardToDelete = storyboards.find(sb => sb.$id === storyboardId);
      
      // Delete the image from storage if it exists
      if (storyboardToDelete && storyboardToDelete.image_url) {
        try {
          // Extract file ID from the image URL
          // Appwrite file URLs are in format: https://cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view
          const urlParts = storyboardToDelete.image_url.split('/');
          const fileId = urlParts[urlParts.length - 2]; // Get the file ID from the URL
          
          if (fileId && fileId !== 'view') {
            await storage.deleteFile(STORYBOARDS_BUCKET_ID, fileId);
            console.log('Image deleted from storage:', fileId);
          }
        } catch (storageError) {
          console.error('Failed to delete image from storage:', storageError);
          // Continue with storyboard deletion even if image deletion fails
        }
      }

      // Delete the storyboard document from database
      await databases.deleteDocument(
        DATABASE_ID,
        STORYBOARDS_COLLECTION_ID,
        storyboardId,
      );
      
      toast.success("Storyboard deleted successfully!");
      setStoryboards(storyboards.filter((item) => item.$id !== storyboardId));
    } catch (error) {
      console.error("Error deleting storyboard:", error);
      toast.error("Failed to delete storyboard.");
    }
  }

  const handleViewStoryboard = (storyboard) => {
    setSelectedStoryboardForView(storyboard);
    setCurrentViewStoryboardIndex(0);
    setShowStoryboardViewModal(true);
  };

  const handleNextViewStoryboard = () => {
    if (selectedStoryboardForView && currentViewStoryboardIndex < selectedStoryboardForView.boards.length - 1) {
      setCurrentViewStoryboardIndex(currentViewStoryboardIndex + 1);
    }
  };

  const handlePreviousViewStoryboard = () => {
    if (currentViewStoryboardIndex > 0) {
      setCurrentViewStoryboardIndex(currentViewStoryboardIndex - 1);
    }
  };


  const handleSaveFlashcard = async () => {
    if (!selectedFlashcardSet || selectedCardIndex === null) return;

    setIsSavingFlashcard(true);
    try {
      const cards = typeof selectedFlashcardSet.cards === "string"
        ? JSON.parse(selectedFlashcardSet.cards)
        : selectedFlashcardSet.cards;

      const updatedCards = [...cards];
      updatedCards[selectedCardIndex] = {
        ...updatedCards[selectedCardIndex],
        question: editingQuestion,
        answer: editingAnswer,
      };

      // Update the flashcard set in the database
      await databases.updateDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        selectedFlashcardSet.$id,
        {
          cards: JSON.stringify(updatedCards),
        },
      );

      // Update local state
      const updatedFlashcards = flashcards.map((fs) =>
        fs.$id === selectedFlashcardSet.$id
          ? { ...fs, cards: JSON.stringify(updatedCards) }
          : fs,
      );

      setFlashcards(updatedFlashcards);
      
      // Close modal and show success message
      closeEditModal();
      toast.success("Flashcard updated successfully!");
    } catch (err) {
      toast.error("Failed to update flashcard");
    } finally {
      setIsSavingFlashcard(false);
    }
  };

  const closeEditModal = () => {
    setShowEditFlashcardModal(false);
    setSelectedFlashcardSet(null);
    setSelectedCardIndex(null);
    setEditingQuestion("");
    setEditingAnswer("");
  };

  const handleEditTitle = (flashcardSet) => {
    setSelectedFlashcardSet(flashcardSet);
    setEditingTitle(flashcardSet.title);
    setShowEditTitleModal(true);
  };

  const handleSaveTitle = async () => {
    if (!selectedFlashcardSet) return;

    setIsSavingTitle(true);
    try {
      // Update the flashcard set title in the database
      await databases.updateDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        selectedFlashcardSet.$id,
        {
          title: editingTitle,
        },
      );

      // Update local state
      const updatedFlashcards = flashcards.map((fs) =>
        fs.$id === selectedFlashcardSet.$id
          ? { ...fs, title: editingTitle }
          : fs,
      );

      setFlashcards(updatedFlashcards);
      
      // Close modal and show success message
      setShowEditTitleModal(false);
      setSelectedFlashcardSet(null);
      setEditingTitle("");
      toast.success("Flashcard title updated successfully!");
    } catch (err) {
      toast.error("Failed to update flashcard title");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleEditQuizTitle = (quiz) => {
    setSelectedQuiz(quiz);
    setEditingQuizTitle(quiz.title);
    setShowEditQuizTitleModal(true);
  };

  const handleSaveQuizTitle = async () => {
    if (!selectedQuiz) return;

    setIsSavingQuizTitle(true);
    try {
      // Update the quiz title in the database
      await databases.updateDocument(
        DATABASE_ID,
        QUIZZES_COLLECTION_ID,
        selectedQuiz.$id,
        {
          title: editingQuizTitle,
        },
      );

      // Update local state
      const updatedQuizzes = quizzes.map((q) =>
        q.$id === selectedQuiz.$id
          ? { ...q, title: editingQuizTitle }
          : q,
      );

      setQuizzes(updatedQuizzes);
      
      // Close modal and show success message
      setShowEditQuizTitleModal(false);
      setSelectedQuiz(null);
      setEditingQuizTitle("");
      toast.success("Quiz title updated successfully!");
    } catch (err) {
      toast.error("Failed to update quiz title");
    } finally {
      setIsSavingQuizTitle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                href="/dashboard"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {space?.name || "Loading..."}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 flex">
        {/* Fixed Left Sidebar - Chapters */}
        <div className="w-80 fixed left-0 top-16 bottom-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chapters
              </h2>
              <button
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                onClick={() => setShowCreateChapterModal(true)}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    fillRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.$id}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedChapter?.$id === chapter.$id
                      ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => handleChapterClick(chapter)}
                >
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {chapter.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {chapter.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Right Content */}
        <div className="ml-80 flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {selectedChapter ? (
              <div className="space-y-8">
                {/* Tab Navigation */}
                <div className="flex-1 overflow-hidden">
                  <div className="px-6">
                    <div className="flex items-center justify-between">
                      <Tabs
                        aria-label="Space Content Tabs"
                        className=""
                        selectedKey={activeTab}
                        onSelectionChange={setActiveTab}
                      >
                        <Tab key="flashcards" title="Flashcards" />
                        <Tab key="summaries" title="Summaries" />
                        <Tab key="quizzes" title="Quizzes" />
                        <Tab key="storyboards" title="Storyboards" />
                      </Tabs>
                      {/* The Add Content button remains untouched here */}
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow"
                        onClick={() => setShowToolsModal(true)}
                      >
                        <svg
                          className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            clipRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            fillRule="evenodd"
                          />
                        </svg>
                        Add Content
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Flashcards Tab */}
                    {activeTab === "flashcards" && (
                      <Card className="transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <CardBody>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Flashcards
                            </h2>
                          </div>
                          {flashcards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {flashcards.map((flashcardSet) => {
                                const cards =
                                  typeof flashcardSet.cards === "string"
                                    ? JSON.parse(flashcardSet.cards)
                                    : flashcardSet.cards;

                                return (
                                  <div
                                    key={flashcardSet.$id}
                                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 min-w-[320px]"
                                  >
                                    <div className="p-6">
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-800">
                                              Flashcards
                                            </span>
                                            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-200 dark:border-purple-800">
                                              {cards.length} cards
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                              {flashcardSet.title}
                                            </h3>
                                            <button
                                              className="p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTitle(flashcardSet);
                                              }}
                                              title="Edit title"
                                            >
                                              <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <path
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                        <button
                                          className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                          onClick={() =>
                                            handleDeleteFlashcard(
                                              flashcardSet.$id,
                                            )
                                          }
                                        >
                                          <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              clipRule="evenodd"
                                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                              fillRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                                        {cards.map((card, index) => (
                                          <div
                                            key={index}
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md group relative"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                              handleCardClick(
                                                flashcardSet,
                                                index,
                                              )
                                            }
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                handleCardClick(
                                                  flashcardSet,
                                                  index,
                                                );
                                              }
                                            }}
                                          >
                                            <button
                                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Delete card"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteIndividualCard(flashcardSet, index);
                                              }}
                                            >
                                              <svg
                                                className="h-4 w-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <path
                                                  clipRule="evenodd"
                                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                  fillRule="evenodd"
                                                />
                                              </svg>
                                            </button>
                                            <p className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                              <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded">
                                                Q
                                              </span>
                                              {card.question}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2">
                                              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded">
                                                A
                                              </span>
                                              {card.answer}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                          <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                            />
                                          </svg>
                                          Created{" "}
                                          {new Date(
                                            flashcardSet.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                 
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500 dark:text-gray-400">
                                No flashcards yet. Create some using the
                                &quot;Add Content&quot; button!
                              </p>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                    {/* Summaries Tab */}
                    {activeTab === "summaries" && (
                      <Card className="transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <CardBody>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Summaries
                            </h2>
                          </div>
                          {summaries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {summaries.map((summary) => (
                                <div
                                  key={summary.$id}
                                  className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedSummary(summary);
                                    setShowSummaryModal(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      setSelectedSummary(summary);
                                      setShowSummaryModal(true);
                                    }
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
                                          Summary
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(
                                            summary.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        {summary.title || "Untitled Summary"}
                                      </h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                                        {summary.summary}
                                      </p>
                                      <a
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-block"
                                        href={summary.url}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Source URL
                                      </a>
                                    </div>
                                    <button
                                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-4"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          window.confirm(
                                            "Are you sure you want to delete this summary?",
                                          )
                                        ) {
                                          handleDeleteSummary(summary.$id);
                                        }
                                      }}
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          clipRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          fillRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500 dark:text-gray-400">
                                No summaries yet. Generate a summary using the
                                &quot;Add Content&quot; button!
                              </p>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                    {/* Quizzes Tab */}
                    {activeTab === "quizzes" && (
                      <Card className="transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <CardBody>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Quizzes
                            </h2>
                          </div>
                          {quizzes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {quizzes.map((quiz) => (
                                <div
                                  key={quiz.$id}
                                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 min-w-[320px]"
                                >
                                  <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {quiz.title}
                                          </h3>
                                          <button
                                            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            onClick={() => handleEditQuizTitle(quiz)}
                                            title="Edit quiz title"
                                          >
                                            <svg
                                              className="h-4 w-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                          {quiz.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                          <span className="flex items-center gap-1">
                                            <svg
                                              className="h-4 w-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                              />
                                            </svg>
                                            {new Date(
                                              quiz.createdAt,
                                            ).toLocaleDateString()}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <svg
                                              className="h-4 w-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                              />
                                            </svg>
                                            {quiz.questions.length} questions
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                          Quiz
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                                      {quiz.questions
                                        .slice(0, 3)
                                        .map((question, index) => (
                                          <div
                                            key={index}
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                                          >
                                            <p className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                              <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded">
                                                Q{index + 1}
                                              </span>
                                              {question.question}
                                            </p>
                                            <div className="space-y-1">
                                              {question.options.map(
                                                (option, optIndex) => (
                                                  <div
                                                    key={optIndex}
                                                    className={`text-sm px-2 py-1 rounded ${
                                                      option ===
                                                      question.correct_answer
                                                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                                        : "text-gray-600 dark:text-gray-300"
                                                    }`}
                                                  >
                                                    {String.fromCharCode(
                                                      65 + optIndex,
                                                    )}
                                                    . {option}
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      {quiz.questions.length > 3 && (
                                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                                          +{quiz.questions.length - 3} more
                                          questions
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                                    <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                                      <span>View All Questions</span>
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M9 5l7 7-7 7"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="mb-4 text-6xl">📝</div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No quizzes yet
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Generate your first quiz to test your
                                students&apos; knowledge
                              </p>
                              <button
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                onClick={() => setShowQuizModal(true)}
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    fillRule="evenodd"
                                  />
                                </svg>
                                Generate Quiz
                              </button>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                    {/* Storyboards Tab */}
                    {activeTab === "storyboards" && (
                      <Card className="transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <CardBody>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Storyboards
                            </h2>
                          </div>
                          {storyboards.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="mb-4 text-6xl">🎬</div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No storyboards yet
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Generate your first storyboard to visualize your
                                ideas.
                              </p>
                              <button
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                onClick={() => {
                                  setShowToolsModal(false);
                                  setShowStoryboardModal(true);
                                }}
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    fillRule="evenodd"
                                  />
                                </svg>
                                Generate Storyboard
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {storyboards.map((sb) => (
                                <div
                                  key={sb.$id}
                                  className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                                        {sb.title || "Untitled Storyboard"}
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                        {sb.createdAt
                                          ? new Date(
                                              sb.createdAt,
                                            ).toLocaleString()
                                          : ""}
                                      </div>
                                      <div className="text-sm text-slate-600 dark:text-slate-300">
                                        {sb.boards.length} scene{sb.boards.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <button
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                        onClick={() => handleViewStoryboard(sb)}
                                      >
                                        <svg
                                          className="h-4 w-4 inline mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                          />
                                          <path
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                          />
                                        </svg>
                                        View Storyboard
                                      </button>
                                      <button
                                        className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-all"
                                        onClick={() =>
                                          handleDeleteStoryboard(sb.$id)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Preview of first scene */}
                                  {sb.boards.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                      <div className="flex items-center gap-4">
                                        {sb.image_url && (
                                          <div className="flex-shrink-0">
                                            <img
                                              alt="Storyboard Preview"
                                              className="w-20 h-20 rounded-md object-cover shadow-sm"
                                              src={sb.image_url}
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                                            Scene 1 Preview
                                          </h4>
                                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {sb.boards[0].supporting_text}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Chapter
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a chapter from the sidebar to view its contents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Chapter Modal */}
      {showEditChapterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-md border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 mb-4">
              Edit Chapter
            </h2>
            <form className="space-y-4" onSubmit={handleEditChapter}>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="edit-chapter-name"
                >
                  Chapter Name
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  id="edit-chapter-name"
                  type="text"
                  value={editedChapter.name}
                  onChange={(e) =>
                    setEditedChapter({
                      ...editedChapter,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="edit-chapter-description"
                >
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  id="edit-chapter-description"
                  rows="3"
                  value={editedChapter.description}
                  onChange={(e) =>
                    setEditedChapter({
                      ...editedChapter,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                  type="submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tools Modal */}
      {showToolsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Content
              </h2>
              <button
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowToolsModal(false)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                onClick={() => {
                  setShowToolsModal(false);
                  setShowCreateFlashcardModal(true);
                }}
              >
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <svg
                    className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Create Flashcards
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manually create flashcards
                  </p>
                </div>
              </button>

              <button
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                onClick={() => {
                  setShowToolsModal(false);
                  setShowGenerateSummaryModal(true);
                }}
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <svg
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Generate Summary
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a summary from text or URL
                  </p>
                </div>
              </button>

              <button
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                onClick={() => {
                  setShowToolsModal(false);
                  setShowQuizModal(true);
                }}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Generate Quiz
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a quiz from text or URL
                  </p>
                </div>
              </button>

              <button
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                onClick={() => {
                  setShowToolsModal(false);
                  setShowStoryboardModal(true);
                }}
              >
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <svg
                    className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Generate Storyboard
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a visual storyboard from a description
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Chapter Modal */}
      {showCreateChapterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-md border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 mb-4">
              Create New Chapter
            </h2>
            <form className="space-y-4" onSubmit={handleCreateChapter}>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="new-chapter-name"
                >
                  Chapter Name
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  id="new-chapter-name"
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="new-chapter-description"
                >
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  id="new-chapter-description"
                  rows="3"
                  value={newChapterDescription}
                  onChange={(e) => setNewChapterDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  type="button"
                  onClick={() => setShowCreateChapterModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                  type="submit"
                >
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Flashcard Modal */}
      {showCreateFlashcardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 mb-4">
              Generate Flashcards
            </h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleGenerateFlashcards}>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="generate-flashcards-url"
                >
                  Enter URL
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  id="generate-flashcards-url"
                  placeholder="https://example.com/article"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setError("");
                  }}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter a valid URL to generate flashcards from the content
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  type="button"
                  onClick={() => {
                    setShowCreateFlashcardModal(false);
                    setUrlInput("");
                    setGeneratedFlashcards([]);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGenerating || !urlInput}
                  type="submit"
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Generate Flashcards"
                  )}
                </button>
              </div>
            </form>

            {generatedFlashcards.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Generated Flashcards ({generatedFlashcards.length})
                </h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {generatedFlashcards.map((flashcard, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Question:
                          </span>
                          <p className="text-slate-900 dark:text-white">
                            {flashcard.question}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Answer:
                          </span>
                          <p className="text-slate-900 dark:text-white">
                            {flashcard.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={handleSaveGeneratedFlashcards}
                  >
                    Save Flashcards
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Flashcards Modal */}
      {showGeneratedFlashcardsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Generated Flashcards ({generatedFlashcards.length})
              </h2>
              <button
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => {
                  setShowGeneratedFlashcardsModal(false);
                  setGeneratedFlashcards([]);
                  setSelectedFlashcard(null);
                  setShowEditFlashcardModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedFlashcards.map((flashcard, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedFlashcard(index);
                      setShowEditFlashcardModal(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedFlashcard(index);
                        setShowEditFlashcardModal(true);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Question:
                        </span>
                        <p className="text-slate-900 dark:text-white line-clamp-2">
                          {flashcard.question}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Answer:
                        </span>
                        <p className="text-slate-900 dark:text-white line-clamp-2">
                          {flashcard.answer}
                        </p>
                      </div>
                    </div>
                    <button
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete flashcard"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFlashcard(index);
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          clipRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowGeneratedFlashcardsModal(false);
                  setGeneratedFlashcards([]);
                  setSelectedFlashcard(null);
                  setShowEditFlashcardModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={handleSaveGeneratedFlashcards}
              >
                Save Flashcards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flashcard Modal */}
      {showEditFlashcardModal &&
        selectedFlashcardSet &&
        selectedCardIndex !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Edit Flashcard
                </h2>
                <button
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={closeEditModal}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="edit-flashcard-question"
                  >
                    Question
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    id="edit-flashcard-question"
                    rows={4}
                    value={editingQuestion}
                    onChange={(e) => setEditingQuestion(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="edit-flashcard-answer"
                  >
                    Answer
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    id="edit-flashcard-answer"
                    rows={6}
                    value={editingAnswer}
                    onChange={(e) => setEditingAnswer(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveFlashcard}
                  disabled={isSavingFlashcard}
                >
                  {isSavingFlashcard ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Generate Summary Modal */}
      {showGenerateSummaryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400 mb-4">
              Generate Summary
            </h2>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSummaryLoading(true);
                setSummaryError("");
                setSummaryResult("");
                try {
                  const res = await fetch(
                    "/api/summary",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: summaryUrlInput }),
                    },
                  );

                  if (!res.ok) throw new Error("Failed to generate summary");
                  const data = await res.json();

                  setSummaryResult(
                    (data && data.data && data.data.summary) ||
                      "No summary returned.",
                  );
                } catch (err) {
                  setSummaryError(err.message || "An error occurred.");
                } finally {
                  setSummaryLoading(false);
                }
              }}
            >
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="generate-summary-url"
                >
                  Enter URL
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  id="generate-summary-url"
                  placeholder="https://example.com/article"
                  type="url"
                  value={summaryUrlInput}
                  onChange={(e) => setSummaryUrlInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  type="button"
                  onClick={() => {
                    setShowGenerateSummaryModal(false);
                    setSummaryUrlInput("");
                    setSummaryResult("");
                    setSummaryError("");
                    setSummaryTitle("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md"
                  disabled={summaryLoading}
                  type="submit"
                >
                  {summaryLoading ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
            {summaryError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{summaryError}</p>
              </div>
            )}
            {summaryResult && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  Summary:
                </h3>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                  {summaryResult}
                </p>
              </div>
            )}
            {summaryResult && (
              <div className="mt-4 flex flex-col items-end gap-2">
                <div className="w-full mb-4">
                  <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="summary-title"
                  >
                    Summary Title
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    id="summary-title"
                    placeholder="Enter a title for this summary"
                    type="text"
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                  />
                </div>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-md"
                  disabled={summarySaveLoading || !summaryTitle.trim()}
                  onClick={async () => await handleSaveSummary(summaryResult)}
                >
                  {summarySaveLoading
                    ? "Saving..."
                    : summarySaveSuccess
                      ? "Saved!"
                      : "Save"}
                </button>
                {summarySaveError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {summarySaveError}
                  </p>
                )}
                {summarySaveSuccess && (
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Summary saved successfully!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary View Modal */}
      {showSummaryModal && selectedSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400">
                Summary
              </h2>
              <button
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => {
                  setShowSummaryModal(false);
                  setSelectedSummary(null);
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Created on{" "}
                  {new Date(selectedSummary.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <a
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  href={selectedSummary.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View Source
                </a>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {selectedSummary.title || "Untitled Summary"}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {selectedSummary.summary}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this summary?",
                      )
                    ) {
                      handleDeleteSummary(selectedSummary.$id);
                      setShowSummaryModal(false);
                      setSelectedSummary(null);
                    }
                  }}
                >
                  Delete Summary
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                  onClick={() => {
                    setShowSummaryModal(false);
                    setSelectedSummary(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Generation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate Quiz
              </h2>
              <button
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizInput("");
                  setGeneratedQuiz(null);
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Input Type Selection */}
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quizInputType === "text"
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setQuizInputType("text")}
                >
                  Enter Text
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quizInputType === "url"
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setQuizInputType("url")}
                >
                  Enter URL
                </button>
              </div>

              {/* Quiz Settings */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Difficulty Selection */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    htmlFor="quiz-difficulty"
                  >
                    Difficulty
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    id="quiz-difficulty"
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Question Count Selection */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    htmlFor="question-count"
                  >
                    Number of Questions
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    id="question-count"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="quiz-input"
                >
                  {quizInputType === "text" ? "Enter your text" : "Enter URL"}
                </label>
                {quizInputType === "text" ? (
                  <textarea
                    className="w-full h-32 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-none"
                    id="quiz-input"
                    placeholder="Enter your text here..."
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                  />
                ) : (
                  <input
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    id="quiz-input"
                    placeholder="https://example.com"
                    type="url"
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                  />
                )}
              </div>

              {/* Generate Button */}
              <button
                className={`w-full px-4 py-2 bg-indigo-600 text-white rounded-lg transition-all ${
                  !quizInput || isGeneratingQuiz
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-indigo-700"
                }`}
                disabled={!quizInput || isGeneratingQuiz}
                onClick={handleGenerateQuiz}
              >
                {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Preview Modal */}
      {showQuizPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generated Quiz
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {generatedQuiz.map((question, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border ${
                          option === question.correct_answer
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <span className="text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => {
                  setShowQuizPreviewModal(false);
                  setGeneratedQuiz([]);
                }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                onClick={handleSaveQuiz}
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard Generation Modal */}
      {showStoryboardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent dark:from-yellow-400 dark:to-orange-400 mb-4">
              Generate Storyboard
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  htmlFor="storyboard-description"
                >
                  Description
                </label>
                <textarea
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500"
                  id="storyboard-description"
                  placeholder="A magical forest with glowing mushrooms"
                  rows="3"
                  value={storyboardPayload.description}
                  onChange={(e) =>
                    setStoryboardPayload({
                      ...storyboardPayload,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  htmlFor="image-type"
                >
                  Image Type
                </label>
                <select
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500"
                  id="image-type"
                  value={storyboardPayload.image_type}
                  onChange={(e) =>
                    setStoryboardPayload({
                      ...storyboardPayload,
                      image_type: e.target.value,
                    })
                  }
                >
                  <option>Entertainment</option>
                  <option>Educational</option>
                  <option>Marketing</option>
                  <option>Documentary</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  htmlFor="number-of-boards"
                >
                  Number of Boards
                </label>
                <select
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500"
                  id="number-of-boards"
                  value={storyboardPayload.number_of_boards}
                  onChange={(e) =>
                    setStoryboardPayload({
                      ...storyboardPayload,
                      number_of_boards: e.target.value,
                    })
                  }
                >
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  htmlFor="art-style"
                >
                  Art Style
                </label>
                <select
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500"
                  id="art-style"
                  value={storyboardPayload.art_style}
                  onChange={(e) =>
                    setStoryboardPayload({
                      ...storyboardPayload,
                      art_style: e.target.value,
                    })
                  }
                >
                  <option>Studio Ghibli style</option>
                  <option>Anime</option>
                  <option>Cartoon</option>
                  <option>Photorealistic</option>
                  <option>Watercolor</option>
                </select>
              </div>
              
              {/* Preview of enhanced description */}
              {storyboardPayload.description && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Enhanced Description Preview:
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {storyboardPayload.description} ({storyboardPayload.image_type} style, {storyboardPayload.art_style})
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 disabled:opacity-50"
                disabled={isGeneratingStoryboard}
                onClick={() => setShowStoryboardModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                disabled={isGeneratingStoryboard}
                onClick={handleGenerateStoryboard}
              >
                {isGeneratingStoryboard ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard Result Modal */}
      {showStoryboardResultModal && generatedStoryboards.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generated Storyboard ({currentStoryboardIndex + 1} of {generatedStoryboards.length})
              </h2>
              <button
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowStoryboardResultModal(false)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {generatedStoryboards[currentStoryboardIndex] && (
                <div className="max-w-6xl mx-auto">
                  <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden shadow-md">
                    <div className="p-4 bg-slate-200 dark:bg-slate-700/50">
                      <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200">
                        Scene {generatedStoryboards[currentStoryboardIndex].scene_number}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-6">
                        {/* Image on the left */}
                        <div className="flex-1">
                          {storyboardImageUrl && (
                            <img
                              alt={`Storyboard Scene ${generatedStoryboards[currentStoryboardIndex].scene_number}`}
                              className="w-full h-auto rounded-md object-cover shadow-lg"
                              src={storyboardImageUrl}
                            />
                          )}
                        </div>
                        
                        {/* Text on the right */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                              Scene Description:
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                              {generatedStoryboards[currentStoryboardIndex].supporting_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentStoryboardIndex === 0}
                  onClick={handlePreviousStoryboard}
                >
                  ← Previous
                </button>
                <button
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentStoryboardIndex === generatedStoryboards.length - 1}
                  onClick={handleNextStoryboard}
                >
                  Next →
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500"
                  onClick={() => setShowStoryboardResultModal(false)}
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  disabled={isSavingStoryboard}
                  onClick={handleSaveStoryboard}
                >
                  {isSavingStoryboard ? "Saving..." : "Save Storyboard"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flashcard Title Modal */}
      {showEditTitleModal && selectedFlashcardSet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Edit Flashcard Title
              </h2>
              <button
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => {
                  setShowEditTitleModal(false);
                  setSelectedFlashcardSet(null);
                  setEditingTitle("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor="edit-flashcard-title"
                >
                  Title
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  id="edit-flashcard-title"
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Enter flashcard title"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowEditTitleModal(false);
                  setSelectedFlashcardSet(null);
                  setEditingTitle("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveTitle}
                disabled={isSavingTitle || !editingTitle.trim()}
              >
                {isSavingTitle ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Title Modal */}
      {showEditQuizTitleModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Edit Quiz Title
              </h2>
              <button
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => {
                  setShowEditQuizTitleModal(false);
                  setSelectedQuiz(null);
                  setEditingQuizTitle("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor="edit-quiz-title"
                >
                  Title
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  id="edit-quiz-title"
                  type="text"
                  value={editingQuizTitle}
                  onChange={(e) => setEditingQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowEditQuizTitleModal(false);
                  setSelectedQuiz(null);
                  setEditingQuizTitle("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveQuizTitle}
                disabled={isSavingQuizTitle || !editingQuizTitle.trim()}
              >
                {isSavingQuizTitle ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Flashcard Set Confirmation Modal */}
      {showDeleteConfirmModal && flashcardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Delete Flashcard Set
              </h2>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>&ldquo;{flashcardToDelete.title}&rdquo;</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setFlashcardToDelete(null);
                }}
                disabled={isDeletingFlashcard}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={confirmDeleteFlashcard}
                disabled={isDeletingFlashcard}
              >
                {isDeletingFlashcard ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Individual Card Confirmation Modal */}
      {showDeleteCardConfirmModal && cardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Delete Card
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                Are you sure you want to delete this card?
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Question:
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {cardToDelete.card.question}
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Answer:
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {cardToDelete.card.answer}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowDeleteCardConfirmModal(false);
                  setCardToDelete(null);
                }}
                disabled={isDeletingCard}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={confirmDeleteIndividualCard}
                disabled={isDeletingCard}
              >
                {isDeletingCard ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard View Modal */}
      {showStoryboardViewModal && selectedStoryboardForView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-6xl h-[90vh] flex flex-col border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedStoryboardForView.title} ({currentViewStoryboardIndex + 1} of {selectedStoryboardForView.boards.length})
              </h2>
              <button
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowStoryboardViewModal(false)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {selectedStoryboardForView.boards[currentViewStoryboardIndex] && (
                <div className="max-w-6xl mx-auto">
                  <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden shadow-md">
                    <div className="p-4 bg-slate-200 dark:bg-slate-700/50">
                      <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200">
                        Scene {selectedStoryboardForView.boards[currentViewStoryboardIndex].scene_number}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-6">
                        {/* Image on the left */}
                        <div className="flex-1">
                          {selectedStoryboardForView.image_url && (
                            <img
                              alt={`Storyboard Scene ${selectedStoryboardForView.boards[currentViewStoryboardIndex].scene_number}`}
                              className="w-full h-auto rounded-md object-cover shadow-lg"
                              src={selectedStoryboardForView.image_url}
                            />
                          )}
                        </div>
                        
                        {/* Text on the right */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                              Scene Description:
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                              {selectedStoryboardForView.boards[currentViewStoryboardIndex].supporting_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentViewStoryboardIndex === 0}
                  onClick={handlePreviousViewStoryboard}
                >
                  ← Previous
                </button>
                <button
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentViewStoryboardIndex === selectedStoryboardForView.boards.length - 1}
                  onClick={handleNextViewStoryboard}
                >
                  Next →
                </button>
              </div>
              
              <button
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500"
                onClick={() => setShowStoryboardViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
