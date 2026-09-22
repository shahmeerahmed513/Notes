class NotepadApp {
  constructor() {
    this.notes =
      JSON.parse(localStorage.getItem("notepad_notes")) || [];

    this.activeNoteId = null;
    this.currentFilter = "all";
    this.selectedTag = null;
    this.searchQuery = "";
    this.sortBy = "updated";

    this.initElements();
    this.initEvents();

    this.render();
  }

  initElements() {
    this.notesGrid =
      document.getElementById("notesGrid");

    this.emptyState =
      document.getElementById("emptyState");

    this.editorSection =
      document.getElementById("editorSection");

    this.searchInput =
      document.getElementById("searchInput");

    this.sortSelect =
      document.getElementById("sortSelect");

    this.noteTitle =
      document.getElementById("noteTitle");

    this.noteContent =
      document.getElementById("noteContent");

    this.noteTags =
      document.getElementById("noteTags");

    this.wordCount =
      document.getElementById("wordCount");

    this.charCount =
      document.getElementById("charCount");

    this.countAll =
      document.getElementById("countAll");

    this.countPinned =
      document.getElementById("countPinned");

    this.countFavorites =
      document.getElementById("countFavorites");

    this.tagList =
      document.getElementById("tagList");

    this.pinNoteBtn =
      document.getElementById("pinNoteBtn");

    this.starNoteBtn =
      document.getElementById("starNoteBtn");
  }

  initEvents() {
    document
      .getElementById("newNoteBtn")
      .addEventListener(
        "click",
        () => this.createNote()
      );

    document
      .getElementById("closeEditorBtn")
      .addEventListener(
        "click",
        () => this.closeEditor()
      );

    document
      .getElementById("deleteNoteBtn")
      .addEventListener(
        "click",
        () => this.deleteNote()
      );

    this.searchInput.addEventListener(
      "input",
      event => {
        this.searchQuery =
          event.target.value.toLowerCase();

        this.render();
      }
    );

    this.sortSelect.addEventListener(
      "change",
      event => {
        this.sortBy = event.target.value;

        this.render();
      }
    );

    document
      .querySelectorAll(".nav-item")
      .forEach(item => {
        item.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(".nav-item")
              .forEach(navItem => {
                navItem.classList.remove("active");
              });

            item.classList.add("active");

            this.currentFilter =
              item.dataset.filter;

            this.selectedTag = null;

            this.render();
          }
        );
      });

    const save = () => this.saveCurrentNote();

    this.noteTitle.addEventListener(
      "input",
      save
    );

    this.noteContent.addEventListener(
      "input",
      save
    );

    this.noteTags.addEventListener(
      "input",
      save
    );

    this.pinNoteBtn.addEventListener(
      "click",
      () => {
        const note = this.getActiveNote();

        if (!note) return;

        note.pinned = !note.pinned;

        this.saveNotes();
        this.updateEditorButtons(note);
        this.render();
      }
    );

    this.starNoteBtn.addEventListener(
      "click",
      () => {
        const note = this.getActiveNote();

        if (!note) return;

        note.favorite = !note.favorite;

        this.saveNotes();
        this.updateEditorButtons(note);
        this.render();
      }
    );

    document
      .getElementById("colorOptions")
      .addEventListener(
        "click",
        event => {
          if (
            !event.target.classList.contains(
              "color-dot"
            )
          ) {
            return;
          }

          document
            .querySelectorAll(".color-dot")
            .forEach(dot => {
              dot.classList.remove("active");
            });

          event.target.classList.add("active");

          const note = this.getActiveNote();

          if (!note) return;

          note.color =
            event.target.dataset.color;

          this.saveNotes();
          this.render();
        }
      );
  }

  createNote() {
    const now =
      new Date().toISOString();

    const note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      tags: [],
      pinned: false,
      favorite: false,
      color: "default",
      createdAt: now,
      updatedAt: now
    };

    this.notes.unshift(note);

    this.saveNotes();
    this.openEditor(note.id);
    this.render();
  }

  getActiveNote() {
    return this.notes.find(
      note =>
        note.id === this.activeNoteId
    );
  }

  saveCurrentNote() {
    const note =
      this.getActiveNote();

    if (!note) return;

    note.title =
      this.noteTitle.value;

    note.content =
      this.noteContent.value;

    note.tags =
      this.noteTags.value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    note.updatedAt =
      new Date().toISOString();

    this.updateEditorStats(note);

    this.saveNotes();

    this.renderNotes();
    this.renderTags();
    this.updateCounters();
  }

  deleteNote() {
    if (!this.activeNoteId) return;

    const confirmed =
      confirm(
        "Are you sure you want to delete this note?"
      );

    if (!confirmed) return;

    this.notes =
      this.notes.filter(
        note =>
          note.id !== this.activeNoteId
      );

    this.saveNotes();

    this.closeEditor();
    this.render();
  }

  openEditor(id) {
    this.activeNoteId = id;

    const note =
      this.getActiveNote();

    if (!note) return;

    this.noteTitle.value =
      note.title;

    this.noteContent.value =
      note.content;

    this.noteTags.value =
      note.tags.join(", ");

    document
      .querySelectorAll(".color-dot")
      .forEach(dot => {
        dot.classList.toggle(
          "active",
          dot.dataset.color ===
            (note.color || "default")
        );
      });

    this.updateEditorButtons(note);
    this.updateEditorStats(note);

    this.editorSection.classList.remove(
      "hidden"
    );
  }

  closeEditor() {
    this.activeNoteId = null;

    this.editorSection.classList.add(
      "hidden"
    );
  }

  updateEditorButtons(note) {
    const pinIcon =
      this.pinNoteBtn.querySelector("i");

    const starIcon =
      this.starNoteBtn.querySelector("i");

    pinIcon.className =
      note.pinned
        ? "fa-solid fa-thumbtack active-icon"
        : "fa-regular fa-thumbtack";

    starIcon.className =
      note.favorite
        ? "fa-solid fa-star active-icon"
        : "fa-regular fa-star";
  }

  updateEditorStats(note) {
    const words =
      note.content.trim()
        ? note.content
            .trim()
            .split(/\s+/)
            .length
        : 0;

    const characters =
      note.content.length;

    this.wordCount.textContent =
      `${words} words`;

    this.charCount.textContent =
      `${characters} characters`;
  }

  getFilteredNotes() {
    return this.notes
      .filter(note => {
        if (
          this.currentFilter === "pinned" &&
          !note.pinned
        ) {
          return false;
        }

        if (
          this.currentFilter === "favorites" &&
          !note.favorite
        ) {
          return false;
        }

        if (
          this.selectedTag &&
          !note.tags.includes(
            this.selectedTag
          )
        ) {
          return false;
        }

        if (this.searchQuery) {
          const title =
            note.title
              .toLowerCase()
              .includes(
                this.searchQuery
              );

          const content =
            note.content
              .toLowerCase()
              .includes(
                this.searchQuery
              );

          if (!title && !content) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (
          this.sortBy === "title"
        ) {
          return a.title.localeCompare(
            b.title
          );
        }

        if (
          this.sortBy === "created"
        ) {
          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );
        }

        return (
          new Date(b.updatedAt) -
          new Date(a.updatedAt)
        );
      });
  }

  render() {
    this.renderNotes();
    this.renderTags();
    this.updateCounters();
  }

  renderNotes() {
    const notes =
      this.getFilteredNotes();

    this.notesGrid.innerHTML = "";

    if (notes.length === 0) {
      this.emptyState.classList.remove(
        "hidden"
      );

      return;
    }

    this.emptyState.classList.add(
      "hidden"
    );

    notes.forEach(note => {
      const card =
        document.createElement("div");

      card.className =
        "note-card";

      card.dataset.color =
        note.color || "default";

      card.innerHTML = `
        <h3>
          ${note.title || "Untitled Note"}
          ${note.pinned ? " 📌" : ""}
        </h3>

        <p class="note-content-preview">
          ${note.content || "No text content..."}
        </p>

        <div class="card-footer">
          <span>
            ${new Date(
              note.updatedAt
            ).toLocaleDateString()}
          </span>

          <span>
            ${note.tags
              .slice(0, 2)
              .map(tag => `#${tag}`)
              .join(" ")}
          </span>
        </div>
      `;

      card.addEventListener(
        "click",
        () => this.openEditor(note.id)
      );

      this.notesGrid.appendChild(
        card
      );
    });
  }

  renderTags() {
    const tags = new Set();

    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        tags.add(tag);
      });
    });

    this.tagList.innerHTML = "";

    tags.forEach(tag => {
      const tagElement =
        document.createElement("span");

      tagElement.className =
        "tag-item";

      tagElement.textContent =
        `#${tag}`;

      if (
        tag === this.selectedTag
      ) {
        tagElement.classList.add(
          "active"
        );
      }

      tagElement.addEventListener(
        "click",
        () => {
          this.selectedTag =
            this.selectedTag === tag
              ? null
              : tag;

          this.render();
        }
      );

      this.tagList.appendChild(
        tagElement
      );
    });
  }

  updateCounters() {
    this.countAll.textContent =
      this.notes.length;

    this.countPinned.textContent =
      this.notes.filter(
        note => note.pinned
      ).length;

    this.countFavorites.textContent =
      this.notes.filter(
        note => note.favorite
      ).length;
  }

  saveNotes() {
    localStorage.setItem(
      "notepad_notes",
      JSON.stringify(this.notes)
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    new NotepadApp();
  }
);