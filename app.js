const STORAGE_KEY = "manicure_studio_appointments";

let appointments = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let deleteId = null;

const $ = (selector) => document.querySelector(selector);

const elements = {
  agendaSection: $("#agendaSection"),
  formSection: $("#formSection"),
  form: $("#appointmentForm"),
  body: $("#appointmentsBody"),
  emptyState: $("#emptyState"),
  search: $("#searchInput"),
  statusFilter: $("#statusFilter"),
  dateFilter: $("#dateFilter"),
  formTitle: $("#formTitle"),
  appointmentId: $("#appointmentId"),
  firstName: $("#firstName"),
  lastName: $("#lastName"),
  phone: $("#phone"),
  service: $("#service"),
  date: $("#appointmentDate"),
  time: $("#appointmentTime"),
  nails: $("#nails"),
  status: $("#status"),
  notes: $("#notes"),
  deleteModal: $("#deleteModal"),
  confirmDelete: $("#confirmDeleteBtn"),
  toast: $("#toast")
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function statusClass(status) {
  return {
    "Pendiente": "pending",
    "Confirmada": "confirmed",
    "Atendida": "attended",
    "Cancelada": "cancelled"
  }[status] || "pending";
}

function renderStats() {
  const today = new Date().toISOString().slice(0, 10);

  $("#totalCount").textContent = appointments.length;
  $("#pendingCount").textContent =
    appointments.filter(a => a.status === "Pendiente").length;
  $("#confirmedCount").textContent =
    appointments.filter(a => a.status === "Confirmada").length;
  $("#todayCount").textContent =
    appointments.filter(a => a.date === today && a.status !== "Cancelada").length;
}

function getFilteredAppointments() {
  const search = elements.search.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const date = elements.dateFilter.value;

  return [...appointments]
    .filter(a => {
      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        a.phone.toLowerCase().includes(search);

      return matchesSearch &&
        (!status || a.status === status) &&
        (!date || a.date === date);
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function renderTable() {
  const filtered = getFilteredAppointments();
  elements.body.innerHTML = "";

  $("#resultsText").textContent =
    `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`;

  elements.emptyState.classList.toggle("hidden", filtered.length !== 0);

  filtered.forEach(appointment => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="client-name">${escapeHTML(appointment.firstName)} ${escapeHTML(appointment.lastName)}</div>
      </td>
      <td>${escapeHTML(appointment.phone)}</td>
      <td>${escapeHTML(appointment.service)}</td>
      <td>${formatDate(appointment.date)}</td>
      <td>${escapeHTML(appointment.time)}</td>
      <td>
        <span class="badge ${statusClass(appointment.status)}">
          ${escapeHTML(appointment.status)}
        </span>
      </td>
      <td>
        <div class="actions">
          <button class="icon-btn" title="Editar" onclick="editAppointment('${appointment.id}')">✎</button>
          <button class="icon-btn delete" title="Eliminar" onclick="askDelete('${appointment.id}')">⌫</button>
        </div>
      </td>
    `;

    elements.body.appendChild(row);
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function showAgenda() {
  elements.agendaSection.classList.remove("hidden");
  elements.formSection.classList.add("hidden");

  document.querySelectorAll(".nav-item").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.section === "agenda")
  );

  renderTable();
}

function showForm(appointment = null) {
  elements.agendaSection.classList.add("hidden");
  elements.formSection.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.section === "nuevo")
  );

  if (appointment) {
    elements.formTitle.textContent = "Editar cita";
    elements.appointmentId.value = appointment.id;
    elements.firstName.value = appointment.firstName;
    elements.lastName.value = appointment.lastName;
    elements.phone.value = appointment.phone;
    elements.service.value = appointment.service;
    elements.date.value = appointment.date;
    elements.time.value = appointment.time;
    elements.nails.value = appointment.nails || "";
    elements.status.value = appointment.status;
    elements.notes.value = appointment.notes || "";
  } else {
    elements.formTitle.textContent = "Registrar nueva cita";
    elements.form.reset();
    elements.appointmentId.value = "";
    elements.status.value = "Pendiente";
    elements.date.value = new Date().toISOString().slice(0, 10);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => elements.firstName.focus(), 150);
}

function editAppointment(id) {
  const appointment = appointments.find(a => a.id === id);
  if (appointment) showForm(appointment);
}

function askDelete(id) {
  deleteId = id;
  elements.deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteId = null;
  elements.deleteModal.classList.add("hidden");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

elements.form.addEventListener("submit", event => {
  event.preventDefault();

  const id = elements.appointmentId.value;

  const data = {
    id: id || crypto.randomUUID(),
    firstName: elements.firstName.value.trim(),
    lastName: elements.lastName.value.trim(),
    phone: elements.phone.value.trim(),
    service: elements.service.value,
    date: elements.date.value,
    time: elements.time.value,
    nails: elements.nails.value,
    status: elements.status.value,
    notes: elements.notes.value.trim()
  };

  if (id) {
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) appointments[index] = data;
    showToast("Cita actualizada correctamente.");
  } else {
    appointments.push(data);
    showToast("Cita registrada correctamente.");
  }

  save();
  renderStats();
  showAgenda();
});

elements.confirmDelete.addEventListener("click", () => {
  if (!deleteId) return;

  appointments = appointments.filter(a => a.id !== deleteId);
  save();
  closeDeleteModal();
  renderStats();
  renderTable();
  showToast("Cita eliminada.");
});

document.querySelectorAll("[data-close-modal]").forEach(el =>
  el.addEventListener("click", closeDeleteModal)
);

$("#newAppointmentBtn").addEventListener("click", () => showForm());
$("#emptyNewBtn").addEventListener("click", () => showForm());
$("#cancelFormBtn").addEventListener("click", showAgenda);
$("#cancelFormBtn2").addEventListener("click", showAgenda);

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.section === "agenda") showAgenda();
    else showForm();
  });
});

[elements.search, elements.statusFilter, elements.dateFilter].forEach(el => {
  el.addEventListener("input", renderTable);
  el.addEventListener("change", renderTable);
});

renderStats();
renderTable();

/* Datos de ejemplo opcionales:
   Si querés iniciar el sistema con citas de prueba,
   descomentá el bloque siguiente y recargá la página.

appointments = [
  {
    id: crypto.randomUUID(),
    firstName: "María",
    lastName: "González",
    phone: "0981 123 456",
    service: "Manicure semipermanente",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    nails: "Medianas",
    status: "Confirmada",
    notes: "Color nude"
  }
];
save();
*/
