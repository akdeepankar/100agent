"use client";
import { useState, useEffect } from "react";
import { Client, Account, Teams, Functions, Databases, Query } from "appwrite";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Button } from "@heroui/button";

// Initialize Appwrite
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const teams = new Teams(client);
const functions = new Functions(client);
const databases = new Databases(client);

// Database and Collection IDs
const DATABASE_ID = "learning_spaces";
const CHAPTERS_COLLECTION_ID = "chapters";
const FLASHCARDS_COLLECTION_ID = "flashcards";
const STORYBOARDS_COLLECTION_ID = "storyboards";
const QUIZZES_COLLECTION_ID = "quizzes";
const SUMMARIES_COLLECTION_ID = "summaries";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teamMembers, setTeamMembers] = useState({});
  const [spaceMembers, setSpaceMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("manage");
  const [allSpaces, setAllSpaces] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [selected, setSelected] = React.useState("manage");
  const [showJoinCard, setShowJoinCard] = useState(false);
  const [chapterCounts, setChapterCounts] = useState({});
  const [flashcardCounts, setFlashcardCounts] = useState({});
  const [storyboardCounts, setStoryboardCounts] = useState({});
  const [quizCounts, setQuizCounts] = useState({});
  const [summaryCounts, setSummaryCounts] = useState({});
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const joinModal = useDisclosure();

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await account.get();

        if (userData?.prefs?.role !== "teacher") {
          router.push("/dashboard");

          return;
        }
        setUser(userData);
        await fetchSpaces();
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Helper to check if user is owner of a team
  const isOwner = (team) => {
    // Find the user's membership for this team
    const memberships = team.memberships || [];

    return memberships.some(
      (m) => m.userId === user?.$id && m.roles.includes("owner"),
    );
  };

  // Helper to check if user is a member of a team
  const isMember = (team) => {
    const memberships = team.memberships || [];

    return memberships.some((m) => m.userId === user?.$id);
  };

  // Fetch chapter counts for spaces
  const fetchChapterCounts = async (spaceIds) => {
    try {
      const chapterCountPromises = spaceIds.map(async (spaceId) => {
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            CHAPTERS_COLLECTION_ID,
            [Query.equal("spaceId", spaceId)]
          );
          return { spaceId, count: response.documents.length };
        } catch (error) {
          console.error(`Error fetching chapters for space ${spaceId}:`, error);
          return { spaceId, count: 0 };
        }
      });

      const counts = await Promise.all(chapterCountPromises);
      const countsMap = Object.fromEntries(
        counts.map(({ spaceId, count }) => [spaceId, count])
      );
      setChapterCounts(countsMap);
    } catch (error) {
      console.error("Error fetching chapter counts:", error);
    }
  };

  // Fetch flashcard counts for spaces
  const fetchFlashcardCounts = async (spaceIds) => {
    try {
      const flashcardCountPromises = spaceIds.map(async (spaceId) => {
        try {
          // First get all chapters for this space
          const chaptersResponse = await databases.listDocuments(
            DATABASE_ID,
            CHAPTERS_COLLECTION_ID,
            [Query.equal("spaceId", spaceId)]
          );
          
          // Then get flashcard count for all chapters in this space
          const flashcardPromises = chaptersResponse.documents.map(async (chapter) => {
            try {
              const flashcardResponse = await databases.listDocuments(
                DATABASE_ID,
                FLASHCARDS_COLLECTION_ID,
                [Query.equal("chapterId", chapter.$id)]
              );
              return flashcardResponse.documents.length;
            } catch (error) {
              return 0;
            }
          });
          
          const flashcardCounts = await Promise.all(flashcardPromises);
          const totalFlashcards = flashcardCounts.reduce((sum, count) => sum + count, 0);
          
          return { spaceId, count: totalFlashcards };
        } catch (error) {
          console.error(`Error fetching flashcards for space ${spaceId}:`, error);
          return { spaceId, count: 0 };
        }
      });

      const counts = await Promise.all(flashcardCountPromises);
      const countsMap = Object.fromEntries(
        counts.map(({ spaceId, count }) => [spaceId, count])
      );
      setFlashcardCounts(countsMap);
    } catch (error) {
      console.error("Error fetching flashcard counts:", error);
    }
  };

  // Fetch storyboard counts for spaces
  const fetchStoryboardCounts = async (spaceIds) => {
    try {
      const storyboardCountPromises = spaceIds.map(async (spaceId) => {
        try {
          // First get all chapters for this space
          const chaptersResponse = await databases.listDocuments(
            DATABASE_ID,
            CHAPTERS_COLLECTION_ID,
            [Query.equal("spaceId", spaceId)]
          );
          
          // Then get storyboard count for all chapters in this space
          const storyboardPromises = chaptersResponse.documents.map(async (chapter) => {
            try {
              const storyboardResponse = await databases.listDocuments(
                DATABASE_ID,
                STORYBOARDS_COLLECTION_ID,
                [Query.equal("chapterId", chapter.$id)]
              );
              return storyboardResponse.documents.length;
            } catch (error) {
              return 0;
            }
          });
          
          const storyboardCounts = await Promise.all(storyboardPromises);
          const totalStoryboards = storyboardCounts.reduce((sum, count) => sum + count, 0);
          
          return { spaceId, count: totalStoryboards };
        } catch (error) {
          console.error(`Error fetching storyboards for space ${spaceId}:`, error);
          return { spaceId, count: 0 };
        }
      });

      const counts = await Promise.all(storyboardCountPromises);
      const countsMap = Object.fromEntries(
        counts.map(({ spaceId, count }) => [spaceId, count])
      );
      setStoryboardCounts(countsMap);
    } catch (error) {
      console.error("Error fetching storyboard counts:", error);
    }
  };

  // Fetch quiz counts for spaces
  const fetchQuizCounts = async (spaceIds) => {
    try {
      const quizCountPromises = spaceIds.map(async (spaceId) => {
        try {
          // First get all chapters for this space
          const chaptersResponse = await databases.listDocuments(
            DATABASE_ID,
            CHAPTERS_COLLECTION_ID,
            [Query.equal("spaceId", spaceId)]
          );
          
          // Then get quiz count for all chapters in this space
          const quizPromises = chaptersResponse.documents.map(async (chapter) => {
            try {
              const quizResponse = await databases.listDocuments(
                DATABASE_ID,
                QUIZZES_COLLECTION_ID,
                [Query.equal("chapterId", chapter.$id), Query.equal("spaceId", spaceId)]
              );
              return quizResponse.documents.length;
            } catch (error) {
              return 0;
            }
          });
          
          const quizCounts = await Promise.all(quizPromises);
          const totalQuizzes = quizCounts.reduce((sum, count) => sum + count, 0);
          
          return { spaceId, count: totalQuizzes };
        } catch (error) {
          console.error(`Error fetching quizzes for space ${spaceId}:`, error);
          return { spaceId, count: 0 };
        }
      });

      const counts = await Promise.all(quizCountPromises);
      const countsMap = Object.fromEntries(
        counts.map(({ spaceId, count }) => [spaceId, count])
      );
      setQuizCounts(countsMap);
    } catch (error) {
      console.error("Error fetching quiz counts:", error);
    }
  };

  // Fetch summary counts for spaces
  const fetchSummaryCounts = async (spaceIds) => {
    try {
      const summaryCountPromises = spaceIds.map(async (spaceId) => {
        try {
          // First get all chapters for this space
          const chaptersResponse = await databases.listDocuments(
            DATABASE_ID,
            CHAPTERS_COLLECTION_ID,
            [Query.equal("spaceId", spaceId)]
          );
          
          // Then get summary count for all chapters in this space
          const summaryPromises = chaptersResponse.documents.map(async (chapter) => {
            try {
              const summaryResponse = await databases.listDocuments(
                DATABASE_ID,
                SUMMARIES_COLLECTION_ID,
                [Query.equal("chapterId", chapter.$id), Query.equal("spaceId", spaceId)]
              );
              return summaryResponse.documents.length;
            } catch (error) {
              return 0;
            }
          });
          
          const summaryCounts = await Promise.all(summaryPromises);
          const totalSummaries = summaryCounts.reduce((sum, count) => sum + count, 0);
          
          return { spaceId, count: totalSummaries };
        } catch (error) {
          console.error(`Error fetching summaries for space ${spaceId}:`, error);
          return { spaceId, count: 0 };
        }
      });

      const counts = await Promise.all(summaryCountPromises);
      const countsMap = Object.fromEntries(
        counts.map(({ spaceId, count }) => [spaceId, count])
      );
      setSummaryCounts(countsMap);
    } catch (error) {
      console.error("Error fetching summary counts:", error);
    }
  };

  const fetchSpaces = async () => {
    try {
      const response = await teams.list();
      // For each team, fetch memberships and attach to team object
      const teamsWithMemberships = await Promise.all(
        response.teams.map(async (team) => {
          try {
            const memberships = await teams.listMemberships(team.$id);

            return { ...team, memberships: memberships.memberships };
          } catch (error) {
            return { ...team, memberships: [] };
          }
        }),
      );

      setSpaces(teamsWithMemberships);
      
      // Fetch chapter counts for all spaces
      await fetchChapterCounts(teamsWithMemberships.map(team => team.$id));
      
      // Fetch flashcard counts for all spaces
      await fetchFlashcardCounts(teamsWithMemberships.map(team => team.$id));
      
      // Fetch storyboard counts for all spaces
      await fetchStoryboardCounts(teamsWithMemberships.map(team => team.$id));
      
      // Fetch quiz counts for all spaces
      await fetchQuizCounts(teamsWithMemberships.map(team => team.$id));
      
      // Fetch summary counts for all spaces
      await fetchSummaryCounts(teamsWithMemberships.map(team => team.$id));
      
      // Fetch members count for each team
      const membersPromises = teamsWithMemberships.map(async (team) => {
        try {
          return { id: team.$id, total: team.memberships.length };
        } catch (error) {
          return { id: team.$id, total: 0 };
        }
      });
      const membersCounts = await Promise.all(membersPromises);

      setTeamMembers(
        Object.fromEntries(membersCounts.map((m) => [m.id, m.total])),
      );
    } catch (error) {
      console.error("Error fetching spaces:", error);
      setError("Failed to fetch productivity spaces");
    }
  };

  const fetchSpaceMembers = async (spaceId) => {
    try {
      const response = await teams.listMemberships(spaceId);

      setSpaceMembers(response.memberships);
    } catch (error) {
      console.error("Error fetching space members:", error);
      setError("Failed to fetch space members");
    }
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsCreatingSpace(true);

    try {
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const team = await teams.create(joinCode, newSpaceName);

      await teams.updatePrefs(team.$id, {
        joinCode: joinCode,
        createdAt: new Date().toISOString(),
      });

      setSuccess("Productivity space created successfully!");
      setShowCreateModal(false);
      setNewSpaceName("");
      await fetchSpaces();
    } catch (error) {
      console.error("Error creating space:", error);
      setError(error.message || "Failed to create productivity space");
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleEditSpace = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await teams.update(currentSpace.$id, newSpaceName);
      setSuccess("Productivity space updated successfully!");
      setShowEditModal(false);
      setCurrentSpace(null);
      setNewSpaceName("");
      await fetchSpaces();
      if (selectedSpace?.$id === currentSpace.$id) {
        setSelectedSpace({ ...selectedSpace, name: newSpaceName });
      }
    } catch (error) {
      console.error("Error updating space:", error);
      setError(error.message || "Failed to update productivity space");
    }
  };

  const handleDeleteSpace = async () => {
    setError("");
    setSuccess("");

    try {
      await teams.delete(currentSpace.$id);
      setSuccess("Productivity space deleted successfully!");
      setShowDeleteModal(false);
      setCurrentSpace(null);
      if (selectedSpace?.$id === currentSpace.$id) {
        setSelectedSpace(null);
      }
      await fetchSpaces();
    } catch (error) {
      console.error("Error deleting space:", error);
      setError(error.message || "Failed to delete productivity space");
    }
  };

  const handleSpaceClick = async (space) => {
    setSelectedSpace(space);
    await fetchSpaceMembers(space.$id);
    
    // Refresh chapter count for the selected space
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAPTERS_COLLECTION_ID,
        [Query.equal("spaceId", space.$id)]
      );
      setChapterCounts(prev => ({
        ...prev,
        [space.$id]: response.documents.length
      }));
      
      // Refresh flashcard count for the selected space
      const flashcardPromises = response.documents.map(async (chapter) => {
        try {
          const flashcardResponse = await databases.listDocuments(
            DATABASE_ID,
            FLASHCARDS_COLLECTION_ID,
            [Query.equal("chapterId", chapter.$id)]
          );
          return flashcardResponse.documents.length;
        } catch (error) {
          return 0;
        }
      });
      
      const flashcardCounts = await Promise.all(flashcardPromises);
      const totalFlashcards = flashcardCounts.reduce((sum, count) => sum + count, 0);
      
      setFlashcardCounts(prev => ({
        ...prev,
        [space.$id]: totalFlashcards
      }));

      // Refresh storyboard count for the selected space
      const storyboardPromises = response.documents.map(async (chapter) => {
        try {
          const storyboardResponse = await databases.listDocuments(
            DATABASE_ID,
            STORYBOARDS_COLLECTION_ID,
            [Query.equal("chapterId", chapter.$id)]
          );
          return storyboardResponse.documents.length;
        } catch (error) {
          return 0;
        }
      });
      
      const storyboardCounts = await Promise.all(storyboardPromises);
      const totalStoryboards = storyboardCounts.reduce((sum, count) => sum + count, 0);
      
      setStoryboardCounts(prev => ({
        ...prev,
        [space.$id]: totalStoryboards
      }));

      // Refresh quiz count for the selected space
      const quizPromises = response.documents.map(async (chapter) => {
        try {
          const quizResponse = await databases.listDocuments(
            DATABASE_ID,
            QUIZZES_COLLECTION_ID,
            [Query.equal("chapterId", chapter.$id), Query.equal("spaceId", space.$id)]
          );
          return quizResponse.documents.length;
        } catch (error) {
          return 0;
        }
      });
      
      const quizCounts = await Promise.all(quizPromises);
      const totalQuizzes = quizCounts.reduce((sum, count) => sum + count, 0);
      
      setQuizCounts(prev => ({
        ...prev,
        [space.$id]: totalQuizzes
      }));

      // Refresh summary count for the selected space
      const summaryPromises = response.documents.map(async (chapter) => {
        try {
          const summaryResponse = await databases.listDocuments(
            DATABASE_ID,
            SUMMARIES_COLLECTION_ID,
            [Query.equal("chapterId", chapter.$id), Query.equal("spaceId", space.$id)]
          );
          return summaryResponse.documents.length;
        } catch (error) {
          return 0;
        }
      });
      
      const summaryCounts = await Promise.all(summaryPromises);
      const totalSummaries = summaryCounts.reduce((sum, count) => sum + count, 0);
      
      setSummaryCounts(prev => ({
        ...prev,
        [space.$id]: totalSummaries
      }));
    } catch (error) {
      console.error("Error fetching counts for selected space:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Fetch all spaces for Explore tab
  const fetchAllSpaces = async () => {
    try {
      const response = await teams.list();

      setAllSpaces(response.teams);
    } catch (error) {
      console.error("Error fetching all spaces:", error);
    }
  };

  // Fetch all spaces when Explore tab is selected
  useEffect(() => {
    if (activeTab === "explore") {
      fetchAllSpaces();
    }
  }, [activeTab]);

  // Join space by code
  const handleJoinSpace = async () => {
    setJoinError("");
    setJoinSuccess("");
    if (!joinCode || joinCode.length !== 6) {
      setJoinError("Please enter a valid 6-digit code.");

      return;
    }
    try {
      // Start the function execution
      const execution = await functions.createExecution(
        "joinTeam",
        JSON.stringify({
          joinCode: joinCode,
          userId: user.$id,
          userEmail: user.email, // send email for fallback
        }),
        false,
      );

      // Poll for the result
      let execStatus;
      let attempts = 0;

      while (attempts < 10) {
        // up to ~5 seconds
        execStatus = await functions.getExecution("joinTeam", execution.$id);
        if (
          execStatus.status === "completed" ||
          execStatus.status === "failed"
        ) {
          break;
        }
        await new Promise((res) => setTimeout(res, 500));
        attempts++;
      }

      if (!execStatus) {
        setJoinError("No response from server. Please try again.");

        return;
      }

      if (execStatus.status === "completed") {
        setJoinSuccess("Joined successfully!");
        setJoinCode("");
        setTimeout(async () => {
          await fetchSpaces();
        }, 2000);
      } else if (execStatus.status === "failed") {
        setJoinError("Failed to join space. Function execution failed.");
      } else {
        setJoinError("No response from server. Please try again.");
      }
    } catch (err) {
      console.error("Error joining space:", err);
      setJoinError("Failed to join space. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-lg text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span className="animate-spin">🔄</span> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md dark:bg-slate-800/90 border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-16 relative">
            <div className="flex items-center gap-2 z-10">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                proSpace
              </span>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <Tabs
                aria-label="Dashboard Options"
                className=""
                selectedKey={selected}
                onSelectionChange={setSelected}
              >
                <Tab key="my" title="My Spaces" />
                <Tab key="manage" title="Manage Spaces" />
              </Tabs>
            </div>
            <div className="flex items-center space-x-4 z-10">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span>👨‍🏫</span>
                    {user?.name}
                  </p>
                </div>
                <Button
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white gap-2 flex items-center"
                  variant="ghost"
                  onClick={handleLogout}
                >
                  <span>🚪</span> Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="px-0 py-0">
        {selected === "my" && (
          <Card className="w-full h-[calc(100vh-4rem)] flex flex-col rounded-none shadow-none border-0 px-0">
            <CardBody className="flex-1 flex flex-col overflow-y-auto px-0 pb-0">
              <div className="flex justify-between items-center mb-8 pt-8 px-8">
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    My Spaces
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    Join and Access smart Spaces and Projects
                  </p>
                </div>
                <Button
                  className="font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  color="primary"
                  onClick={joinModal.onOpen}
                >
                  🔗 Join New Space
                </Button>
              </div>
              <Modal
                isOpen={joinModal.isOpen}
                onOpenChange={joinModal.onOpenChange}
              >
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Join a Workspace
                      </ModalHeader>
                      <ModalBody>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 text-center">
                          Enter a 6-digit code to join a collaborative workspace.
                        </p>
                        <input
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white text-center text-lg tracking-widest mb-4"
                          maxLength={6}
                          placeholder="Enter code"
                          type="text"
                          value={joinCode}
                          onChange={(e) =>
                            setJoinCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                        />
                        {joinError && (
                          <div className="text-red-600 dark:text-red-400 text-center text-sm mb-2">
                            {joinError}
                          </div>
                        )}
                        {joinSuccess && (
                          <div className="text-green-600 dark:text-green-400 text-center text-sm mb-2">
                            {joinSuccess}
                          </div>
                        )}
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="danger"
                          variant="light"
                          onPress={() => {
                            onClose();
                            setJoinCode("");
                            setJoinError("");
                            setJoinSuccess("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          onPress={() => {
                            handleJoinSpace();
                          }}
                        >
                          Join
                        </Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
              {spaces.filter(isMember).length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 px-8">
                  <div className="text-center max-w-md">
                    <div className="mb-6 text-8xl">🚀</div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      Ready to Collaborate?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
                      Join your first workspace to start collaborating with your team and managing projects together.
                    </p>
                    <Button
                      className="font-semibold px-6 py-3"
                      color="primary"
                      onClick={joinModal.onOpen}
                    >
                      Join Your First Space
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-8">
                  {spaces.filter(isMember).map((space) => (
                    <Card
                      key={space.$id}
                      className="bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group hover:scale-[1.02]"
                    >
                      <CardBody
                        className="cursor-pointer p-6"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          router.push(`/dashboard/myspace/${space.$id}`)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter")
                            router.push(`/dashboard/myspace/${space.$id}`);
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {space.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full font-medium flex items-center gap-1">
                                <span>👤</span>
                                {space.memberships
                                  .find((m) => m.userId === user?.$id)
                                  ?.roles.join(", ") || "Member"}
                              </span>
                              <span className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium flex items-center gap-1">
                                <span>👥</span>
                                {teamMembers[space.$id] || 0} members
                              </span>
                            </div>
                          </div>
                          <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                            🚀
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-lg tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {space.prefs?.joinCode}
                            </span>
                          </div>
                          <div className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                            <span>Click to enter</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
        {selected === "manage" && (
          <Card className="w-full h-[calc(100vh-4rem)] flex flex-col rounded-none shadow-none border-0 px-0">
            <CardBody className="flex-1 flex flex-col overflow-y-auto px-0 pb-0">
              <div className="flex flex-col h-full px-8 pt-8 pb-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                      Productivity Spaces
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300">
                      Create and manage your collaborative workspaces
                    </p>
                  </div>
                  <Button
                    className="font-semibold"
                    color="primary"
                    onClick={() => setShowCreateModal(true)}
                    isDisabled={spaces.filter(isOwner).length >= 3}
                  >
                    + Create Space {spaces.filter(isOwner).length >= 3 && `(${spaces.filter(isOwner).length}/3)`}
                  </Button>
                </div>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/50 dark:text-red-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg dark:bg-green-900/50 dark:text-green-200">
                    {success}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-4">
                    {spaces.filter(isOwner).length === 0 ? (
                      <div className="text-center py-16 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="mb-6 text-6xl">🏢</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                          No Productivity Spaces Yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-base">
                          Create your first workspace to start collaborating and managing your projects!
                        </p>
                      </div>
                    ) : (
                      spaces.filter(isOwner).map((space) => (
                        <Card
                          key={space.$id}
                          className={`bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden ${selectedSpace?.$id === space.$id ? "ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
                        >
                          <CardBody
                            className="cursor-pointer p-6"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSpaceClick(space)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleSpaceClick(space);
                            }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {space.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Button
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSpace(space);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <span>👥</span>
                                {teamMembers[space.$id] || 0} members
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 font-mono">
                                {space.prefs?.joinCode}
                              </span>
                            </div>
                          </CardBody>
                        </Card>
                      ))
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    {selectedSpace ? (
                      <Card className="bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-lg">
                        <CardBody className="p-8">
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                {selectedSpace.name}
                              </h2>
                              <p className="text-slate-600 dark:text-slate-300 text-lg">
                                Created on{" "}
                                {new Date(
                                  selectedSpace.prefs?.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                className="px-8 py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                color="primary"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/space/${selectedSpace.$id}`,
                                  )
                                }
                              >
                                🚀 Enter Space
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-8">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
                              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide">
                                        Members
                                      </h3>
                                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {teamMembers[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-blue-500 dark:text-blue-400">
                                      👥
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase tracking-wide">
                                        Chapters
                                      </h3>
                                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                        {chapterCounts[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-green-500 dark:text-green-400">
                                      📚
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 uppercase tracking-wide">
                                        Flashcards
                                      </h3>
                                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                        {flashcardCounts[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-purple-500 dark:text-purple-400">
                                      🎯
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1 uppercase tracking-wide">
                                        Storyboards
                                      </h3>
                                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                        {storyboardCounts[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-orange-500 dark:text-orange-400">
                                      🎨
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                              <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 uppercase tracking-wide">
                                        Quizzes
                                      </h3>
                                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                        {quizCounts[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-red-500 dark:text-red-400">
                                      ❓
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200/50 dark:border-teal-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                                <CardBody className="p-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1 uppercase tracking-wide">
                                        Summaries
                                      </h3>
                                      <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                                        {summaryCounts[selectedSpace.$id] || 0}
                                      </p>
                                    </div>
                                    <div className="text-3xl text-teal-500 dark:text-teal-400">
                                      📝
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            </div>
                            {/* Join Code Section */}
                            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-4 shadow-lg">
                              <CardBody className="p-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl">🔗</div>
                                    <div>
                                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                        Join Code
                                      </h3>
                                      <p className="text-xs text-slate-600 dark:text-slate-300">
                                        Share with students
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-mono font-bold text-slate-900 dark:text-white tracking-wider shadow-sm">
                                      {selectedSpace.prefs?.joinCode}
                                    </code>
                                    <Button
                                      className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg shadow-sm min-w-0 w-auto"
                                      variant="bordered"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          selectedSpace.prefs?.joinCode,
                                        );
                                        setSuccess(
                                          "Join code copied to clipboard!",
                                        );
                                      }}
                                    >
                                      📋
                                    </Button>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </div>
                        </CardBody>
                      </Card>
                    ) : (
                      <Card className="h-full flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-lg">
                        <CardBody className="p-12 text-center">
                          <div className="mb-6 text-6xl">👈</div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Select a Productivity Space
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 text-lg">
                            Choose a space from the sidebar to view its details and manage content
                          </p>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </main>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Create Productivity Space
            </h2>
            <form onSubmit={handleCreateSpace}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor="create-space-name"
                >
                  Space Name
                </label>
                <input
                  required
                  disabled={isCreatingSpace}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="create-space-name"
                  placeholder="Enter space name"
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  disabled={isCreatingSpace}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSpaceName("");
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={isCreatingSpace || !newSpaceName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  type="submit"
                >
                  {isCreatingSpace ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      Creating...
                    </>
                  ) : (
                    "Create Space"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Space Modal */}
      {showEditModal && currentSpace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Edit Productivity Space
            </h2>
            <form onSubmit={handleEditSpace}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor="edit-space-name"
                >
                  Space Name
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  id="edit-space-name"
                  placeholder="Enter space name"
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentSpace(null);
                    setNewSpaceName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  type="submit"
                >
                  Update Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Space Modal */}
      {showDeleteModal && currentSpace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Delete Productivity Space
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete &quot;{currentSpace.name}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCurrentSpace(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleDeleteSpace}
              >
                Delete Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
