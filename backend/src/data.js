export const stories = [
  {
    id: 1,
    title: "The Last Lantern",
    genre: "Fantasy",
    author: "Ari Vale",
    synopsis:
      "A wandering mapmaker discovers a lantern that shows roads to forgotten cities.",
    likes: 12
  },
  {
    id: 2,
    title: "Echoes in Rust",
    genre: "Sci-Fi",
    author: "Mina Cross",
    synopsis:
      "In an orbital scrapyard, a mechanic hears voices from a decommissioned AI core.",
    likes: 20
  },
  {
    id: 3,
    title: "Rain Over Ninth Street",
    genre: "Noir",
    author: "D. Hollow",
    synopsis:
      "A private investigator follows a missing jazz singer into a city of secrets.",
    likes: 8
  }
];

let currentId = stories.length;

export function getNextId() {
  currentId += 1;
  return currentId;
}
