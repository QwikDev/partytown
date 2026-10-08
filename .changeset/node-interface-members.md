---
'@qwik.dev/partytown': patch
---

fix: worker nodes get only the members every `Node` has: elements no longer inherit `Text` members such as `splitText`, which made libraries that detect text nodes by it (preact) treat elements as text nodes.
