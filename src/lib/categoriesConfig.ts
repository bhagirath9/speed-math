export interface Topic {
  id: string;
  label: string;
  iconName: string;
}

export interface Category {
  id: string;
  label: string;
  topics: Topic[];
}

export const CATEGORIES_CONFIG: Category[] = [
  {
    id: "Math",
    label: "Math",
    topics: [
      { id: "addition", label: "Addition", iconName: "FaPlusCircle" },
      { id: "subtraction", label: "Subtraction", iconName: "FaMinusCircle" },
      { id: "multiplication", label: "Multiplication", iconName: "RxCross2" },
      { id: "division", label: "Division", iconName: "FaDivide" },
    ],
  },
  {
    id: "GK",
    label: "GK",
    topics: [
      { id: "Indian History", label: "Indian History", iconName: "FaBook" },
      { id: "Indian Culture", label: "Indian Culture", iconName: "FaPalette" },
      { id: "Rajasthan History", label: "Rajasthan History", iconName: "FaFortAwesome" },
      { id: "Rajasthan Culture", label: "Rajasthan Culture", iconName: "FaMusic" },
    ],
  },
];

/**
 * Checks if a topic is locked for a user based on their login and purchase status.
 */
export function isTopicLocked(
  categoryId: string,
  topicId: string,
  isPurchased: boolean
): boolean {
  if (isPurchased) {
    return false; // Premium users have zero restrictions
  }

  // Free Tier / Guest Users:
  if (categoryId === "Math") {
    // Only Addition and Subtraction are free
    const unlockedMath = ["addition", "subtraction"];
    return !unlockedMath.includes(topicId);
  }

  if (categoryId === "GK") {
    // Only Indian History and Indian Culture are free
    const unlockedGK = ["Indian History", "Indian Culture"];
    return !unlockedGK.includes(topicId);
  }

  return true; // Lock everything else by default for safety
}

/**
 * Checks if a difficulty level is locked for a user based on their purchase status.
 */
export function isDifficultyLocked(
  difficulty: string,
  isPurchased: boolean
): boolean {
  if (isPurchased) {
    return false; // Premium users have zero restrictions
  }

  // Free tier can only access "easy"
  if (difficulty === "medium" || difficulty === "hard") {
    return true;
  }

  return false;
}
