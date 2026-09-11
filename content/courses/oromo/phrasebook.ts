/**
 * Phase two of the course (Devin Guide rule 7): an English phrase, answered by
 * choosing the Afaan Oromo phrase. Only the English side is authored here.
 *
 * Nothing proposes the Afaan Oromo: the open lexicon is a word list with four
 * phrase-like entries in 16,011, and machine-composing sentences from single
 * words would teach children broken grammar. So each phrase ships with no
 * answer until a fluent speaker types one in the review tool, and a set stays
 * closed in the app until enough of its phrases have answers.
 *
 * Sentences reuse vocabulary the word units already teach, so a phrase set is
 * a step up from words the child has met rather than new vocabulary.
 */

export interface PhraseSpec {
  english: string;
  /** Context for the translator: who is speaking, and to whom. */
  note?: string;
}

export interface PhraseSetSpec {
  id: string;
  order: number;
  title: string;
  phrases: PhraseSpec[];
}

const say = (...english: string[]): PhraseSpec[] => english.map((phrase) => ({ english: phrase }));

export const PHRASE_SETS: PhraseSetSpec[] = [
  {
    id: "phrases-01-greetings",
    order: 1,
    title: "Greetings and manners",
    phrases: [
      { english: "Hello!", note: "everyday greeting to anyone" },
      { english: "Good morning.", note: "greeting before noon" },
      { english: "Good evening.", note: "greeting at the end of the day" },
      { english: "How are you?", note: "speaking to one friend" },
      { english: "I am fine, thank you.", note: "answering how are you" },
      { english: "What is your name?", note: "asking one child" },
      { english: "My name is Caalaa.", note: "keep the name Caalaa" },
      ...say("Please.", "Thank you very much.", "Yes, please.", "No, thank you.", "Goodbye!"),
    ],
  },
  {
    id: "phrases-02-family",
    order: 2,
    title: "My family",
    phrases: [
      { english: "This is my mother.", note: "introducing someone nearby" },
      { english: "This is my father.", note: "introducing someone nearby" },
      ...say(
        "I have two sisters.",
        "I have one brother.",
        "My brother is small.",
        "My sister is tall.",
        "Where is my mother?",
        "My grandmother is at home.",
        "We are one family.",
        "My father is working.",
        "The baby is sleeping.",
        "I love my family.",
      ),
    ],
  },
  {
    id: "phrases-03-food",
    order: 3,
    title: "Food and drink",
    phrases: [
      { english: "I want water.", note: "a child asking a parent" },
      { english: "I am hungry.", note: "a child speaking about himself" },
      ...say(
        "I am thirsty.",
        "May I have milk?",
        "The food is good.",
        "I like meat.",
        "I do not like coffee.",
        "The bread is hot.",
        "Let us eat.",
        "I am eating porridge.",
        "The water is cold.",
        "I have finished eating.",
      ),
    ],
  },
  {
    id: "phrases-04-school",
    order: 4,
    title: "At school",
    phrases: [
      { english: "I am going to school.", note: "a child speaking about himself" },
      { english: "Where is my book?", note: "looking for something" },
      ...say(
        "This is my teacher.",
        "I am reading a book.",
        "I am writing my name.",
        "I do not know.",
        "I know the answer.",
        "Please say it again.",
        "What does this word mean?",
        "The lesson is easy.",
        "The lesson is hard.",
        "I am learning Afaan Oromo.",
      ),
    ],
  },
  {
    id: "phrases-05-feelings",
    order: 5,
    title: "How I feel",
    phrases: [
      { english: "I am happy.", note: "a child speaking about himself" },
      { english: "I am tired.", note: "a child speaking about himself" },
      ...say(
        "I am sad.",
        "I am not sick.",
        "My head hurts.",
        "My stomach hurts.",
        "I am cold.",
        "I am hot.",
        "Are you happy?",
        "Do not be afraid.",
        "I am sorry.",
        "I feel better now.",
      ),
    ],
  },
  {
    id: "phrases-06-play",
    order: 6,
    title: "Playing outside",
    phrases: [
      { english: "Let us play.", note: "speaking to one friend" },
      { english: "Come here.", note: "speaking to one friend" },
      ...say(
        "Wait for me.",
        "Look at the dog.",
        "The cat is on the chair.",
        "The bird is flying.",
        "Run fast!",
        "I am tired of running.",
        "That is my ball.",
        "Give me the ball, please.",
        "Let us go home.",
        "It is dark now.",
      ),
    ],
  },
  {
    id: "phrases-07-home",
    order: 7,
    title: "Around the house",
    phrases: [
      { english: "I am at home.", note: "a child speaking about himself" },
      { english: "Open the door, please.", note: "speaking to one person" },
      ...say(
        "Close the window.",
        "Where is the water?",
        "The house is clean.",
        "I am washing my hands.",
        "I am going to sleep.",
        "Wake up!",
        "Help me, please.",
        "Put it on the table.",
        "The room is small.",
        "I am sitting on the floor.",
      ),
    ],
  },
  {
    id: "phrases-08-questions",
    order: 8,
    title: "Asking questions",
    phrases: [
      { english: "What is this?", note: "pointing at something nearby" },
      { english: "Who is that?", note: "asking about a person" },
      ...say(
        "Where are you going?",
        "When are we going?",
        "Why are you crying?",
        "How much is it?",
        "How many children are there?",
        "Whose book is this?",
        "Can you help me?",
        "Do you speak English?",
        "Do you understand me?",
        "Is this correct?",
      ),
    ],
  },
  {
    id: "phrases-09-market",
    order: 9,
    title: "Numbers and the market",
    phrases: [
      { english: "I want one banana.", note: "buying at a market" },
      { english: "I want three eggs.", note: "buying at a market" },
      ...say(
        "How much is the bread?",
        "That is too expensive.",
        "It is cheap.",
        "I have no money.",
        "Give me two, please.",
        "I am going to the market.",
        "The market is far.",
        "The shop is near.",
        "Thank you, that is all.",
        "Here is your money.",
      ),
    ],
  },
  {
    id: "phrases-10-day",
    order: 10,
    title: "My day",
    phrases: [
      { english: "Today is Monday.", note: "keep the day name in Afaan Oromo" },
      { english: "I get up in the morning.", note: "a child describing a habit" },
      ...say(
        "I am going now.",
        "I will come tomorrow.",
        "We went yesterday.",
        "It is raining today.",
        "The sun is hot today.",
        "I am busy now.",
        "Let us go quickly.",
        "See you tomorrow.",
        "Good night.",
        "Sleep well.",
      ),
    ],
  },
];
