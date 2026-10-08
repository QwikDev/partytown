(() => {
  // runs on the main thread: the worker has its own `self.name`, the main window has ''
  window.mainThreadScriptRan = self.name === '';
})();
