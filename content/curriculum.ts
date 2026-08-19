/**
 * The curriculum is authored here, not derived from a dictionary: the choice
 * of which words a child learns first is a teaching decision. The drafter
 * looks each English word up in the lexicon and proposes Oromo answers for a
 * fluent speaker to confirm.
 */
export interface UnitSpec {
  id: string;
  order: number;
  title: string;
  /** English prompts, in teaching order. `pos` narrows lexicon candidates. */
  words: { english: string; pos: "noun" | "verb" | "adj" | "num" }[];
}

const nouns = (...words: string[]): UnitSpec["words"] =>
  words.map((english) => ({ english, pos: "noun" as const }));

export const UNITS: UnitSpec[] = [
  {
    id: "unit-01-family",
    order: 1,
    title: "Family",
    words: nouns(
      "mother",
      "father",
      "child",
      "baby",
      "brother",
      "sister",
      "son",
      "daughter",
      "grandmother",
      "grandfather",
      "family",
      "boy",
      "girl",
      "man",
      "woman",
      "friend",
      "name",
      "home",
      "husband",
      "wife",
      "uncle",
      "aunt",
      "people",
      "neighbor",
      "guest",
    ),
  },
  {
    id: "unit-02-food-and-drink",
    order: 2,
    title: "Food & drink",
    words: [
      ...nouns(
        "water",
        "milk",
        "coffee",
        "tea",
        "bread",
        "meat",
        "egg",
        "salt",
        "sugar",
        "butter",
        "honey",
        "food",
        "fruit",
        "banana",
        "orange",
        "onion",
        "potato",
        "maize",
        "barley",
        "porridge",
        "cup",
        "plate",
        "spoon",
      ),
      { english: "eat", pos: "verb" },
      { english: "drink", pos: "verb" },
    ],
  },
  {
    id: "unit-03-animals",
    order: 3,
    title: "Animals",
    words: nouns(
      "dog",
      "cat",
      "cow",
      "ox",
      "goat",
      "sheep",
      "horse",
      "donkey",
      "camel",
      "chicken",
      "bird",
      "fish",
      "lion",
      "elephant",
      "monkey",
      "snake",
      "mouse",
      "hyena",
      "leopard",
      "buffalo",
      "bee",
      "fly",
      "hen",
      "calf",
      "animal",
    ),
  },
];
