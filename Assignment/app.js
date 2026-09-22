/**
 * Notepad Pro - Application Logic
 * Persistent Storage & Pure Note Writing Interface
 */

class NotepadApp {
  constructor() {
    // Load persisted notes or initialize empty array
    this.notes = JSON.parse(localStorage.getItem('notepad_notes')) || [];
    this.activeNoteId = null;
    this.currentFilter = 'all';
    this.selectedTag = null;
    this.searchQuery = '';
    this.sortBy = 'updated';

    this.initElements();
    this.initEventListeners();
    this.render();
  }

  initElements() {
    this.notesGrid = document.getElementById('notesGrid');
    this.emptyState = document.getElementById('emptyState');
    this.editorSection = document.getElementById('editorSection');
    this.searchInput = document.getElementById('searchInput');
    this.sortSelect = document.getElementById('sortSelect');
    
    // Writer / Editor Elements
    this.noteTitle = document.getElementById('noteTitle');
    this.noteContent = document.getElementById('noteContent');
    this.noteTags = document.getElementById('noteTags');
    this.saveStatus = document.getElementById('saveStatus');
    this.wordCount = document.getElementById('wordCount');
    this.charCount = document.getElementById('charCount');
    this.lastModifiedTime = document.getElementById('lastModifiedTime');

    // Counters & Tags
    this.countAll = document.getElementById('countAll');
    this.countPinned = document.getElementById('countPinned');
    this.countFavorites = document.getElementById('countFavorites');
    this.tagList = document.getElementById('tagList');

    // Action Buttons
    this.pinNoteBtn = document.getElementById('pinNoteBtn');
    this.starNoteBtn = document.getElementById('starNoteBtn');
  }

  initEventListeners() {
    // Create, View, Delete Handlers
    document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
    document.getElementById('closeEditorBtn').addEventListener('click', () => this.closeEditor());
    document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteActiveNote());

