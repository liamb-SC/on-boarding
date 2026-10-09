# TLS and crypto quiz

Answer in `answers.json` with the letter of the best option, e.g. `{ "q1": "a", ... }`.

**q1. What does TLS (HTTPS) protect?**
- a) Only confidentiality: nobody on the network can read the traffic.
- b) Data at rest on the server's disk.
- c) Confidentiality and integrity of data in transit, plus authentication of the server.
- d) It hides which IP address you're connecting to.

**q2. In TLS 1.3, how do client and server end up with the same session key?**
- a) The server puts it inside its certificate.
- b) The client generates it and sends it in plain text, protected by the handshake hash.
- c) It's the server's private key.
- d) An ephemeral (EC)Diffie-Hellman key exchange; the certificate's key only *signs* the handshake.

**q3. Why does a browser trust `https://example.com`'s certificate?**
- a) It chains up to a root CA in the browser/OS trust store, it covers the hostname (SAN) and it's within its validity dates.
- b) The server says it's valid in the handshake.
- c) Any certificate is trusted if the connection uses TLS 1.3.
- d) The certificate is self-signed by example.com.

**q4. "Forward secrecy" means...**
- a) Sessions are re-encrypted every few minutes.
- b) If the server's long-term private key is stolen later, recorded past sessions still can't be decrypted.
- c) The client can't forward the data to anyone else.
- d) Certificates are renewed before they expire.

**q5. Why store passwords with scrypt/bcrypt/argon2 rather than encrypting them with AES?**
- a) AES can't handle strings.
- b) Encryption is slower.
- c) A hash is one-way and deliberately slow: there's no key that, once stolen, reveals every password.
- d) Hashing makes passwords shorter so they use less storage.

**q6. AES-GCM vs AES-CBC: what does GCM add?**
- a) A longer key.
- b) Authentication: a tag that makes decryption fail if the ciphertext (or IV) was changed.
- c) Compression.
- d) It removes the need for an IV.
