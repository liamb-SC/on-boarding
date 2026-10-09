import express from 'express';

// A Router is a mini-app: mount it with app.use('/notes', notesRouter(store))
// and the paths below become /notes, /notes/:id, ...
export function notesRouter(store) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(store.list());
  });

  // TODO 3: GET /:id    -> 200 with the note, or 404 { "error": "Note not found" }
  //         (req.params.id is a string; the store's ids are numbers)
  // TODO 4: POST /      -> body { "text": "..." }
  //         - text missing, not a string, or blank -> 400 { "error": "..." }
  //         - otherwise 201 with the new note and a Location: /notes/<id> header

  return router;
}
