export const calculatorBaseQuestions = [
  {
    id: "publicTransportType",
    title: "Public Transportation",
    question: "Which types of public transportation do you take?",
    type: "multi",
    options: ["Train", "Bus", "Jeepney", "Tricycle"],
    followUps: [
      {
        id: "publicTransportFrequency",
        title: transport => `How often do you take the ${transport}?`,
        type: "single",
        options: [
          "Daily",
          "4-5 Times a week",
          "Once a week",
          "Rarely (2-3x a month)"
        ]
      },
      {
        id: "publicTransportDistance",
        title: transport => `What was the distance traveled per ${transport} trip (in km)?`,
        type: "single",
        options: [
          "1-5 KM",
          "5-10 KM",
          "10-20 KM",
          "20-30 KM",
          "More than 30 KM"
        ]
      }
    ]
  },
  {
    id: "vehicleType",
    title: "Vehicle Usage",
    question: "What type of vehicle do you use for transportation?",
    type: "multi",
    options: ["Diesel Car", "Hybrid Car", "Electric Car", "Gasoline Car", "Motorbike"],
    followUps: [
      {
        id: "vehicleFrequency",
        title: vehicle => `How often do you use your ${vehicle}?`,
        type: "single",
        options: [
          "Daily",
          "4-5 Times a week",
          "Once a week",
          "Rarely (2-3x a month)"
        ]
      },
      {
        id: "vehicleDistance",
        title: vehicle => `What was the distance traveled per ${vehicle} trip (in km)?`,
        type: "single",
        options: [
          "1-5 KM",
          "5-10 KM",
          "10-20 KM",
          "20-30 KM",
          "More than 30 KM"
        ]
      }
    ]
  },
  {
    id: "householdSize",
    title: "Household Size",
    question: "How many people, including yourself, currently reside in your household?",
    type: "input"
  },
  {
    id: "electricityRate",
    title: "Electricity Rate",
    question: "What is your town/city’s electricity rate?",
    type: "input"
  },
  {
    id: "electricityBill",
    title: "Electricity Bill",
    question: "What is your electricity bill for the month?",
    type: "input"
  },
  {
    id: "meatMeals",
    title: "Meat Consumption",
    question: "How often do you eat meat-based meals?",
    type: "single",
    options: [
      "1–10 meals/month",
      "11–20 meals/month",
      "21–40 meals/month",
      "41–60 meals/month",
      "61–90 meals/month"
    ]
  },
  {
    id: "dairyMeals",
    title: "Dairy Consumption",
    question: "How often do you eat dairy-based meals?",
    type: "single",
    options: [
      "1–10 meals/month",
      "11–20 meals/month",
      "21–40 meals/month",
      "41–60 meals/month",
      "61–90 meals/month"
    ]
  },
  {
    id: "fishMeals",
    title: "Fish Consumption",
    question: "How often do you eat fish-based meals?",
    type: "single",
    options: [
      "1–10 meals/month",
      "11–20 meals/month",
      "21–40 meals/month",
      "41–60 meals/month",
      "61–90 meals/month"
    ]
  }
];
