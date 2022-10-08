self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    try {
      return await fetch(e.request);
    } catch {
      // this also fools chrome offline support detection
      return new Response("Youtube Downloder requires network");
    }
  })());
});
