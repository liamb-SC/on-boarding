import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import { seed } from './data.js';

// The schema is the API contract: every type, field and argument a client can
// use. Read this to see what you can query.
export const typeDefs = /* GraphQL */ `
  type Author {
    id: ID!
    name: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int!
    rating: Int
    author: Author!
  }

  input AddBookInput {
    title: String!
    year: Int!
    authorId: ID!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
    author(id: ID!): Author
  }

  type Mutation {
    addBook(input: AddBookInput!): Book!
    rateBook(id: ID!, rating: Int!): Book
    deleteBook(id: ID!): Boolean!
  }
`;

// Resolvers are the functions that fetch the data for each field.
export function createSchema(db = seed()) {
  const findBook = (id) => db.books.find((b) => b.id === id);
  const findAuthor = (id) => db.authors.find((a) => a.id === id);
  const nextId = (rows) => String(Math.max(0, ...rows.map((r) => Number(r.id))) + 1);

  const resolvers = {
    Query: {
      books: () => db.books,
      book: (_, { id }) => findBook(id),
      authors: () => db.authors,
      author: (_, { id }) => findAuthor(id),
    },
    Mutation: {
      addBook: (_, { input }) => {
        if (!findAuthor(input.authorId)) {
          throw new GraphQLError(`No author with id ${input.authorId}`, { extensions: { code: 'NOT_FOUND' } });
        }
        const book = { id: nextId(db.books), rating: null, ...input };
        db.books.push(book);
        return book;
      },
      rateBook: (_, { id, rating }) => {
        if (rating < 1 || rating > 5) {
          throw new GraphQLError('rating must be between 1 and 5', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const book = findBook(id);
        if (book) book.rating = rating;
        return book;
      },
      deleteBook: (_, { id }) => {
        const before = db.books.length;
        db.books = db.books.filter((b) => b.id !== id);
        return db.books.length < before;
      },
    },
    Author: {
      books: (author) => db.books.filter((b) => b.authorId === author.id),
    },
    Book: {
      author: (book) => findAuthor(book.authorId),
    },
  };

  return makeExecutableSchema({ typeDefs, resolvers });
}
