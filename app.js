const STORAGE_KEY = 'palate-passport-places';

const seedPlaces = [
  {
    id: crypto.randomUUID(),
    name: 'Milo & Olive',
    cuisine: 'Bakery',
    neighborhood: 'Santa Monica',
    tags: ['brunch', 'pastry'],
    note: 'Great for a slow weekend breakfast and pastry run.',
    tried: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Llama Inn',
    cuisine: 'Peruvian',
    neighborhood: 'Williamsburg',
    tags: ['date night', 'cocktails'],
    note: 'Worth booking ahead for dinner with out-of-town friends.',
    tried: true,
    createdAt: new Date().toISOString(),
  },
];

const elements = {
  form: document.getElementById('place-form'),
  id: document.getElementById('place-id'),
  name: document.getElementById('name'),
  cuisine: document.getElementById('cuisine'),
  neighborhood: document.getElementById('neighborhood'),
  tags: document.getElementById('tags'),
  note: document.getElementById('note'),
  tried: document.getElementById('tried'),
  submit: document.getElementById('submit-button'),
  cancel: document.getElementById('cancel-button'),
  search: document.getElementById('search'),
  cuisineFilter: document.getElementById('cuisine-filter'),
  neighborhoodFilter: document.getElementById('neighborhood-filter'),
  statusFilter: document.getElementById('status-filter'),
  list: document.getElementById('places-list'),
  empty: document.getElementById('empty-state'),
  results: document.getElementById('results-count'),
};

let places = loadPlaces();

function loadPlaces() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPlaces));
    return seedPlaces;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedPlaces;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPlaces));
    return seedPlaces;
  }
}

function savePlaces() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

function getFormValues() {
  return {
    id: elements.id.value || crypto.randomUUID(),
    name: elements.name.value.trim(),
    cuisine: elements.cuisine.value.trim(),
    neighborhood: elements.neighborhood.value.trim(),
    tags: elements.tags.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    note: elements.note.value.trim(),
    tried: elements.tried.checked,
    createdAt: new Date().toISOString(),
  };
}

function resetForm() {
  elements.form.reset();
  elements.id.value = '';
  elements.submit.textContent = 'Save place';
  elements.cancel.classList.add('hidden');
}

function populateFilters() {
  populateSelect(
    elements.cuisineFilter,
    'All cuisines',
    uniqueValues(places.map((place) => place.cuisine))
  );
  populateSelect(
    elements.neighborhoodFilter,
    'All neighborhoods',
    uniqueValues(places.map((place) => place.neighborhood))
  );
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map((value) => value.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function populateSelect(select, defaultLabel, values) {
  const previousValue = select.value;
  select.innerHTML = '';

  const defaultOption = new Option(defaultLabel, 'all');
  select.add(defaultOption);

  values.forEach((value) => {
    select.add(new Option(value, value));
  });

  select.value = values.includes(previousValue) ? previousValue : 'all';
}

function getFilteredPlaces() {
  const query = elements.search.value.trim().toLowerCase();
  const cuisine = elements.cuisineFilter.value;
  const neighborhood = elements.neighborhoodFilter.value;
  const status = elements.statusFilter.value;

  return places.filter((place) => {
    const matchesQuery =
      !query ||
      [place.name, place.note, place.cuisine, place.neighborhood, place.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query);
    const matchesCuisine = cuisine === 'all' || place.cuisine === cuisine;
    const matchesNeighborhood = neighborhood === 'all' || place.neighborhood === neighborhood;
    const matchesStatus =
      status === 'all' ||
      (status === 'tried' && place.tried) ||
      (status === 'want-to-try' && !place.tried);

    return matchesQuery && matchesCuisine && matchesNeighborhood && matchesStatus;
  });
}

function renderPlaces() {
  populateFilters();
  const filteredPlaces = getFilteredPlaces();

  elements.results.textContent = `${filteredPlaces.length} place${filteredPlaces.length === 1 ? '' : 's'}`;
  elements.empty.classList.toggle('hidden', places.length > 0);
  elements.list.innerHTML = '';

  if (!filteredPlaces.length) {
    if (places.length > 0) {
      elements.empty.textContent = 'No saved places match those filters yet.';
      elements.empty.classList.remove('hidden');
    }
    return;
  }

  elements.empty.classList.add('hidden');

  filteredPlaces
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach((place) => {
      const item = document.createElement('li');
      item.className = 'place-card';
      item.innerHTML = `
        <div class="card-topline">
          <div>
            <h3>${escapeHtml(place.name)}</h3>
            <p class="meta">${escapeHtml(place.cuisine)} in ${escapeHtml(place.neighborhood)}</p>
          </div>
          <span class="status-pill">${place.tried ? 'Tried' : 'Want to try'}</span>
        </div>
        <p class="note">${escapeHtml(place.note || 'No note added yet.')}</p>
        <div class="tag-row">
          ${place.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="card-actions">
          <button type="button" data-action="edit" data-id="${place.id}">Edit</button>
          <button type="button" data-action="delete" data-id="${place.id}">Delete</button>
        </div>
      `;
      elements.list.appendChild(item);
    });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function upsertPlace(event) {
  event.preventDefault();
  const nextPlace = getFormValues();

  if (!nextPlace.name || !nextPlace.cuisine || !nextPlace.neighborhood) {
    return;
  }

  const existingIndex = places.findIndex((place) => place.id === nextPlace.id);

  if (existingIndex >= 0) {
    nextPlace.createdAt = places[existingIndex].createdAt;
    places[existingIndex] = nextPlace;
  } else {
    places = [nextPlace, ...places];
  }

  savePlaces();
  resetForm();
  renderPlaces();
}

function startEdit(id) {
  const place = places.find((entry) => entry.id === id);
  if (!place) return;

  elements.id.value = place.id;
  elements.name.value = place.name;
  elements.cuisine.value = place.cuisine;
  elements.neighborhood.value = place.neighborhood;
  elements.tags.value = place.tags.join(', ');
  elements.note.value = place.note;
  elements.tried.checked = place.tried;
  elements.submit.textContent = 'Update place';
  elements.cancel.classList.remove('hidden');
  elements.name.focus();
}

function deletePlace(id) {
  places = places.filter((place) => place.id !== id);
  savePlaces();
  resetForm();
  renderPlaces();
}

elements.form.addEventListener('submit', upsertPlace);
elements.cancel.addEventListener('click', resetForm);

[elements.search, elements.cuisineFilter, elements.neighborhoodFilter, elements.statusFilter].forEach(
  (control) => control.addEventListener('input', renderPlaces)
);

elements.list.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const { id } = event.target.dataset;

  if (action === 'edit') {
    startEdit(id);
  }

  if (action === 'delete') {
    deletePlace(id);
  }
});

renderPlaces();
