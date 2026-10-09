// The Library service's handlers. Every call needs the metadata
//   authorization: Bearer onboarding-token
// or it's rejected with UNAUTHENTICATED. (This file is also what the
// validator runs, so changing it here won't help you pass!)
export function createLibraryHandlers({ grpc, books, token = 'onboarding-token', onCall = () => {} }) {
  function allowed(method, call, fail) {
    const deadline = Number(call.getDeadline()); // a Date or ms timestamp; Infinity if none
    onCall({
      method,
      request: call.request,
      authorization: call.metadata.get('authorization')[0],
      deadlineMs: Number.isFinite(deadline) ? deadline - Date.now() : Infinity,
    });
    if (call.metadata.get('authorization')[0] === `Bearer ${token}`) return true;
    fail({ code: grpc.status.UNAUTHENTICATED, details: 'missing or invalid authorization metadata' });
    return false;
  }

  return {
    GetBook(call, callback) {
      if (!allowed('GetBook', call, callback)) return;
      const book = books.find((b) => b.id === call.request.id);
      if (!book) return callback({ code: grpc.status.NOT_FOUND, details: `no book with id ${call.request.id}` });
      callback(null, book);
    },

    ListBooks(call) {
      if (!allowed('ListBooks', call, (err) => call.emit('error', err))) return;
      const { author } = call.request;
      for (const b of books) if (!author || b.author === author) call.write(b);
      call.end();
    },

    GenerateReport(call, callback) {
      if (!allowed('GenerateReport', call, callback)) return;
      const timer = setTimeout(() => callback(null, { summary: `${books.length} books in the library` }), 3000);
      call.on('cancelled', () => clearTimeout(timer));
    },
  };
}
