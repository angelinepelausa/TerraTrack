export const onboardingQuestions = [
  {
    id: 1,
    title: "Transportation Preferences",
    question: "Which transport options do you use or plan to use?",
    options: [
      "Walk regularly",
      "Bike",
      "Drive own car",
      "Public transport",
      "Physical/mobility limitations",
    ],
  },
  {
    id: 2,
    title: "Commute Distance",
    question: "What’s your typical commute like?",
    options: [
      "No regular commute",
      "Short (≤ 5 km per trip)",
      "Medium (5–20 km per trip)",
      "Long (> 20 km per trip)",
    ],
  },
  {
    id: 3,
    title: "Home Energy Control",
    question: "Which energy-related actions are applicable?",
    options: [
      "Full control of home appliances",
      "Dorm/shared housing",
      "Have air conditioning",
      "Use electric kitchen devices",
      "Can unplug/change lighting",
    ],
  },
  {
    id: 4,
    title: "Dietary Preferences",
    question: "What describes your current diet?",
    options: [
      "Eat meat regularly",
      "Eat fish/seafood",
      "Plant-based (vegetarian/vegan)",
      "Food allergies",
    ],
  },
  {
    id: 5,
    title: "Spending Willingness",
    question: "Which action types suit your budget?",
    options: [
      "Free & easy tips",
      "Low-cost improvements",
      "Open to investing in eco-products",
    ],
  },
];

export const REFERRAL_STEP = onboardingQuestions.length;

export const submitOnboardingAnswers = async (answers) => {
  console.log("Submitted answers:", answers);
};