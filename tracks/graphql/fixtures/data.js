// In-memory "database". seed() returns a fresh copy, so every run starts clean.
export function seed() {
  return {
    authors: [
      { id: '1', name: 'Ursula K. Le Guin' },
      { id: '2', name: 'Terry Pratchett' },
      { id: '3', name: 'Octavia E. Butler' },
    ],
    books: [
      { id: '1', title: 'A Wizard of Earthsea', year: 1968, rating: 4, authorId: '1' },
      { id: '2', title: 'The Left Hand of Darkness', year: 1969, rating: 5, authorId: '1' },
      { id: '3', title: 'Guards! Guards!', year: 1989, rating: 5, authorId: '2' },
      { id: '4', title: 'Small Gods', year: 1992, rating: 4, authorId: '2' },
      { id: '5', title: 'Kindred', year: 1979, rating: 5, authorId: '3' },
      { id: '6', title: 'Guards! Guards! (duplicate)', year: 1989, rating: null, authorId: '2' },
      { id: '7', title: 'Test book please ignore', year: 2024, rating: null, authorId: '3' },
    ],
    reviews: [],
  };
}
