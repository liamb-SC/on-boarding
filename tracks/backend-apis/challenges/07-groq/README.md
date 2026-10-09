# 07 · GROQ (Sanity's query language)

**Skills:** filters `*[...]`, projections `{...}`, `order()`, slices
`[0...3]`, dereferencing `->`, parameters `$x`, sub-queries with `^`,
`count()`, excluding drafts.

## Background
**GROQ** is the query language of [Sanity](https://www.sanity.io)'s
Content Lake. All your content is one big pool of JSON documents, and a query
is a pipeline over it:

```groq
*[_type == "movie" && releaseYear > 2000]     // * = every document, [...] = filter
  | order(releaseYear desc)                   // sort
  [0...5]                                     // slice: first five (... excludes the end)
  { title, "director": director->name }       // projection: pick and rename fields
```

- `director` is a **reference** (`{ "_ref": "person-ridley" }`), and `->`
  follows it to the referenced document.
- `$genre` is a **parameter**, passed separately from the query text. As with
  SQL or GraphQL variables, never build queries by pasting strings together.
- `^` means "the document one level up". Inside a sub-query it lets you
  match against the outer document:
  `*[_type == "person"]{ name, "n": count(*[director._ref == ^._id]) }`.
- **Drafts:** Sanity stores an unpublished edit as a separate document whose
  `_id` starts with `drafts.`. Public queries leave them out with
  `!(_id in path("drafts.**"))`.

You don't need a Sanity account. `groq-js` is the reference implementation,
and `npm run groq` runs it against `dataset.json`.

## Scenario
`dataset.json` holds `movie` and `person` documents, plus one draft movie.
The files in `queries/` are empty.

## Goal
**Every movie query leaves out drafts.**
1. `01-recent.groq`: movies released in 2010 or later, newest first, each as
   `{ title, releaseYear }`.
2. `02-alien.groq`: the movie whose slug is `alien`, as a **single object**
   (not an array): `{ title, director }`, where `director` is the director's
   name.
3. `03-by-genre.groq` + `03-by-genre.params.json`: movies whose `genres`
   include `$genre` (set it to `"drama"`), ordered by title, as `{ title }`.
4. `04-top-rated.groq`: the three highest-rated movies, as `{ title, rating }`.
5. `05-directors.groq`: every person, ordered by name, as
   `{ name, directed }`, where `directed` is how many movies they directed.

## Try it
```bash
npm run groq -- queries/01-recent.groq
npm run groq -- queries/03-by-genre.groq queries/03-by-genre.params.json
```

## Hints
- `[0]` after a filter gives you one document instead of an array.
- `"newName": expression` inside a projection names a computed field.
- `$genre in genres` tests membership in an array.

## Check your work
```
./onboard validate backend-apis/07
```
