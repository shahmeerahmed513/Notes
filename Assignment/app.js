class NotepadApp {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem("notes")) || [];
    this.activeNoteId = null;

    this.notesGrid = document.getElementById("notesGrid");
    this.emptyState = document.getElementById("emptyState");
    this.editorSection = document.getElementById("editorSection");
    this.noteTitle = document.getElementById("noteTitle");
    this.noteContent = document.getElementById("noteContent");

    this.addEvents();
    this.renderNotes();
  }

  addEvents() {
    document
      .getElementById("newNoteBtn")
      .addEventListener("click", () => this.createNote());

    document
      .getElementById("closeEditorBtn")
      .addEventListener("click", () => this.closeEditor());

    document
      .getElementById("deleteNoteBtn")
      .addEventListener("click", () => this.deleteNote());

    this.noteTitle.addEventListener("input", () => this.saveCurrentNote());
    this.noteContent.addEventListener("input", () => this.saveCurrentNote());
  }

  createNote() {
    const note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      createdAt: new Date().toISOString()
    };

    this.notes.unshift(note);

    this.saveNotes();
    this.openEditor(note.id);
    this.renderNotes();
  }

  openEditor(id) {
    const note = this.notes.find(note => note.id === id);

    if (!note) return;

    this.activeNoteId = id;

    this.noteTitle.value = note.title;
    this.noteContent.value = note.content;

    this.editorSection.classList.remove("hidden");
  }

  closeEditor() {
    this.activeNoteId = null;
    this.editorSection.classList.add("hidden");

    this.renderNotes();
  }

  saveCurrentNote() {
    const note = this.notes.find(note => note.id === this.activeNoteId);

    if (!note) return;

    note.title = this.noteTitle.value;
    note.content = this.noteContent.value;

    this.saveNotes();
  }

  deleteNote() {
    if (!this.activeNoteId) return;

    const confirmed = confirm("Delete this note?");

    if (!confirmed) return;

    this.notes = this.notes.filter(
      note => note.id !== this.activeNoteId
    );

    this.saveNotes();
    this.closeEditor();
  }

  saveNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
  }

  renderNotes() {
    this.notesGrid.innerHTML = "";

    if (this.notes.length === 0) {
      this.emptyState.classList.remove("hidden");
      return;
    }

    this.emptyState.classList.add("hidden");

    this.notes.forEach(note => {
      const card = document.createElement("div");

      card.className = "note-card";

      card.innerHTML = `
        <h3>${note.title || "Untitled Note"}</h3>
        <p>${note.content || "Empty note..."}</p>
      `;

      card.addEventListener("click", () => {
        this.openEditor(note.id);
      });

      this.notesGrid.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NotepadApp();
});