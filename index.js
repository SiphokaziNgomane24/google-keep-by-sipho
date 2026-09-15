class Note {
  constructor(id, title, text) {
    this.id = id;
    this.title = title;
    this.text = text;
    this.archived = false;
    this.trashed = false;
  }
}

class App {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem("notes")) || [];
    this.selectedNoteId = "";
    this.miniSidebar = true;
    this.currentView = "notes"; // notes | archive | trash
    this.searchQuery = "";

    this.$activeForm = document.querySelector(".active-form");
    this.$inactiveForm = document.querySelector(".inactive-form");
    this.$noteTitle = document.querySelector("#note-title");
    this.$noteText = document.querySelector("#note-text");
    this.$notes = document.querySelector(".notes");
    this.$emptyState = document.querySelector(".empty-state");
    this.$form = document.querySelector("#form");
    this.$modal = document.querySelector(".modal");
    this.$modalForm = document.querySelector("#modal-form");
    this.$modalTitle = document.querySelector("#modal-title");
    this.$modalText = document.querySelector("#modal-text");
    this.$closeModalForm = document.querySelector("#modal-btn");
    this.$sidebar = document.querySelector(".sidebar");
    this.$sidebarItems = document.querySelectorAll(".sidebar-item");
    this.$sidebarActiveItem = document.querySelector(".active-item");
    this.$searchInput = document.querySelector("#search-input");
    this.$clearSearch = document.querySelector("#clear-search");

    this.addEventListeners();
    this.render();
  }

  addEventListeners() {
    document.body.addEventListener("click", (event) => {
      this.handleFormClick(event);
      this.closeModal(event);
      this.openModal(event);
      this.handleNoteAction(event);
    });

    document.body.addEventListener("mouseover", (event) => {
      const $note = event.target.closest(".note");
      if ($note) this.handleMouseOverNote($note);
    });

    document.body.addEventListener("mouseout", (event) => {
      const $note = event.target.closest(".note");
      if ($note) this.handleMouseOutNote($note);
    });

    this.$form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.$noteTitle.value;
      const text = this.$noteText.value;
      this.addNote({ title, text });
      this.$form.reset();
      this.closeActiveForm();
    });

    this.$modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    this.$sidebar.addEventListener("mouseover", () => {
      this.handleToggleSidebar(true);
    });

    this.$sidebar.addEventListener("mouseout", () => {
      this.handleToggleSidebar(false);
    });

    this.$sidebarItems.forEach(($item) => {
      $item.addEventListener("click", () => {
        const view = $item.dataset.view;
        if (view === "notes" || view === "archive" || view === "trash") {
          this.switchView(view, $item);
        }
      });
    });

    this.$searchInput.addEventListener("input", (event) => {
      this.searchQuery = event.target.value.trim().toLowerCase();
      this.$clearSearch.style.display = this.searchQuery ? "inline-block" : "none";
      this.displayNotes();
    });

    this.$clearSearch.addEventListener("click", () => {
      this.searchQuery = "";
      this.$searchInput.value = "";
      this.$clearSearch.style.display = "none";
      this.displayNotes();
    });
  }

  switchView(view, $item) {
    this.currentView = view;
    this.$sidebarActiveItem.classList.remove("active-item", "sidebar-active-item");
    this.$sidebarActiveItem.querySelector(".material-symbols-outlined").classList.remove("active");
    $item.classList.add("active-item");
    if (!this.miniSidebar) $item.classList.add("sidebar-active-item");
    $item.querySelector(".material-symbols-outlined").classList.add("active");
    this.$sidebarActiveItem = $item;
    this.displayNotes();
  }

  handleFormClick(event) {
    const isActiveFormClickedOn = this.$activeForm.contains(event.target);
    const isInactiveFormClickedOn = this.$inactiveForm.contains(event.target);

    if (isInactiveFormClickedOn) {
      this.openActiveForm();
    } else if (!isInactiveFormClickedOn && !isActiveFormClickedOn) {
      this.closeActiveForm();
    }
  }

  openActiveForm() {
    this.$inactiveForm.style.display = "none";
    this.$activeForm.style.display = "block";
    this.$noteText.focus();
  }

  closeActiveForm() {
    this.$inactiveForm.style.display = "block";
    this.$activeForm.style.display = "none";
  }

  openModal(event) {
    const $selectedNote = event.target.closest(".note");
    if ($selectedNote && !event.target.closest(".note-action")) {
      this.selectedNoteId = $selectedNote.id;
      const note = this.notes.find((n) => n.id === this.selectedNoteId);
      if (!note) return;
      this.$modalTitle.value = note.title;
      this.$modalText.value = note.text;
      this.$modal.classList.add("open-modal");
    }
  }

  closeModal(event) {
    const isModalFormClickedOn = this.$modalForm.contains(event.target);
    const isCloseModalBtnClickedOn = this.$closeModalForm.contains(event.target);
    if (
      (!isModalFormClickedOn || isCloseModalBtnClickedOn) &&
      this.$modal.classList.contains("open-modal")
    ) {
      this.editNote(this.selectedNoteId, {
        title: this.$modalTitle.value,
        text: this.$modalText.value,
      });
      this.$modal.classList.remove("open-modal");
    }
  }

  handleNoteAction(event) {
    const $actionEl = event.target.closest(".note-action");
    if (!$actionEl) return;
    const $selectedNote = event.target.closest(".note");
    if (!$selectedNote) return;
    const id = $selectedNote.id;
    const action = $actionEl.dataset.action;

    if (action === "archive") this.archiveNote(id);
    else if (action === "unarchive") this.unarchiveNote(id);
    else if (action === "trash") this.trashNote(id);
    else if (action === "restore") this.restoreNote(id);
    else if (action === "delete-forever") this.deleteForever(id);
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  addNote({ title, text }) {
    if (text.trim() !== "") {
      const newNote = new Note(cuid(), title, text);
      this.notes = [newNote, ...this.notes];
      this.render();
    }
  }

  editNote(id, { title, text }) {
    this.notes = this.notes.map((note) => {
      if (note.id === id) {
        note.title = title;
        note.text = text;
      }
      return note;
    });
    this.render();
  }

  archiveNote(id) {
    this.notes = this.notes.map((note) => {
      if (note.id === id) note.archived = true;
      return note;
    });
    this.render();
  }

  unarchiveNote(id) {
    this.notes = this.notes.map((note) => {
      if (note.id === id) note.archived = false;
      return note;
    });
    this.render();
  }

  trashNote(id) {
    this.notes = this.notes.map((note) => {
      if (note.id === id) {
        note.trashed = true;
        note.archived = false;
      }
      return note;
    });
    this.render();
  }

  restoreNote(id) {
    this.notes = this.notes.map((note) => {
      if (note.id === id) note.trashed = false;
      return note;
    });
    this.render();
  }

  deleteForever(id) {
    this.notes = this.notes.filter((note) => note.id !== id);
    this.render();
  }

  handleMouseOverNote($note) {
    const $checkCircle = $note.querySelector(".check-circle");
    const $noteFooter = $note.querySelector(".note-footer");
    if ($checkCircle) $checkCircle.style.visibility = "visible";
    if ($noteFooter) $noteFooter.style.visibility = "visible";
  }

  handleMouseOutNote($note) {
    const $checkCircle = $note.querySelector(".check-circle");
    const $noteFooter = $note.querySelector(".note-footer");
    if ($checkCircle) $checkCircle.style.visibility = "hidden";
    if ($noteFooter) $noteFooter.style.visibility = "hidden";
  }

  handleToggleSidebar(isHovering) {
    if (isHovering) {
      this.$sidebar.style.width = "250px";
      this.$sidebar.classList.add("sidebar-hover");
      this.$sidebarActiveItem.classList.add("sidebar-active-item");
      this.miniSidebar = false;
    } else {
      this.$sidebar.style.width = "80px";
      this.$sidebar.classList.remove("sidebar-hover");
      this.$sidebarActiveItem.classList.remove("sidebar-active-item");
      this.miniSidebar = true;
    }
  }

  saveNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
  }

  render() {
    this.saveNotes();
    this.displayNotes();
  }

  getVisibleNotes() {
    return this.notes.filter((note) => {
      const matchesView =
        this.currentView === "notes"
          ? !note.archived && !note.trashed
          : this.currentView === "archive"
          ? note.archived && !note.trashed
          : note.trashed;

      if (!matchesView) return false;

      if (!this.searchQuery) return true;
      const haystack = (note.title + " " + note.text).toLowerCase();
      return haystack.includes(this.searchQuery);
    });
  }

  noteFooterHtml() {
    if (this.currentView === "trash") {
      return `
        <div class="tooltip note-action" data-action="restore">
          <span class="material-symbols-outlined hover small-icon">restore_from_trash</span>
          <span class="tooltip-text">Restore</span>
        </div>
        <div class="tooltip note-action" data-action="delete-forever">
          <span class="material-symbols-outlined hover small-icon">delete_forever</span>
          <span class="tooltip-text">Delete forever</span>
        </div>
      `;
    }

    const archiveIcon = this.currentView === "archive" ? "unarchive" : "archive";
    const archiveAction = this.currentView === "archive" ? "unarchive" : "archive";
    const archiveLabel = this.currentView === "archive" ? "Unarchive" : "Archive";

    return `
      <div class="tooltip">
        <span class="material-symbols-outlined hover small-icon">add_alert</span>
        <span class="tooltip-text">Remind me</span>
      </div>
      <div class="tooltip">
        <span class="material-symbols-outlined hover small-icon">person_add</span>
        <span class="tooltip-text">Collaborator</span>
      </div>
      <div class="tooltip">
        <span class="material-symbols-outlined hover small-icon">palette</span>
        <span class="tooltip-text">Change Color</span>
      </div>
      <div class="tooltip">
        <span class="material-symbols-outlined hover small-icon">image</span>
        <span class="tooltip-text">Add Image</span>
      </div>
      <div class="tooltip note-action" data-action="${archiveAction}">
        <span class="material-symbols-outlined hover small-icon">${archiveIcon}</span>
        <span class="tooltip-text">${archiveLabel}</span>
      </div>
      <div class="tooltip note-action" data-action="trash">
        <span class="material-symbols-outlined hover small-icon">delete</span>
        <span class="tooltip-text">Delete note</span>
      </div>
    `;
  }

  displayNotes() {
    const visibleNotes = this.getVisibleNotes();

    if (visibleNotes.length === 0) {
      this.$notes.innerHTML = "";
      this.$emptyState.style.display = "block";
      const emptyLabels = {
        notes: this.searchQuery ? "No matching notes" : "Notes you add appear here",
        archive: "No archived notes",
        trash: "No notes in Trash",
      };
      this.$emptyState.textContent = emptyLabels[this.currentView];
      return;
    }

    this.$emptyState.style.display = "none";

    this.$notes.innerHTML = visibleNotes
      .map(
        (note) => `
        <div class="note" id="${note.id}">
          <span class="material-symbols-outlined check-circle">check_circle</span>
          <div class="title">${this.escapeHtml(note.title)}</div>
          <div class="text">${this.escapeHtml(note.text)}</div>
          <div class="note-footer">
            ${this.noteFooterHtml()}
          </div>
        </div>
        `
      )
      .join("");
  }
}

const app = new App();