    // Search and Sort Filter Handlers
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.render();
    });

    this.sortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentFilter = item.dataset.filter;
        this.selectedTag = null;
        this.render();
      });
    });

    // Auto-save triggers on typing in fields
    const saveTrigger = () => this.autoSaveActiveNote();
    this.noteTitle.addEventListener('input', saveTrigger);
    this.noteContent.addEventListener('input', saveTrigger);
    this.noteTags.addEventListener('input', saveTrigger);

    // Pin & Star Actions
    this.pinNoteBtn.addEventListener('click', () => {
      const note = this.getActiveNote();
      if (note) {
        note.pinned = !note.pinned;
        this.updateEditorControls(note);
        this.saveAndRender();
      }
    });

    this.starNoteBtn.addEventListener('click', () => {
      const note = this.getActiveNote();
      if (note) {
        note.favorite = !note.favorite;
        this.updateEditorControls(note);
        this.saveAndRender();
      }
    });

    // Color Selector Event Handling
    document.getElementById('colorOptions').addEventListener('click', (e) => {
      if (e.target.classList.contains('color-dot')) {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
        const note = this.getActiveNote();
        if (note) {
          note.color = e.target.dataset.color;
          this.saveAndRender();
        }
      }
    });

    // Export & Import Management
    document.getElementById('exportBtn').addEventListener('click', () => this.exportBackup());
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (e) => this.importBackup(e));
  }

  // --- CRUD OPERATIONS ---
  createNewNote() {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      tags: [],
      pinned: false,
      favorite: false,
      color: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.unshift(newNote);
    this.saveNotesToStorage();
    this.openEditor(newNote.id);
  }

  getActiveNote() {
    return this.notes.find(n => n.id === this.activeNoteId);
  }

  autoSaveActiveNote() {
    const note = this.getActiveNote();
    if (!note) return;

    note.title = this.noteTitle.value;
    note.content = this.noteContent.value;
    note.tags = this.noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
    note.updatedAt = new Date().toISOString();

    this.updateEditorStats(note);
    this.saveNotesToStorage();
    this.renderNotesGrid();
    this.renderTags();
  }

  deleteActiveNote() {
    if (!this.activeNoteId) return;
    if (confirm('Are you sure you want to delete this note?')) {
      this.notes = this.notes.filter(n => n.id !== this.activeNoteId);
      this.saveNotesToStorage();
      this.closeEditor();
      this.render();
    }
  }

  // --- EDITOR CONTROLS ---
  openEditor(id) {
    this.activeNoteId = id;
    const note = this.getActiveNote();
    if (!note) return;

    this.noteTitle.value = note.title;
    this.noteContent.value = note.content;
    this.noteTags.value = note.tags.join(', ');

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === (note.color || 'default'));
    });

    this.updateEditorControls(note);
    this.updateEditorStats(note);

    this.editorSection.classList.remove('hidden');
    this.noteContent.focus();
  }

  closeEditor() {
    this.activeNoteId = null;
    this.editorSection.classList.add('hidden');
  }

  updateEditorControls(note) {
    const pinIcon = this.pinNoteBtn.querySelector('i');
    const starIcon = this.starNoteBtn.querySelector('i');

    pinIcon.className = note.pinned ? 'fa-solid fa-thumbtack active-icon' : 'fa-regular fa-thumbtack';
    starIcon.className = note.favorite ? 'fa-solid fa-star active-icon' : 'fa-regular fa-star';
  }

  updateEditorStats(note) {
    const words = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
    const chars = note.content.length;

    this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    this.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    this.lastModifiedTime.textContent = `Edited: ${new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // --- FILTER & SORT LOGIC ---
  getFilteredNotes() {
    return this.notes.filter(note => {
      if (this.currentFilter === 'pinned' && !note.pinned) return false;
      if (this.currentFilter === 'favorites' && !note.favorite) return false;

      if (this.selectedTag && !note.tags.includes(this.selectedTag)) return false;

      if (this.searchQuery) {
        const titleMatch = note.title.toLowerCase().includes(this.searchQuery);
        const contentMatch = note.content.toLowerCase().includes(this.searchQuery);
        const tagMatch = note.tags.some(t => t.toLowerCase().includes(this.searchQuery));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === 'title') return a.title.localeCompare(b.title);
      if (this.sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  // --- VIEW RENDERING ---
  render() {
    this.renderNotesGrid();
    this.renderTags();
    this.updateCounters();
  }

  renderNotesGrid() {
    const filtered = this.getFilteredNotes();
    this.notesGrid.innerHTML = '';

    if (filtered.length === 0) {
      this.emptyState.classList.remove('hidden');
    } else {
      this.emptyState.classList.add('hidden');
      filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.color = note.color || 'default';
        
        const tagsHTML = note.tags.map(t => `<span class="mini-tag">#${t}</span>`).join('');

        card.innerHTML = `
          <div class="note-card-header">
            <h3 class="note-card-title">${note.title || 'Untitled Note'}</h3>
            ${note.pinned ? '<i class="fa-solid fa-thumbtack pin-icon"></i>' : ''}
          </div>
          <p class="note-card-snippet">${note.content || 'No text content...'}</p>
          <div class="note-card-footer">
            <span>${new Date(note.updatedAt).toLocaleDateString()}</span>
            <div class="note-card-tags">${tagsHTML}</div>
          </div>
        `;

        card.addEventListener('click', () => this.openEditor(note.id));
        this.notesGrid.appendChild(card);
      });
    }
  }

  renderTags() {
    const allTags = new Set();
    this.notes.forEach(n => n.tags.forEach(t => allTags.add(t)));
    
    this.tagList.innerHTML = '';
    allTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = `tag-item ${this.selectedTag === tag ? 'active' : ''}`;
      tagEl.textContent = `#${tag}`;
      tagEl.addEventListener('click', () => {
        this.selectedTag = this.selectedTag === tag ? null : tag;
        this.render();
      });
      this.tagList.appendChild(tagEl);
    });
  }

  updateCounters() {
    this.countAll.textContent = this.notes.length;
    this.countPinned.textContent = this.notes.filter(n => n.pinned).length;
    this.countFavorites.textContent = this.notes.filter(n => n.favorite).length;
  }

  // --- LOCALSTORAGE PERSISTENCE ---
  saveNotesToStorage() {
    localStorage.setItem('notepad_notes', JSON.stringify(this.notes));
  }

  saveAndRender() {
    this.saveNotesToStorage();
    this.render();
  }

  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `notepad_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedNotes = JSON.parse(event.target.result);
        if (Array.isArray(importedNotes)) {
          this.notes = importedNotes;
          this.saveAndRender();
          alert('Notes imported and saved successfully!');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  }
}

// Instantiate application on page initialization
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NotepadApp();
}